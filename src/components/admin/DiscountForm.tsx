import { ActionForm, Submit } from "@/components/admin/ActionForm";
import { Field } from "@/components/admin/ui";
import { saveDiscountAction } from "@/lib/admin/config-actions";
import { centsToInput } from "@/lib/commerce/money";

export interface DiscountRow {
  id: string;
  code: string | null;
  title: string;
  kind: string;
  value: number;
  min_subtotal_cents: number;
  applies_to: string;
  collection_ids: string[];
  product_ids: string[];
  usage_limit: number | null;
  once_per_customer: boolean;
  is_automatic: boolean;
  status: string;
  starts_at: Date;
  ends_at: Date | null;
}

const local = (d: Date | null | undefined) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

export function DiscountForm({ d, collections, products }: { d?: DiscountRow; collections: { id: string; title: string }[]; products: { id: string; title: string }[] }) {
  return (
    <ActionForm action={saveDiscountAction} resetOnSuccess={!d} className="grid gap-3 sm:grid-cols-2">
      {d && <input type="hidden" name="id" value={d.id} />}
      <Field label="Code" hint="What shoppers type. Leave blank for automatic."><input name="code" defaultValue={d?.code ?? ""} pattern="[A-Za-z0-9_-]+" className="adm-input font-mono uppercase" /></Field>
      <Field label="Internal title"><input name="title" required defaultValue={d?.title} className="adm-input" /></Field>
      <label className="flex items-center gap-2 text-[0.8125rem] sm:col-span-2"><input type="checkbox" name="is_automatic" defaultChecked={d?.is_automatic} className="accent-[var(--color-purple)]" />Automatic — applies at checkout without a code (best automatic offer wins; codes don&apos;t stack)</label>
      <Field label="Type">
        <select name="kind" defaultValue={d?.kind ?? "percentage"} className="adm-input">
          <option value="percentage">Percentage off</option><option value="fixed_amount">Fixed amount off</option><option value="free_shipping">Free shipping</option>
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Percent"><input name="percent" type="number" min={1} max={100} defaultValue={d?.kind === "percentage" ? d.value : ""} className="adm-input" /></Field>
        <Field label="Amount"><input name="amount" inputMode="decimal" defaultValue={d?.kind === "fixed_amount" ? centsToInput(d.value) : ""} className="adm-input" /></Field>
      </div>
      <Field label="Applies to">
        <select name="applies_to" defaultValue={d?.applies_to ?? "all"} className="adm-input"><option value="all">Entire order</option><option value="collections">Specific collections</option><option value="products">Specific products</option></select>
      </Field>
      <Field label="Minimum spend"><input name="min_subtotal" inputMode="decimal" defaultValue={d && d.min_subtotal_cents ? centsToInput(d.min_subtotal_cents) : ""} placeholder="0.00" className="adm-input" /></Field>
      <Field label="Collections" hint="Ctrl/⌘-click to select several."><select name="collection_ids" multiple defaultValue={d?.collection_ids} className="adm-input h-24">{collections.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></Field>
      <Field label="Products"><select name="product_ids" multiple defaultValue={d?.product_ids} className="adm-input h-24">{products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></Field>
      <Field label="Total usage limit"><input name="usage_limit" type="number" min={1} defaultValue={d?.usage_limit ?? ""} placeholder="Unlimited" className="adm-input" /></Field>
      <label className="flex items-center gap-2 self-end pb-2 text-[0.8125rem]"><input type="checkbox" name="once_per_customer" defaultChecked={d?.once_per_customer} className="accent-[var(--color-purple)]" />Once per customer (by email)</label>
      <Field label="Starts"><input name="starts_at" type="datetime-local" defaultValue={local(d?.starts_at)} className="adm-input" /></Field>
      <Field label="Ends"><input name="ends_at" type="datetime-local" defaultValue={local(d?.ends_at)} className="adm-input" /></Field>
      <Field label="Status"><select name="status" defaultValue={d?.status ?? "active"} className="adm-input"><option value="active">Active</option><option value="disabled">Disabled</option></select></Field>
      <div className="self-end sm:col-span-2"><Submit>{d ? "Save discount" : "Create discount"}</Submit></div>
    </ActionForm>
  );
}
