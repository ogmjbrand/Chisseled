import { db } from "@/lib/db";
import { guard } from "@/lib/admin/guard";
import { Forbidden, PageHeader } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/ActionForm";
import { ProductCoreFields } from "@/components/admin/ProductCoreFields";
import { createProductAction } from "@/lib/admin/product-actions";

export const metadata = { title: "Add product" };

export default async function NewProduct() {
  if (!(await guard("products:write"))) return <Forbidden />;
  const [categories, collections] = await Promise.all([
    db()<{ id: string; name: string }[]>`select id, name from categories order by position, name`,
    db()<{ id: string; title: string }[]>`select id, title from collections order by position, title`,
  ]);
  return (
    <>
      <PageHeader title="Add product" back={{ href: "/admin/products", label: "Products" }} />
      <ActionForm action={createProductAction}>
        <ProductCoreFields p={null} categories={categories} collections={collections} isNew />
        <div className="sticky bottom-0 mt-6 flex justify-end gap-2 border-t border-bone/[0.07] bg-[var(--adm-bg)]/95 py-4 backdrop-blur">
          <Submit>Create product</Submit>
        </div>
      </ActionForm>
    </>
  );
}
