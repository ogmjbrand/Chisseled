import { db, isDatabaseConfigured } from "@/lib/db";
import { can, getStaff } from "@/lib/auth/staff";
import type { Permission } from "@/lib/auth/permissions";
import { audit } from "@/lib/commerce/audit";

export const dynamic = "force-dynamic";

/** CSV cell: quoted, and neutralised against spreadsheet formula injection. */
function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s = v instanceof Date ? v.toISOString() : Array.isArray(v) ? v.join("; ") : typeof v === "object" ? JSON.stringify(v) : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

const money = (c: number | null) => (c === null || c === undefined ? null : (c / 100).toFixed(2));

const EXPORTS: Record<string, { permission: Permission; query: () => Promise<Record<string, unknown>[]> }> = {
  orders: {
    permission: "orders:read",
    query: async () =>
      (await db()<Record<string, unknown>[]>`
        select o.number, o.created_at, o.paid_at, o.email, o.status, o.payment_status, o.fulfillment_status, o.currency,
               o.subtotal_cents, o.discount_cents, o.shipping_cents, o.tax_cents, o.total_cents, o.refunded_cents,
               o.discount_code, o.shipping_method, o.payment_provider,
               o.shipping_address->>'firstName' as first_name, o.shipping_address->>'lastName' as last_name,
               o.shipping_address->>'city' as city, o.shipping_address->>'country' as country,
               (select string_agg(oi.quantity || ' x ' || oi.title || coalesce(' (' || nullif(oi.variant_title,'') || ')', ''), '; ')
                  from order_items oi where oi.order_id = o.id) as items
        from orders o where o.payment_status <> 'voided' order by o.created_at desc limit 50000`).map((r) => ({
        ...r,
        subtotal: money(r.subtotal_cents as number), discount: money(r.discount_cents as number), shipping: money(r.shipping_cents as number),
        tax: money(r.tax_cents as number), total: money(r.total_cents as number), refunded: money(r.refunded_cents as number),
        subtotal_cents: undefined, discount_cents: undefined, shipping_cents: undefined, tax_cents: undefined, total_cents: undefined, refunded_cents: undefined,
      })),
  },
  customers: {
    permission: "customers:read",
    query: async () =>
      (await db()<Record<string, unknown>[]>`
        select c.email, c.first_name, c.last_name, c.phone, c.accepts_marketing, c.tags, c.status,
               (c.password_hash is not null) as has_account, c.created_at,
               (select count(*) from orders o where o.customer_id = c.id and o.payment_status in ('paid','partially_refunded','refunded'))::int as paid_orders,
               (select coalesce(sum(total_cents - refunded_cents),0) from orders o where o.customer_id = c.id and o.payment_status in ('paid','partially_refunded','refunded'))::bigint as spent_cents
        from customers c order by c.created_at desc limit 100000`).map((r) => ({ ...r, lifetime_spend: money(r.spent_cents as number), spent_cents: undefined })),
  },
  products: {
    permission: "products:read",
    query: async () =>
      (await db()<Record<string, unknown>[]>`
        select p.slug, p.title, p.status, c.name as category, v.title as variant, v.sku, v.barcode,
               v.price_cents, v.compare_at_cents, v.cost_cents, i.on_hand, i.reserved, i.low_stock_threshold
        from products p join product_variants v on v.product_id = p.id left join inventory i on i.variant_id = v.id
        left join categories c on c.id = p.category_id order by p.title, v.position`).map((r) => ({
        ...r, price: money(r.price_cents as number), compare_at: money(r.compare_at_cents as number), cost: money(r.cost_cents as number),
        price_cents: undefined, compare_at_cents: undefined, cost_cents: undefined,
      })),
  },
  subscribers: {
    permission: "marketing:read",
    query: () => db()<Record<string, unknown>[]>`
      select email, source, subscribed_at from newsletter_subscribers where status = 'subscribed' order by subscribed_at desc`,
  },
};

export async function GET(_req: Request, ctx: { params: Promise<{ kind: string }> }) {
  const { kind } = await ctx.params;
  const spec = EXPORTS[kind];
  if (!spec || !isDatabaseConfigured()) return new Response("Not found", { status: 404 });
  const staff = await getStaff();
  if (!staff) return new Response("Sign in required", { status: 401 });
  if (!can(staff, spec.permission)) return new Response("Forbidden", { status: 403 });

  const rows = (await spec.query()).map((r) => Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined)));
  const headers = rows[0] ? Object.keys(rows[0]) : ["no_rows"];
  const csv = [headers.map(cell).join(","), ...rows.map((r) => headers.map((h) => cell(r[h])).join(","))].join("\r\n");
  await audit(staff, "export.csv", "export", kind, { rows: rows.length });
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="chisseled-${kind}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
