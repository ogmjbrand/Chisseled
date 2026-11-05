import Link from "next/link";
import { db } from "@/lib/db";
import { guard, likePattern, pageNumber } from "@/lib/admin/guard";
import { Badge, Card, Empty, Filters, Forbidden, PageHeader, Pagination, Table, fmtDate } from "@/components/admin/ui";
import { formatMoney } from "@/lib/commerce/money";
import { getStoreSettings, orderName } from "@/lib/commerce/settings";

export const metadata = { title: "Orders" };
const PER = 30;
const PAYMENT = ["pending", "paid", "partially_refunded", "refunded", "failed", "voided"];
const FULFIL = ["unfulfilled", "partially_fulfilled", "fulfilled", "returned"];

export default async function Orders({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!(await guard("orders:read"))) return <Forbidden />;
  const sp = await searchParams;
  // "#CH1042", "CH1042" and "1042" all find order 1042.
  const q = (sp.q ?? "").trim().replace(/^#?([A-Za-z]{1,5})?(?=\d+$)/, "").slice(0, 100);
  const payment = PAYMENT.includes(sp.payment ?? "") ? sp.payment! : null;
  const fulfillment = FULFIL.includes(sp.fulfillment ?? "") ? sp.fulfillment! : null;
  const flagged = sp.flagged === "1";
  const showVoided = sp.voided === "1";
  const page = pageNumber(sp.page);
  const settings = await getStoreSettings();
  const sql = db();
  const num = /^\d+$/.test(q) ? Number(q) : null;

  const where = sql`
    where (${q} = '' or o.email ilike ${likePattern(q)} or o.number = ${num ?? -1}
           or (o.shipping_address->>'lastName') ilike ${likePattern(q)})
      and (${payment}::text is null or o.payment_status = ${payment})
      and (${payment}::text is not null or ${showVoided} or o.payment_status <> 'voided')
      and (${fulfillment}::text is null or o.fulfillment_status = ${fulfillment})
      and (not ${flagged} or cardinality(o.flags) > 0)`;
  const [rows, [{ total }]] = await Promise.all([
    sql<{ id: string; number: number; created_at: Date; email: string; name: string | null; total_cents: number; currency: string; payment_status: string; fulfillment_status: string; status: string; items: number; flags: string[] }[]>`
      select o.id, o.number, o.created_at, o.email, o.total_cents, o.currency, o.payment_status, o.fulfillment_status, o.status, o.flags,
             nullif(trim(coalesce(o.shipping_address->>'firstName','') || ' ' || coalesce(o.shipping_address->>'lastName','')), '') as name,
             (select coalesce(sum(quantity),0)::int from order_items where order_id = o.id) as items
      from orders o ${where} order by o.created_at desc limit ${PER} offset ${(page - 1) * PER}`,
    sql<{ total: number }[]>`select count(*)::int as total from orders o ${where}`,
  ]);
  const params = (p: number) => `/admin/orders?${new URLSearchParams({ ...(q && { q }), ...(payment && { payment }), ...(fulfillment && { fulfillment }), ...(flagged && { flagged: "1" }), ...(showVoided && { voided: "1" }), page: String(p) })}`;

  return (
    <>
      <PageHeader title="Orders" description={`${total} order${total === 1 ? "" : "s"}${payment || fulfillment || q ? " match" : ""}. Abandoned checkouts are hidden unless you include them.`} />
      <Card pad={false}>
        <Filters action="/admin/orders">
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Order number, email or surname" aria-label="Search orders" className="adm-input max-w-xs" />
          <select name="payment" defaultValue={payment ?? ""} aria-label="Payment status" className="adm-input w-auto">
            <option value="">Any payment</option>
            {PAYMENT.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
          <select name="fulfillment" defaultValue={fulfillment ?? ""} aria-label="Fulfilment status" className="adm-input w-auto">
            <option value="">Any fulfilment</option>
            {FULFIL.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
          <label className="flex items-center gap-1.5 text-[0.75rem]"><input type="checkbox" name="flagged" value="1" defaultChecked={flagged} className="accent-[var(--color-purple)]" />Needs attention</label>
          <label className="flex items-center gap-1.5 text-[0.75rem]"><input type="checkbox" name="voided" value="1" defaultChecked={showVoided} className="accent-[var(--color-purple)]" />Include abandoned</label>
        </Filters>
        <Table head={["Order", "Date", "Customer", "Items", "Payment", "Fulfilment", <span key="t" className="block text-right">Total</span>]} empty={rows.length === 0 ? <Empty title="No orders found." /> : null}>
          {rows.map((o) => (
            <tr key={o.id}>
              <td>
                <Link href={`/admin/orders/${o.id}`} className="row-link">{orderName(o.number, settings.order_prefix)}</Link>
                {o.flags.length > 0 && <span className="ml-2" title={o.flags.join(", ")}><Badge value="critical" label="attention" /></span>}
              </td>
              <td className="whitespace-nowrap">{fmtDate(o.created_at, true)}</td>
              <td className="max-w-[16rem]"><span className="block truncate text-bone">{o.name ?? "—"}</span><span className="block truncate text-[0.75rem] text-smoke">{o.email}</span></td>
              <td>{o.items}</td>
              <td>{o.status === "cancelled" ? <Badge value="cancelled" /> : <Badge value={o.payment_status} />}</td>
              <td><Badge value={o.fulfillment_status} /></td>
              <td className="num">{formatMoney(o.total_cents, o.currency)}</td>
            </tr>
          ))}
        </Table>
        <Pagination page={page} pages={Math.ceil(total / PER)} href={params} />
      </Card>
    </>
  );
}
