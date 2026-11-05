import Link from "next/link";
import { db } from "@/lib/db";
import { guard, likePattern, pageNumber } from "@/lib/admin/guard";
import { Badge, Card, Empty, Filters, Forbidden, PageHeader, Pagination, Stat, Table, fmtDate } from "@/components/admin/ui";
import { formatMoney } from "@/lib/commerce/money";
import { getStoreSettings, orderName } from "@/lib/commerce/settings";
import { PROVIDERS } from "@/lib/payments";

export const metadata = { title: "Payments" };
const PER = 40;

export default async function Payments({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!(await guard("payments:read"))) return <Forbidden />;
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const status = ["initialized", "pending", "succeeded", "failed", "abandoned"].includes(sp.status ?? "") ? sp.status! : "";
  const provider = ["paystack", "flutterwave"].includes(sp.provider ?? "") ? sp.provider! : "";
  const page = pageNumber(sp.page);
  const settings = await getStoreSettings();
  const sql = db();
  const where = sql`
    where (${q} = '' or p.reference ilike ${likePattern(q)} or p.provider_transaction_id = ${q} or o.email ilike ${likePattern(q)})
      and (${status} = '' or p.status = ${status}) and (${provider} = '' or p.provider = ${provider})`;
  const [rows, [{ total }], [totals], webhooks] = await Promise.all([
    sql<{ id: string; order_id: string; number: number; email: string; provider: string; reference: string; provider_transaction_id: string | null; status: string; amount_cents: number; currency: string; fee_cents: number | null; channel: string | null; created_at: Date; verified_at: Date | null }[]>`
      select p.id, p.order_id, o.number, o.email, p.provider, p.reference, p.provider_transaction_id, p.status, p.amount_cents, p.currency,
             p.fee_cents, p.channel, p.created_at, p.verified_at
      from payments p join orders o on o.id = p.order_id ${where} order by p.created_at desc limit ${PER} offset ${(page - 1) * PER}`,
    sql<{ total: number }[]>`select count(*)::int as total from payments p join orders o on o.id = p.order_id ${where}`,
    sql<{ captured: number; fees: number; failed: number; refunded: number }[]>`
      select coalesce(sum(amount_cents) filter (where status = 'succeeded' and verified_at > now() - interval '30 days'),0)::bigint as captured,
             coalesce(sum(fee_cents) filter (where status = 'succeeded' and verified_at > now() - interval '30 days'),0)::bigint as fees,
             count(*) filter (where status = 'failed' and created_at > now() - interval '30 days')::int as failed,
             (select coalesce(sum(amount_cents),0)::bigint from refunds where status <> 'failed' and created_at > now() - interval '30 days') as refunded
      from payments`,
    sql<{ provider: string; received: number; failed: number; last: Date | null }[]>`
      select provider, count(*)::int as received, count(*) filter (where processed_at is null and error is not null)::int as failed, max(received_at) as last
      from webhook_events where received_at > now() - interval '30 days' group by provider`,
  ]);
  const money = (n: number) => formatMoney(n, settings.currency);
  return (
    <>
      <PageHeader title="Payments" description="Every payment attempt, verified server-side with the provider before an order is marked paid." />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Captured · 30 days" value={money(totals.captured)} />
        <Stat label="Provider fees · 30 days" value={money(totals.fees)} hint={totals.captured ? `${((totals.fees / totals.captured) * 100).toFixed(2)}% effective` : undefined} />
        <Stat label="Refunded · 30 days" value={money(totals.refunded)} />
        <Stat label="Failed attempts · 30 days" value={totals.failed} />
      </div>
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {Object.values(PROVIDERS).map((p) => {
          const w = webhooks.find((x) => x.provider === p.id);
          return (
            <div key={p.id} className="adm-card flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-bone capitalize">{p.id}</p>
                <p className="text-[0.75rem] text-smoke">{w ? `${w.received} webhooks · last ${fmtDate(w.last, true)}${w.failed ? ` · ${w.failed} failed` : ""}` : "No webhooks received in 30 days"}</p>
              </div>
              <Badge value={p.isConfigured() ? "active" : "disabled"} label={p.isConfigured() ? "connected" : "not configured"} />
            </div>
          );
        })}
      </div>
      <Card pad={false}>
        <Filters action="/admin/payments">
          <input name="q" defaultValue={q} placeholder="Reference, transaction id or email" aria-label="Search payments" className="adm-input max-w-xs" />
          <select name="status" defaultValue={status} aria-label="Status" className="adm-input w-auto">
            <option value="">Any status</option>{["succeeded", "pending", "initialized", "failed", "abandoned"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select name="provider" defaultValue={provider} aria-label="Provider" className="adm-input w-auto">
            <option value="">Any provider</option><option value="paystack">Paystack</option><option value="flutterwave">Flutterwave</option>
          </select>
        </Filters>
        <Table head={["Date", "Order", "Provider", "Reference", "Status", "Fee", <span key="a" className="block text-right">Amount</span>]} empty={rows.length === 0 ? <Empty title="No payments yet." /> : null}>
          {rows.map((p) => (
            <tr key={p.id}>
              <td className="whitespace-nowrap">{fmtDate(p.created_at, true)}</td>
              <td><Link href={`/admin/orders/${p.order_id}`} className="row-link">{orderName(p.number, settings.order_prefix)}</Link><span className="block text-[0.75rem] text-smoke">{p.email}</span></td>
              <td className="capitalize">{p.provider}{p.channel && <span className="block text-[0.75rem] text-smoke">{p.channel}</span>}</td>
              <td className="font-mono text-[0.75rem]">{p.reference}{p.provider_transaction_id && <span className="block text-smoke">txn {p.provider_transaction_id}</span>}</td>
              <td><Badge value={p.status} /></td>
              <td className="num">{p.fee_cents !== null ? formatMoney(p.fee_cents, p.currency) : "—"}</td>
              <td className="num">{formatMoney(p.amount_cents, p.currency)}</td>
            </tr>
          ))}
        </Table>
        <Pagination page={page} pages={Math.ceil(total / PER)} href={(n) => `/admin/payments?${new URLSearchParams({ ...(q && { q }), ...(status && { status }), ...(provider && { provider }), page: String(n) })}`} />
      </Card>
    </>
  );
}
