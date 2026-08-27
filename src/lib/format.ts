/**
 * CHISSELED prices in USD — the storefront is US-first, shipping from Florida.
 *
 * The base unit is integer cents, never a float: 8900 is $89.00. Money never
 * touches binary floating point until the moment it is displayed, so totals
 * cannot drift by a cent over a long cart.
 *
 * Other currencies are presentational only. The rates below are illustrative
 * placeholders for browsing — production must read live rates and settle in
 * the customer's currency at the payment provider, not here.
 */

export const CURRENCIES = {
  USD: { code: "USD", symbol: "$", rate: 1, locale: "en-US" },
  GBP: { code: "GBP", symbol: "£", rate: 0.79, locale: "en-GB" },
  EUR: { code: "EUR", symbol: "€", rate: 0.92, locale: "en-IE" },
  CAD: { code: "CAD", symbol: "CA$", rate: 1.37, locale: "en-CA" },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const BASE_CURRENCY: CurrencyCode = "USD";

/**
 * Format a price held in cents. Whole-dollar amounts drop the decimals —
 * "$89" reads as a considered price where "$89.00" reads as a receipt.
 */
export function formatPrice(cents: number, code: CurrencyCode = BASE_CURRENCY): string {
  const c = CURRENCIES[code];
  const value = (cents / 100) * c.rate;
  const whole = Math.abs(value % 1) < 0.005;

  return `${c.symbol}${value.toLocaleString(c.locale, {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  })}`;
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return String(n);
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Free US shipping over $100, in cents. */
export const FREE_SHIPPING_THRESHOLD = 10000;

/**
 * US MSRP architecture. Retail sits in a tier because of what a piece is,
 * not because of what an exchange rate did that morning.
 */
export const PRICE_TIERS = {
  essentials: { label: "Essentials", min: 3500, max: 5500 },
  performance: { label: "Performance", min: 6500, max: 9500 },
  premium: { label: "Premium", min: 9500, max: 15000 },
  statement: { label: "Statement", min: 12000, max: 20000 },
} as const;

export type PriceTier = keyof typeof PRICE_TIERS;
