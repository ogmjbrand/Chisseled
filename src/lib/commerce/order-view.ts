import { db } from "@/lib/db";
import { sha256, safeEqual } from "@/lib/security/crypto";
import { isUuid } from "@/lib/security/validate";

export interface OrderView {
  id: string;
  number: number;
  email: string;
  currency: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  refundedCents: number;
  discountCode: string | null;
  shippingMethod: string;
  shippingAddress: Record<string, string> | null;
  createdAt: Date;
  paidAt: Date | null;
  items: { id: string; title: string; variantTitle: string; quantity: number; totalCents: number; imageUrl: string | null; sku: string | null; unitPriceCents: number }[];
  shipments: { id: string; status: string; carrier: string; trackingNumber: string; trackingUrl: string | null; shippedAt: Date | null }[];
}

export async function loadOrderView(where: { id?: string; number?: number; customerId?: string }): Promise<OrderView | null> {
  const sql = db();
  const rows = where.id
    ? await sql<Record<string, never>[]>`select * from orders where id = ${where.id}`
    : await sql<Record<string, never>[]>`select * from orders where number = ${where.number ?? -1} and customer_id = ${where.customerId ?? null}`;
  const o = rows[0] as unknown as Record<string, unknown> | undefined;
  if (!o) return null;
  const items = await sql<{ id: string; title: string; variant_title: string; quantity: number; total_cents: number; image_url: string | null; sku: string | null; unit_price_cents: number }[]>`
    select id, title, variant_title, quantity, total_cents, image_url, sku, unit_price_cents from order_items where order_id = ${o.id as string}`;
  const shipments = await sql<{ id: string; status: string; carrier: string; tracking_number: string; tracking_url: string | null; shipped_at: Date | null }[]>`
    select id, status, carrier, tracking_number, tracking_url, shipped_at from shipments where order_id = ${o.id as string} order by created_at`;
  return {
    id: o.id as string,
    number: o.number as number,
    email: o.email as string,
    currency: o.currency as string,
    status: o.status as string,
    paymentStatus: o.payment_status as string,
    fulfillmentStatus: o.fulfillment_status as string,
    subtotalCents: o.subtotal_cents as number,
    discountCents: o.discount_cents as number,
    shippingCents: o.shipping_cents as number,
    taxCents: o.tax_cents as number,
    totalCents: o.total_cents as number,
    refundedCents: o.refunded_cents as number,
    discountCode: (o.discount_code as string | null) ?? null,
    shippingMethod: o.shipping_method as string,
    shippingAddress: (o.shipping_address as Record<string, string> | null) ?? null,
    createdAt: o.created_at as Date,
    paidAt: (o.paid_at as Date | null) ?? null,
    items: items.map((i) => ({ id: i.id, title: i.title, variantTitle: i.variant_title, quantity: i.quantity, totalCents: i.total_cents, imageUrl: i.image_url, sku: i.sku, unitPriceCents: i.unit_price_cents })),
    shipments: shipments.map((s) => ({ id: s.id, status: s.status, carrier: s.carrier, trackingNumber: s.tracking_number, trackingUrl: s.tracking_url, shippedAt: s.shipped_at })),
  };
}

/** Guest access: the confirmation link carries a random key whose hash is stored on the order. */
export async function orderForGuest(id: string, key: string, customerId: string | null): Promise<OrderView | null> {
  if (!isUuid(id)) return null;
  const [row] = await db()<{ access_token_hash: string; customer_id: string | null }[]>`
    select access_token_hash, customer_id from orders where id = ${id}`;
  if (!row) return null;
  const keyOk = key.length > 0 && key.length < 100 && safeEqual(sha256(key), row.access_token_hash);
  const ownerOk = customerId !== null && row.customer_id === customerId;
  return keyOk || ownerOk ? loadOrderView({ id }) : null;
}
