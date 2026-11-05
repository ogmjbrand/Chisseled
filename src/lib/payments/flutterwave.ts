import { hmacBase64, safeEqual } from "@/lib/security/crypto";
import { providerFetch } from "@/lib/payments/http";
import type { PaymentProvider, VerifiedPayment, WebhookEvent } from "@/lib/payments/types";

/**
 * Flutterwave v3 — https://developer.flutterwave.com/docs
 * Amounts are sent in MAJOR units (e.g. 49.99), so convert at the boundary.
 */

const base = () => process.env.FLUTTERWAVE_BASE_URL || "https://api.flutterwave.com/v3";
const secret = () => process.env.FLUTTERWAVE_SECRET_KEY ?? "";
const webhookHash = () => process.env.FLUTTERWAVE_WEBHOOK_HASH ?? "";

const toMajor = (cents: number) => Math.round(cents) / 100;
const toCents = (major: number) => Math.round(Number(major) * 100);

interface FlwEnvelope<T> {
  status: string;
  message: string;
  data: T;
}

const STATUS: Record<string, VerifiedPayment["status"]> = {
  successful: "succeeded",
  failed: "failed",
  cancelled: "abandoned",
};

export const flutterwave: PaymentProvider = {
  id: "flutterwave",
  label: "Card, mobile money & bank (Flutterwave)",

  isConfigured: () => Boolean(secret() && webhookHash()),

  supportsCurrency: (c) => ["NGN", "USD", "GBP", "EUR", "GHS", "KES", "ZAR", "UGX", "TZS", "RWF", "XAF", "XOF", "CAD"].includes(c),

  async initialize(input) {
    const res = await providerFetch<FlwEnvelope<{ link: string }>>(`${base()}/payments`, {
      method: "POST",
      secret: secret(),
      body: {
        tx_ref: input.reference,
        amount: toMajor(input.amountCents),
        currency: input.currency,
        redirect_url: input.callbackUrl,
        customer: { email: input.email, name: input.name, phonenumber: input.phone || undefined },
        customizations: { title: "CHISSELED" },
        meta: { order_id: input.orderId, order_number: input.orderNumber },
      },
    });
    if (res.status !== "success" || !res.data?.link) throw new Error(res.message || "Flutterwave initialisation failed");
    return { authorizationUrl: res.data.link, raw: res.data };
  },

  async verify(reference) {
    const res = await providerFetch<FlwEnvelope<{
      id: number; status: string; amount: number; currency: string; payment_type: string | null;
      app_fee: number | null; processor_response: string | null; tx_ref: string;
    }>>(`${base()}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`, { secret: secret() });
    const d = res.data;
    if (d.tx_ref !== reference) throw new Error("Flutterwave verification returned a different reference");
    return {
      status: STATUS[d.status] ?? "pending",
      amountCents: toCents(d.amount),
      currency: d.currency,
      transactionId: String(d.id),
      channel: d.payment_type,
      feeCents: d.app_fee !== null && d.app_fee !== undefined ? toCents(d.app_fee) : null,
      failureReason: d.status === "successful" ? null : d.processor_response,
      raw: d,
    };
  },

  verifyWebhook(rawBody, headers) {
    const hash = webhookHash();
    if (!hash) return false;
    // Newer signed webhooks: HMAC-SHA256(body, secret hash), base64.
    const signed = headers.get("flutterwave-signature");
    if (signed) return safeEqual(hmacBase64("sha256", hash, rawBody), signed);
    // Legacy: the static secret hash echoed in `verif-hash`.
    const legacy = headers.get("verif-hash");
    return Boolean(legacy) && safeEqual(legacy!, hash);
  },

  parseWebhook(body): WebhookEvent | null {
    const b = body as { event?: string; type?: string; data?: Record<string, unknown> };
    const event = b?.event ?? b?.type;
    if (!event || !b.data) return null;
    const d = b.data;
    if (event.startsWith("charge.")) {
      return {
        eventId: `${event}:${String(d.id ?? d.tx_ref)}:${String(d.status ?? "")}`,
        type: event,
        kind: "charge",
        reference: typeof d.tx_ref === "string" ? d.tx_ref : null,
        refundId: null,
        refundStatus: null,
      };
    }
    if (event.startsWith("refund.")) {
      const s = String(d.status ?? "").toLowerCase();
      return {
        eventId: `${event}:${String(d.id)}:${s}`,
        type: event,
        kind: "refund",
        reference: typeof d.tx_ref === "string" ? d.tx_ref : null,
        refundId: d.id !== undefined ? String(d.id) : null,
        refundStatus: s === "completed" || s === "successful" ? "succeeded" : s === "failed" ? "failed" : "pending",
      };
    }
    return { eventId: `${event}:${String(d.id ?? "")}`, type: event, kind: "other", reference: null, refundId: null, refundStatus: null };
  },

  async refund({ transactionId, amountCents }) {
    if (!transactionId) throw new Error("Flutterwave refunds need the provider transaction id");
    const res = await providerFetch<FlwEnvelope<{ id: number; status: string }>>(
      `${base()}/transactions/${encodeURIComponent(transactionId)}/refund`,
      { method: "POST", secret: secret(), body: { amount: toMajor(amountCents) } },
    );
    const s = String(res.data?.status ?? "").toLowerCase();
    return {
      refundId: res.data?.id !== undefined ? String(res.data.id) : null,
      status: s === "completed" || s === "successful" ? "succeeded" : s === "failed" ? "failed" : "pending",
      failureReason: s === "failed" ? res.message : null,
      raw: res.data,
    };
  },
};
