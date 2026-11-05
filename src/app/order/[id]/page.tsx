import Link from "next/link";
import { notFound } from "next/navigation";
import { isDatabaseConfigured } from "@/lib/db";
import { getCustomer } from "@/lib/auth/customer";
import { orderForGuest } from "@/lib/commerce/order-view";
import { OrderSummary, statusLabel } from "@/components/orders/OrderSummary";
import { getStoreSettings, orderName } from "@/lib/commerce/settings";
import { ArrowMark } from "@/components/primitives/Marks";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order confirmation", robots: { index: false, follow: false } };

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ key?: string; pending?: string }>;
}) {
  if (!isDatabaseConfigured()) notFound();
  const { id } = await params;
  const { key = "", pending } = await searchParams;
  const customer = await getCustomer();
  const order = await orderForGuest(id, key, customer?.id ?? null);
  if (!order) notFound();
  const settings = await getStoreSettings();
  const paid = ["paid", "partially_refunded", "refunded"].includes(order.paymentStatus);

  return (
    <div className="shell pb-24 pt-[calc(var(--nav-h)+3rem)]">
      <p className="eyebrow mb-4">Order {orderName(order.number, settings.order_prefix)}</p>
      {paid ? (
        <>
          <h1 className="display-md mb-4 text-bone">Thank you. It&apos;s confirmed.</h1>
          <p className="lede mb-10 max-w-[52ch]">
            Payment received. A confirmation is on its way to <span className="text-bone">{order.email}</span>, and
            we&apos;ll send tracking as soon as it ships.
          </p>
        </>
      ) : order.status === "cancelled" ? (
        <>
          <h1 className="display-md mb-4 text-bone">This order was cancelled.</h1>
          <p className="lede mb-10 max-w-[52ch]">No payment was taken. Your items are back on sale.</p>
        </>
      ) : (
        <>
          <h1 className="display-md mb-4 text-bone">{pending ? "Confirming your payment…" : "Awaiting payment."}</h1>
          <p className="lede mb-10 max-w-[52ch]">
            {pending
              ? "Your provider hasn't confirmed the payment yet. This page updates when it does — refresh in a moment. You won't be charged twice."
              : "We haven't received payment for this order yet."}
          </p>
        </>
      )}

      <p className="mb-6 font-mono text-micro uppercase tracking-[0.16em] text-smoke">
        {statusLabel(order.paymentStatus)} · {statusLabel(order.fulfillmentStatus)}
      </p>

      <OrderSummary order={order} />

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/shop" className="btn btn-primary">
          Keep shopping <ArrowMark className="size-4" />
        </Link>
        {customer ? (
          <Link href="/account" className="btn btn-ghost">Your orders</Link>
        ) : (
          <Link href="/account" className="btn btn-ghost">Create an account to track orders</Link>
        )}
      </div>
    </div>
  );
}
