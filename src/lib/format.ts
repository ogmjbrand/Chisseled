/**
 * Currency is Naira by default — CHISSELED ships from Lagos — with a
 * client-side selector for international browsing. Rates here are
 * illustrative placeholders; production must read live rates and price
 * in the customer's settlement currency at checkout.
 */

export const CURRENCIES = {
  NGN: { code: "NGN", symbol: "₦", rate: 1, locale: "en-NG" },
  USD: { code: "USD", symbol: "$", rate: 0.00065, locale: "en-US" },
  GBP: { code: "GBP", symbol: "£", rate: 0.00051, locale: "en-GB" },
  EUR: { code: "EUR", symbol: "€", rate: 0.0006, locale: "en-IE" },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export function formatPrice(naira: number, code: CurrencyCode = "NGN"): string {
  const c = CURRENCIES[code];
  const value = naira * c.rate;

  if (code === "NGN") {
    return `₦${Math.round(value).toLocaleString("en-NG")}`;
  }

  return `${c.symbol}${value.toLocaleString(c.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return String(n);
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Free shipping threshold, in Naira. */
export const FREE_SHIPPING_THRESHOLD = 120000;
