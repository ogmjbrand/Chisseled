import Link from "next/link";
import { db } from "@/lib/db";
import { guard, likePattern, pageNumber } from "@/lib/admin/guard";
import { Badge, Card, Empty, Filters, Forbidden, PageHeader, Pagination, Table, fmtDate } from "@/components/admin/ui";
import { formatMoney } from "@/lib/commerce/money";
import { getStoreSettings } from "@/lib/commerce/settings";

export const metadata = { title: "Customers" };
const PER = 30;

const SEGMENTS: Record<string, { label: string; hint: string }> = {
  all: { label: "All", hint: "Everyone who has an account or has checked out" },
  buyers: { label: "Purchasers", hint: "At least one paid order" },
  repeat: { label: "Repeat", hint: "Two or more paid orders" },
  vip: { label: "VIP", hint: "Top 10% by lifetime spend" },
  at_risk: { label: "At risk", hint: "Bought before, nothing in 90 days" },
  prospects: { label: "No purchase", hint: "Never completed a paid order" },
  subscribers: { label: "Subscribed", hint: "Accepts marketing email" },
};

export default async function Customers({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!(await guard("customers:read"))) return <Forbidden />;
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const segment = sp.segment && sp.segment in SEGMENTS ? sp.segment : "all";
  const tag = (sp.tag ?? "").trim().slice(0, 40);
  const page = pageNumber(sp.page);
  const settings = await getStoreSettings();
  const sql = db();

  const base = sql`
    with stats as (
      select c.*, coalesce(s.orders,0) as orders, coalesce(s.spent,0) as spent, s.last_order
      from customers c left join (
        select customer_id, count(*)::int as orders, sum(total_cents - refunded_cents)::bigint as spent, max(paid_at) as last_order
        from orders where payment_status in ('paid','partially_refunded','refunded') group by customer_id) s on s.customer_id = c.id),
    vip as (select percentile_cont(0.9) within group (order by spent) as cut from stats where orders > 0)
    select stats.* from stats, vip
    where (${q} = '' or email ilike ${likePattern(q)} or (first_name || ' ' || last_name) ilike ${likePattern(q)} or phone ilike ${likePattern(q)})
      and (${tag} = '' or ${tag} = any(tags))
      and case ${segment}
        when 'buyers' then orders > 0
        when 'repeat' then orders > 1
        when 'vip' then orders > 0 and spent >= coalesce(vip.cut, 0)
        when 'at_risk' then orders > 0 and last_order < now() - interval '90 days'
        when 'prospects' then orders = 0
        when 'subscribers' then accepts_marketing
        else true end`;

  const [rows, [{ total }]] = await Promise.all([
    sql<{ id: string; email: string; first_name: string; last_name: string; orders: number; spent: number; last_order: Date | null; password_hash: string | null; status: string; accepts_marketing: boolean; tags: string[] }[]>`
      select * from (${base}) t order by spent desc, created_at desc limit ${PER} offset ${(page - 1) * PER}`,
    sql<{ total: number }[]>`select count(*)::int as total from (${base}) t`,
  ]);
  const href = (p: number, seg = segment) => `/admin/customers?${new URLSearchParams({ ...(q && { q }), ...(tag && { tag }), segment: seg, page: String(p) })}`;

  return (
    <>
      <PageHeader title="Customers" description={SEGMENTS[segment].hint} />
      <nav className="mb-4 flex flex-wrap gap-1.5" aria-label="Segments">
        {Object.entries(SEGMENTS).map(([k, v]) => (
          <Link key={k} href={href(1, k)} className={`adm-btn ${k === segment ? "adm-btn-primary" : "adm-btn-ghost"} !px-3 !py-1.5 !text-[0.75rem]`}>{v.label}</Link>
        ))}
      </nav>
      <Card pad={false}>
        <Filters action="/admin/customers">
          <input type="hidden" name="segment" value={segment} />
          <input name="q" defaultValue={q} placeholder="Name, email or phone" aria-label="Search customers" className="adm-input max-w-xs" />
          <input name="tag" defaultValue={tag} placeholder="Tag" aria-label="Tag" className="adm-input w-32" />
        </Filters>
        <Table head={["Customer", "Account", "Orders", "Last order", "Marketing", <span key="s" className="block text-right">Lifetime spend</span>]} empty={rows.length === 0 ? <Empty title="No customers in this view." /> : null}>
          {rows.map((c) => (
            <tr key={c.id}>
              <td>
                <Link href={`/admin/customers/${c.id}`} className="row-link">{[c.first_name, c.last_name].filter(Boolean).join(" ") || c.email}</Link>
                <span className="block text-[0.75rem] text-smoke">{c.email}</span>
                {c.tags.length > 0 && <span className="mt-1 flex flex-wrap gap-1">{c.tags.map((t) => <span key={t} className="rounded bg-bone/[0.06] px-1.5 text-[0.6875rem]">{t}</span>)}</span>}
              </td>
              <td>{c.status === "disabled" ? <Badge value="disabled" /> : c.password_hash ? <Badge value="active" label="account" /> : <Badge value="draft" label="guest" />}</td>
              <td>{c.orders}</td>
              <td>{fmtDate(c.last_order)}</td>
              <td>{c.accepts_marketing ? "Subscribed" : <span className="text-ash">—</span>}</td>
              <td className="num">{formatMoney(c.spent, settings.currency)}</td>
            </tr>
          ))}
        </Table>
        <Pagination page={page} pages={Math.ceil(total / PER)} href={(p) => href(p)} />
      </Card>
    </>
  );
}
