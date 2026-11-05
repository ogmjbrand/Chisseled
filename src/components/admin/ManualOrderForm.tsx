"use client";

import { useState } from "react";
import { ActionForm, Submit } from "@/components/admin/ActionForm";
import { Field } from "@/components/admin/ui";
import type { ActionState } from "@/lib/security/validate";

interface VariantOption {
  id: string;
  label: string;
  available: number | null;
}

export function ManualOrderForm({
  action,
  variants,
  countries,
  defaultCountry,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  variants: VariantOption[];
  countries: [string, string][];
  defaultCountry: string;
}) {
  const [rows, setRows] = useState([0]);
  const [next, setNext] = useState(1);
  return (
    <ActionForm action={action} className="space-y-6">
      <section className="adm-card p-5">
        <h2 className="adm-card-title mb-4">Items</h2>
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r} className="flex gap-2">
              <select name="variant_id" required aria-label="Product" className="adm-input flex-1" defaultValue="">
                <option value="" disabled>Choose a product…</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id} disabled={v.available !== null && v.available <= 0}>
                    {v.label}{v.available === null ? "" : ` — ${v.available} available`}
                  </option>
                ))}
              </select>
              <input name="qty" type="number" min={1} max={99} defaultValue={1} aria-label="Quantity" className="adm-input w-20" />
              {rows.length > 1 && (
                <button type="button" onClick={() => setRows(rows.filter((x) => x !== r))} className="adm-btn adm-btn-danger !px-2.5">✕</button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={() => { setRows([...rows, next]); setNext(next + 1); }} className="adm-btn adm-btn-ghost mt-3">
          + Add item
        </button>
        <p className="mt-3 text-[0.75rem] text-smoke">Prices come from the catalogue; stock is reserved the moment the order is created.</p>
      </section>

      <section className="adm-card grid gap-3 p-5 sm:grid-cols-2">
        <h2 className="adm-card-title sm:col-span-2">Customer & delivery</h2>
        <Field label="Email"><input name="email" type="email" required className="adm-input" /></Field>
        <Field label="Phone"><input name="phone" type="tel" className="adm-input" /></Field>
        <Field label="First name"><input name="firstName" required className="adm-input" /></Field>
        <Field label="Last name"><input name="lastName" className="adm-input" /></Field>
        <Field label="Address" className="sm:col-span-2"><input name="line1" required className="adm-input" /></Field>
        <Field label="Apartment, suite"><input name="line2" className="adm-input" /></Field>
        <Field label="City"><input name="city" required className="adm-input" /></Field>
        <Field label="State / region"><input name="region" className="adm-input" /></Field>
        <Field label="Postal code"><input name="postalCode" className="adm-input" /></Field>
        <Field label="Country">
          <select name="country" defaultValue={defaultCountry} className="adm-input">
            {countries.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select>
        </Field>
      </section>

      <section className="adm-card grid gap-3 p-5 sm:grid-cols-3">
        <h2 className="adm-card-title sm:col-span-3">Charges</h2>
        <Field label="Delivery label"><input name="shipping_name" defaultValue="Delivery" className="adm-input" /></Field>
        <Field label="Delivery fee"><input name="shipping_price" inputMode="decimal" placeholder="0.00" className="adm-input" /></Field>
        <Field label="Discount code"><input name="discountCode" className="adm-input font-mono uppercase" /></Field>
        <Field label="Hold stock for (hours)" hint="Unpaid orders release their stock after this."><input name="hold_hours" type="number" min={1} max={168} defaultValue={48} className="adm-input" /></Field>
        <Field label="Note" className="sm:col-span-2"><input name="note" maxLength={1000} className="adm-input" /></Field>
      </section>

      <div className="flex justify-end"><Submit>Create order</Submit></div>
    </ActionForm>
  );
}
