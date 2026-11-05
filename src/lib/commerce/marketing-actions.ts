"use server";

import { isDatabaseConfigured } from "@/lib/db";
import { resolveVariant } from "@/lib/commerce/cart";
import { createStockAlert, subscribe, unsubscribeByToken } from "@/lib/commerce/marketing";
import { rateLimit } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/request";
import { email, optStr, str, toActionError, UserFacingError, type ActionState } from "@/lib/security/validate";

async function guard(bucket: string) {
  if (!isDatabaseConfigured()) throw new UserFacingError("Sign-ups are temporarily unavailable. Please try again shortly.");
  if (!(await rateLimit(`${bucket}:${await clientIp()}`, 10, 600)).ok) throw new UserFacingError("Too many attempts. Try again in a few minutes.");
}

export async function newsletterAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await guard("newsletter");
    const result = await subscribe(email(form), "footer");
    return { ok: true, message: result === "already" ? "You're already on the list." : "You're in." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function stockAlertAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await guard("stock-alert");
    const slug = str(form, "slug", { max: 96, pattern: /^[a-z0-9-]+$/ });
    const size = optStr(form, "size", { max: 40 });
    const colorway = optStr(form, "colorway", { max: 80 });
    const variantId = size || colorway ? await resolveVariant(slug, colorway || "apparel", size || undefined) : null;
    await createStockAlert({ email: email(form), slug, variantId });
    return { ok: true, message: "Done — we'll email you the moment it's back." };
  } catch (err) {
    return toActionError(err);
  }
}

export async function unsubscribeAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await guard("unsubscribe");
    const done = await unsubscribeByToken(str(form, "token", { max: 64 }));
    if (!done) throw new UserFacingError("That unsubscribe link isn't valid or has already been used.");
    return { ok: true, message: `${done} won't receive marketing email from us again.` };
  } catch (err) {
    return toActionError(err);
  }
}
