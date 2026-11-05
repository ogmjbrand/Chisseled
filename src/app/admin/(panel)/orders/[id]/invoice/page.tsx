import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { guard } from "@/lib/admin/guard";
import { isUuid } from "@/lib/security/validate";
import { Forbidden } from "@/components/admin/ui";
import { PrintButton } from "@/components/admin/PrintButton";
import { formatMoney } from "@/lib/commerce/money";
import { getStoreSettings, orderName } from "@/lib/commerce/settings";
import { COUNTRY_NAME } from "@/lib/commerce/countries";

export const metadata = { title: "Invoice" };

export default async function Invoice({ params }: { params: Promise<{ id: string }> }) {
  if (!(await guard("orders:read"))) return <Forbidden />;
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [o] = await db()<{ number: number; email: string; phone: string; currency: string; created_at: Date; paid_at: Date | null; payment_status: string; subtotal_cents: number; discount_cents: number; discount_code: string | null; shipping_cents: number; shipping_method: string; tax_cents: number; total_cents: number; refunded_cents: number; shipping_address: Record<string, string> | null }[]>`
    select number, email, phone, currency, created_at, paid_at, payment_status, subtotal_cents, discount_cents, discount_code, shipping_cents,
           shipping_method, tax_cents, total_cents, refunded_cents, shipping_address from orders where id = ${id}`;
  if (!o) notFound();
  const items = await db()<{ title: string; variant_title: string; sku: string | null; quantity: number; unit_price_cents: number; total_cents: number }[]>`
    select title, variant_title, sku, quantity, unit_price_cents, total_cents from order_items where order_id = ${id}`;
  const s = await getStoreSettings();
  const m = (c: number) => formatMoney(c, o.currency);
  const a = o.shipping_address;
  return (
    <div>
      <div className="adm-no-print mb-4 flex justify-end"><PrintButton /></div>
      <article className="mx-auto max-w-[52rem] rounded-lg bg-white p-10 text-[13px] text-neutral-900 print:p-0">
        <header className="mb-10 flex items-start justify-between">
          <div>
            <p className="font-display text-[22px] font-bold uppercase tracking-tight">{s.name}</p>
            <p className="text-neutral-500">{s.email}</p>
          </div>
          <div className="text-right">
            <p className="text-[20px] font-semibold">Invoice</p>
            <p>{orderName(o.number, s.order_prefix)}</p>
            <p className="text-neutral-500">Issued {o.created_at.toLocaleDateString("en-GB", { dateStyle: "long" })}</p>
            <p className="text-neutral-500">{o.paid_at ? `Paid ${o.paid_at.toLocaleDateString("en-GB", { dateStyle: "long" })}` : `Status: ${o.payment_status}`}</p>
          </div>
        </header>
        <section className="mb-8 grid grid-cols-2 gap-8">
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wider text-neutral-500">Bill / ship to</p>
            {a && <p>{a.firstName} {a.lastName}<br />{a.company && <>{a.company}<br /></>}{a.line1}{a.line2 && <>, {a.line2}</>}<br />{a.city}{a.region && `, ${a.region}`} {a.postalCode}<br />{COUNTRY_NAME.get(a.country) ?? a.country}</p>}
            <p className="mt-1">{o.email}{o.phone && <><br />{o.phone}</>}</p>
          </div>
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wider text-neutral-500">Delivery</p>
            <p>{o.shipping_method}</p>
          </div>
        </section>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-neutral-300 text-left text-[11px] uppercase tracking-wider text-neutral-500">
              <th className="py-2">Item</th><th className="py-2">SKU</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Unit</th><th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i, n) => (
              <tr key={n} className="border-b border-neutral-200">
                <td className="py-2">{i.title}{i.variant_title && <span className="text-neutral-500"> — {i.variant_title}</span>}</td>
                <td className="py-2 font-mono text-[11px]">{i.sku ?? ""}</td>
                <td className="py-2 text-right">{i.quantity}</td>
                <td className="py-2 text-right">{m(i.unit_price_cents)}</td>
                <td className="py-2 text-right">{m(i.total_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="ml-auto mt-6 w-64 space-y-1">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{m(o.subtotal_cents)}</dd></div>
          {o.discount_cents > 0 && <div className="flex justify-between"><dt>Discount{o.discount_code && ` (${o.discount_code})`}</dt><dd>−{m(o.discount_cents)}</dd></div>}
          <div className="flex justify-between"><dt>Shipping</dt><dd>{m(o.shipping_cents)}</dd></div>
          {o.tax_cents > 0 && <div className="flex justify-between"><dt>Tax</dt><dd>{m(o.tax_cents)}</dd></div>}
          <div className="flex justify-between border-t border-neutral-300 pt-1 font-semibold"><dt>Total</dt><dd>{m(o.total_cents)}</dd></div>
          {o.refunded_cents > 0 && <div className="flex justify-between"><dt>Refunded</dt><dd>−{m(o.refunded_cents)}</dd></div>}
        </dl>
        <footer className="mt-12 text-center text-[11px] text-neutral-500">Thank you for training with {s.name}.</footer>
      </article>
    </div>
  );
}
