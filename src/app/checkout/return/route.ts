import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db";
import { verifyAndApplyPayment } from "@/lib/commerce/orders";
import { clearCartCookie } from "@/lib/commerce/cart";
import { rateLimit } from "@/lib/security/rate-limit";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * The provider redirects the shopper here after payment. Query parameters
 * are only used to know WHICH payment to check — the outcome always comes
 * from a server-side verification call to the provider.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const provider = url.searchParams.get("provider") ?? "";
  const reference = (url.searchParams.get("reference") ?? url.searchParams.get("tx_ref") ?? "").slice(0, 100);
  const key = (url.searchParams.get("key") ?? "").slice(0, 100);
  const orderId = url.searchParams.get("order") ?? "";
  const back = (path: string) => NextResponse.redirect(new URL(path, url.origin), 303);

  if (!isDatabaseConfigured() || !reference || !/^[A-Za-z0-9-]+$/.test(reference)) return back("/checkout?error=payment");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await rateLimit(`checkout-return:${ip}`, 30, 60)).ok) return back("/checkout?error=busy");

  // The reference must belong to the order in the link.
  const [p] = await db()<{ order_id: string }[]>`select order_id from payments where reference = ${reference}`;
  if (!p || p.order_id !== orderId) return back("/checkout?error=payment");

  try {
    const { outcome } = await verifyAndApplyPayment(provider, reference);
    const confirmation = `/order/${orderId}?key=${encodeURIComponent(key)}`;
    if (outcome === "paid" || outcome === "already_paid") {
      await clearCartCookie();
      return back(confirmation);
    }
    if (outcome === "pending") return back(`${confirmation}&pending=1`);
    return back("/checkout?error=declined");
  } catch (err) {
    console.error("[checkout] verification failed", err);
    return back(`/order/${orderId}?key=${encodeURIComponent(key)}&pending=1`);
  }
}
