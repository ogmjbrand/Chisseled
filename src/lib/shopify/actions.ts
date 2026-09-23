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

const UNREACHABLE =
  "Couldn't reach the store. Check your connection and try again.";

/**
 * Reads an existing Shopify cart.
 *
 * IMPORTANT:
 * This function never creates or writes a cart cookie.
 * It is safe to call while rendering a Server Component such as /checkout.
 */
async function readExistingCart(): Promise<{
  cart: ShopifyCart | null;
  error: string | null;
}> {
  const existingId = await readCartId();

  if (!existingId) {
    return {
      cart: null,
      error: null,
    };
  }

  const cart = await shopifyGetCart(existingId);

  if (cart) {
    return {
      cart,
      error: null,
    };
  }

  // The stored Shopify cart may have expired or become invalid.
  // Do not attempt to modify cookies during page rendering.
  return {
    cart: null,
    error: null,
  };
}

/**
 * Ensures a usable cart exists.
 *
 * This is only used by actual cart mutations such as adding an item.
 * Those operations run as Server Actions, so writing the cart cookie is valid.
 */
async function ensureCart(): Promise<{
  cart: ShopifyCart | null;
  error: string | null;
}> {
  const existingId = await readCartId();

  if (existingId) {
    const cart = await shopifyGetCart(existingId);

    if (cart) {
      return {
        cart,
        error: null,
      };
    }
  }

  const result = await shopifyCreateCart([]);

  if (result.cart) {
    await writeCartId(result.cart.id);

    return {
      cart: result.cart,
      error: null,
    };
  }

  return {
    cart: null,
    error: UNREACHABLE,
  };
}

/**
 * A cart line's colourway isn't always literally present on the Shopify
 * variant. A single-colourway product may carry no "Color" option at all,
 * so the reverse mapping falls back to the local catalogue's default
 * colourway for that product.
 */
function resolveColorway(
  slug: string,
  value: string | undefined,
): ColorwayKey {
  const local = getProduct(slug);

  if (value) {
    const lower = value.trim().toLowerCase();

    const key = (Object.keys(COLORWAYS) as ColorwayKey[]).find(
      (k) =>
        k === lower ||
        COLORWAYS[k].name.toLowerCase() === lower,
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

function summarize(
  cart: ShopifyCart | null,
  error: string | null = null,
): CartSummary {
  if (!cart) {
    return {
      lines: [],
      subtotalCents: 0,
      totalCents: 0,
      checkoutUrl: null,
      ready: true,
      error,
    };
  }

  const lines: CartLineSummary[] = cart.lines.map((line) => {
    const slug = line.merchandise.product.handle;

    const colorValue = line.merchandise.selectedOptions.find(
      (o) => /^colou?r$/i.test(o.name),
    )?.value;

    const size =
      line.merchandise.selectedOptions.find(
        (o) => o.name.toLowerCase() === "size",
      )?.value ?? "";

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
  if (result.userErrors.length) {
    return result.userErrors.map((e) => e.message).join(" ");
  }

  if (!result.cart) {
    return UNREACHABLE;
  }

  return null;
}

/**
 * READ-ONLY cart summary.
 *
 * This is safe for /checkout because it does not create a cart
 * and does not modify cookies during page rendering.
 */
export async function getCartSummaryAction(): Promise<CartSummary> {
  const { cart, error } = await readExistingCart();

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
    return summarize(
      null,
      `"${input.slug}" isn't available in the store right now.`,
    );
  }

  const variant = findShopifyVariant(
    product,
    input.colorway,
    input.size,
  );

  if (!variant) {
    return summarize(
      null,
      "That size and colour combination isn't available.",
    );
  }

  if (!variant.availableForSale) {
    return summarize(null, "That variant is out of stock.");
  }

  const { cart: current, error } = await ensureCart();

  if (!current) {
    return summarize(null, error);
  }

  const result = await shopifyAddToCart(
    current.id,
    [
      {
        merchandiseId: variant.id,
        quantity: input.qty,
      },
    ],
  );

  return summarize(result.cart, errorFrom(result));
}

export async function updateLineQtyAction(input: {
  slug: string;
  colorway: ColorwayKey;
  size: string;
  qty: number;
}): Promise<CartSummary> {
  const { cart, error } = await ensureCart();

  if (!cart) {
    return summarize(null, error);
  }

  const match = cart.lines.find((line) => {
    const size =
      line.merchandise.selectedOptions.find(
        (o) => o.name.toLowerCase() === "size",
      )?.value ?? "";

    return (
      line.merchandise.product.handle === input.slug &&
      size === input.size
    );
  });

  if (!match) {
    return summarize(cart);
  }

  if (input.qty <= 0) {
    const result = await shopifyRemoveFromCart(
      cart.id,
      [match.id],
    );

    return summarize(result.cart, errorFrom(result));
  }

  const result = await shopifyUpdateCart(
    cart.id,
    [
      {
        id: match.id,
        quantity: input.qty,
      },
    ],
  );

  return summarize(result.cart, errorFrom(result));
}

export async function removeLineAction(input: {
  slug: string;
  colorway: ColorwayKey;
  size: string;
}): Promise<CartSummary> {
  return updateLineQtyAction({
    ...input,
    qty: 0,
  });
}