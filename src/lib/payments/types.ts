export type ProviderId = "paystack" | "flutterwave" | "stripe";

export interface InitializeInput {
  /** Where the shopper returns if they abandon the hosted page. */
  cancelUrl?: string;
  reference: string;
  amountCents: number;
  currency: string;
  email: string;
  name: string;
  phone: string;
  callbackUrl: string;
  orderId: string;
  orderNumber: number;
}

export interface VerifiedPayment {
  status: "succeeded" | "failed" | "pending" | "abandoned";
  amountCents: number;
  currency: string;
  transactionId: string | null;
  channel: string | null;
  feeCents: number | null;
  failureReason: string | null;
  raw: unknown;
}

export interface WebhookEvent {
  eventId: string;
  type: string;
  kind: "charge" | "refund" | "other";
  reference: string | null;
  refundId: string | null;
  refundStatus: "succeeded" | "failed" | "pending" | null;
}

export interface RefundResult {
  refundId: string | null;
  status: "pending" | "succeeded" | "failed";
  failureReason: string | null;
  raw: unknown;
}

export interface PaymentProvider {
  id: ProviderId;
  label: string;
  isConfigured(): boolean;
  supportsCurrency(currency: string): boolean;
  initialize(input: InitializeInput): Promise<{ authorizationUrl: string; raw: unknown }>;
  /** `hint` is the provider-side id stored at initialisation (Stripe's Checkout Session id). */
  verify(reference: string, hint?: string | null): Promise<VerifiedPayment>;
  /** Signature check over the exact raw request body. */
  verifyWebhook(rawBody: string, headers: Headers): boolean;
  parseWebhook(body: unknown): WebhookEvent | null;
  refund(input: { reference: string; transactionId: string | null; amountCents: number; currency: string }): Promise<RefundResult>;
}

export class PaymentProviderError extends Error {}
