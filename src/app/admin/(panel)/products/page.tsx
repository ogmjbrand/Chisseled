import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { guard, likePattern, pageNumber } from "@/lib/admin/guard";
import { can } from "@/lib/auth/staff";
import { Badge, Card, Empty, Filters, Forbidden, PageHeader, Pagination, Table, ExportLink } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/ActionForm";
import { bulkStatusAction } from "@/lib/admin/product-actions";
import { formatMoney } from "@/lib/commerce/money";
import { getStoreSettings } from "@/lib/commerce/settings";

export const metadata = { title: "Products" };
const PER = 25;

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const staff = await guard("products:read");
  if (!staff) return <Forbidden />;
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const status = ["draft", "active", "archived"].includes(sp.status ?? "") ? sp.status! : null;
  const collection = sp.collection && /^[0-9a-f-]{36}$/i.test(sp.collection) ? sp.collection : null;
  const page = pageNumber(sp.page);
  const settings = await getStoreSettings();
  const sql = db();

  const where = sql`
    where (${q} = '' or p.title ilike ${likePattern(q)} or exists (select 1 from product_variants v where v.product_id = p.id and (v.sku ilike ${likePattern(q)} or v.barcode = ${q})))
      and (${status}::text is null or p.status = ${status})
      and (${collection}::uuid is null or exists (select 1 from product_collections pc where pc.product_id = p.id and pc.collection_id = ${collection}))`;

  const [rows, [{ total }], collections, counts] = await Promise.all([
    sql<{ id: string; title: string; slug: string; status: string; image: string | null; variants: number; min_price: number | null; max_price: number | null; stock: number | null; tracked: boolean; category: string | null }[]>`
      select p.id, p.title, p.slug, p.status, c.name as category,
        (select url from product_images i where i.product_id = p.id order by position limit 1) as image,
        (select count(*)::int from product_variants v where v.product_id = p.id) as variants,
        (select min(price_cents) from product_variants v where v.product_id = p.id) as min_price,
        (select max(price_cents) from product_variants v where v.product_id = p.id) as max_price,
        (select sum(i.on_hand - i.reserved)::int from product_variants v join inventory i on i.variant_id = v.id where v.product_id = p.id and v.track_inventory) as stock,
        exists (select 1 from product_variants v where v.product_id = p.id and v.track_inventory) as tracked
      from products p left join categories c on c.id = p.category_id
      ${where}
      order by p.updated_at desc limit ${PER} offset ${(page - 1) * PER}`,
    sql<{ total: number }[]>`select count(*)::int as total from products p ${where}`,
    sql<{ id: string; title: string }[]>`select id, title from collections order by position, title`,
    sql<{ status: string; n: number }[]>`select status, count(*)::int as n from products group by status`,
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?.n ?? 0;
  const writable = can(staff, "products:write");
  const qs = (p: number) => `/admin/products?${new URLSearchParams({ ...(q && { q }), ...(status && { status }), ...(collection && { collection }), page: String(p) })}`;

  return (
    <>
      <PageHeader
        title="Products"
        description={`${count("active")} active · ${count("draft")} draft · ${count("archived")} archived`}
        actions={
          <>
            <ExportLink kind="products" />
            {writable && <Link href="/admin/products/new" className="adm-btn adm-btn-primary">Add product</Link>}
          </>
        }
      />
      {sp.deleted && <p className="adm-msg adm-msg-ok mb-4">Product deleted.</p>}
      <Card pad={false}>
        <Filters action="/admin/products">
          <input name="q" defaultValue={q} placeholder="Search title, SKU or barcode" className="adm-input max-w-xs" aria-label="Search products" />
          <select name="status" defaultValue={status ?? ""} className="adm-input w-auto" aria-label="Status">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <select name="collection" defaultValue={collection ?? ""} className="adm-input w-auto" aria-label="Collection">
            <option value="">All collections</option>
            {collections.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </Filters>
        <ActionForm action={bulkStatusAction}>
          <Table
            head={[writable ? <span key="s" className="sr-only">Select</span> : "", "Product", "Status", "Inventory", "Category", <span key="p" className="block text-right">Price</span>]}
            empty={rows.length === 0 ? <Empty title={q || status || collection ? "No products match these filters." : "No products yet."}>{!q && writable && <Link href="/admin/products/new" className="text-purple-bright">Add your first product →</Link>}</Empty> : null}
          >
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="w-8">{writable && <input type="checkbox" name="ids" value={r.id} aria-label={`Select ${r.title}`} className="accent-[var(--color-purple)]" />}</td>
                <td>
                  <Link href={`/admin/products/${r.id}`} className="flex items-center gap-3">
                    <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-[var(--adm-panel-2)]">
                      {r.image && <Image src={r.image} alt="" fill sizes="40px" className="object-cover" />}
                    </span>
                    <span>
                      <span className="row-link block">{r.title}</span>
                      <span className="text-[0.75rem] text-smoke">{r.variants} variant{r.variants === 1 ? "" : "s"}</span>
                    </span>
                  </Link>
                </td>
                <td><Badge value={r.status} /></td>
                <td>{r.tracked ? <span className={(r.stock ?? 0) <= 0 ? "text-[var(--adm-bad)]" : ""}>{r.stock ?? 0} available</span> : <span className="text-smoke">Not tracked</span>}</td>
                <td>{r.category ?? <span className="text-ash">—</span>}</td>
                <td className="num">
                  {r.min_price === null ? "—" : r.min_price === r.max_price ? formatMoney(r.min_price, settings.currency) : `${formatMoney(r.min_price, settings.currency)} – ${formatMoney(r.max_price!, settings.currency)}`}
                </td>
              </tr>
            ))}
          </Table>
          {writable && rows.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-bone/[0.07] px-5 py-3">
              <span className="text-[0.75rem] text-smoke">With selected:</span>
              <select name="bulk_status" className="adm-input adm-input-sm w-auto" aria-label="New status">
                <option value="active">Set active</option>
                <option value="draft">Set draft</option>
                <option value="archived">Archive</option>
              </select>
              <Submit variant="ghost">Apply</Submit>
            </div>
          )}
        </ActionForm>
        <Pagination page={page} pages={Math.ceil(total / PER)} href={qs} />
      </Card>
    </>
  );
}
