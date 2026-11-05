import { db, transaction } from "@/lib/db";
import { assertServer } from "@/lib/security/server-only";
import { hashPassword, randomToken, sha256 } from "@/lib/security/crypto";
import { rateLimit } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/request";
import { UserFacingError, passwordStrength } from "@/lib/security/validate";
import { emailLayout, sendEmail, siteUrl } from "@/lib/commerce/email";

assertServer("src/lib/auth/password-reset");

type Subject = "staff" | "customer";
const TTL_MINUTES = 60;

/**
 * Emails a one-time reset link. Always resolves the same way whether or not
 * the address exists, so the form can't be used to discover accounts.
 * Guests (checkout-only customers) can use this to claim an account.
 */
export async function requestPasswordReset(type: Subject, emailAddress: string): Promise<void> {
  const ip = await clientIp();
  const a = await rateLimit(`reset:${type}:ip:${ip}`, 10, 3600);
  const b = await rateLimit(`reset:${type}:email:${emailAddress}`, 3, 3600);
  if (!a.ok || !b.ok) throw new UserFacingError("Too many reset requests. Try again later.");

  const table = type === "staff" ? db()<{ id: string }[]>`select id from staff_users where email = ${emailAddress} and status = 'active'`
    : db()<{ id: string }[]>`select id from customers where email = ${emailAddress} and status = 'active'`;
  const [subject] = await table;
  if (!subject) return;

  const token = randomToken();
  await db()`
    insert into password_resets (subject_type, subject_id, token_hash, expires_at)
    values (${type}, ${subject.id}, ${sha256(token)}, now() + make_interval(mins => ${TTL_MINUTES}))`;
  const link = `${siteUrl()}${type === "staff" ? "/admin/reset" : "/account/reset"}?token=${encodeURIComponent(token)}`;
  const sent = await sendEmail(
    emailAddress,
    type === "staff" ? "Reset your CHISSELED admin password" : "Set or reset your CHISSELED password",
    emailLayout(`<h1 style="font-size:20px">Choose a new password</h1>
      <p>Use the link below within ${TTL_MINUTES} minutes. It works once.</p>
      <p><a href="${link}">${link}</a></p>
      <p>If you didn't ask for this, ignore this email — your password won't change.</p>`),
  );
  if (!sent) console.warn("[password-reset] email provider not configured; reset link not sent");
  await db()`insert into audit_logs (staff_id, actor, action, entity_type, entity_id, ip)
             values (${type === "staff" ? subject.id : null}, ${emailAddress}, 'auth.reset_requested', ${type}, ${subject.id}, ${ip})`;
}

export async function resetPassword(type: Subject, token: string, password: string): Promise<void> {
  const weak = type === "staff"
    ? password.length < 12 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password) ? "Use at least 12 characters with letters and a number." : null
    : passwordStrength(password);
  if (weak) throw new UserFacingError(weak);
  if (!(await rateLimit(`reset-use:${await clientIp()}`, 20, 3600)).ok) throw new UserFacingError("Too many attempts. Try again later.");
  const hash = await hashPassword(password);

  await transaction(async (tx) => {
    const [row] = await tx<{ id: string; subject_id: string }[]>`
      select id, subject_id from password_resets
      where token_hash = ${sha256(token)} and subject_type = ${type} and used_at is null and expires_at > now()
      for update`;
    if (!row) throw new UserFacingError("This link has expired or was already used. Request a new one.");
    await tx`update password_resets set used_at = now() where subject_type = ${type} and subject_id = ${row.subject_id} and used_at is null`;
    if (type === "staff") {
      await tx`update staff_users set password_hash = ${hash}, failed_login_count = 0, locked_until = null where id = ${row.subject_id}`;
      await tx`update staff_sessions set revoked_at = now() where staff_id = ${row.subject_id} and revoked_at is null`;
    } else {
      await tx`update customers set password_hash = ${hash}, failed_login_count = 0, locked_until = null where id = ${row.subject_id}`;
      await tx`update customer_sessions set revoked_at = now() where customer_id = ${row.subject_id} and revoked_at is null`;
    }
    await tx`insert into audit_logs (staff_id, actor, action, entity_type, entity_id)
             values (${type === "staff" ? row.subject_id : null}, ${type}, 'auth.password_reset', ${type}, ${row.subject_id})`;
  });
}
