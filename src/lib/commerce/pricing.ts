import { db, type Queryable } from "@/lib/db";
import type { StoreSettings } from "@/lib/commerce/settings";

/**
 * Server-side pricing. The browser never sends a price: every total is
 * recomputed here from database prices at the moment of checkout.
 */

export interface PricedLine {
  variantId: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
}

export interface DiscountRow {
  id: string;
  code: string | null;
  title: string;
  kind: "percentage" | "fixed_amount" | "free_shipping";
  value: number;
  min_subtotal_cents: number;
  applies_to: "all" | "collections" | "products";
  collection_ids: string[];
  product_ids: string[];
  usage_limit: number | null;
  once_per_customer: boolean;
  times_used: number;
  is_automatic: boolean;
}

export interface ShippingOption {
  id: string;
  name: string;
  priceCents: number;
  daysMin: number | null;
  daysMax: number | null;
}

export interface Totals {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  discount: { id: string; code: string | null; title: string; freeShipping: boolean } | null;
  discountError: string | null;
  shippingOptions: ShippingOption[];
  shippingRate: ShippingOption | null;
  shippingError: string | null;
}

async function eligibleSubtotal(d: DiscountRow, lines: PricedLine[], q: Queryable): Promise<number> {
  if (d.applies_to === "all") return lines.reduce((n, l) => n + l.unitPriceCents * l.quantity, 0);
  let productIds = new Set(d.product_ids);
  if (d.applies_to === "collections") {
    const rows = await q<{ product_id: string }[]>`
      select product_id from product_collections where collection_id = any(${d.collection_ids}::uuid[])`;
    productIds = new Set(rows.map((r) => r.product_id));
  }
  return lines.filter((l) => productIds.has(l.productId)).reduce((n, l) => n + l.unitPriceCents * l.quantity, 0);
}

function amountFor(d: DiscountRow, eligible: number): number {
  if (d.kind === "percentage") return Math.floor((eligible * d.value) / 100);
  if (d.kind === "fixed_amount") return Math.min(d.value, eligible);
  return 0;
}

async function validate(d: DiscountRow, subtotal: number, email: string | null, q: Queryable): Promise<string | null> {
  if (d.usage_limit !== null && d.times_used >= d.usage_limit) return "This code has reached its usage limit.";
  if (subtotal < d.min_subtotal_cents) return "Your bag doesn't meet this code's minimum spend yet.";
  if (d.once_per_customer && email) {
    const [used] = await q`select 1 from discount_redemptions where discount_id = ${d.id} and email = ${email} limit 1`;
    if (used) return "You've already used this code.";
  }
  return null;
}

const DISCOUNT_COLS = `id, code, title, kind, value, min_subtotal_cents, applies_to, collection_ids, product_ids,
  usage_limit, once_per_customer, times_used, is_automatic`;

export async function findCodeDiscount(code: string, q: Queryable = db(), lock = false): Promise<DiscountRow | null> {
  const rows = await q.unsafe<DiscountRow[]>(
    `select ${DISCOUNT_COLS} from discounts
     where code = $1 and status = 'active' and starts_at <= now() and (ends_at is null or ends_at > now())
     ${lock ? "for update" : ""}`,
    [code.trim()],
  );
  return rows[0] ?? null;
}

async function automaticDiscounts(q: Queryable): Promise<DiscountRow[]> {
  return q.unsafe<DiscountRow[]>(
    `select ${DISCOUNT_COLS} from discounts
     where is_automatic and status = 'active' and starts_at <= now() and (ends_at is null or ends_at > now())`,
  );
}

export async function shippingOptionsFor(country: string, subtotalAfterDiscount: number, q: Queryable = db()) {
  const zones = await q<{ id: string; countries: string[]; is_rest_of_world: boolean }[]>`
    select id, countries, is_rest_of_world from shipping_zones`;
  if (zones.length === 0) return { options: [] as ShippingOption[], error: "Shipping hasn't been set up yet." };
  const zone =
    zones.find((z) => z.countries.map((c) => c.trim()).includes(country)) ?? zones.find((z) => z.is_rest_of_world);
  if (!zone) return { options: [] as ShippingOption[], error: "We don't ship to this country yet." };
  const rates = await q<{ id: string; name: string; price_cents: number; free_over_cents: number | null; days_min: number | null; days_max: number | null }[]>`
    select id, name, price_cents, free_over_cents, days_min, days_max from shipping_rates
    where zone_id = ${zone.id} and active and min_subtotal_cents <= ${subtotalAfterDiscount}
    order by position, price_cents`;
  if (rates.length === 0) return { options: [] as ShippingOption[], error: "No delivery options are available for this order." };
  return {
    options: rates.map((r) => ({
      id: r.id,
      name: r.name,
      priceCents: r.free_over_cents !== null && subtotalAfterDiscount >= r.free_over_cents ? 0 : r.price_cents,
      daysMin: r.days_min,
      daysMax: r.days_max,
    })),
    error: null,
  };
}

export async function computeTotals(
  input: {
    lines: PricedLine[];
    discountCode: string | null;
    email: string | null;
    country: string | null;
    shippingRateId: string | null;
    settings: StoreSettings;
    /** Inside checkout, lock the discount row so usage limits can't be raced. */
    lockDiscount?: boolean;
  },
  q: Queryable = db(),
): Promise<Totals> {
  const subtotal = input.lines.reduce((n, l) => n + l.unitPriceCents * l.quantity, 0);

  let discount: DiscountRow | null = null;
  let discountCents = 0;
  let discountError: string | null = null;

  if (input.discountCode) {
    const d = await findCodeDiscount(input.discountCode, q, input.lockDiscount);
    if (!d) discountError = "That code isn't valid.";
    else {
      discountError = await validate(d, subtotal, input.email, q);
      if (!discountError) {
        const eligible = await eligibleSubtotal(d, input.lines, q);
        if (eligible === 0 && d.kind !== "free_shipping") discountError = "This code doesn't apply to the items in your bag.";
        else {
          discount = d;
          discountCents = amountFor(d, eligible);
        }
      }
    }
  }
  if (!discount) {
    // Best automatic discount, if any.
    for (const d of await automaticDiscounts(q)) {
      if (await validate(d, subtotal, input.email, q)) continue;
      const amount = amountFor(d, await eligibleSubtotal(d, input.lines, q));
      if (!discount || amount > discountCents) {
        discount = d;
        discountCents = amount;
      }
    }
  }

  const afterDiscount = subtotal - discountCents;
  let shippingOptions: ShippingOption[] = [];
  let shippingError: string | null = null;
  let shippingRate: ShippingOption | null = null;
  if (input.country) {
    const res = await shippingOptionsFor(input.country, afterDiscount, q);
    shippingOptions = res.options;
    shippingError = res.error;
    if (discount?.kind === "free_shipping") shippingOptions = shippingOptions.map((o) => ({ ...o, priceCents: 0 }));
    shippingRate = shippingOptions.find((o) => o.id === input.shippingRateId) ?? shippingOptions[0] ?? null;
  }
  const shippingCents = shippingRate?.priceCents ?? 0;
  const taxCents = input.settings.tax_inclusive ? 0 : Math.round((afterDiscount * input.settings.tax_rate_bps) / 10_000);

  return {
    subtotalCents: subtotal,
    discountCents,
    shippingCents,
    taxCents,
    totalCents: afterDiscount + shippingCents + taxCents,
    discount: discount
      ? { id: discount.id, code: discount.code, title: discount.title, freeShipping: discount.kind === "free_shipping" }
      : null,
    discountError,
    shippingOptions,
    shippingRate,
    shippingError,
  };
}
