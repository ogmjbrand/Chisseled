import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { guard } from "@/lib/admin/guard";
import { can } from "@/lib/auth/staff";
import { isUuid } from "@/lib/security/validate";
import { Badge, Card, Empty, Forbidden, PageHeader } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/ActionForm";
import { ProductCoreFields, type ProductCore } from "@/components/admin/ProductCoreFields";
import {
  addImageAction,
  deleteImageAction,
  deleteProductAction,
  deleteVariantAction,
  generateVariantsAction,
  saveVariantsAction,
  updateImagesAction,
  updateProductAction,
} from "@/lib/admin/product-actions";
import { centsToInput, formatMoney } from "@/lib/commerce/money";
import { getStoreSettings } from "@/lib/commerce/settings";

export const metadata = { title: "Edit product" };

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const staff = await guard("products:read");
  if (!staff) return <Forbidden />;
  const { id } = await params;
  const { created } = await searchParams;
  if (!isUuid(id)) notFound();
  const sql = db();
  const [row] = await sql<(Omit<ProductCore, "collections"> & { id: string })[]>`
    select id, title, slug, subtitle, description, status, category_id, product_type, vendor, gender, tags, featured,
           seo_title, seo_description, options, details from products where id = ${id}`;
  if (!row) notFound();
  const [categories, collections, linked, variants, images, [sales], settings] = await Promise.all([
    sql<{ id: string; name: string }[]>`select id, name from categories order by position, name`,
    sql<{ id: string; title: string }[]>`select id, title from collections order by position, title`,
    sql<{ collection_id: string }[]>`select collection_id from product_collections where product_id = ${id}`,
    sql<{ id: string; title: string; sku: string | null; barcode: string | null; price_cents: number; compare_at_cents: number | null; cost_cents: number | null; weight_grams: number | null; track_inventory: boolean; image_url: string | null; position: number; on_hand: number; reserved: number; low_stock_threshold: number }[]>`
      select v.id, v.title, v.sku, v.barcode, v.price_cents, v.compare_at_cents, v.cost_cents, v.weight_grams, v.track_inventory,
             v.image_url, v.position, coalesce(i.on_hand,0) as on_hand, coalesce(i.reserved,0) as reserved, coalesce(i.low_stock_threshold,5) as low_stock_threshold
      from product_variants v left join inventory i on i.variant_id = v.id where v.product_id = ${id} order by v.position, v.created_at`,
    sql<{ id: string; url: string; alt: string; position: number }[]>`select id, url, alt, position from product_images where product_id = ${id} order by position, created_at`,
    sql<{ units: number; revenue: number }[]>`
      select coalesce(sum(oi.quantity),0)::int as units, coalesce(sum(oi.total_cents),0)::bigint as revenue
      from order_items oi join orders o on o.id = oi.order_id where oi.product_id = ${id} and o.payment_status in ('paid','partially_refunded','refunded')`,
    getStoreSettings(),
  ]);
  const p: ProductCore = { ...row, collections: linked.map((l) => l.collection_id) };
  const writable = can(staff, "products:write");
  const money = (c: number) => formatMoney(c, settings.currency);

  return (
    <>
      <PageHeader
        title={row.title}
        back={{ href: "/admin/products", label: "Products" }}
        description={
          <span className="flex flex-wrap items-center gap-3">
            <Badge value={row.status} />
            <span>{sales.units} sold · {money(sales.revenue)} revenue</span>
          </span>
        }
        actions={row.status === "active" && <Link href={`/product/${row.slug}`} target="_blank" className="adm-btn adm-btn-ghost">View in store ↗</Link>}
      />
      {created && <p className="adm-msg adm-msg-ok mb-4">Product created. Add photos and check each variant&apos;s stock below.</p>}

      <fieldset disabled={!writable} className="contents">
        <ActionForm action={updateProductAction}>
          <input type="hidden" name="id" value={id} />
          <ProductCoreFields p={p} categories={categories} collections={collections} isNew={false} />
          {writable && (
            <div className="sticky bottom-0 z-10 mt-6 flex justify-end gap-2 border-t border-bone/[0.07] bg-[var(--adm-bg)]/95 py-4 backdrop-blur">
              <Submit>Save product</Submit>
            </div>
          )}
        </ActionForm>

        {/* ---------------- Variants ---------------- */}
        <Card
          className="mt-6"
          title={`Variants (${variants.length})`}
          actions={
            writable && (
              <ActionForm action={generateVariantsAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={id} />
                <input name="price" inputMode="decimal" placeholder="Price for new" aria-label="Price for new variants" className="adm-input adm-input-sm w-28" />
                <Submit variant="ghost" className="!py-1.5">Create missing variants</Submit>
              </ActionForm>
            )
          }
          pad={false}
        >
          {variants.length === 0 ? (
            <Empty title="No variants yet.">Add options above (e.g. “Size: S, M, L”), save, then create the missing variants.</Empty>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Variant</th><th>SKU</th><th>Barcode</th><th>Price</th><th>Compare at</th><th>Cost</th>
                      <th>Track</th><th>On hand</th><th>Reserved</th><th>Low at</th><th>Weight (g)</th><th>Pos.</th><th />
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v) => {
                      const f = (n: string) => `v.${v.id}.${n}`;
                      const margin = v.cost_cents !== null && v.price_cents > 0 ? Math.round(((v.price_cents - v.cost_cents) / v.price_cents) * 100) : null;
                      return (
                        <tr key={v.id}>
                          <td className="whitespace-nowrap text-bone">
                            <input type="hidden" name="variant_ids" value={v.id} form="variants-form" />
                            {v.title}
                            {margin !== null && <span className="block text-[0.6875rem] text-smoke">{margin}% margin</span>}
                          </td>
                          <td><input form="variants-form" name={f("sku")} defaultValue={v.sku ?? ""} className="adm-input adm-input-sm w-32 font-mono" /></td>
                          <td><input form="variants-form" name={f("barcode")} defaultValue={v.barcode ?? ""} className="adm-input adm-input-sm w-28 font-mono" /></td>
                          <td><input form="variants-form" name={f("price")} required inputMode="decimal" defaultValue={centsToInput(v.price_cents)} className="adm-input adm-input-sm w-24" /></td>
                          <td><input form="variants-form" name={f("compare_at")} inputMode="decimal" defaultValue={centsToInput(v.compare_at_cents)} className="adm-input adm-input-sm w-24" /></td>
                          <td><input form="variants-form" name={f("cost")} inputMode="decimal" defaultValue={centsToInput(v.cost_cents)} className="adm-input adm-input-sm w-24" /></td>
                          <td className="text-center"><input form="variants-form" type="checkbox" name={f("track")} defaultChecked={v.track_inventory} aria-label="Track inventory" className="accent-[var(--color-purple)]" /></td>
                          <td><input form="variants-form" name={f("on_hand")} type="number" min={v.reserved} defaultValue={v.on_hand} className="adm-input adm-input-sm w-20" /></td>
                          <td className="num">{v.reserved}</td>
                          <td><input form="variants-form" name={f("threshold")} type="number" min={0} defaultValue={v.low_stock_threshold} className="adm-input adm-input-sm w-16" /></td>
                          <td><input form="variants-form" name={f("weight")} type="number" min={0} defaultValue={v.weight_grams ?? ""} className="adm-input adm-input-sm w-20" /></td>
                          <td><input form="variants-form" name={f("position")} type="number" min={0} defaultValue={v.position} className="adm-input adm-input-sm w-14" /></td>
                          <td>
                            {writable && (
                              <ActionForm action={deleteVariantAction} confirm={`Remove variant “${v.title}”?`}>
                                <input type="hidden" name="id" value={id} />
                                <input type="hidden" name="variant_id" value={v.id} />
                                <Submit variant="danger" className="!px-2 !py-1 !text-[0.6875rem]">Remove</Submit>
                              </ActionForm>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {writable && (
                <ActionForm id="variants-form" action={saveVariantsAction} className="flex items-center justify-between gap-3 border-t border-bone/[0.07] px-5 py-3">
                  <input type="hidden" name="id" value={id} />
                  <span className="text-[0.75rem] text-smoke">On hand is the physical count; reserved units belong to unpaid orders and can&apos;t be removed.</span>
                  <Submit>Save variants</Submit>
                </ActionForm>
              )}
            </>
          )}
        </Card>

        {/* ---------------- Images ---------------- */}
        <Card className="mt-6" title={`Media (${images.length})`}>
          {images.length > 0 && (
            <ul className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
              {images.map((img, i) => (
                <li key={img.id} className="overflow-hidden rounded-lg border border-bone/[0.07]">
                  <div className="relative aspect-square bg-[var(--adm-panel-2)]">
                    <Image src={img.url} alt={img.alt} fill sizes="200px" className="object-cover" />
                    {i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-purple px-1.5 text-[0.625rem] text-white">Main</span>}
                  </div>
                  <div className="space-y-1.5 p-2">
                    <input type="hidden" name="image_ids" value={img.id} form="images-form" />
                    <input form="images-form" name={`img.${img.id}.alt`} defaultValue={img.alt} placeholder="Alt text" aria-label="Alt text" className="adm-input adm-input-sm" />
                    <div className="flex items-center gap-1.5">
                      <input form="images-form" name={`img.${img.id}.position`} type="number" min={0} defaultValue={img.position} aria-label="Position" className="adm-input adm-input-sm w-14" />
                      {writable && (
                        <ActionForm action={deleteImageAction} confirm="Remove this image?" className="ml-auto">
                          <input type="hidden" name="id" value={id} />
                          <input type="hidden" name="image_id" value={img.id} />
                          <Submit variant="danger" className="!px-2 !py-1 !text-[0.6875rem]">Remove</Submit>
                        </ActionForm>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {writable && (
            <div className="grid gap-4 lg:grid-cols-2">
              {images.length > 0 && (
                <ActionForm id="images-form" action={updateImagesAction} className="flex items-start">
                  <input type="hidden" name="id" value={id} />
                  <Submit variant="ghost">Save order &amp; alt text</Submit>
                </ActionForm>
              )}
              <ActionForm action={addImageAction} resetOnSuccess className="space-y-2">
                <input type="hidden" name="id" value={id} />
                <div className="flex flex-wrap gap-2">
                  <input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/avif" aria-label="Upload image" className="adm-input max-w-[16rem] text-[0.75rem]" />
                  <span className="self-center text-[0.75rem] text-smoke">or</span>
                  <input name="url" placeholder="https://… or /media/…" aria-label="Image URL" className="adm-input min-w-[12rem] flex-1" />
                </div>
                <div className="flex gap-2">
                  <input name="alt" placeholder="Alt text (describe the photo)" aria-label="Alt text" className="adm-input flex-1" />
                  <Submit>Add image</Submit>
                </div>
              </ActionForm>
            </div>
          )}
        </Card>

        {writable && (
          <Card className="mt-6" title="Danger zone">
            <ActionForm action={deleteProductAction} confirm="Delete this product permanently? This can't be undone." className="flex flex-wrap items-center justify-between gap-3">
              <input type="hidden" name="id" value={id} />
              <p className="text-[0.8125rem] text-smoke">Products that have been ordered can&apos;t be deleted — archive them to keep order history intact.</p>
              <Submit variant="danger">Delete product</Submit>
            </ActionForm>
          </Card>
        )}
      </fieldset>
    </>
  );
}
