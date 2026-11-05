import Link from "next/link";
import { db } from "@/lib/db";
import { guard } from "@/lib/admin/guard";
import { can } from "@/lib/auth/staff";
import { Badge, Card, Empty, Field, Forbidden, PageHeader, Table } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/ActionForm";
import { saveCollectionAction } from "@/lib/admin/catalog-actions";

export const metadata = { title: "Collections" };

export default async function Collections() {
  const staff = await guard("products:read");
  if (!staff) return <Forbidden />;
  const rows = await db()<{ id: string; title: string; slug: string; status: string; products: number; active: number; position: number }[]>`
    select c.id, c.title, c.slug, c.status, c.position,
           count(pc.product_id)::int as products, count(p.id) filter (where p.status = 'active')::int as active
    from collections c left join product_collections pc on pc.collection_id = c.id left join products p on p.id = pc.product_id
    group by c.id order by c.position, c.title`;
  return (
    <>
      <PageHeader title="Collections" description="Curated groups shown at /shop/<handle>. A collection with no active products is hidden from the store automatically." />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Card pad={false}>
          <Table head={["Collection", "Handle", "Status", <span key="p" className="block text-right">Products</span>]} empty={rows.length === 0 ? <Empty title="No collections yet." /> : null}>
            {rows.map((c) => (
              <tr key={c.id}>
                <td><Link href={`/admin/collections/${c.id}`} className="row-link">{c.title}</Link></td>
                <td className="font-mono text-[0.75rem] text-smoke">/shop/{c.slug}</td>
                <td><Badge value={c.status} /></td>
                <td className="num">{c.active} active / {c.products}</td>
              </tr>
            ))}
          </Table>
        </Card>
        {can(staff, "products:write") && (
          <Card title="New collection">
            <ActionForm action={saveCollectionAction} resetOnSuccess className="space-y-3">
              <Field label="Title"><input name="title" required maxLength={120} className="adm-input" /></Field>
              <Field label="Handle" hint="Optional — generated from the title."><input name="slug" className="adm-input font-mono" /></Field>
              <Field label="Description"><textarea name="description" rows={3} className="adm-input" /></Field>
              <Submit>Create collection</Submit>
            </ActionForm>
          </Card>
        )}
      </div>
    </>
  );
}
