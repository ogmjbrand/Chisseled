import { Card, Field } from "@/components/admin/ui";

export interface ProductCore {
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  status: string;
  category_id: string | null;
  product_type: string;
  vendor: string;
  gender: string;
  tags: string[];
  featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  options: { name: string; values: string[] }[];
  details: Record<string, unknown>;
  collections: string[];
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

/** Server-rendered field set shared by "new" and "edit". */
export function ProductCoreFields({
  p,
  categories,
  collections,
  isNew,
}: {
  p: ProductCore | null;
  categories: { id: string; name: string }[];
  collections: { id: string; title: string }[];
  isNew: boolean;
}) {
  const d = p?.details ?? {};
  const benefits = Array.isArray(d.benefits)
    ? (d.benefits as { title: string; detail: string }[]).map((b) => (b.detail ? `${b.title}: ${b.detail}` : b.title)).join("\n")
    : "";
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <Card title="Details">
          <div className="space-y-4">
            <Field label="Title"><input name="title" required maxLength={200} defaultValue={p?.title} className="adm-input" /></Field>
            <Field label="Subtitle / tagline" hint="The one-line promise shown under the name.">
              <input name="subtitle" maxLength={200} defaultValue={p?.subtitle} className="adm-input" />
            </Field>
            <Field label="Description"><textarea name="description" rows={6} maxLength={20000} defaultValue={p?.description} className="adm-input" /></Field>
          </div>
        </Card>

        {isNew && (
          <Card title="Pricing & stock">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Price"><input name="price" inputMode="decimal" required placeholder="0.00" className="adm-input" /></Field>
              <Field label="Compare-at price" hint="Original price, shown struck through."><input name="compare_at" inputMode="decimal" placeholder="0.00" className="adm-input" /></Field>
              <Field label="Cost per item" hint="Private. Powers profit reports."><input name="cost" inputMode="decimal" placeholder="0.00" className="adm-input" /></Field>
              <Field label="SKU prefix" hint="Variant SKUs get option suffixes."><input name="sku" maxLength={60} className="adm-input" /></Field>
              <Field label="Starting stock per variant"><input name="stock" type="number" min={0} defaultValue={0} className="adm-input" /></Field>
            </div>
          </Card>
        )}

        <Card title="Options">
          <Field
            label="One option per line"
            hint={isNew ? "e.g. “Size: S, M, L, XL” and “Color: Black, Purple”. A variant is created for every combination." : "Changing values doesn't delete variants — use “Create missing variants” below, and remove ones you no longer sell."}
          >
            <textarea
              name="options"
              rows={3}
              maxLength={3000}
              placeholder={"Size: S, M, L, XL\nColor: Black, Purple"}
              defaultValue={p?.options.map((o) => `${o.name}: ${o.values.join(", ")}`).join("\n")}
              className="adm-input font-mono"
            />
          </Field>
        </Card>

        <Card title="Storefront story">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Long-form story" className="sm:col-span-2"><textarea name="story" rows={4} defaultValue={str(d.story)} className="adm-input" /></Field>
            <Field label="Benefits" hint="One per line, “Title: detail”." className="sm:col-span-2"><textarea name="benefits" rows={4} defaultValue={benefits} className="adm-input" /></Field>
            <Field label="Fabric"><input name="fabric" defaultValue={str(d.fabric)} className="adm-input" /></Field>
            <Field label="Care"><input name="care" defaultValue={str(d.care)} className="adm-input" /></Field>
            <Field label="Model note"><input name="modelNote" defaultValue={str(d.modelNote)} className="adm-input" /></Field>
            <Field label="Fit">
              <select name="fit" defaultValue={str(d.fit) || "regular"} className="adm-input">
                {["compression", "sculpt", "regular", "relaxed", "oversized"].map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
            <Field label="Badges" hint="Comma-separated, max 4." className="sm:col-span-2">
              <input name="badges" defaultValue={Array.isArray(d.badges) ? (d.badges as string[]).join(", ") : ""} className="adm-input" />
            </Field>
          </div>
        </Card>

        <Card title="Search engine listing">
          <div className="space-y-4">
            <Field label="URL handle" hint="/product/<handle>. Leave blank to generate from the title.">
              <input name="slug" maxLength={96} pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={p?.slug} className="adm-input font-mono" />
            </Field>
            <Field label="Page title" hint="Up to 70 characters."><input name="seo_title" maxLength={70} defaultValue={p?.seo_title ?? ""} className="adm-input" /></Field>
            <Field label="Meta description" hint="Up to 320 characters."><textarea name="seo_description" rows={2} maxLength={320} defaultValue={p?.seo_description ?? ""} className="adm-input" /></Field>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Status">
          <select name="status" defaultValue={p?.status ?? "draft"} className="adm-input">
            <option value="draft">Draft — hidden from the store</option>
            <option value="active">Active — on sale</option>
            <option value="archived">Archived</option>
          </select>
          <label className="mt-4 flex items-center gap-2 text-[0.8125rem]">
            <input type="checkbox" name="featured" defaultChecked={p?.featured} className="accent-[var(--color-purple)]" /> Feature first in listings
          </label>
        </Card>
        <Card title="Organisation">
          <div className="space-y-4">
            <Field label="Category">
              <select name="category_id" defaultValue={p?.category_id ?? ""} className="adm-input">
                <option value="">None</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Product type"><input name="product_type" maxLength={80} defaultValue={p?.product_type} className="adm-input" /></Field>
            <Field label="Vendor"><input name="vendor" maxLength={80} defaultValue={p?.vendor ?? "CHISSELED"} className="adm-input" /></Field>
            <Field label="Audience">
              <select name="gender" defaultValue={p?.gender ?? "unisex"} className="adm-input">
                <option value="unisex">Unisex</option><option value="women">Women</option><option value="men">Men</option>
              </select>
            </Field>
            <Field label="Tags" hint="Comma-separated."><input name="tags" defaultValue={p?.tags.join(", ")} className="adm-input" /></Field>
          </div>
        </Card>
        <Card title="Collections">
          {collections.length === 0 ? (
            <p className="text-[0.8125rem] text-smoke">No collections yet.</p>
          ) : (
            <ul className="space-y-2">
              {collections.map((c) => (
                <li key={c.id}>
                  <label className="flex items-center gap-2 text-[0.8125rem]">
                    <input type="checkbox" name="collections" value={c.id} defaultChecked={p?.collections.includes(c.id)} className="accent-[var(--color-purple)]" />
                    {c.title}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
