import { db } from "@/lib/db";
import { guard } from "@/lib/admin/guard";
import { can } from "@/lib/auth/staff";
import { Badge, Card, Empty, Forbidden, PageHeader, fmtDate } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/ActionForm";
import { DiscountForm, type DiscountRow } from "@/components/admin/DiscountForm";
import { deleteDiscountAction } from "@/lib/admin/config-actions";
import { formatMoney } from "@/lib/commerce/money";
import { getStoreSettings } from "@/lib/commerce/settings";

export const metadata = { title: "Discounts" };

export default async function Discounts() {
  const staff = await guard("discounts:read");
  if (!staff) return <Forbidden />;
  const settings = await getStoreSettings();
  const [rows, collections, products] = await Promise.all([
    db()<(DiscountRow & { times_used: number; revenue: number; given: number })[]>`
      select d.*, coalesce(sum(o.total_cents) filter (where o.payment_status in ('paid','partially_refunded','refunded')),0)::bigint as revenue,
             coalesce(sum(r.amount_cents) filter (where o.payment_status in ('paid','partially_refunded','refunded')),0)::bigint as given
      from discounts d left join discount_redemptions r on r.discount_id = d.id left join orders o on o.id = r.order_id
      group by d.id order by d.created_at desc`,
    db()<{ id: string; title: string }[]>`select id, title from collections order by title`,
    db()<{ id: string; title: string }[]>`select id, title from products where status <> 'archived' order by title limit 1000`,
  ]);
  const writable = can(staff, "discounts:write");
  const money = (n: number) => formatMoney(n, settings.currency);
  const describe = (d: DiscountRow) =>
    d.kind === "percentage" ? `${d.value}% off` : d.kind === "fixed_amount" ? `${money(d.value)} off` : "Free shipping";
  const live = (d: DiscountRow) => d.status === "active" && d.starts_at <= new Date() && (!d.ends_at || d.ends_at > new Date());

  return (
    <>
      <PageHeader title="Discounts" description="Codes and automatic promotions. Usage is claimed when an order is placed and released if it's never paid." />
      {writable && <Card title="New discount" className="mb-6"><DiscountForm collections={collections} products={products} /></Card>}
      <Card pad={false}>
        {rows.length === 0 ? <Empty title="No discounts yet." /> : (
          <ul className="divide-y divide-bone/[0.07]">
            {rows.map((d) => (
              <li key={d.id} className="px-5 py-4">
                <details>
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                    <span>
                      <span className="font-mono text-bone">{d.code ?? "AUTOMATIC"}</span>
                      <span className="ml-2 text-smoke">{d.title} · {describe(d)}{d.min_subtotal_cents ? ` over ${money(d.min_subtotal_cents)}` : ""}</span>
                      <span className="block text-[0.75rem] text-smoke">
                        {fmtDate(d.starts_at)} – {d.ends_at ? fmtDate(d.ends_at) : "no end"} · used {d.times_used}{d.usage_limit ? `/${d.usage_limit}` : ""} · {money(d.given)} given · {money(d.revenue)} in orders
                      </span>
                    </span>
                    <Badge value={live(d) ? "active" : d.status === "active" ? "scheduled" : "disabled"} label={live(d) ? "live" : d.status === "active" ? (d.ends_at && d.ends_at <= new Date() ? "expired" : "scheduled") : "disabled"} />
                  </summary>
                  {writable && (
                    <div className="mt-4 space-y-3">
                      <DiscountForm d={d} collections={collections} products={products} />
                      <ActionForm action={deleteDiscountAction} confirm="Delete this discount?">
                        <input type="hidden" name="id" value={d.id} />
                        <Submit variant="danger">Delete</Submit>
                      </ActionForm>
                    </div>
                  )}
                </details>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
