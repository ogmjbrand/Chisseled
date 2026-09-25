import { shopifyFetch } from "@/lib/shopify/client";
import {
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_QUERY,
  COLLECTIONS_QUERY,
  COLLECTION_BY_HANDLE_QUERY,
  PRODUCTS_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
} from "@/lib/shopify/queries";
import type {
  ShopifyCart,
  ShopifyCollection,
  ShopifyProduct,
  ShopifyUserError,
} from "@/lib/shopify/types";

const PRODUCTS_REVALIDATE = 60;
const COLLECTIONS_REVALIDATE = 300;

function edges<T>(
  connection: { edges: { node: T }[] } | null | undefined,
): T[] {
  return connection?.edges.map((edge) => edge.node) ?? [];
}

/* ==================================================================
   PRODUCTS
   ================================================================== */

interface ProductsResponse {
  products: {
    edges: { node: ShopifyProduct }[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  };
}

/** Up to `first` products (default 100 — this catalogue is well under that). */
export async function getProducts(
  first = 100,
): Promise<ShopifyProduct[]> {
  const { data } = await shopifyFetch<ProductsResponse>({
    query: PRODUCTS_QUERY,
    variables: {
      first,
      after: null,
    },
    tags: ["shopify-products"],
    revalidate: PRODUCTS_REVALIDATE,
  });

  return edges(data?.products);
}

interface ProductByHandleResponse {
  productByHandle: ShopifyProduct | null;
}

export async function getProductByHandle(
  handle: string,
): Promise<ShopifyProduct | null> {
  const { data } = await shopifyFetch<ProductByHandleResponse>({
    query: PRODUCT_BY_HANDLE_QUERY,
    variables: { handle },
    tags: ["shopify-products", `shopify-product-${handle}`],
    revalidate: PRODUCTS_REVALIDATE,
  });

  return data?.productByHandle ?? null;
}

/* ==================================================================
   COLLECTIONS
   ================================================================== */

interface CollectionsResponse {
  collections: {
    edges: { node: ShopifyCollection }[];
  };
}

export async function getCollections(
  first = 50,
): Promise<ShopifyCollection[]> {
  const { data } = await shopifyFetch<CollectionsResponse>({
    query: COLLECTIONS_QUERY,
    variables: { first },
    tags: ["shopify-collections"],
    revalidate: COLLECTIONS_REVALIDATE,
  });

  return edges(data?.collections);
}

interface CollectionByHandleResponse {
  collectionByHandle:
    | (Omit<ShopifyCollection, never> & {
        products: {
          edges: { node: ShopifyProduct }[];
        };
      })
    | null;
}

export async function getCollectionByHandle(
  handle: string,
  first = 100,
): Promise<{
  collection: ShopifyCollection;
  products: ShopifyProduct[];
} | null> {
  const { data } = await shopifyFetch<CollectionByHandleResponse>({
    query: COLLECTION_BY_HANDLE_QUERY,
    variables: {
      handle,
      first,
    },
    tags: [
      "shopify-collections",
      `shopify-collection-${handle}`,
    ],
    revalidate: COLLECTIONS_REVALIDATE,
  });

  if (!data?.collectionByHandle) {
    return null;
  }

  const { products, ...collection } = data.collectionByHandle;

  return {
    collection,
    products: edges(products),
  };
}

/* ==================================================================
   CART
   ================================================================== */

export interface CartMutationResult {
  cart: ShopifyCart | null;
  userErrors: ShopifyUserError[];

  /** Set when Shopify itself could not be reached at all. */
  networkError: boolean;
}

interface CartResponse {
  cart: ShopifyCart | null;
}

/**
 * Every cart-returning operation requests `lines` the same way (see
 * CART_FIELDS in queries.ts): `lines(first: 100) { edges { node { ... } } }`.
 * Shopify therefore always answers with `lines: { edges: [{ node }] }`, but
 * `ShopifyCart.lines` is typed — and consumed throughout actions.ts — as a
 * plain `ShopifyCartLine[]`. This is the single place that reconciles the
 * two, the same way `edges()` above already does for products and
 * collections. It must run on every function that can return a cart —
 * createCart/addToCart/updateCart/removeFromCart included, not just reads —
 * since a line added a moment ago is exactly what the customer expects to
 * still see at checkout.
 */
function normalizeCart(cart: ShopifyCart | null | undefined): ShopifyCart | null {
  if (!cart) return null;
  const rawLines = cart.lines as unknown;
  if (Array.isArray(rawLines)) return cart;
  return {
    ...cart,
    lines: edges(rawLines as { edges: { node: ShopifyCart["lines"][number] }[] } | null | undefined),
  };
}

export async function getCart(
  cartId: string,
): Promise<ShopifyCart | null> {
  const { data } = await shopifyFetch<CartResponse>({
    query: CART_QUERY,
    variables: { cartId },
  });

  return normalizeCart(data?.cart);
}

interface CartLineInput {
  merchandiseId: string;
  quantity: number;
}

interface CartCreateResponse {
  cartCreate: {
    cart: ShopifyCart | null;
    userErrors: ShopifyUserError[];
  };
}

export async function createCart(
  lines: CartLineInput[] = [],
): Promise<CartMutationResult> {
  const { data, networkError } =
    await shopifyFetch<CartCreateResponse>({
      query: CART_CREATE_MUTATION,
      variables: { lines },
    });

  return {
    cart: normalizeCart(data?.cartCreate.cart),
    userErrors: data?.cartCreate.userErrors ?? [],
    networkError,
  };
}

interface CartLinesAddResponse {
  cartLinesAdd: {
    cart: ShopifyCart | null;
    userErrors: ShopifyUserError[];
  };
}

export async function addToCart(
  cartId: string,
  lines: CartLineInput[],
): Promise<CartMutationResult> {
  const { data, networkError } =
    await shopifyFetch<CartLinesAddResponse>({
      query: CART_LINES_ADD_MUTATION,
      variables: {
        cartId,
        lines,
      },
    });

  return {
    cart: normalizeCart(data?.cartLinesAdd.cart),
    userErrors: data?.cartLinesAdd.userErrors ?? [],
    networkError,
  };
}

interface CartLineUpdateInput {
  id: string;
  quantity: number;
}

interface CartLinesUpdateResponse {
  cartLinesUpdate: {
    cart: ShopifyCart | null;
    userErrors: ShopifyUserError[];
  };
}

export async function updateCart(
  cartId: string,
  lines: CartLineUpdateInput[],
): Promise<CartMutationResult> {
  const { data, networkError } =
    await shopifyFetch<CartLinesUpdateResponse>({
      query: CART_LINES_UPDATE_MUTATION,
      variables: {
        cartId,
        lines,
      },
    });

  return {
    cart: normalizeCart(data?.cartLinesUpdate.cart),
    userErrors: data?.cartLinesUpdate.userErrors ?? [],
    networkError,
  };
}

interface CartLinesRemoveResponse {
  cartLinesRemove: {
    cart: ShopifyCart | null;
    userErrors: ShopifyUserError[];
  };
}

export async function removeFromCart(
  cartId: string,
  lineIds: string[],
): Promise<CartMutationResult> {
  const { data, networkError } =
    await shopifyFetch<CartLinesRemoveResponse>({
      query: CART_LINES_REMOVE_MUTATION,
      variables: {
        cartId,
        lineIds,
      },
    });

  return {
    cart: normalizeCart(data?.cartLinesRemove.cart),
    userErrors: data?.cartLinesRemove.userErrors ?? [],
    networkError,
  };
}