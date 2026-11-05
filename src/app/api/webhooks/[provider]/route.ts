import { NextResponse } from "next/server";
import { db, isDatabaseConfigured } from "@/lib/db";
import { getProvider } from "@/lib/payments";
import { applyRefundWebhook, verifyAndApplyPayment } from "@/lib/commerce/orders";

export const dynamic = "force-dynamic";

const MAX_BODY = 1_000_000;

/**
 * Payment provider webhooks: /api/webhooks/paystack, /api/webhooks/flutterwave
 *
 * 1. Signature verified over the exact raw body (HMAC) — unsigned → 401.
 * 2. Idempotent: (provider, event_id) is unique; a replay of a processed
 *    event is acknowledged without side effects.
 * 3. The webhook body is never trusted for money: charge events trigger a
 *    server-to-server verification against the provider API.
 * 4. A processing failure returns 500 so the provider retries.
 */
export async function POST(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider: providerId } = await ctx.params;
  const provider = getProvider(providerId);
  if (!provider || !isDatabaseConfigured()) return NextResponse.json({ error: "not found" }, { status: 404 });

  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_BODY) return NextResponse.json({ error: "payload too large" }, { status: 413 });
  const raw = await req.text();
  if (raw.length > MAX_BODY) return NextResponse.json({ error: "payload too large" }, { status: 413 });

  if (!provider.verifyWebhook(raw, req.headers)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const event = provider.parseWebhook(body);
  if (!event) return NextResponse.json({ ok: true, ignored: true });

  const sql = db();
  const [row] = await sql<{ id: number; processed_at: Date | null }[]>`
    insert into webhook_events (provider, event_id, event_type, payload)
    values (${provider.id}, ${event.eventId}, ${event.type}, ${sql.json(body as never)})
    on conflict (provider, event_id) do update set event_type = excluded.event_type
    returning id, processed_at`;
  if (row.processed_at) return NextResponse.json({ ok: true, duplicate: true });

  try {
    if (event.kind === "charge" && event.reference) {
      await verifyAndApplyPayment(provider.id, event.reference);
    } else if (event.kind === "refund" && event.refundId && event.refundStatus) {
      await applyRefundWebhook(event.refundId, event.refundStatus);
    }
    await sql`update webhook_events set processed_at = now(), error = null where id = ${row.id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "processing failed";
    await sql`update webhook_events set error = ${message.slice(0, 1000)} where id = ${row.id}`;
    console.error("[webhook] processing failed", provider.id, event.type, message);
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
