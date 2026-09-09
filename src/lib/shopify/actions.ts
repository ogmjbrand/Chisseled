"use server";

import { cookies } from "next/headers";
import { COLORWAYS } from "@/lib/art";
import type { ColorwayKey } from "@/lib/art";
import { getProduct } from "@/lib/catalog";
import {
  addToCart as shopifyAddToCart,
  createCart as shopifyCreateCart,
  getCart as shopifyGetCart,
  removeFromCart as shopifyRemoveFromCart,
  updateCart as shopifyUpdateCart,
  getProductByHandle,
  type CartMutationResult,
} from "@/lib/shopify";
import { findShopifyVariant, moneyToCents } from "@/lib/shopify/mappers";
import type { ShopifyCart } from "@/lib/shopify/types";

/**
 * Server Actions — the only place client code ever touches Shopify cart
 * operations. The Storefront token never leaves the server: these functions
 * run on the server by construction (the `"use server"` directive above),
 * and the client only ever receives the plain, serialisable cart summary
 * returned at the bottom of this file.
 */

const CART_COOKIE = "chisseled_cart_id";

async function readCartId(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(CART_COOKIE)?.value;
}

async function writeCartId(id: string): Promise<void> {
  const jar = await cookies();
  jar.set(CART_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

const UNREACHABLE = "Couldn't reach the store. Check your connection and try again.";

/**
 * Reads the current cart, creating one if none exists yet or the stored id
 * no longer resolves (expired/consumed).
 *
 * Whether Shopify is unreachable because of a thrown network error, a
 * blocked/non-2xx HTTP response, or a malformed GraphQL response, the only
 * thing that actually matters to a caller is "is there a usable cart" — so
 * this reports failure the same way regardless of which of those it was,
 * rather than trusting a lower-level networkError flag that is only ever
 * true for a *thrown* exception and stays false for a same-shaped failure
 * that still returned an HTTP response (a proxy block returning 403, for
 * instance — exactly what this sandbox's own egress policy does).
 */
async function ensureCart(): Promise<{ cart: ShopifyCart | null; error: string | null }> {
  const existingId = await readCartId();

  if (existingId) {
    const cart = await shopifyGetCart(existingId);
    if (cart) return { cart, error: null };
    // Falls through to create a new one — the stored id is stale.
  }

  const result = await shopifyCreateCart([]);
  if (result.cart) {
    await writeCartId(result.cart.id);
    return { cart: result.cart, error: null };
  }
  return { cart: null, error: UNREACHABLE };
}

/**
 * A cart line's colourway isn't always literally present on the Shopify
 * variant (a single-colourway product may carry no "Color" option at all),
 * so the reverse mapping falls back to the local catalogue's own default
 * colourway for that product rather than leaving the field unresolved.
 */
function resolveColorway(slug: string, value: string | undefined): ColorwayKey {
  const local = getProduct(slug);
  if (value) {
    const lower = value.trim().toLowerCase();
    const key = (Object.keys(COLORWAYS) as ColorwayKey[]).find(
      (k) => k === lower || COLORWAYS[k].name.toLowerCase() === lower,
    );
    if (key) return key;
  }
  return local?.variants[0]?.colorway ?? "onyx";
}

export interface CartLineSummary {
  id: string;
  slug: string;
  colorway: ColorwayKey;
  size: string;
  qty: number;
  priceCents: number;
  shopifyLineId: string;
}

export interface CartSummary {
  lines: CartLineSummary[];
  subtotalCents: number;
  totalCents: number;
  checkoutUrl: string | null;
  ready: boolean;
  error: string | null;
}

function summarize(cart: ShopifyCart | null, error: string | null = null): CartSummary {
  if (!cart) {
    return { lines: [], subtotalCents: 0, totalCents: 0, checkoutUrl: null, ready: true, error };
  }

  const lines: CartLineSummary[] = cart.lines.map((line) => {
    const slug = line.merchandise.product.handle;
    const colorValue = line.merchandise.selectedOptions.find((o) => /^colou?r$/i.test(o.name))?.value;
    const size = line.merchandise.selectedOptions.find((o) => o.name.toLowerCase() === "size")?.value ?? "";
    const colorway = resolveColorway(slug, colorValue);
    return {
      id: `${slug}:${colorway}:${size}`,
      slug,
      colorway,
      size,
      qty: line.quantity,
      priceCents: moneyToCents(line.cost.totalAmount) ?? 0,
      shopifyLineId: line.id,
    };
  });

  return {
    lines,
    subtotalCents: moneyToCents(cart.cost.subtotalAmount) ?? 0,
    totalCents: moneyToCents(cart.cost.totalAmount) ?? 0,
    checkoutUrl: cart.checkoutUrl,
    ready: true,
    error,
  };
}

function errorFrom(result: CartMutationResult): string | null {
  if (result.userErrors.length) return result.userErrors.map((e) => e.message).join(" ");
  if (!result.cart) return UNREACHABLE;
  return null;
}

export async function getCartSummaryAction(): Promise<CartSummary> {
  const { cart, error } = await ensureCart();
  return summarize(cart, error);
}

export async function addLineToCartAction(input: {
  slug: string;
  colorway: ColorwayKey;
  size: string;
  qty: number;
}): Promise<CartSummary> {
  const product = await getProductByHandle(input.slug);
  if (!product) {
    return summarize(null, `"${input.slug}" isn't available in the store right now.`);
  }

  const variant = findShopifyVariant(product, input.colorway, input.size);
  if (!variant) {
    return summarize(null, "That size and colour combination isn't available.");
  }
  if (!variant.availableForSale) {
    return summarize(null, "That variant is out of stock.");
  }

  const { cart: current, error } = await ensureCart();
  if (!current) return summarize(null, error);

  const result = await shopifyAddToCart(current.id, [{ merchandiseId: variant.id, quantity: input.qty }]);
  return summarize(result.cart, errorFrom(result));
}

export async function updateLineQtyAction(input: {
  slug: string;
  colorway: ColorwayKey;
  size: string;
  qty: number;
}): Promise<CartSummary> {
  const { cart, error } = await ensureCart();
  if (!cart) return summarize(null, error);

  const match = cart.lines.find((l) => {
    const size = l.merchandise.selectedOptions.find((o) => o.name.toLowerCase() === "size")?.value ?? "";
    return l.merchandise.product.handle === input.slug && size === input.size;
  });
  if (!match) return summarize(cart);

  if (input.qty <= 0) {
    const result = await shopifyRemoveFromCart(cart.id, [match.id]);
    return summarize(result.cart, errorFrom(result));
  }

  const result = await shopifyUpdateCart(cart.id, [{ id: match.id, quantity: input.qty }]);
  return summarize(result.cart, errorFrom(result));
}

export async function removeLineAction(input: {
  slug: string;
  colorway: ColorwayKey;
  size: string;
}): Promise<CartSummary> {
  return updateLineQtyAction({ ...input, qty: 0 });
}
