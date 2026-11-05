import Link from "next/link";
import { db } from "@/lib/db";
import { guard, pageNumber } from "@/lib/admin/guard";
import { Badge, Card, Empty, Forbidden, PageHeader, Pagination, Stat, Table, fmtDate } from "@/components/admin/ui";
import { formatMoney } from "@/lib/commerce/money";
import { getStoreSettings, orderName } from "@/lib/commerce/settings";

export const metadata = { title: "Refunds" };
const PER = 40;

export default async function Refunds({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  if (!(await guard("payments:read"))) return <Forbidden />;
  const page = pageNumber((await searchParams).page);
  const settings = await getStoreSettings();
  const [rows, [{ total }], [s]] = await Promise.all([
    db()<{ id: string; order_id: string; number: number; amount_cents: number; currency: string; status: string; reason: string; restock_items: { quantity: number }[]; created_at: Date; staff: string | null; failure_reason: string | null }[]>`
      select r.id, r.order_id, o.number, r.amount_cents, o.currency, r.status, r.reason, r.restock_items, r.created_at, s.name as staff, r.failure_reason
      from refunds r join orders o on o.id = r.order_id left join staff_users s on s.id = r.staff_id
      order by r.created_at desc limit ${PER} offset ${(page - 1) * PER}`,
    db()<{ total: number }[]>`select count(*)::int as total from refunds`,
    db()<{ amount: number; count: number; pending: number; paid_total: number }[]>`
      select coalesce(sum(amount_cents) filter (where status <> 'failed'),0)::bigint as amount, count(*) filter (where status <> 'failed')::int as count,
             count(*) filter (where status = 'pending')::int as pending,
             (select coalesce(sum(total_cents),0)::bigint from orders where payment_status in ('paid','partially_refunded','refunded')) as paid_total
      from refunds`,
  ]);
  return (
    <>
      <PageHeader title="Refunds" description="Refunds are issued from an order. Submitted refunds settle when the provider confirms them via webhook." />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Refunded, all time" value={formatMoney(s.amount, settings.currency)} />
        <Stat label="Refunds" value={s.count} />
        <Stat label="Refund rate" value={s.paid_total ? `${((s.amount / s.paid_total) * 100).toFixed(1)}%` : "—"} hint="of paid revenue" />
        <Stat label="Awaiting provider" value={s.pending} />
      </div>
      <Card pad={false}>
        <Table head={["Date", "Order", "Reason", "Restocked", "By", "Status", <span key="a" className="block text-right">Amount</span>]} empty={rows.length === 0 ? <Empty title="No refunds issued." /> : null}>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="whitespace-nowrap">{fmtDate(r.created_at, true)}</td>
              <td><Link href={`/admin/orders/${r.order_id}`} className="row-link">{orderName(r.number, settings.order_prefix)}</Link></td>
              <td>{r.reason || <span className="text-ash">—</span>}{r.failure_reason && <span className="block text-[0.75rem] text-[var(--adm-bad)]">{r.failure_reason}</span>}</td>
              <td>{r.restock_items.reduce((n, i) => n + (i.quantity || 0), 0)} units</td>
              <td>{r.staff ?? "—"}</td>
              <td><Badge value={r.status} /></td>
              <td className="num">{formatMoney(r.amount_cents, r.currency)}</td>
            </tr>
          ))}
        </Table>
        <Pagination page={page} pages={Math.ceil(total / PER)} href={(p) => `/admin/refunds?page=${p}`} />
      </Card>
    </>
  );
}
