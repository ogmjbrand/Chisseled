import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { guard } from "@/lib/admin/guard";
import { can } from "@/lib/auth/staff";
import { isUuid } from "@/lib/security/validate";
import { Badge, Card, Field, Forbidden, PageHeader, fmtDate } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/ActionForm";
import { cancelOrderAction, fulfilAction, noteAction, refundAction, reverifyAction, shipmentAction, staffNoteAction } from "@/lib/admin/order-actions";
import { centsToInput, formatMoney } from "@/lib/commerce/money";
import { getStoreSettings, orderName } from "@/lib/commerce/settings";
import { COUNTRY_NAME } from "@/lib/commerce/countries";

export const metadata = { title: "Order" };

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const staff = await guard("orders:read");
  if (!staff) return <Forbidden />;
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const sql = db();
  const [o] = await sql<{
    id: string; number: number; email: string; phone: string; currency: string; status: string; payment_status: string; fulfillment_status: string;
    subtotal_cents: number; discount_cents: number; shipping_cents: number; tax_cents: number; total_cents: number; refunded_cents: number;
    discount_code: string | null; shipping_method: string; shipping_address: Record<string, string> | null; customer_note: string; staff_note: string;
    customer_id: string | null; created_at: Date; paid_at: Date | null; cancelled_at: Date | null; cancel_reason: string | null; flags: string[];
    inventory_state: string; reservation_expires_at: Date | null;
  }[]>`select * from orders where id = ${id}`;
  if (!o) notFound();
  const [items, payments, refunds, shipments, events, [customer], settings] = await Promise.all([
    sql<{ id: string; title: string; variant_title: string; sku: string | null; image_url: string | null; unit_price_cents: number; quantity: number; total_cents: number; fulfilled_quantity: number; restocked_quantity: number; product_id: string | null }[]>`
      select id, title, variant_title, sku, image_url, unit_price_cents, quantity, total_cents, fulfilled_quantity, restocked_quantity, product_id
      from order_items where order_id = ${id}`,
    sql<{ id: string; provider: string; reference: string; status: string; amount_cents: number; currency: string; channel: string | null; fee_cents: number | null; provider_transaction_id: string | null; failure_reason: string | null; verified_at: Date | null; created_at: Date }[]>`
      select id, provider, reference, status, amount_cents, currency, channel, fee_cents, provider_transaction_id, failure_reason, verified_at, created_at
      from payments where order_id = ${id} order by created_at desc`,
    sql<{ id: string; amount_cents: number; status: string; reason: string; created_at: Date }[]>`
      select id, amount_cents, status, reason, created_at from refunds where order_id = ${id} order by created_at desc`,
    sql<{ id: string; status: string; carrier: string; tracking_number: string; tracking_url: string | null; shipped_at: Date | null; items: { orderItemId: string; quantity: number }[] }[]>`
      select id, status, carrier, tracking_number, tracking_url, shipped_at, items from shipments where order_id = ${id} order by created_at`,
    sql<{ id: number; kind: string; message: string; created_at: Date; staff: string | null }[]>`
      select e.id, e.kind, e.message, e.created_at, s.name as staff from order_events e left join staff_users s on s.id = e.staff_id
      where e.order_id = ${id} order by e.created_at desc`,
    o.customer_id
      ? sql<{ id: string; first_name: string; last_name: string; orders: number; spent: number }[]>`
          select c.id, c.first_name, c.last_name,
            (select count(*)::int from orders where customer_id = c.id and payment_status in ('paid','partially_refunded','refunded')) as orders,
            (select coalesce(sum(total_cents - refunded_cents),0)::bigint from orders where customer_id = c.id and payment_status in ('paid','partially_refunded','refunded')) as spent
          from customers c where c.id = ${o.customer_id}`
      : Promise.resolve([] as never[]),
    getStoreSettings(),
  ]);
  const money = (c: number) => formatMoney(c, o.currency);
  const paid = ["paid", "partially_refunded"].includes(o.payment_status);
  const unfulfilled = items.filter((i) => i.quantity > i.fulfilled_quantity);
  const refundable = o.total_cents - o.refunded_cents;
  const a = o.shipping_address;
  const name = orderName(o.number, settings.order_prefix);

  return (
    <>
      <PageHeader
        title={name}
        back={{ href: "/admin/orders", label: "Orders" }}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {o.status === "cancelled" ? <Badge value="cancelled" /> : <Badge value={o.payment_status} />}
            <Badge value={o.fulfillment_status} />
            <span>Placed {fmtDate(o.created_at, true)}</span>
            {o.paid_at && <span>· Paid {fmtDate(o.paid_at, true)}</span>}
          </span>
        }
        actions={<Link href={`/admin/orders/${id}/invoice`} target="_blank" className="adm-btn adm-btn-ghost">Print invoice</Link>}
      />

      {o.flags.length > 0 && (
        <div className="adm-card mb-6 border-[rgba(243,154,154,0.35)] p-4 text-[0.8125rem] text-[var(--adm-bad)]">
          Needs attention: {o.flags.map((f) => f.replace(/_/g, " ")).join(", ")}. See the timeline below.
        </div>
      )}
      {o.status === "pending" && o.reservation_expires_at && (
        <div className="adm-card mb-6 p-4 text-[0.8125rem] text-[var(--adm-warn)]">
          Awaiting payment. Stock is reserved until {fmtDate(o.reservation_expires_at, true)}; after that it&apos;s released automatically (the provider is re-checked first).
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card title="Items" pad={false}>
            <ul className="divide-y divide-bone/[0.07]">
              {items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 px-5 py-3">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-[var(--adm-panel-2)]">
                    {i.image_url && <Image src={i.image_url} alt="" fill sizes="48px" className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    {i.product_id ? <Link href={`/admin/products/${i.product_id}`} className="block truncate text-bone hover:text-purple-bright">{i.title}</Link> : <span className="block truncate text-bone">{i.title}</span>}
                    <span className="block text-[0.75rem] text-smoke">{[i.variant_title, i.sku && `SKU ${i.sku}`].filter(Boolean).join(" · ")}</span>
                    <span className="block text-[0.75rem] text-smoke">{i.fulfilled_quantity}/{i.quantity} shipped{i.restocked_quantity ? ` · ${i.restocked_quantity} restocked` : ""}</span>
                  </span>
                  <span className="numeric text-right text-[0.8125rem]">{money(i.unit_price_cents)} × {i.quantity}<br /><span className="text-bone">{money(i.total_cents)}</span></span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t border-bone/[0.07] px-5 py-4 text-[0.8125rem]">
              <div className="flex justify-between"><dt>Subtotal</dt><dd className="numeric">{money(o.subtotal_cents)}</dd></div>
              {o.discount_cents > 0 && <div className="flex justify-between"><dt>Discount {o.discount_code && <span className="font-mono text-smoke">({o.discount_code})</span>}</dt><dd className="numeric">−{money(o.discount_cents)}</dd></div>}
              <div className="flex justify-between"><dt>Shipping · {o.shipping_method}</dt><dd className="numeric">{money(o.shipping_cents)}</dd></div>
              {o.tax_cents > 0 && <div className="flex justify-between"><dt>Tax</dt><dd className="numeric">{money(o.tax_cents)}</dd></div>}
              <div className="flex justify-between text-bone"><dt>Total</dt><dd className="numeric font-medium">{money(o.total_cents)}</dd></div>
              {o.refunded_cents > 0 && <div className="flex justify-between"><dt>Refunded</dt><dd className="numeric">−{money(o.refunded_cents)}</dd></div>}
              {o.refunded_cents > 0 && <div className="flex justify-between text-bone"><dt>Net</dt><dd className="numeric">{money(o.total_cents - o.refunded_cents)}</dd></div>}
            </dl>
          </Card>

          {/* Fulfilment */}
          {paid && o.status !== "cancelled" && unfulfilled.length > 0 && can(staff, "fulfillment:write") && (
            <Card title="Fulfil items">
              <ActionForm action={fulfilAction} className="space-y-4">
                <input type="hidden" name="id" value={id} />
                <ul className="space-y-2">
                  {unfulfilled.map((i) => (
                    <li key={i.id} className="flex items-center justify-between gap-3 text-[0.8125rem]">
                      <input type="hidden" name="item_ids" value={i.id} />
                      <span className="text-bone">{i.title}{i.variant_title && <span className="text-smoke"> · {i.variant_title}</span>}</span>
                      <label className="flex items-center gap-2">
                        <span className="text-smoke">Qty</span>
                        <input type="number" name={`qty.${i.id}`} min={0} max={i.quantity - i.fulfilled_quantity} defaultValue={i.quantity - i.fulfilled_quantity} className="adm-input adm-input-sm w-16" />
                        <span className="text-smoke">of {i.quantity - i.fulfilled_quantity}</span>
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Carrier"><input name="carrier" placeholder="DHL, GIG, UPS…" className="adm-input" /></Field>
                  <Field label="Tracking number"><input name="tracking_number" className="adm-input font-mono" /></Field>
                  <Field label="Tracking URL"><input name="tracking_url" placeholder="https://" className="adm-input" /></Field>
                </div>
                <Submit>Mark as shipped</Submit>
              </ActionForm>
            </Card>
          )}

          {shipments.length > 0 && (
            <Card title="Shipments">
              <ul className="space-y-4">
                {shipments.map((s) => (
                  <li key={s.id} className="rounded-lg border border-bone/[0.07] p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[0.8125rem]">
                      <Badge value={s.status} />
                      <span className="text-smoke">Shipped {fmtDate(s.shipped_at, true)} · {s.items.reduce((n, x) => n + x.quantity, 0)} unit(s)</span>
                    </div>
                    <fieldset disabled={!can(staff, "fulfillment:write")}>
                      <ActionForm action={shipmentAction} className="grid gap-3 sm:grid-cols-4">
                        <input type="hidden" name="shipment_id" value={s.id} />
                        <select name="status" defaultValue={s.status} aria-label="Shipment status" className="adm-input">
                          {["pending", "in_transit", "out_for_delivery", "delivered", "failed", "returned"].map((x) => <option key={x} value={x}>{x.replace(/_/g, " ")}</option>)}
                        </select>
                        <input name="carrier" defaultValue={s.carrier} placeholder="Carrier" aria-label="Carrier" className="adm-input" />
                        <input name="tracking_number" defaultValue={s.tracking_number} placeholder="Tracking number" aria-label="Tracking number" className="adm-input font-mono" />
                        <input name="tracking_url" defaultValue={s.tracking_url ?? ""} placeholder="https://" aria-label="Tracking URL" className="adm-input" />
                        <div className="sm:col-span-4"><Submit variant="ghost">Update shipment</Submit></div>
                      </ActionForm>
                    </fieldset>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Payments */}
          <Card title="Payments" actions={can(staff, "orders:write") && can(staff, "payments:read") && payments.length > 0 && (
            <ActionForm action={reverifyAction}><input type="hidden" name="id" value={id} /><Submit variant="ghost" className="!py-1">Re-verify with provider</Submit></ActionForm>
          )} pad={false}>
            {payments.length === 0 ? <p className="px-5 py-4 text-smoke">No payment attempts.</p> : (
              <ul className="divide-y divide-bone/[0.07]">
                {payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-[0.8125rem]">
                    <span>
                      <span className="text-bone capitalize">{p.provider}</span> <span className="font-mono text-[0.75rem] text-smoke">{p.reference}</span>
                      <span className="block text-[0.75rem] text-smoke">
                        {fmtDate(p.created_at, true)}{p.channel && ` · ${p.channel}`}{p.fee_cents !== null && ` · fee ${formatMoney(p.fee_cents, p.currency)}`}{p.verified_at && ` · verified ${fmtDate(p.verified_at, true)}`}
                        {p.failure_reason && <span className="text-[var(--adm-bad)]"> · {p.failure_reason}</span>}
                      </span>
                    </span>
                    <span className="flex items-center gap-3"><Badge value={p.status} /><span className="numeric">{formatMoney(p.amount_cents, p.currency)}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Refund */}
          {paid && refundable > 0 && can(staff, "refunds:write") && (
            <Card title="Refund">
              <ActionForm action={refundAction} confirm="Issue this refund? Money is returned through the payment provider." className="space-y-4">
                <input type="hidden" name="id" value={id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={`Amount (max ${money(refundable)})`}><input name="amount" inputMode="decimal" required defaultValue={centsToInput(refundable)} className="adm-input" /></Field>
                  <Field label="Reason"><input name="reason" maxLength={300} placeholder="Customer return, damaged item…" className="adm-input" /></Field>
                </div>
                <div>
                  <p className="adm-label mb-2">Restock items</p>
                  <ul className="space-y-1.5">
                    {items.filter((i) => i.quantity > i.restocked_quantity).map((i) => (
                      <li key={i.id} className="flex items-center justify-between gap-3 text-[0.8125rem]">
                        <input type="hidden" name="item_ids" value={i.id} />
                        <span>{i.title}{i.variant_title && <span className="text-smoke"> · {i.variant_title}</span>}</span>
                        <input type="number" name={`restock.${i.id}`} min={0} max={i.quantity - i.restocked_quantity} defaultValue={0} aria-label={`Restock ${i.title}`} className="adm-input adm-input-sm w-16" />
                      </li>
                    ))}
                  </ul>
                </div>
                <Submit variant="danger">Refund {o.currency}</Submit>
              </ActionForm>
            </Card>
          )}
          {refunds.length > 0 && (
            <Card title="Refund history" pad={false}>
              <ul className="divide-y divide-bone/[0.07]">
                {refunds.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3 text-[0.8125rem]">
                    <span>{fmtDate(r.created_at, true)}{r.reason && <span className="text-smoke"> · {r.reason}</span>}</span>
                    <span className="flex items-center gap-3"><Badge value={r.status} /><span className="numeric">{money(r.amount_cents)}</span></span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Timeline */}
          <Card title="Timeline">
            {can(staff, "orders:write") && (
              <ActionForm action={noteAction} resetOnSuccess className="mb-5 flex gap-2">
                <input type="hidden" name="id" value={id} />
                <input name="note" required maxLength={2000} placeholder="Add a note for the team…" aria-label="Note" className="adm-input flex-1" />
                <Submit variant="ghost">Post</Submit>
              </ActionForm>
            )}
            <ol className="relative space-y-4 border-l border-bone/[0.1] pl-5">
              {events.map((e) => (
                <li key={e.id} className="relative text-[0.8125rem]">
                  <span className="absolute -left-[1.6rem] top-1.5 size-2 rounded-full bg-purple-bright" aria-hidden />
                  <p className="text-bone">{e.message}</p>
                  <p className="text-[0.75rem] text-smoke">{fmtDate(e.created_at, true)}{e.staff && ` · ${e.staff}`}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Customer">
            <div className="space-y-1 text-[0.8125rem]">
              {customer ? (
                <Link href={`/admin/customers/${customer.id}`} className="text-bone hover:text-purple-bright">{[customer.first_name, customer.last_name].filter(Boolean).join(" ") || o.email}</Link>
              ) : <p className="text-bone">Guest</p>}
              <p className="break-all">{o.email}</p>
              {o.phone && <p>{o.phone}</p>}
              {customer && <p className="pt-1 text-smoke">{customer.orders} paid order{customer.orders === 1 ? "" : "s"} · {formatMoney(customer.spent, o.currency)} lifetime</p>}
            </div>
          </Card>
          {a && (
            <Card title="Shipping address">
              <p className="text-[0.8125rem] leading-relaxed">
                {a.firstName} {a.lastName}<br />{a.company && <>{a.company}<br /></>}
                {a.line1}<br />{a.line2 && <>{a.line2}<br /></>}
                {a.city}{a.region ? `, ${a.region}` : ""} {a.postalCode}<br />{COUNTRY_NAME.get(a.country) ?? a.country}
              </p>
            </Card>
          )}
          {o.customer_note && <Card title="Customer note"><p className="whitespace-pre-wrap text-[0.8125rem]">{o.customer_note}</p></Card>}
          <Card title="Staff note">
            <fieldset disabled={!can(staff, "orders:write")}>
              <ActionForm action={staffNoteAction} className="space-y-2">
                <input type="hidden" name="id" value={id} />
                <textarea name="staff_note" rows={3} defaultValue={o.staff_note} aria-label="Staff note" className="adm-input" />
                <Submit variant="ghost">Save note</Submit>
              </ActionForm>
            </fieldset>
          </Card>
          {o.status !== "cancelled" && o.fulfillment_status === "unfulfilled" && can(staff, "orders:write") && (
            <Card title="Cancel order">
              <ActionForm action={cancelOrderAction} confirm="Cancel this order?" className="space-y-3">
                <input type="hidden" name="id" value={id} />
                <Field label="Reason"><input name="reason" required maxLength={300} className="adm-input" /></Field>
                {paid && (
                  <>
                    <label className="flex items-center gap-2 text-[0.8125rem]"><input type="checkbox" name="restock" defaultChecked className="accent-[var(--color-purple)]" />Return items to stock</label>
                    <p className="text-[0.75rem] text-smoke">This order is paid — issue the refund separately above.</p>
                  </>
                )}
                <Submit variant="danger">Cancel order</Submit>
              </ActionForm>
            </Card>
          )}
          {o.status === "cancelled" && (
            <Card title="Cancelled"><p className="text-[0.8125rem]">{fmtDate(o.cancelled_at, true)} — {o.cancel_reason}</p></Card>
          )}
        </div>
      </div>
    </>
  );
}
