"use server";

import { adminAction } from "@/lib/admin/action";
import { db, pgCode, transaction } from "@/lib/db";
import { audit, notify } from "@/lib/commerce/audit";
import { writeSetting, readSetting, DEFAULT_STORE, type StoreSettings } from "@/lib/commerce/settings";
import { hashPassword } from "@/lib/security/crypto";
import { PERMISSIONS } from "@/lib/auth/permissions";
import type { StaffUser } from "@/lib/auth/staff";
import {
  UserFacingError,
  ValidationError,
  bool,
  email,
  int,
  oneOf,
  optStr,
  str,
  uuid,
} from "@/lib/security/validate";

function strongPassword(form: FormData, name = "password"): string {
  const p = str(form, name, { max: 200, label: "Password" });
  if (p.length < 12 || !/[a-zA-Z]/.test(p) || !/[0-9]/.test(p)) {
    throw new ValidationError(name, "Staff passwords need at least 12 characters, including letters and a number.");
  }
  return p;
}

async function roleKey(roleId: string): Promise<string> {
  const [r] = await db()<{ key: string }[]>`select key from roles where id = ${roleId}`;
  if (!r) throw new UserFacingError("Unknown role.");
  return r.key;
}

/** Only owners may grant the owner role or modify an owner. */
function assertOwnerRules(actor: StaffUser, targetRoleKey: string) {
  if (targetRoleKey === "owner" && actor.roleKey !== "owner") throw new UserFacingError("Only an owner can manage owner accounts.");
}

async function assertNotLastOwner(staffId: string) {
  const [{ owners, is_owner }] = await db()<{ owners: number; is_owner: boolean }[]>`
    select (select count(*)::int from staff_users u join roles r on r.id = u.role_id where r.key = 'owner' and u.status = 'active') as owners,
           exists (select 1 from staff_users u join roles r on r.id = u.role_id where u.id = ${staffId} and r.key = 'owner') as is_owner`;
  if (is_owner && owners <= 1) throw new UserFacingError("This is the only active owner. Make someone else an owner first.");
}

export const inviteStaffAction = adminAction("staff:write", async (staff, form) => {
  const roleId = uuid(form, "role_id");
  assertOwnerRules(staff, await roleKey(roleId));
  const address = email(form);
  const hash = await hashPassword(strongPassword(form));
  const [row] = await db()<{ id: string }[]>`
    insert into staff_users (email, name, password_hash, role_id)
    values (${address}, ${str(form, "name", { max: 120, label: "Name" })}, ${hash}, ${roleId}) returning id`.catch((err) => {
    if (pgCode(err) === "23505") throw new ValidationError("email", "A staff account with this email already exists.");
    throw err;
  });
  await audit(staff, "staff.create", "staff", row.id, { email: address, role_id: roleId });
  await notify({ kind: "staff", title: `Staff account created for ${address}`, body: `By ${staff.name}.` });
  return "Staff account created. Share the temporary password securely and ask them to change it.";
});

export const updateStaffAction = adminAction("staff:write", async (staff, form) => {
  const id = uuid(form, "id");
  const roleId = uuid(form, "role_id");
  const status = oneOf(form, "status", ["active", "suspended"] as const);
  const newRole = await roleKey(roleId);
  const [current] = await db()<{ role_key: string }[]>`select r.key as role_key from staff_users u join roles r on r.id = u.role_id where u.id = ${id}`;
  if (!current) throw new UserFacingError("Staff member not found.");
  assertOwnerRules(staff, current.role_key);
  assertOwnerRules(staff, newRole);
  if (id === staff.id && status !== "active") throw new UserFacingError("You can't suspend yourself.");
  if (current.role_key === "owner" && (newRole !== "owner" || status !== "active")) await assertNotLastOwner(id);
  await transaction(async (tx) => {
    await tx`update staff_users set role_id = ${roleId}, status = ${status}, name = ${str(form, "name", { max: 120 })} where id = ${id}`;
    if (status === "suspended") await tx`update staff_sessions set revoked_at = now() where staff_id = ${id} and revoked_at is null`;
    await audit(staff, "staff.update", "staff", id, { role: newRole, status }, tx);
  });
  return "Staff member updated.";
});

export const resetStaffPasswordAction = adminAction("staff:write", async (staff, form) => {
  const id = uuid(form, "id");
  const [current] = await db()<{ role_key: string }[]>`select r.key as role_key from staff_users u join roles r on r.id = u.role_id where u.id = ${id}`;
  if (!current) throw new UserFacingError("Staff member not found.");
  assertOwnerRules(staff, current.role_key);
  const hash = await hashPassword(strongPassword(form));
  await transaction(async (tx) => {
    await tx`update staff_users set password_hash = ${hash}, failed_login_count = 0, locked_until = null where id = ${id}`;
    await tx`update staff_sessions set revoked_at = now() where staff_id = ${id} and revoked_at is null`;
    await audit(staff, "staff.password_reset", "staff", id, {}, tx);
  });
  return "Password reset and existing sessions signed out.";
});

