import { NextResponse } from "next/server";
import { db, isDatabaseConfigured } from "@/lib/db";
import { safeEqual } from "@/lib/security/crypto";
import { expireReservations, markAbandonedCarts } from "@/lib/commerce/orders";

export const dynamic = "force-dynamic";

/**
 * Scheduled housekeeping (e.g. Vercel Cron every 10 minutes):
 *   Authorization: Bearer $CRON_SECRET
 * - releases stock held by unpaid orders past their reservation window
 *   (after re-checking each payment with its provider)
 * - marks idle carts abandoned
 * - prunes expired sessions and rate-limit windows
 */
async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "database not configured" }, { status: 503 });

  const reservations = await expireReservations();
  const abandoned = await markAbandonedCarts();
  const sql = db();
  await sql`delete from staff_sessions where expires_at < now() - interval '1 day' or revoked_at < now() - interval '1 day'`;
  await sql`delete from customer_sessions where expires_at < now() - interval '1 day' or revoked_at < now() - interval '1 day'`;
  await sql`delete from rate_limits where window_start < now() - interval '1 day'`;
  return NextResponse.json({ ok: true, ...reservations, abandonedCarts: abandoned });
}

export const GET = run;
export const POST = run;
