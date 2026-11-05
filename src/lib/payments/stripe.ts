import { hmacHex, safeEqual } from "@/lib/security/crypto";
import { providerFetch } from "@/lib/payments/http";
import type { PaymentProvider, VerifiedPayment, WebhookEvent } from "@/lib/payments/types";

/**
 * Stripe Checkout — for international cards, Apple Pay and Google Pay.
 * https://docs.stripe.com/api/checkout/sessions
 * Amounts are in the currency's smallest unit (cents), like the rest of the app.
 * Zero-decimal currencies are deliberately not offered.
 */

const base = () => process.env.STRIPE_BASE_URL || "https://api.stripe.com/v1";
const secret = () => process.env.STRIPE_SECRET_KEY ?? "";
const whsec = () => process.env.STRIPE_WEBHOOK_SECRET ?? "";
const TOLERANCE_SECONDS = 300;

interface Session {
  id: string;
  url: string | null;
  status: "open" | "complete" | "expired";
  payment_status: "paid" | "unpaid" | "no_payment_required";
  client_reference_id: string | null;
  amount_total: number | null;
  currency: string | null;
  payment_intent: string | { id: string } | null;
}

export const stripe: PaymentProvider = {
  id: "stripe",
  label: "International cards, Apple Pay & Google Pay (Stripe)",

  isConfigured: () => Boolean(secret() && whsec()),

  supportsCurrency: (c) =>
    ["USD", "GBP", "EUR", "CAD", "AUD", "NZD", "CHF", "SEK", "NOK", "DKK", "ZAR", "KES", "AED", "SGD", "HKD", "NGN", "GHS"].includes(c),

  async initialize(input) {
    const s = await providerFetch<Session>(`${base()}/checkout/sessions`, {
      method: "POST",
      secret: secret(),
      form: {
        mode: "payment",
        client_reference_id: input.reference,
        customer_email: input.email,
        success_url: input.callbackUrl,
        cancel_url: input.cancelUrl ?? input.callbackUrl,
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": input.currency.toLowerCase(),
        "line_items[0][price_data][unit_amount]": String(input.amountCents),
        "line_items[0][price_data][product_data][name]": `CHISSELED order ${input.orderNumber}`,
        "metadata[order_id]": input.orderId,
        "metadata[reference]": input.reference,
        "payment_intent_data[metadata][reference]": input.reference,
      },
    });
    if (!s.url) throw new Error("Stripe did not return a checkout URL");
    return { authorizationUrl: s.url, raw: { id: s.id } };
  },

  async verify(reference, hint) {
    if (!hint) throw new Error("Stripe verification needs the Checkout Session id");
    const s = await providerFetch<Session>(`${base()}/checkout/sessions/${encodeURIComponent(hint)}`, { secret: secret() });
    if (s.client_reference_id !== reference) throw new Error("Stripe session does not belong to this payment");
    const status: VerifiedPayment["status"] =
      s.payment_status === "paid" ? "succeeded" : s.status === "expired" ? "abandoned" : "pending";
    const pi = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id ?? null;
    return {
      status,
      amountCents: s.amount_total ?? 0,
      currency: (s.currency ?? "").toUpperCase(),
      transactionId: pi,
      channel: "card",
      feeCents: null,
      failureReason: status === "succeeded" ? null : `Checkout ${s.status}`,
      raw: { id: s.id, status: s.status, payment_status: s.payment_status, payment_intent: pi },
    };
  },

  /** Stripe-Signature: t=<ts>,v1=<hex hmac of "t.body">. Rejects stale timestamps (replay). */
  verifyWebhook(rawBody, headers) {
    const header = headers.get("stripe-signature");
    if (!header || !whsec()) return false;
    const parts = header.split(",").map((p) => p.split("=") as [string, string]);
    const t = parts.find(([k]) => k === "t")?.[1];
    const sigs = parts.filter(([k]) => k === "v1").map(([, v]) => v);
    if (!t || !sigs.length) return false;
    if (Math.abs(Date.now() / 1000 - Number(t)) > TOLERANCE_SECONDS) return false;
    const expected = hmacHex("sha256", whsec(), `${t}.${rawBody}`);
    return sigs.some((s) => safeEqual(expected, s));
  },

  parseWebhook(body): WebhookEvent | null {
    const e = body as { id?: string; type?: string; data?: { object?: Record<string, unknown> } };
    const o = e?.data?.object;
    if (!e?.id || !e.type || !o) return null;
    if (e.type.startsWith("checkout.session.")) {
      return { eventId: e.id, type: e.type, kind: "charge", reference: (o.client_reference_id as string) ?? null, refundId: null, refundStatus: null };
    }
    if (e.type.startsWith("refund.") || e.type === "charge.refund.updated") {
      const s = String(o.status ?? "");
      return {
        eventId: e.id,
        type: e.type,
        kind: "refund",
        reference: null,
        refundId: (o.id as string) ?? null,
        refundStatus: s === "succeeded" ? "succeeded" : s === "failed" || s === "canceled" ? "failed" : "pending",
      };
    }
    return { eventId: e.id, type: e.type, kind: "other", reference: null, refundId: null, refundStatus: null };
  },

  async refund({ transactionId, amountCents }) {
    if (!transactionId) throw new Error("Stripe refunds need the PaymentIntent id");
    const r = await providerFetch<{ id: string; status: string; failure_reason?: string }>(`${base()}/refunds`, {
      method: "POST",
      secret: secret(),
      form: { payment_intent: transactionId, amount: String(amountCents) },
    });
    return {
      refundId: r.id,
      status: r.status === "succeeded" ? "succeeded" : r.status === "failed" || r.status === "canceled" ? "failed" : "pending",
      failureReason: r.failure_reason ?? null,
      raw: r,
    };
  },
};
