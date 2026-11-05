import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import { assertServer } from "@/lib/security/server-only";
import { hashPassword, randomToken, sha256, verifyPassword } from "@/lib/security/crypto";
import { rateLimit } from "@/lib/security/rate-limit";
import { clientIp, userAgent } from "@/lib/security/request";
import type { Permission } from "@/lib/auth/permissions";

assertServer("src/lib/auth/staff");

export const STAFF_COOKIE = "chs_admin";
const SESSION_HOURS = 12;
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

export interface StaffUser {
  id: string;
  email: string;
  name: string;
  roleKey: string;
  roleName: string;
  permissions: Set<Permission>;
}

export class ForbiddenError extends Error {
  constructor(public permission: string) {
    super(`You don't have permission to do that (${permission}).`);
  }
}

async function setCookie(token: string) {
  (await cookies()).set(STAFF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function loginStaff(emailInput: string, password: string): Promise<LoginResult> {
  const ip = await clientIp();
  const email = emailInput.trim().toLowerCase();
  const generic = "Email or password is incorrect.";

  const byIp = await rateLimit(`staff-login:ip:${ip}`, 20, 15 * 60);
  const byEmail = await rateLimit(`staff-login:email:${email}`, 10, 15 * 60);
  if (!byIp.ok || !byEmail.ok) return { ok: false, error: "Too many attempts. Try again in a few minutes." };

  const sql = db();
  const [user] = await sql<{ id: string; password_hash: string; status: string; locked_until: Date | null }[]>`
    select id, password_hash, status, locked_until from staff_users where email = ${email}`;

  const valid = await verifyPassword(password, user?.password_hash);
  if (!user) return { ok: false, error: generic };

  if (user.locked_until && user.locked_until > new Date()) {
    return { ok: false, error: "This account is temporarily locked after repeated failed sign-ins." };
  }
  if (!valid) {
    await sql`
      update staff_users set
        failed_login_count = failed_login_count + 1,
        locked_until = case when failed_login_count + 1 >= ${MAX_FAILED}
                            then now() + make_interval(mins => ${LOCK_MINUTES}) else locked_until end
      where id = ${user.id}`;
    await sql`insert into audit_logs (staff_id, actor, action, entity_type, entity_id, ip)
              values (${user.id}, ${email}, 'auth.login_failed', 'staff', ${user.id}, ${ip})`;
    return { ok: false, error: generic };
  }
  if (user.status !== "active") return { ok: false, error: "This account has been suspended." };

  const token = randomToken();
  await sql`
    insert into staff_sessions (staff_id, token_hash, ip, user_agent, expires_at)
    values (${user.id}, ${sha256(token)}, ${ip}, ${await userAgent()}, now() + make_interval(hours => ${SESSION_HOURS}))`;
  await sql`update staff_users set failed_login_count = 0, locked_until = null, last_login_at = now() where id = ${user.id}`;
  await sql`insert into audit_logs (staff_id, actor, action, entity_type, entity_id, ip)
            values (${user.id}, ${email}, 'auth.login', 'staff', ${user.id}, ${ip})`;
  await setCookie(token);
  return { ok: true };
}

export async function logoutStaff(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(STAFF_COOKIE)?.value;
  if (token) {
    await db()`update staff_sessions set revoked_at = now() where token_hash = ${sha256(token)}`;
  }
  jar.delete(STAFF_COOKIE);
}

/** Current signed-in staff member, or null. Memoised per request. */
export const getStaff = cache(async (): Promise<StaffUser | null> => {
  const token = (await cookies()).get(STAFF_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const sql = db();
  const [row] = await sql<{ id: string; email: string; name: string; role_key: string; role_name: string; permissions: string[] }[]>`
    select u.id, u.email, u.name, r.key as role_key, r.name as role_name,
           coalesce(array_agg(rp.permission_key) filter (where rp.permission_key is not null), '{}') as permissions
    from staff_sessions s
    join staff_users u on u.id = s.staff_id
    join roles r on r.id = u.role_id
    left join role_permissions rp on rp.role_id = r.id
    where s.token_hash = ${sha256(token)}
      and s.revoked_at is null and s.expires_at > now() and u.status = 'active'
    group by u.id, r.key, r.name`;
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    roleKey: row.role_key,
    roleName: row.role_name,
    permissions: new Set(row.permissions as Permission[]),
  };
});

/** For pages: redirects to the login screen when signed out. */
export async function requireStaff(): Promise<StaffUser> {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  return staff;
}

export function can(staff: StaffUser, permission: Permission): boolean {
  return staff.permissions.has(permission);
}

/**
 * Server-side authorisation gate. Every admin read page and every admin
 * mutation calls this — hiding a button in the UI is never the control.
 */
export async function requirePermission(permission: Permission): Promise<StaffUser> {
  const staff = await requireStaff();
  if (!can(staff, permission)) throw new ForbiddenError(permission);
  return staff;
}

export async function createStaffUser(input: { email: string; name: string; password: string; roleKey: string }) {
  const hash = await hashPassword(input.password);
  const [row] = await db()<{ id: string }[]>`
    insert into staff_users (email, name, password_hash, role_id)
    select ${input.email.toLowerCase()}, ${input.name}, ${hash}, id from roles where key = ${input.roleKey}
    returning id`;
  if (!row) throw new Error(`Unknown role ${input.roleKey}`);
  return row.id;
}
