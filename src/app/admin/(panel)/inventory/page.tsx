import Link from "next/link";
import { db } from "@/lib/db";
import { guard, likePattern, pageNumber } from "@/lib/admin/guard";
import { can } from "@/lib/auth/staff";
import { Card, Empty, Filters, Forbidden, PageHeader, Pagination, Stat, Table } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/ActionForm";
import { adjustStockAction } from "@/lib/admin/inventory-actions";
import { inventoryValuation } from "@/lib/commerce/analytics";
import { formatMoney } from "@/lib/commerce/money";
import { getStoreSettings } from "@/lib/commerce/settings";

export const metadata = { title: "Inventory" };
const PER = 40;

export default async function Inventory({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const staff = await guard("inventory:read");
  if (!staff) return <Forbidden />;
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const stock = ["low", "out", "in"].includes(sp.stock ?? "") ? sp.stock! : "";
  const page = pageNumber(sp.page);
  const sql = db();
  const settings = await getStoreSettings();
  const where = sql`
    where v.track_inventory and p.status <> 'archived'
      and (${q} = '' or p.title ilike ${likePattern(q)} or v.sku ilike ${likePattern(q)} or v.barcode = ${q})
      and case ${stock}
        when 'low' then i.on_hand - i.reserved <= i.low_stock_threshold
        when 'out' then i.on_hand - i.reserved <= 0
        when 'in' then i.on_hand - i.reserved > i.low_stock_threshold
        else true end`;
  const [rows, [{ total }], val] = await Promise.all([
    sql<{ variant_id: string; product_id: string; product: string; variant: string; sku: string | null; on_hand: number; reserved: number; threshold: number; cost_cents: number | null }[]>`
      select v.id as variant_id, p.id as product_id, p.title as product, v.title as variant, v.sku, i.on_hand, i.reserved,
             i.low_stock_threshold as threshold, v.cost_cents
      from inventory i join product_variants v on v.id = i.variant_id join products p on p.id = v.product_id
      ${where} order by (i.on_hand - i.reserved) - i.low_stock_threshold, p.title, v.position
      limit ${PER} offset ${(page - 1) * PER}`,
    sql<{ total: number }[]>`select count(*)::int as total from inventory i join product_variants v on v.id = i.variant_id join products p on p.id = v.product_id ${where}`,
    inventoryValuation(),
  ]);
  const writable = can(staff, "inventory:write");
  const href = (p: number) => `/admin/inventory?${new URLSearchParams({ ...(q && { q }), ...(stock && { stock }), page: String(p) })}`;
  return (
    <>
      <PageHeader
        title="Inventory"
        description="Available = on hand − reserved. Reserved units belong to orders awaiting payment and are released automatically if payment doesn't arrive."
        actions={<Link href="/admin/inventory/history" className="adm-btn adm-btn-ghost">Movement history</Link>}
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Units on hand" value={val.units.toLocaleString()} hint={`${val.variants} tracked variants`} />
        <Stat label="Value at cost" value={formatMoney(val.at_cost, settings.currency)} hint={val.uncosted_units ? `${val.uncosted_units} units uncosted` : "all units costed"} />
        <Stat label="Low stock" value={val.low} />
        <Stat label="Out of stock" value={val.out} />
      </div>
      <Card pad={false}>
        <Filters action="/admin/inventory">
          <input name="q" defaultValue={q} placeholder="Product, SKU or barcode" aria-label="Search inventory" className="adm-input max-w-xs" />
          <select name="stock" defaultValue={stock} aria-label="Stock level" className="adm-input w-auto">
            <option value="">All levels</option><option value="low">Low or out</option><option value="out">Out of stock</option><option value="in">Healthy</option>
          </select>
        </Filters>
        <Table head={["Product", "SKU", "On hand", "Reserved", "Available", "Low at", writable ? "Adjust" : ""]} empty={rows.length === 0 ? <Empty title="No tracked variants match." /> : null}>
          {rows.map((r) => {
            const available = r.on_hand - r.reserved;
            const tone = available <= 0 ? "text-[var(--adm-bad)]" : available <= r.threshold ? "text-[var(--adm-warn)]" : "text-bone";
            return (
              <tr key={r.variant_id}>
                <td><Link href={`/admin/products/${r.product_id}`} className="row-link">{r.product}</Link>{r.variant !== "Default" && <span className="block text-[0.75rem] text-smoke">{r.variant}</span>}</td>
                <td className="font-mono text-[0.75rem]">{r.sku ?? "—"}</td>
                <td className="num">{r.on_hand}</td>
                <td className="num">{r.reserved}</td>
                <td className={`num font-medium ${tone}`}>{available}</td>
                <td className="num">{r.threshold}</td>
                <td>
                  {writable && (
                    <ActionForm action={adjustStockAction} className="flex flex-wrap items-center gap-1.5">
                      <input type="hidden" name="variant_id" value={r.variant_id} />
                      <select name="mode" aria-label="Mode" className="adm-input adm-input-sm w-auto"><option value="delta">Add / remove</option><option value="set">Set to</option></select>
                      <input name="quantity" type="number" required aria-label="Quantity" placeholder="±0" className="adm-input adm-input-sm w-20" />
                      <select name="reason" aria-label="Reason" className="adm-input adm-input-sm w-auto">
                        <option value="restock">Restock</option><option value="adjustment">Adjustment</option><option value="correction">Count correction</option><option value="damage">Damaged</option><option value="return">Return</option>
                      </select>
                      <input name="note" aria-label="Note" placeholder="Note" className="adm-input adm-input-sm w-28" />
                      <Submit variant="ghost" className="!px-2 !py-1 !text-[0.75rem]">Save</Submit>
                    </ActionForm>
                  )}
                </td>
              </tr>
            );
          })}
        </Table>
        <Pagination page={page} pages={Math.ceil(total / PER)} href={href} />
      </Card>
    </>
  );
}
