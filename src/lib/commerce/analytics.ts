import { db } from "@/lib/db";

/**
 * Store analytics computed directly from orders, refunds, inventory and carts.
 * Definitions (shown in the UI next to each figure):
 *   Gross sales    = item subtotals of paid orders, before discounts
 *   Discounts      = discount amounts on those orders
 *   Refunds        = refunds issued in the period (not failed)
 *   Net sales      = gross − discounts − refunds
 *   Total collected= order totals (incl. shipping & tax) − refunds
 * "Paid" = payment verified (paid / partially refunded / refunded).
 */

const PAID = ["paid", "partially_refunded", "refunded"];

export interface Range {
  from: Date;
  to: Date;
}

export function rangeFromParam(days: string | undefined): Range & { days: number } {
  const d = [7, 30, 90, 365].includes(Number(days)) ? Number(days) : 30;
  const to = new Date();
  const from = new Date(to.getTime() - d * 86400_000);
  return { from, to, days: d };
}

export function previous(r: Range): Range {
  const span = r.to.getTime() - r.from.getTime();
  return { from: new Date(r.from.getTime() - span), to: r.from };
}

export interface Summary {
  orders: number;
  grossCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  refundCents: number;
  refundCount: number;
  netCents: number;
  collectedCents: number;
  aovCents: number;
  customers: number;
  newCustomers: number;
  returningCustomers: number;
  units: number;
}

export async function summary(r: Range): Promise<Summary> {
  const sql = db();
  const [o] = await sql<{ orders: number; gross: number; discount: number; shipping: number; tax: number; total: number; customers: number }[]>`
    select count(*)::int as orders, coalesce(sum(subtotal_cents),0)::bigint as gross, coalesce(sum(discount_cents),0)::bigint as discount,
           coalesce(sum(shipping_cents),0)::bigint as shipping, coalesce(sum(tax_cents),0)::bigint as tax,
           coalesce(sum(total_cents),0)::bigint as total, count(distinct customer_id)::int as customers
    from orders where payment_status = any(${PAID}) and paid_at >= ${r.from} and paid_at < ${r.to}`;
  const [u] = await sql<{ units: number }[]>`
    select coalesce(sum(oi.quantity),0)::int as units from order_items oi join orders o on o.id = oi.order_id
    where o.payment_status = any(${PAID}) and o.paid_at >= ${r.from} and o.paid_at < ${r.to}`;
  const [rf] = await sql<{ amount: number; count: number }[]>`
    select coalesce(sum(amount_cents),0)::bigint as amount, count(*)::int as count from refunds
    where status <> 'failed' and created_at >= ${r.from} and created_at < ${r.to}`;
  // New = first ever paid order falls in the range; returning = had a paid order before the range.
  const [c] = await sql<{ new_customers: number; returning: number }[]>`
    with buyers as (
      select customer_id, min(paid_at) as first_paid from orders
      where payment_status = any(${PAID}) and customer_id is not null group by customer_id),
    in_range as (
      select distinct customer_id from orders
      where payment_status = any(${PAID}) and paid_at >= ${r.from} and paid_at < ${r.to} and customer_id is not null)
    select count(*) filter (where b.first_paid >= ${r.from})::int as new_customers,
           count(*) filter (where b.first_paid < ${r.from})::int as returning
    from in_range i join buyers b using (customer_id)`;
  const net = o.gross - o.discount - rf.amount;
  return {
    orders: o.orders,
    grossCents: o.gross,
    discountCents: o.discount,
    shippingCents: o.shipping,
    taxCents: o.tax,
    totalCents: o.total,
    refundCents: rf.amount,
    refundCount: rf.count,
    netCents: net,
    collectedCents: o.total - rf.amount,
    aovCents: o.orders ? Math.round(o.total / o.orders) : 0,
    customers: o.customers,
    newCustomers: c.new_customers,
    returningCustomers: c.returning,
    units: u.units,
  };
}

export async function salesSeries(r: Range & { days: number }): Promise<{ label: string; value: number; orders: number }[]> {
  const bucket = r.days > 120 ? "month" : r.days > 31 ? "week" : "day";
  const rows = await db()<{ bucket: Date; revenue: number; orders: number }[]>`
    with series as (
      select generate_series(date_trunc(${bucket}, ${r.from}::timestamptz), date_trunc(${bucket}, ${r.to}::timestamptz),
                             ('1 ' || ${bucket})::interval) as bucket)
    select s.bucket, coalesce(sum(o.total_cents),0)::bigint as revenue, count(o.id)::int as orders
    from series s left join orders o
      on date_trunc(${bucket}, o.paid_at) = s.bucket and o.payment_status = any(${PAID})
    group by s.bucket order by s.bucket`;
  const fmt: Intl.DateTimeFormatOptions = bucket === "month" ? { month: "short", year: "2-digit" } : { day: "numeric", month: "short" };
  return rows.map((row) => ({ label: new Date(row.bucket).toLocaleDateString("en-GB", fmt), value: row.revenue, orders: row.orders }));
}

