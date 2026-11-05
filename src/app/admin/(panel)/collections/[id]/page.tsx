import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { guard } from "@/lib/admin/guard";
import { can } from "@/lib/auth/staff";
import { isUuid } from "@/lib/security/validate";
import { Badge, Card, Empty, Field, Forbidden, PageHeader, Table } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/ActionForm";
import { deleteCollectionAction, saveCollectionAction, setCollectionProductsAction } from "@/lib/admin/catalog-actions";

export const metadata = { title: "Collection" };

export default async function CollectionDetail({ params }: { params: Promise<{ id: string }> }) {
  const staff = await guard("products:read");
  if (!staff) return <Forbidden />;
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [c] = await db()<{ id: string; title: string; slug: string; description: string; status: string; position: number; image_url: string | null; seo_title: string | null; seo_description: string | null }[]>`
    select id, title, slug, description, status, position, image_url, seo_title, seo_description from collections where id = ${id}`;
  if (!c) notFound();
  const [members, others] = await Promise.all([
    db()<{ id: string; title: string; status: string }[]>`
      select p.id, p.title, p.status from product_collections pc join products p on p.id = pc.product_id
      where pc.collection_id = ${id} order by pc.position, p.title`,
    db()<{ id: string; title: string }[]>`
      select id, title from products p where status <> 'archived'
      and not exists (select 1 from product_collections pc where pc.product_id = p.id and pc.collection_id = ${id}) order by title limit 500`,
  ]);
  const writable = can(staff, "products:write");
  return (
    <>
      <PageHeader title={c.title} back={{ href: "/admin/collections", label: "Collections" }} actions={c.status === "active" && <Link href={`/shop/${c.slug}`} target="_blank" className="adm-btn adm-btn-ghost">View in store ↗</Link>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Card title={`Products (${members.length})`} pad={false}
          actions={writable && others.length > 0 && (
            <ActionForm action={setCollectionProductsAction} className="flex gap-2">
              <input type="hidden" name="id" value={id} />
              <select name="add_product" required aria-label="Product to add" className="adm-input adm-input-sm w-56">
                <option value="">Add a product…</option>
                {others.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
              </select>
              <Submit variant="ghost" className="!py-1">Add</Submit>
            </ActionForm>
          )}
        >
          <Table head={["Product", "Status", ""]} empty={members.length === 0 ? <Empty title="No products in this collection." /> : null}>
            {members.map((m) => (
              <tr key={m.id}>
                <td><Link href={`/admin/products/${m.id}`} className="row-link">{m.title}</Link></td>
                <td><Badge value={m.status} /></td>
                <td className="text-right">
                  {writable && (
                    <ActionForm action={setCollectionProductsAction}>
                      <input type="hidden" name="id" value={id} />
                      <input type="hidden" name="remove_product" value={m.id} />
                      <Submit variant="danger" className="!px-2 !py-1 !text-[0.6875rem]">Remove</Submit>
                    </ActionForm>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </Card>
        <div className="space-y-6">
          <Card title="Details">
            <fieldset disabled={!writable}>
              <ActionForm action={saveCollectionAction} className="space-y-3">
                <input type="hidden" name="id" value={id} />
                <Field label="Title"><input name="title" required defaultValue={c.title} className="adm-input" /></Field>
                <Field label="Handle"><input name="slug" defaultValue={c.slug} className="adm-input font-mono" /></Field>
                <Field label="Description"><textarea name="description" rows={3} defaultValue={c.description} className="adm-input" /></Field>
                <Field label="Status">
                  <select name="status" defaultValue={c.status} className="adm-input">
                    <option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option>
                  </select>
                </Field>
                <Field label="Sort position"><input name="position" type="number" min={0} defaultValue={c.position} className="adm-input" /></Field>
                <Field label="Image URL"><input name="image_url" defaultValue={c.image_url ?? ""} className="adm-input" /></Field>
                <Field label="SEO title"><input name="seo_title" maxLength={70} defaultValue={c.seo_title ?? ""} className="adm-input" /></Field>
                <Field label="SEO description"><textarea name="seo_description" maxLength={320} rows={2} defaultValue={c.seo_description ?? ""} className="adm-input" /></Field>
                {writable && <Submit>Save collection</Submit>}
              </ActionForm>
            </fieldset>
          </Card>
          {writable && (
            <Card title="Delete">
              <ActionForm action={deleteCollectionAction} confirm="Delete this collection? Products stay in the catalogue.">
                <input type="hidden" name="id" value={id} />
                <Submit variant="danger">Delete collection</Submit>
              </ActionForm>
            </Card>
          )}
        </div>
      </div>
      <p className="mt-4 text-[0.75rem] text-ash">Status shown: <Badge value={c.status} /></p>
    </>
  );
}
