import { NextResponse } from "next/server";
import { db, isDatabaseConfigured } from "@/lib/db";
import { writeCartId } from "@/lib/commerce/cart";
import { sha256 } from "@/lib/security/crypto";
import { rateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

/** Abandoned-cart email link: restores that bag in this browser and opens checkout. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = (url.searchParams.get("token") ?? "").slice(0, 100);
  const to = (path: string) => NextResponse.redirect(new URL(path, url.origin), 303);
  if (!isDatabaseConfigured() || !token) return to("/shop");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await rateLimit(`cart-recover:${ip}`, 20, 600)).ok) return to("/shop");
  const [cart] = await db()<{ id: string }[]>`
    update carts set status = 'active', updated_at = now()
    where recovery_token = ${sha256(token)} and status in ('abandoned','active') returning id`;
  if (!cart) return to("/shop");
  await writeCartId(cart.id);
  return to("/checkout");
}
