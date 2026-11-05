import { hmacHex, safeEqual } from "@/lib/security/crypto";
import { providerFetch } from "@/lib/payments/http";
import type { PaymentProvider, VerifiedPayment, WebhookEvent } from "@/lib/payments/types";

/**
 * Paystack — https://paystack.com/docs/api
 * Amounts are sent in the currency's subunit (kobo, pesewas, cents), which
 * is exactly how this app stores money.
 */

const base = () => process.env.PAYSTACK_BASE_URL || "https://api.paystack.co";
const secret = () => process.env.PAYSTACK_SECRET_KEY ?? "";

interface PaystackEnvelope<T> {
  status: boolean;
  message: string;
  data: T;
}

const STATUS: Record<string, VerifiedPayment["status"]> = {
  success: "succeeded",
  failed: "failed",
  abandoned: "abandoned",
  reversed: "failed",
};

export const paystack: PaymentProvider = {
  id: "paystack",
  label: "Card, bank transfer & USSD (Paystack)",

  isConfigured: () => Boolean(secret()),

  supportsCurrency: (c) => ["NGN", "GHS", "ZAR", "KES", "USD", "XOF", "EGP", "RWF"].includes(c),

  async initialize(input) {
    const res = await providerFetch<PaystackEnvelope<{ authorization_url: string; reference: string }>>(
      `${base()}/transaction/initialize`,
      {
        method: "POST",
        secret: secret(),
        body: {
          email: input.email,
          amount: input.amountCents,
          currency: input.currency,
          reference: input.reference,
          callback_url: input.callbackUrl,
          metadata: { order_id: input.orderId, order_number: input.orderNumber },
        },
      },
    );
    if (!res.status || !res.data?.authorization_url) throw new Error(res.message || "Paystack initialisation failed");
    return { authorizationUrl: res.data.authorization_url, raw: res.data };
  },

  async verify(reference) {
    const res = await providerFetch<PaystackEnvelope<{
      id: number; status: string; amount: number; currency: string; channel: string | null;
      fees: number | null; gateway_response: string | null; reference: string;
    }>>(`${base()}/transaction/verify/${encodeURIComponent(reference)}`, { secret: secret() });
    const d = res.data;
    return {
      status: STATUS[d.status] ?? "pending",
      amountCents: d.amount,
      currency: d.currency,
      transactionId: String(d.id),
      channel: d.channel,
      feeCents: d.fees ?? null,
      failureReason: d.status === "success" ? null : d.gateway_response,
      raw: d,
    };
  },

  verifyWebhook(rawBody, headers) {
    const signature = headers.get("x-paystack-signature");
    if (!signature || !secret()) return false;
    return safeEqual(hmacHex("sha512", secret(), rawBody), signature);
  },

  parseWebhook(body): WebhookEvent | null {
    const b = body as { event?: string; data?: Record<string, unknown> };
    if (!b?.event || !b.data) return null;
    const d = b.data;
    if (b.event.startsWith("charge.")) {
      return {
        eventId: `${b.event}:${String(d.id ?? d.reference)}`,
        type: b.event,
        kind: "charge",
        reference: typeof d.reference === "string" ? d.reference : null,
        refundId: null,
        refundStatus: null,
      };
    }
    if (b.event.startsWith("refund.")) {
      const status = b.event === "refund.processed" ? "succeeded" : b.event === "refund.failed" ? "failed" : "pending";
      const tx = d.transaction_reference ?? (d.transaction as { reference?: string } | undefined)?.reference;
      return {
        eventId: `${b.event}:${String(d.id)}`,
        type: b.event,
        kind: "refund",
        reference: typeof tx === "string" ? tx : null,
        refundId: d.id !== undefined ? String(d.id) : null,
        refundStatus: status,
      };
    }
    return { eventId: `${b.event}:${String(d.id ?? "")}`, type: b.event, kind: "other", reference: null, refundId: null, refundStatus: null };
  },

  async refund({ reference, amountCents }) {
    const res = await providerFetch<PaystackEnvelope<{ id: number; status: string }>>(`${base()}/refund`, {
      method: "POST",
      secret: secret(),
      body: { transaction: reference, amount: amountCents },
    });
    const s = res.data?.status;
    return {
      refundId: res.data?.id !== undefined ? String(res.data.id) : null,
      status: s === "processed" ? "succeeded" : s === "failed" ? "failed" : "pending",
      failureReason: s === "failed" ? res.message : null,
      raw: res.data,
    };
  },
};
