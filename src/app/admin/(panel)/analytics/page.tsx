import Link from "next/link";
import { guard } from "@/lib/admin/guard";
import { Card, Empty, Forbidden, PageHeader, Stat, Table } from "@/components/admin/ui";
import { AreaChart, BarList } from "@/components/admin/charts";
import {
  bestSellers,
  funnel,
  inventoryValuation,
  pctChange,
  previous,
  profitability,
  rangeFromParam,
  refundStats,
  retention,
  salesSeries,
  summary,
} from "@/lib/commerce/analytics";
import { formatMoney } from "@/lib/commerce/money";
import { getStoreSettings } from "@/lib/commerce/settings";

export const metadata = { title: "Analytics" };

export default async function Analytics({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  if (!(await guard("analytics:read"))) return <Forbidden />;
  const range = rangeFromParam((await searchParams).days);
  const settings = await getStoreSettings();
  const money = (c: number) => formatMoney(c, settings.currency);
  const compact = (c: number) => new Intl.NumberFormat("en", { style: "currency", currency: settings.currency, notation: "compact", maximumFractionDigits: 1 }).format(c / 100);
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

  const [s, prev, series, top, profit, ret, stock, f, refunds] = await Promise.all([
    summary(range), summary(previous(range)), salesSeries(range), bestSellers(range, 10), profitability(range),
    retention(), inventoryValuation(), funnel(range), refundStats(range),
  ]);
  const hasData = s.orders > 0 || prev.orders > 0;

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Computed live from orders, refunds, carts and stock. Nothing is estimated: figures that need cost data only cover items with a recorded cost."
        actions={<nav className="flex gap-1" aria-label="Range">{[7, 30, 90, 365].map((d) => <Link key={d} href={`/admin/analytics?days=${d}`} className={`adm-btn ${d === range.days ? "adm-btn-primary" : "adm-btn-ghost"} !px-3 !py-1.5`}>{d === 365 ? "12 months" : `${d} days`}</Link>)}</nav>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Gross sales" value={money(s.grossCents)} trend={pctChange(s.grossCents, prev.grossCents)} hint="before discounts" />
        <Stat label="Net sales" value={money(s.netCents)} trend={pctChange(s.netCents, prev.netCents)} hint="− discounts − refunds" />
        <Stat label="Orders" value={s.orders} trend={pctChange(s.orders, prev.orders)} hint={`${s.units} units`} />
        <Stat label="Average order value" value={money(s.aovCents)} trend={pctChange(s.aovCents, prev.aovCents)} />
      </div>

      <Card title="Sales over time" className="mb-6">
        {hasData ? <AreaChart data={series} format={compact} title="Revenue per period" height={260} /> : <Empty title="No paid orders in this range." />}
      </Card>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <Card title="Sales breakdown">
          <dl className="space-y-2 text-[0.8125rem]">
            {[
              ["Gross sales", s.grossCents], ["Discounts", -s.discountCents], ["Refunds", -s.refundCents], ["Net sales", s.netCents],
              ["Shipping", s.shippingCents], ["Tax", s.taxCents],
            ].map(([k, v]) => (
              <div key={k as string} className={`flex justify-between ${k === "Net sales" ? "border-t border-bone/[0.07] pt-2 text-bone" : ""}`}><dt>{k}</dt><dd className="numeric">{money(v as number)}</dd></div>
            ))}
            <div className="flex justify-between border-t border-bone/[0.07] pt-2 font-medium text-bone"><dt>Total collected</dt><dd className="numeric">{money(s.collectedCents)}</dd></div>
          </dl>
        </Card>
        <Card title="Profitability">
          {profit.costedRevenueCents === 0 ? (
            <Empty title="No cost data yet.">Add “Cost per item” to variants and gross profit will be calculated for orders placed from then on.</Empty>
          ) : (
            <dl className="space-y-2 text-[0.8125rem]">
              <div className="flex justify-between"><dt>Revenue with known cost</dt><dd className="numeric">{money(profit.costedRevenueCents)}</dd></div>
              <div className="flex justify-between"><dt>Cost of goods</dt><dd className="numeric">−{money(profit.costCents)}</dd></div>
              <div className="flex justify-between border-t border-bone/[0.07] pt-2 text-bone"><dt>Gross profit</dt><dd className="numeric">{money(profit.grossProfitCents)}</dd></div>
              <div className="flex justify-between"><dt>Gross margin</dt><dd className="numeric">{pct(profit.grossProfitCents / profit.costedRevenueCents)}</dd></div>
              <p className="pt-1 text-[0.75rem] text-ash">Covers {pct(profit.coverage)} of item revenue in this range.</p>
            </dl>
          )}
        </Card>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-3">
        <Card title="Customers">
          <dl className="space-y-2 text-[0.8125rem]">
            <div className="flex justify-between"><dt>Buying customers</dt><dd className="numeric">{s.customers}</dd></div>
            <div className="flex justify-between"><dt>New</dt><dd className="numeric">{s.newCustomers}</dd></div>
            <div className="flex justify-between"><dt>Returning</dt><dd className="numeric">{s.returningCustomers}</dd></div>
            <div className="flex justify-between border-t border-bone/[0.07] pt-2 text-bone"><dt>Repeat-purchase rate (all time)</dt><dd className="numeric">{ret.buyers ? pct(ret.rate) : "—"}</dd></div>
            <p className="text-[0.75rem] text-ash">{ret.repeat} of {ret.buyers} buyers have ordered more than once.</p>
          </dl>
        </Card>
        <Card title="Checkout funnel">
          <dl className="space-y-2 text-[0.8125rem]">
            <div className="flex justify-between"><dt>Carts started</dt><dd className="numeric">{f.carts}</dd></div>
            <div className="flex justify-between"><dt>Checkouts submitted</dt><dd className="numeric">{f.checkouts}</dd></div>
            <div className="flex justify-between"><dt>Paid orders</dt><dd className="numeric">{f.paid}</dd></div>
            <div className="flex justify-between border-t border-bone/[0.07] pt-2 text-bone"><dt>Cart → paid</dt><dd className="numeric">{f.carts ? pct(f.paid / f.carts) : "—"}</dd></div>
            <div className="flex justify-between"><dt>Checkout → paid</dt><dd className="numeric">{f.checkouts ? pct(f.paid / f.checkouts) : "—"}</dd></div>
            <p className="text-[0.75rem] text-ash">Page-view traffic isn&apos;t tracked, so conversion starts at “added to bag”.</p>
          </dl>
        </Card>
        <Card title="Refunds">
          <dl className="space-y-2 text-[0.8125rem]">
            <div className="flex justify-between"><dt>Refunds issued</dt><dd className="numeric">{s.refundCount}</dd></div>
            <div className="flex justify-between"><dt>Amount</dt><dd className="numeric">{money(s.refundCents)}</dd></div>
            <div className="flex justify-between"><dt>Refund rate</dt><dd className="numeric">{s.totalCents ? pct(s.refundCents / s.totalCents) : "—"}</dd></div>
          </dl>
          {refunds.length > 0 && <div className="mt-4"><BarList data={refunds.map((r) => ({ label: r.reason, value: r.amount, sub: `${r.count}×` }))} format={money} /></div>}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card title="Product performance" pad={false}>
          <Table head={["Product", <span key="u" className="block text-right">Units</span>, <span key="r" className="block text-right">Revenue</span>, <span key="m" className="block text-right">Margin</span>]} empty={top.length === 0 ? <Empty title="Nothing sold in this range." /> : null}>
            {top.map((t) => (
              <tr key={t.product_id ?? t.title}>
                <td>{t.product_id ? <Link href={`/admin/products/${t.product_id}`} className="row-link">{t.title}</Link> : t.title}</td>
                <td className="num">{t.units}</td>
                <td className="num">{money(t.revenue)}</td>
                <td className="num">{t.cost !== null && t.costed_units === t.units ? pct((t.revenue - t.cost) / t.revenue) : <span className="text-ash">no cost</span>}</td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card title="Inventory valuation">
          <dl className="space-y-2 text-[0.8125rem]">
            <div className="flex justify-between"><dt>Units on hand</dt><dd className="numeric">{stock.units.toLocaleString()}</dd></div>
            <div className="flex justify-between"><dt>At cost</dt><dd className="numeric">{money(stock.at_cost)}</dd></div>
            <div className="flex justify-between"><dt>At retail</dt><dd className="numeric">{money(stock.at_retail)}</dd></div>
            <div className="flex justify-between"><dt>Potential margin</dt><dd className="numeric">{stock.at_cost && stock.uncosted_units === 0 ? money(stock.at_retail - stock.at_cost) : "—"}</dd></div>
            {stock.uncosted_units > 0 && <p className="text-[0.75rem] text-ash">{stock.uncosted_units} units have no cost and are excluded from cost value.</p>}
          </dl>
        </Card>
      </div>
    </>
  );
}
