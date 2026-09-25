import {
  getProduct,
  getProducts as getLocalProducts,
  getProductsByCollection as getLocalProductsByCollection,
  getFeatured as getLocalFeatured,
} from "@/lib/catalog";
import type { CollectionSlug, Product } from "@/lib/types";
import { getProductByHandle, getProducts as getShopifyProducts } from "@/lib/shopify";
import { enrichProduct, enrichProducts } from "@/lib/shopify/mappers";

/**
 * The layer product/shop pages actually call. Keeps `src/lib/catalog.ts`
 * (the static catalogue — photography, story copy, reviews, nutrition
 * panels, everything Shopify has no concept of) completely free of any
 * Shopify dependency; this module sits on top of it instead of the other
 * way around.
 *
 * Every function here is safe to call unconditionally: a missing Shopify
 * handle, or Shopify being unreachable entirely, both fall back to the
 * static catalogue product exactly as it already renders today.
 */

export async function getEnrichedProduct(slug: string): Promise<Product | undefined> {
  const local = getProduct(slug);
  if (!local) return undefined;
  const shopify = await getProductByHandle(slug);
  return enrichProduct(local, shopify);
}

export async function getEnrichedProducts(): Promise<Product[]> {
  const locals = getLocalProducts();
  const shopify = await getShopifyProducts(250);
  return enrichProducts(locals, shopify);
}

export async function getEnrichedProductsByCollection(collection: CollectionSlug): Promise<Product[]> {
  const locals = getLocalProductsByCollection(collection);
  const shopify = await getShopifyProducts(250);
  return enrichProducts(locals, shopify);
}

export async function getEnrichedFeatured(): Promise<Product[]> {
  const locals = getLocalFeatured();
  const shopify = await getShopifyProducts(250);
  return enrichProducts(locals, shopify);
}
