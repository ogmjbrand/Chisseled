import { db } from "@/lib/db";
import { guard } from "@/lib/admin/guard";
import { can } from "@/lib/auth/staff";
import { Card, Empty, Field, Forbidden, PageHeader } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/ActionForm";
import { deleteCategoryAction, saveCategoryAction } from "@/lib/admin/catalog-actions";

export const metadata = { title: "Categories" };

export default async function Categories() {
  const staff = await guard("products:read");
  if (!staff) return <Forbidden />;
  const rows = await db()<{ id: string; name: string; slug: string; parent_id: string | null; position: number; description: string; products: number }[]>`
    select c.id, c.name, c.slug, c.parent_id, c.position, c.description, count(p.id)::int as products
    from categories c left join products p on p.category_id = c.id group by c.id order by c.position, c.name`;
  const writable = can(staff, "products:write");
  const name = new Map(rows.map((r) => [r.id, r.name]));
  return (
    <>
      <PageHeader title="Categories" description="The product taxonomy used for filtering in the store (what a product is — Hoodies, Leggings…). Collections are for curation." />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Card pad={false}>
          {rows.length === 0 ? <Empty title="No categories yet." /> : (
            <ul className="divide-y divide-bone/[0.07]">
              {rows.map((c) => (
                <li key={c.id} className="px-5 py-3">
                  <details>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                      <span>
                        <span className="text-bone">{c.name}</span>
                        {c.parent_id && <span className="ml-2 text-[0.75rem] text-smoke">in {name.get(c.parent_id)}</span>}
                      </span>
                      <span className="text-[0.75rem] text-smoke">{c.products} product{c.products === 1 ? "" : "s"} · edit</span>
                    </summary>
                    <fieldset disabled={!writable} className="mt-4 grid gap-3 sm:grid-cols-2">
                      <ActionForm action={saveCategoryAction} className="contents">
                        <input type="hidden" name="id" value={c.id} />
                        <Field label="Name"><input name="name" required defaultValue={c.name} className="adm-input" /></Field>
                        <Field label="Handle"><input name="slug" defaultValue={c.slug} className="adm-input font-mono" /></Field>
                        <Field label="Parent">
                          <select name="parent_id" defaultValue={c.parent_id ?? ""} className="adm-input">
                            <option value="">None</option>
                            {rows.filter((r) => r.id !== c.id).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                        </Field>
                        <Field label="Position"><input name="position" type="number" min={0} defaultValue={c.position} className="adm-input" /></Field>
                        <Field label="Description" className="sm:col-span-2"><input name="description" defaultValue={c.description} className="adm-input" /></Field>
                        {writable && <div className="sm:col-span-2"><Submit>Save</Submit></div>}
                      </ActionForm>
                      {writable && (
                        <ActionForm action={deleteCategoryAction} confirm={`Delete “${c.name}”?`} className="sm:col-span-2">
                          <input type="hidden" name="id" value={c.id} />
                          <Submit variant="danger">Delete category</Submit>
                        </ActionForm>
                      )}
                    </fieldset>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </Card>
        {writable && (
          <Card title="New category">
            <ActionForm action={saveCategoryAction} resetOnSuccess className="space-y-3">
              <Field label="Name"><input name="name" required maxLength={80} className="adm-input" /></Field>
              <Field label="Parent">
                <select name="parent_id" className="adm-input"><option value="">None</option>{rows.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
              </Field>
              <Submit>Create category</Submit>
            </ActionForm>
          </Card>
        )}
      </div>
    </>
  );
}