export async function bestSellers(r: Range, limit = 8) {
  return db()<{ product_id: string | null; title: string; units: number; revenue: number; cost: number | null; costed_units: number }[]>`
    select oi.product_id, max(oi.title) as title, sum(oi.quantity)::int as units, sum(oi.total_cents)::bigint as revenue,
           sum(oi.unit_cost_cents * oi.quantity) filter (where oi.unit_cost_cents is not null)::bigint as cost,
           coalesce(sum(oi.quantity) filter (where oi.unit_cost_cents is not null), 0)::int as costed_units
    from order_items oi join orders o on o.id = oi.order_id
    where o.payment_status = any(${PAID}) and o.paid_at >= ${r.from} and o.paid_at < ${r.to}
    group by oi.product_id order by revenue desc limit ${limit}`;
}

/** Gross profit only over line items that carry a unit cost — never estimated. */
export async function profitability(r: Range) {
  const [row] = await db()<{ revenue: number; cost: number; costed_revenue: number }[]>`
    select coalesce(sum(oi.total_cents),0)::bigint as revenue,
           coalesce(sum(oi.unit_cost_cents * oi.quantity) filter (where oi.unit_cost_cents is not null),0)::bigint as cost,
           coalesce(sum(oi.total_cents) filter (where oi.unit_cost_cents is not null),0)::bigint as costed_revenue
    from order_items oi join orders o on o.id = oi.order_id
    where o.payment_status = any(${PAID}) and o.paid_at >= ${r.from} and o.paid_at < ${r.to}`;
  return {
    revenueCents: row.revenue,
    costedRevenueCents: row.costed_revenue,
    costCents: row.cost,
    grossProfitCents: row.costed_revenue - row.cost,
    coverage: row.revenue ? row.costed_revenue / row.revenue : 0,
  };
}

export async function retention() {
  const [row] = await db()<{ buyers: number; repeat: number }[]>`
    select count(*)::int as buyers, count(*) filter (where n > 1)::int as repeat from (
      select customer_id, count(*) as n from orders where payment_status = any(${PAID}) and customer_id is not null group by customer_id) t`;
  return { buyers: row.buyers, repeat: row.repeat, rate: row.buyers ? row.repeat / row.buyers : 0 };
}

export async function inventoryValuation() {
  const [row] = await db()<{ units: number; at_cost: number; at_retail: number; uncosted_units: number; variants: number; low: number; out: number }[]>`
    select coalesce(sum(i.on_hand),0)::int as units,
           coalesce(sum(i.on_hand * v.cost_cents) filter (where v.cost_cents is not null),0)::bigint as at_cost,
           coalesce(sum(i.on_hand * v.price_cents),0)::bigint as at_retail,
           coalesce(sum(i.on_hand) filter (where v.cost_cents is null),0)::int as uncosted_units,
           count(*)::int as variants,
           count(*) filter (where i.on_hand - i.reserved > 0 and i.on_hand - i.reserved <= i.low_stock_threshold)::int as low,
           count(*) filter (where i.on_hand - i.reserved <= 0)::int as out
    from inventory i join product_variants v on v.id = i.variant_id join products p on p.id = v.product_id
    where v.track_inventory and p.status <> 'archived'`;
  return row;
}

/** Checkout funnel from real cart and order rows. */
export async function funnel(r: Range) {
  const [row] = await db()<{ carts: number; checkouts: number; paid: number }[]>`
    select (select count(*) from carts c where c.created_at >= ${r.from} and c.created_at < ${r.to}
              and (c.status = 'converted' or exists (select 1 from cart_items ci where ci.cart_id = c.id)))::int as carts,
           (select count(distinct coalesce(cart_id::text, id::text)) from orders where created_at >= ${r.from} and created_at < ${r.to})::int as checkouts,
           (select count(*) from orders where payment_status = any(${PAID}) and paid_at >= ${r.from} and paid_at < ${r.to})::int as paid`;
  return row;
}

export async function refundStats(r: Range) {
  return db()<{ reason: string; count: number; amount: number }[]>`
    select coalesce(nullif(reason, ''), 'No reason given') as reason, count(*)::int as count, sum(amount_cents)::bigint as amount
    from refunds where status <> 'failed' and created_at >= ${r.from} and created_at < ${r.to}
    group by 1 order by amount desc limit 6`;
}

export function pctChange(now: number, before: number): number | null {
  if (!before) return null;
  return ((now - before) / before) * 100;
}