/** Any signed-in staff member can change their own password. */
export const changeOwnPasswordAction = adminAction("dashboard:view", async (staff, form) => {
  const hash = await hashPassword(strongPassword(form, "new_password"));
  const { verifyPassword } = await import("@/lib/security/crypto");
  const [row] = await db()<{ password_hash: string }[]>`select password_hash from staff_users where id = ${staff.id}`;
  if (!(await verifyPassword(str(form, "current_password", { max: 200 }), row?.password_hash))) {
    throw new ValidationError("current_password", "Current password is incorrect.");
  }
  await db()`update staff_users set password_hash = ${hash} where id = ${staff.id}`;
  await audit(staff, "staff.password_change", "staff", staff.id, {});
  return "Password changed.";
});

export const saveRoleAction = adminAction("staff:write", async (staff, form) => {
  const id = optStr(form, "id", { max: 36 });
  const perms = form.getAll("permissions").map(String).filter((p) => (PERMISSIONS as readonly string[]).includes(p));
  if (!perms.includes("dashboard:view")) perms.push("dashboard:view");
  await transaction(async (tx) => {
    let roleId = id;
    if (roleId) {
      const [r] = await tx<{ key: string }[]>`select key from roles where id = ${roleId} for update`;
      if (!r) throw new UserFacingError("Role not found.");
      if (r.key === "owner") throw new UserFacingError("The owner role always has every permission.");
      if (r.key === "admin" && staff.roleKey !== "owner") throw new UserFacingError("Only an owner can change the administrator role.");
      await tx`update roles set name = ${str(form, "name", { max: 60, label: "Role name" })}, description = ${optStr(form, "description", { max: 300 })} where id = ${roleId}`;
    } else {
      const name = str(form, "name", { max: 60, label: "Role name" });
      const key = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "role";
      const [r] = await tx<{ id: string }[]>`
        insert into roles (key, name, description) values (${/^[a-z]/.test(key) ? key : `r_${key}`}, ${name}, ${optStr(form, "description", { max: 300 })})
        returning id`.catch((err) => {
        if (pgCode(err) === "23505") throw new ValidationError("name", "A role with that name already exists.");
        throw err;
      });
      roleId = r.id;
    }
    await tx`delete from role_permissions where role_id = ${roleId}`;
    for (const p of perms) await tx`insert into role_permissions (role_id, permission_key) values (${roleId}, ${p})`;
    await audit(staff, id ? "role.update" : "role.create", "role", roleId!, { permissions: perms }, tx);
  });
  return "Role saved. Changes apply on each member's next request.";
});

export const deleteRoleAction = adminAction("staff:write", async (staff, form) => {
  const id = uuid(form, "id");
  const [r] = await db()<{ is_system: boolean; members: number }[]>`
    select is_system, (select count(*)::int from staff_users where role_id = roles.id) as members from roles where id = ${id}`;
  if (!r) throw new UserFacingError("Role not found.");
  if (r.is_system) throw new UserFacingError("Built-in roles can't be deleted.");
  if (r.members) throw new UserFacingError("Move this role's members to another role first.");
  await db()`delete from roles where id = ${id}`;
  await audit(staff, "role.delete", "role", id, {});
  return "Role deleted.";
});

/* ------------------------------- Notifications ------------------------------ */

export const markNotificationsAction = adminAction("notifications:read", async (staff, form) => {
  const id = optStr(form, "id", { max: 36 });
  if (id) await db()`update notifications set read_at = now() where id = ${id} and read_at is null`;
  else await db()`update notifications set read_at = now() where read_at is null`;
  return id ? "Marked as read." : "All caught up.";
});

/* --------------------------------- Settings --------------------------------- */

export const saveStoreSettingsAction = adminAction("settings:write", async (staff, form) => {
  const before = await readSetting<StoreSettings>("store", DEFAULT_STORE);
  const currency = str(form, "currency", { max: 3, pattern: /^[A-Z]{3}$/, label: "Currency" });
  if (currency !== before.currency) {
    const [{ open }] = await db()<{ open: number }[]>`select count(*)::int as open from orders where status = 'pending'`;
    if (open > 0) throw new UserFacingError("Orders are awaiting payment. Change currency when none are pending.");
    if (!bool(form, "confirm_currency")) throw new UserFacingError("Changing currency doesn't convert prices. Tick the confirmation to proceed.");
  }
  const next: StoreSettings = {
    name: str(form, "name", { max: 80, label: "Store name" }),
    email: email(form, "email"),
    currency,
    country: str(form, "country", { max: 2, pattern: /^[A-Z]{2}$/, label: "Country" }),
    tax_rate_bps: Math.round(Number(optStr(form, "tax_rate", { max: 6, pattern: /^\d{1,2}(\.\d{1,2})?$/, label: "Tax rate" }) || 0) * 100),
    tax_inclusive: bool(form, "tax_inclusive"),
    reservation_minutes: int(form, "reservation_minutes", { min: 10, max: 1440, label: "Reservation window" }),
    low_stock_default: int(form, "low_stock_default", { min: 0, max: 10_000, label: "Low-stock threshold" }),
    order_prefix: optStr(form, "order_prefix", { max: 6, pattern: /^[A-Z0-9]*$/, label: "Order prefix" }),
  };
  await writeSetting("store", next);
  await audit(staff, "settings.store", "settings", "store", { before, after: next });
  return "Settings saved.";
});

export const savePaymentSettingsAction = adminAction("settings:write", async (staff, form) => {
  const next = { paystack_enabled: bool(form, "paystack_enabled"), flutterwave_enabled: bool(form, "flutterwave_enabled") };
  await writeSetting("payments", next);
  await audit(staff, "settings.payments", "settings", "payments", next);
  return "Payment settings saved.";
});
