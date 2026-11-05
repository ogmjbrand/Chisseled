import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCustomer } from "@/lib/auth/customer";
import { loadOrderView } from "@/lib/commerce/order-view";
import { OrderSummary, statusLabel } from "@/components/orders/OrderSummary";
import { getStoreSettings, orderName } from "@/lib/commerce/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order", robots: { index: false, follow: false } };

export default async function AccountOrderPage({ params }: { params: Promise<{ number: string }> }) {
  const customer = await getCustomer();
  if (!customer) redirect("/account");
  const { number } = await params;
  const n = Number(number);
  if (!Number.isInteger(n) || n <= 0) notFound();
  const order = await loadOrderView({ number: n, customerId: customer.id });
  if (!order) notFound();
  const settings = await getStoreSettings();
  return (
    <div className="shell pb-24 pt-[calc(var(--nav-h)+3rem)]">
      <Link href="/account" className="link-rule mb-6 inline-block text-caption text-smoke">← All orders</Link>
      <h1 className="display-md mb-3 text-bone">Order {orderName(order.number, settings.order_prefix)}</h1>
      <p className="mb-10 font-mono text-micro uppercase tracking-[0.16em] text-smoke">
        {order.createdAt.toLocaleDateString("en", { dateStyle: "long" })} · {order.status === "cancelled" ? "Cancelled" : `${statusLabel(order.paymentStatus)} · ${statusLabel(order.fulfillmentStatus)}`}
      </p>
      <OrderSummary order={order} />
    </div>
  );
}
