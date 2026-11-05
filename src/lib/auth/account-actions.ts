"use server";

import { revalidatePath } from "next/cache";
import { db, transaction } from "@/lib/db";
import { getCustomer } from "@/lib/auth/customer";
import { requestPasswordReset, resetPassword } from "@/lib/auth/password-reset";
import { syncConsent } from "@/lib/commerce/marketing";
import { hashPassword, verifyPassword } from "@/lib/security/crypto";
import { rateLimit } from "@/lib/security/rate-limit";
import {
  bool,
  country,
  email,
  optStr,
  passwordStrength,
  str,
  toActionError,
  uuid,
  UserFacingError,
  ValidationError,
  type ActionState,
} from "@/lib/security/validate";

const SENT = "If that email has an account, a reset link is on its way. It expires in an hour.";

export async function customerForgotAction(_p: ActionState, form: FormData): Promise<ActionState> {
  try {
    await requestPasswordReset("customer", email(form));
    return { ok: true, message: SENT };
  } catch (err) {
    return toActionError(err);
  }
}

export async function staffForgotAction(_p: ActionState, form: FormData): Promise<ActionState> {
  try {
    await requestPasswordReset("staff", email(form));
    return { ok: true, message: SENT };
  } catch (err) {
    return toActionError(err);
  }
}

export async function customerResetAction(_p: ActionState, form: FormData): Promise<ActionState> {
  try {
    await resetPassword("customer", str(form, "token", { max: 100 }), str(form, "password", { max: 200, label: "Password" }));
    return { ok: true, message: "Password set. You can sign in now." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function staffResetAction(_p: ActionState, form: FormData): Promise<ActionState> {
  try {
    await resetPassword("staff", str(form, "token", { max: 100 }), str(form, "password", { max: 200, label: "Password" }));
    return { ok: true, message: "Password changed. Sign in with your new password." };
  } catch (err) {
    return toActionError(err);
  }
}

/* --------------------------- signed-in customer --------------------------- */

async function me() {
  const c = await getCustomer();
  if (!c) throw new UserFacingError("Your session has ended. Sign in again.");
  if (!(await rateLimit(`account-write:${c.id}`, 40, 600)).ok) throw new UserFacingError("Too many changes. Wait a moment.");
  return c;
}

function done(message: string): ActionState {
  revalidatePath("/account");
  return { ok: true, message };
}

export async function updateProfileAction(_p: ActionState, form: FormData): Promise<ActionState> {
  try {
    const c = await me();
    const accepts = bool(form, "accepts_marketing");
    await db()`update customers set first_name = ${str(form, "first_name", { max: 80, label: "First name" })},
               last_name = ${optStr(form, "last_name", { max: 80 })},
               phone = ${optStr(form, "phone", { max: 30, pattern: /^[+0-9 ()-]{6,30}$/, label: "Phone" })},
               accepts_marketing = ${accepts} where id = ${c.id}`;
    await syncConsent(c.email, accepts);
    return done("Profile saved.");
  } catch (err) {
    return toActionError(err);
  }
}

export async function changePasswordAction(_p: ActionState, form: FormData): Promise<ActionState> {
  try {
    const c = await me();
    const next = str(form, "new_password", { max: 200, label: "New password" });
    const weak = passwordStrength(next);
    if (weak) throw new ValidationError("new_password", weak);
    const [row] = await db()<{ password_hash: string | null }[]>`select password_hash from customers where id = ${c.id}`;
    if (!(await verifyPassword(str(form, "current_password", { max: 200, label: "Current password" }), row?.password_hash))) {
      throw new ValidationError("current_password", "Current password is incorrect.");
    }
    await db()`update customers set password_hash = ${await hashPassword(next)} where id = ${c.id}`;
    return done("Password changed.");
  } catch (err) {
    return toActionError(err);
  }
}

export async function saveAddressAction(_p: ActionState, form: FormData): Promise<ActionState> {
  try {
    const c = await me();
    const [{ n }] = await db()<{ n: number }[]>`select count(*)::int as n from customer_addresses where customer_id = ${c.id}`;
    if (n >= 20) throw new UserFacingError("You can save up to 20 addresses.");
    const makeDefault = bool(form, "is_default") || n === 0;
    await transaction(async (tx) => {
      if (makeDefault) await tx`update customer_addresses set is_default = false where customer_id = ${c.id}`;
      await tx`
        insert into customer_addresses (customer_id, first_name, last_name, company, line1, line2, city, region, postal_code, country, phone, is_default)
        values (${c.id}, ${str(form, "first_name", { max: 80, label: "First name" })}, ${str(form, "last_name", { max: 80, label: "Last name" })},
                ${optStr(form, "company", { max: 120 })}, ${str(form, "line1", { max: 200, label: "Address" })}, ${optStr(form, "line2", { max: 200 })},
                ${str(form, "city", { max: 120, label: "City" })}, ${optStr(form, "region", { max: 120 })}, ${optStr(form, "postal_code", { max: 20 })},
                ${country(form, "country")}, ${optStr(form, "phone", { max: 30 })}, ${makeDefault})`;
    });
    return done("Address saved.");
  } catch (err) {
    return toActionError(err);
  }
}

export async function deleteAddressAction(_p: ActionState, form: FormData): Promise<ActionState> {
  try {
    const c = await me();
    await db()`delete from customer_addresses where id = ${uuid(form, "id")} and customer_id = ${c.id}`;
    return done("Address removed.");
  } catch (err) {
    return toActionError(err);
  }
}

export async function defaultAddressAction(_p: ActionState, form: FormData): Promise<ActionState> {
  try {
    const c = await me();
    const id = uuid(form, "id");
    await transaction(async (tx) => {
      await tx`update customer_addresses set is_default = false where customer_id = ${c.id}`;
      await tx`update customer_addresses set is_default = true where id = ${id} and customer_id = ${c.id}`;
    });
    return done("Default address updated.");
  } catch (err) {
    return toActionError(err);
  }
}
