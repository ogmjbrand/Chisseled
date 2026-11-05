import Image from "next/image";
import { formatMoney } from "@/lib/commerce/money";
import type { OrderView } from "@/lib/commerce/order-view";
import { COUNTRY_NAME } from "@/lib/commerce/countries";

const LABEL: Record<string, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  partially_refunded: "Partially refunded",
  refunded: "Refunded",
  failed: "Payment failed",
  voided: "Cancelled",
  unfulfilled: "Preparing",
  partially_fulfilled: "Partially shipped",
  fulfilled: "Shipped",
  returned: "Returned",
  in_transit: "In transit",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
};

export function statusLabel(s: string): string {
  return LABEL[s] ?? s.replace(/_/g, " ");
}

export function OrderSummary({ order }: { order: OrderView }) {
  const money = (c: number) => formatMoney(c, order.currency);
  const a = order.shippingAddress;
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <div>
        <ul className="divide-y divide-bone/10 border-y border-bone/10">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center gap-4 py-4">
              <div className="relative size-16 shrink-0 overflow-hidden bg-graphite">
                {i.imageUrl && <Image src={i.imageUrl} alt="" fill sizes="64px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-body-sm text-bone">{i.title}</p>
                <p className="text-caption text-smoke">
                  {i.variantTitle ? `${i.variantTitle} · ` : ""}Qty {i.quantity}
                </p>
              </div>
              <p className="numeric text-body-sm text-bone">{money(i.totalCents)}</p>
            </li>
          ))}
        </ul>

        {order.shipments.length > 0 && (
          <section className="mt-10">
            <h2 className="eyebrow mb-4">Shipments</h2>
            <ul className="space-y-3">
              {order.shipments.map((s) => (
                <li key={s.id} className="border border-bone/10 bg-carbon p-4 text-body-sm">
                  <p className="text-bone">{statusLabel(s.status)}</p>
                  {s.trackingNumber && (
                    <p className="text-smoke">
                      {s.carrier} ·{" "}
                      {s.trackingUrl ? (
                        <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer" className="link-rule text-bone">{s.trackingNumber}</a>
                      ) : (
                        s.trackingNumber
                      )}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <aside className="h-fit space-y-6 border border-bone/10 bg-carbon p-6 text-body-sm">
        <dl className="space-y-2">
          <div className="flex justify-between"><dt className="text-smoke">Subtotal</dt><dd className="numeric text-bone">{money(order.subtotalCents)}</dd></div>
          {order.discountCents > 0 && (
            <div className="flex justify-between"><dt className="text-smoke">Discount{order.discountCode ? ` (${order.discountCode})` : ""}</dt><dd className="numeric text-purple-bright">−{money(order.discountCents)}</dd></div>
          )}
          <div className="flex justify-between"><dt className="text-smoke">Shipping</dt><dd className="numeric text-bone">{order.shippingCents ? money(order.shippingCents) : "Free"}</dd></div>
          {order.taxCents > 0 && <div className="flex justify-between"><dt className="text-smoke">Tax</dt><dd className="numeric text-bone">{money(order.taxCents)}</dd></div>}
          <div className="flex justify-between border-t border-bone/10 pt-2"><dt className="text-bone">Total</dt><dd className="numeric font-medium text-bone">{money(order.totalCents)}</dd></div>
          {order.refundedCents > 0 && <div className="flex justify-between"><dt className="text-smoke">Refunded</dt><dd className="numeric text-bone">−{money(order.refundedCents)}</dd></div>}
        </dl>
        {a && (
          <div>
            <h2 className="eyebrow mb-2">Delivering to</h2>
            <p className="leading-relaxed text-fog">
              {a.firstName} {a.lastName}<br />
              {a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />
              {a.city}{a.region ? `, ${a.region}` : ""} {a.postalCode}<br />
              {COUNTRY_NAME.get(a.country) ?? a.country}
            </p>
            <p className="mt-2 text-smoke">{order.shippingMethod}</p>
          </div>
        )}
      </aside>
    </div>
  );
}
