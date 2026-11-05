"use server";

import type { ColorwayKey } from "@/lib/art";
import { getCustomer } from "@/lib/auth/customer";
import { db, isDatabaseConfigured } from "@/lib/db";
import { getOrCreateCartId, loadCart, readCartId, resolveVariant, type Cart } from "@/lib/commerce/cart";
import { rateLimit } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/request";
import { isUuid } from "@/lib/security/validate";

/**
 * Server Actions the storefront's cart UI calls. The client only ever
 * receives the plain summary below — never database ids beyond the cart
 * line id, never costs, never anything secret.
 */

export interface CartLineSummary {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  colorway: ColorwayKey;
  size: string;
  qty: number;
  /** Line total in minor units at the current database price. */
  priceCents: number;
}

export interface CartSummary {
  lines: CartLineSummary[];
  subtotalCents: number;
  totalCents: number;
  checkoutUrl: string | null;
  ready: boolean;
  error: string | null;
}

const UNAVAILABLE = "The store is temporarily unavailable. Please try again shortly.";

function summarize(cart: Cart | null, error: string | null = null): CartSummary {
  if (!cart) return { lines: [], subtotalCents: 0, totalCents: 0, checkoutUrl: null, ready: true, error };
  return {
    lines: cart.items.map((i) => ({
      id: i.id,
      slug: i.slug,
      name: i.name,
      imageUrl: i.imageUrl,
      colorway: i.colorway,
      size: i.size || (i.variantTitle !== "Default" ? i.variantTitle : ""),
      qty: i.quantity,
      priceCents: i.unitPriceCents * i.quantity,
    })),
    subtotalCents: cart.subtotalCents,
    totalCents: cart.subtotalCents,
    checkoutUrl: cart.items.length ? "/checkout" : null,
    ready: true,
    error,
  };
}

async function guard(): Promise<string | null> {
  if (!isDatabaseConfigured()) return UNAVAILABLE;
  const limit = await rateLimit(`cart:${await clientIp()}`, 120, 60);
  return limit.ok ? null : "You're doing that too quickly. Wait a moment and try again.";
}

export async function getCartSummaryAction(): Promise<CartSummary> {
  if (!isDatabaseConfigured()) return summarize(null);
  try {
    const id = await readCartId();
    return summarize(id ? await loadCart(id) : null);
  } catch (err) {
    console.error("[cart] read failed", err);
    return summarize(null, UNAVAILABLE);
  }
}

export async function addLineToCartAction(input: {
  slug: string;
  colorway: ColorwayKey;
  size: string | undefined;
  qty: number;
}): Promise<CartSummary> {
  try {
    const blocked = await guard();
    if (blocked) return { ...(await getCartSummaryAction()), error: blocked };
    const qty = Math.trunc(Number(input.qty));
    if (typeof input.slug !== "string" || !Number.isFinite(qty) || qty < 1 || qty > 20) {
      return { ...(await getCartSummaryAction()), error: "That quantity isn't valid." };
    }

    const variantId = await resolveVariant(input.slug.slice(0, 120), String(input.colorway ?? "").slice(0, 80), input.size?.slice(0, 40));
    if (!variantId) {
      return { ...(await getCartSummaryAction()), error: "That size and colour combination isn't available." };
    }

    const customer = await getCustomer();
    const cartId = await getOrCreateCartId(customer?.id ?? null);
    const [stock] = await db()<{ track_inventory: boolean; available: number | null; in_cart: number }[]>`
      select v.track_inventory, (i.on_hand - i.reserved)::int as available,
             coalesce((select quantity from cart_items where cart_id = ${cartId} and variant_id = v.id), 0) as in_cart
      from product_variants v left join inventory i on i.variant_id = v.id where v.id = ${variantId}`;
    const wanted = stock.in_cart + qty;
    if (stock.track_inventory && (stock.available ?? 0) < wanted) {
      const left = Math.max(0, (stock.available ?? 0) - stock.in_cart);
      return {
        ...summarize(await loadCart(cartId)),
        error: left > 0 ? `Only ${left} more available in that size.` : "That variant is out of stock.",
      };
    }
    await db()`
      insert into cart_items (cart_id, variant_id, quantity) values (${cartId}, ${variantId}, ${qty})
      on conflict (cart_id, variant_id) do update set quantity = least(cart_items.quantity + excluded.quantity, 99)`;
    await db()`update carts set updated_at = now(), customer_id = coalesce(customer_id, ${customer?.id ?? null}) where id = ${cartId}`;
    return summarize(await loadCart(cartId));
  } catch (err) {
    console.error("[cart] add failed", err);
    return summarize(null, UNAVAILABLE);
  }
}

export async function updateLineQtyAction(input: { id: string; qty: number }): Promise<CartSummary> {
  try {
    const blocked = await guard();
    if (blocked) return { ...(await getCartSummaryAction()), error: blocked };
    const cartId = await readCartId();
    if (!cartId || !isUuid(String(input.id))) return getCartSummaryAction();
    const qty = Math.trunc(Number(input.qty));
    if (!Number.isFinite(qty) || qty <= 0) {
      await db()`delete from cart_items where id = ${input.id} and cart_id = ${cartId}`;
      return summarize(await loadCart(cartId));
    }
    const [row] = await db()<{ track_inventory: boolean; available: number | null }[]>`
      select v.track_inventory, (i.on_hand - i.reserved)::int as available
      from cart_items ci join product_variants v on v.id = ci.variant_id left join inventory i on i.variant_id = v.id
      where ci.id = ${input.id} and ci.cart_id = ${cartId}`;
    if (!row) return summarize(await loadCart(cartId));
    if (row.track_inventory && (row.available ?? 0) < qty) {
      return { ...summarize(await loadCart(cartId)), error: `Only ${Math.max(0, row.available ?? 0)} available.` };
    }
    await db()`update cart_items set quantity = ${Math.min(qty, 99)} where id = ${input.id} and cart_id = ${cartId}`;
    await db()`update carts set updated_at = now() where id = ${cartId}`;
    return summarize(await loadCart(cartId));
  } catch (err) {
    console.error("[cart] update failed", err);
    return summarize(null, UNAVAILABLE);
  }
}

export async function removeLineAction(input: { id: string }): Promise<CartSummary> {
  return updateLineQtyAction({ id: input.id, qty: 0 });
}
