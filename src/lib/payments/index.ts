import { assertServer } from "@/lib/security/server-only";
import { flutterwave } from "@/lib/payments/flutterwave";
import { paystack } from "@/lib/payments/paystack";
import type { PaymentProvider, ProviderId } from "@/lib/payments/types";
import { getPaymentSettings } from "@/lib/commerce/settings";

assertServer("src/lib/payments");

export const PROVIDERS: Record<ProviderId, PaymentProvider> = { paystack, flutterwave };

export function getProvider(id: string): PaymentProvider | null {
  return id in PROVIDERS ? PROVIDERS[id as ProviderId] : null;
}

/** Providers that have keys configured, are enabled in settings, and accept the store currency. */
export async function availableProviders(currency: string): Promise<PaymentProvider[]> {
  const settings = await getPaymentSettings();
  return Object.values(PROVIDERS).filter(
    (p) =>
      p.isConfigured() &&
      p.supportsCurrency(currency) &&
      (p.id === "paystack" ? settings.paystack_enabled : settings.flutterwave_enabled),
  );
}

export type { PaymentProvider, ProviderId };
