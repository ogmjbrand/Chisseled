import { cookies } from "next/headers";
import { db, type Queryable } from "@/lib/db";
import { isUuid } from "@/lib/security/validate";
import { colorwayFor, colorMatches } from "@/lib/commerce/catalog";
import type { ColorwayKey } from "@/lib/art";

/**
 * Server-side cart. The cart id lives in an httpOnly cookie; contents,
 * prices and stock live in the database. Prices shown in the bag are always
 * current database prices.
 */

export const CART_COOKIE = "chs_cart";

export interface CartItem {
  id: string;
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  variantTitle: string;
  sku: string | null;
  imageUrl: string | null;
  options: Record<string, string>;
  colorway: ColorwayKey;
  size: string;
  quantity: number;
  unitPriceCents: number;
  unitCostCents: number | null;
  /** null when the variant doesn't track inventory */
  available: number | null;
  purchasable: boolean;
}

export interface Cart {
  id: string;
  items: CartItem[];
  discountCode: string | null;
  email: string | null;
  subtotalCents: number;
}

export async function readCartId(): Promise<string | null> {
  const id = (await cookies()).get(CART_COOKIE)?.value ?? null;
  return id && isUuid(id) ? id : null;
}

export async function writeCartId(id: string): Promise<void> {
  (await cookies()).set(CART_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearCartCookie(): Promise<void> {
  (await cookies()).delete(CART_COOKIE);
}

export async function loadCart(cartId: string, q: Queryable = db()): Promise<Cart | null> {
  const [cart] = await q<{ id: string; discount_code: string | null; email: string | null }[]>`
    select id, discount_code, email from carts where id = ${cartId} and status <> 'converted'`;
  if (!cart) return null;
  const rows = await q<{
    id: string; variant_id: string; product_id: string; slug: string; title: string; variant_title: string;
    sku: string | null; image_url: string | null; options: Record<string, string>; quantity: number;
    price_cents: number; cost_cents: number | null; track_inventory: boolean; available: number | null; status: string;
  }[]>`
    select ci.id, ci.variant_id, p.id as product_id, p.slug, p.title, v.title as variant_title, v.sku,
           coalesce(v.image_url, (select url from product_images pi where pi.product_id = p.id order by position limit 1)) as image_url,
           v.options, ci.quantity, v.price_cents, v.cost_cents, v.track_inventory,
           (i.on_hand - i.reserved)::int as available, p.status
    from cart_items ci
    join product_variants v on v.id = ci.variant_id
    join products p on p.id = v.product_id
    left join inventory i on i.variant_id = v.id
    where ci.cart_id = ${cartId}
    order by ci.created_at`;
  const items: CartItem[] = rows.map((r) => {
    const sizeKey = Object.keys(r.options).find((k) => /^size$/i.test(k));
    const colorKey = Object.keys(r.options).find((k) => /^colou?r$/i.test(k));
    const available = r.track_inventory ? Math.max(0, r.available ?? 0) : null;
    return {
      id: r.id,
      variantId: r.variant_id,
      productId: r.product_id,
      slug: r.slug,
      name: r.title,
      variantTitle: r.variant_title,
      sku: r.sku,
      imageUrl: r.image_url,
      options: r.options,
      colorway: colorwayFor(colorKey ? r.options[colorKey] : undefined),
      size: sizeKey ? r.options[sizeKey] : "",
      quantity: r.quantity,
      unitPriceCents: r.price_cents,
      unitCostCents: r.cost_cents,
      available,
      purchasable: r.status === "active" && (available === null || available >= r.quantity),
    };
  });
  return {
    id: cart.id,
    items,
    discountCode: cart.discount_code,
    email: cart.email,
    subtotalCents: items.reduce((n, i) => n + i.unitPriceCents * i.quantity, 0),
  };
}

export async function getOrCreateCartId(customerId: string | null): Promise<string> {
  const existing = await readCartId();
  if (existing) {
    const [row] = await db()`select id from carts where id = ${existing} and status = 'active'`;
    if (row) return existing;
  }
  const [created] = await db()<{ id: string }[]>`
    insert into carts (customer_id) values (${customerId}) returning id`;
  await writeCartId(created.id);
  return created.id;
}

/** Resolve the storefront's (slug, colour, size) selection to one active variant. */
export async function resolveVariant(slug: string, colorway: string, size: string | undefined) {
  const rows = await db()<{ id: string; options: Record<string, string> }[]>`
    select v.id, v.options from product_variants v join products p on p.id = v.product_id
    where p.slug = ${slug} and p.status = 'active' order by v.position`;
  return (
    rows.find((r) => {
      const entries = Object.entries(r.options);
      const color = entries.find(([k]) => /^colou?r$/i.test(k))?.[1];
      const sz = entries.find(([k]) => /^size$/i.test(k))?.[1];
      if (!colorMatches(color, colorway)) return false;
      if (sz !== undefined && size && sz.toLowerCase() !== size.toLowerCase()) return false;
      if (sz !== undefined && !size && rows.length > 1) return false;
      return true;
    })?.id ?? null
  );
}
