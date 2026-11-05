import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db";
import { assertServer } from "@/lib/security/server-only";
import { hashPassword, randomToken, sha256, verifyPassword } from "@/lib/security/crypto";
import { rateLimit } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/request";
import { UserFacingError, passwordStrength } from "@/lib/security/validate";
import { subscribe } from "@/lib/commerce/marketing";

assertServer("src/lib/auth/customer");

export const CUSTOMER_COOKIE = "chs_customer";
const SESSION_DAYS = 30;

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

async function startSession(customerId: string) {
  const token = randomToken();
  await db()`insert into customer_sessions (customer_id, token_hash, expires_at)
             values (${customerId}, ${sha256(token)}, now() + make_interval(days => ${SESSION_DAYS}))`;
  (await cookies()).set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

/**
 * Registers an account. A guest record created by an earlier checkout with
 * the same email is upgraded in place, so its order history carries over —
 * but only if it has no password yet (an existing account is never taken over).
 */
export async function registerCustomer(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  acceptsMarketing: boolean;
}): Promise<void> {
  const limited = await rateLimit(`customer-register:${await clientIp()}`, 10, 3600);
  if (!limited.ok) throw new UserFacingError("Too many attempts. Try again later.");
  const weak = passwordStrength(input.password);
  if (weak) throw new UserFacingError(weak);

  const hash = await hashPassword(input.password);
  const [row] = await db()<{ id: string }[]>`
    insert into customers (email, first_name, last_name, password_hash, accepts_marketing)
    values (${input.email}, ${input.firstName}, ${input.lastName}, ${hash}, ${input.acceptsMarketing})
    on conflict (email) do update set
      password_hash = excluded.password_hash,
      first_name = coalesce(nullif(customers.first_name, ''), excluded.first_name),
      last_name = coalesce(nullif(customers.last_name, ''), excluded.last_name),
      accepts_marketing = customers.accepts_marketing or excluded.accepts_marketing
    where customers.password_hash is null
    returning id`;
  if (!row) throw new UserFacingError("An account with this email already exists. Sign in instead.");
  if (input.acceptsMarketing) await subscribe(input.email, "register");
  await startSession(row.id);
}

export async function loginCustomer(emailInput: string, password: string): Promise<void> {
  const email = emailInput.trim().toLowerCase();
  const ip = await clientIp();
  const a = await rateLimit(`customer-login:ip:${ip}`, 30, 900);
  const b = await rateLimit(`customer-login:email:${email}`, 10, 900);
  if (!a.ok || !b.ok) throw new UserFacingError("Too many attempts. Try again in a few minutes.");

  const [c] = await db()<{ id: string; password_hash: string | null; status: string; locked_until: Date | null }[]>`
    select id, password_hash, status, locked_until from customers where email = ${email}`;
  const valid = await verifyPassword(password, c?.password_hash);
  if (!c || !valid) {
    if (c) {
      await db()`update customers set failed_login_count = failed_login_count + 1,
                 locked_until = case when failed_login_count + 1 >= 8 then now() + interval '15 minutes' else locked_until end
                 where id = ${c.id}`;
    }
    throw new UserFacingError("Email or password is incorrect.");
  }
  if (c.locked_until && c.locked_until > new Date()) throw new UserFacingError("Account temporarily locked. Try again shortly.");
  if (c.status !== "active") throw new UserFacingError("This account is disabled. Contact support.");
  await db()`update customers set failed_login_count = 0, locked_until = null where id = ${c.id}`;
  await startSession(c.id);
}

export async function logoutCustomer(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  if (token) await db()`update customer_sessions set revoked_at = now() where token_hash = ${sha256(token)}`;
  jar.delete(CUSTOMER_COOKIE);
}

export const getCustomer = cache(async (): Promise<Customer | null> => {
  if (!process.env.DATABASE_URL) return null;
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const [row] = await db()<{ id: string; email: string; first_name: string; last_name: string; phone: string }[]>`
    select c.id, c.email, c.first_name, c.last_name, c.phone
    from customer_sessions s join customers c on c.id = s.customer_id
    where s.token_hash = ${sha256(token)} and s.revoked_at is null and s.expires_at > now() and c.status = 'active'`;
  return row
    ? { id: row.id, email: row.email, firstName: row.first_name, lastName: row.last_name, phone: row.phone }
    : null;
});
