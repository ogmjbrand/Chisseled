import Link from "next/link";
import { db } from "@/lib/db";
import { guard } from "@/lib/admin/guard";
import { Badge, Card, Empty, Forbidden, PageHeader, Stat, Table, fmtDate } from "@/components/admin/ui";
import { AreaChart, BarList } from "@/components/admin/charts";
import { bestSellers, inventoryValuation, pctChange, previous, rangeFromParam, salesSeries, summary } from "@/lib/commerce/analytics";
import { getStoreSettings, orderName } from "@/lib/commerce/settings";
import { formatMoney } from "@/lib/commerce/money";

export const metadata = { title: "Overview" };

export default async function Overview({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const staff = await guard("dashboard:view");
  if (!staff) return <Forbidden />;
  const { days } = await searchParams;
  const range = rangeFromParam(days);
  const settings = await getStoreSettings();
  const money = (c: number) => formatMoney(c, settings.currency);
  const short = (c: number) =>
    new Intl.NumberFormat("en", { style: "currency", currency: settings.currency, notation: "compact", maximumFractionDigits: 1 }).format(c / 100);

  const [now, before, series, top, stock, recent, attention] = await Promise.all([
    summary(range),
    summary(previous(range)),
    salesSeries(range),
    bestSellers(range, 5),
    inventoryValuation(),
    db()<{ id: string; number: number; email: string; total_cents: number; currency: string; payment_status: string; fulfillment_status: string; created_at: Date }[]>`
      select id, number, email, total_cents, currency, payment_status, fulfillment_status, created_at
      from orders where payment_status <> 'voided' order by created_at desc limit 8`,
    db()<{ to_fulfil: number; pending: number; flagged: number }[]>`
      select count(*) filter (where payment_status in ('paid','partially_refunded') and fulfillment_status in ('unfulfilled','partially_fulfilled') and status <> 'cancelled')::int as to_fulfil,
             count(*) filter (where payment_status = 'pending' and status = 'pending')::int as pending,
             count(*) filter (where cardinality(flags) > 0 and status <> 'cancelled')::int as flagged
      from orders`,
  ]);
  const a = attention[0];

  return (
    <>
      <PageHeader
        title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${staff.name.split(" ")[0]}`}
        description={`Last ${range.days} days, compared with the ${range.days} days before. Figures are paid orders only.`}
        actions={
          <nav className="flex gap-1" aria-label="Range">
            {[7, 30, 90, 365].map((d) => (
              <Link key={d} href={`/admin?days=${d}`} className={`adm-btn ${d === range.days ? "adm-btn-primary" : "adm-btn-ghost"} !px-3 !py-1.5`}>
                {d === 365 ? "1y" : `${d}d`}
              </Link>
            ))}
          </nav>
        }
      />

      {(a.to_fulfil > 0 || a.flagged > 0 || stock.low + stock.out > 0) && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {a.to_fulfil > 0 && <Link href="/admin/orders?fulfillment=unfulfilled&payment=paid" className="adm-card flex items-center justify-between p-4 hover:border-purple/50"><span className="text-bone">{a.to_fulfil} order{a.to_fulfil === 1 ? "" : "s"} to fulfil</span><span className="text-smoke">→</span></Link>}
          {a.flagged > 0 && <Link href="/admin/orders?flagged=1" className="adm-card flex items-center justify-between p-4 hover:border-purple/50"><span className="text-[var(--adm-bad)]">{a.flagged} order{a.flagged === 1 ? "" : "s"} need attention</span><span className="text-smoke">→</span></Link>}
          {stock.low + stock.out > 0 && <Link href="/admin/inventory?stock=low" className="adm-card flex items-center justify-between p-4 hover:border-purple/50"><span className="text-[var(--adm-warn)]">{stock.low} low · {stock.out} out of stock</span><span className="text-smoke">→</span></Link>}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Net sales" value={money(now.netCents)} trend={pctChange(now.netCents, before.netCents)} hint="gross − discounts − refunds" />
        <Stat label="Orders" value={now.orders} trend={pctChange(now.orders, before.orders)} hint={`${a.pending} awaiting payment`} />
        <Stat label="Average order" value={money(now.aovCents)} trend={pctChange(now.aovCents, before.aovCents)} />
        <Stat label="Customers" value={now.customers} trend={pctChange(now.customers, before.customers)} hint={`${now.newCustomers} new · ${now.returningCustomers} returning`} />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card title="Sales" actions={<span className="numeric text-[0.8125rem] text-bone">{money(now.totalCents)} collected</span>}>
          {now.orders === 0 && before.orders === 0 ? (
            <Empty title="No paid orders in this period yet.">Sales appear here as soon as payments are verified.</Empty>
          ) : (
            <AreaChart data={series} format={short} title="Revenue by period" />
          )}
        </Card>
        <Card title="Top products">
          {top.length === 0 ? (
            <Empty title="Nothing sold yet." />
          ) : (
            <BarList data={top.map((t) => ({ label: t.title, value: t.revenue, sub: `${t.units} sold` }))} format={money} />
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card title="Recent orders" actions={<Link href="/admin/orders" className="text-[0.75rem] text-purple-bright">All orders →</Link>} pad={false}>
          <Table
            head={["Order", "Date", "Customer", "Payment", "Fulfilment", <span key="t" className="block text-right">Total</span>]}
            empty={recent.length === 0 ? <Empty title="No orders yet." /> : null}
          >
            {recent.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/admin/orders/${o.id}`} className="row-link">{orderName(o.number, settings.order_prefix)}</Link></td>
                <td>{fmtDate(o.created_at, true)}</td>
                <td className="max-w-[14rem] truncate">{o.email}</td>
                <td><Badge value={o.payment_status} /></td>
                <td><Badge value={o.fulfillment_status} /></td>
                <td className="num">{formatMoney(o.total_cents, o.currency)}</td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card title="Inventory value">
          <dl className="space-y-3 text-[0.8125rem]">
            <div className="flex justify-between"><dt className="text-smoke">Units on hand</dt><dd className="numeric text-bone">{stock.units.toLocaleString()}</dd></div>
            <div className="flex justify-between"><dt className="text-smoke">At retail</dt><dd className="numeric text-bone">{money(stock.at_retail)}</dd></div>
            <div className="flex justify-between"><dt className="text-smoke">At cost</dt><dd className="numeric text-bone">{money(stock.at_cost)}</dd></div>
            {stock.uncosted_units > 0 && <p className="text-[0.75rem] text-ash">{stock.uncosted_units} units have no cost recorded and are excluded from cost value.</p>}
          </dl>
        </Card>
      </div>
    </>
  );
}
