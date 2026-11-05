"use server";

import { getEnrichedProductsByHandles, searchProducts } from "@/lib/commerce/catalog";
import { rateLimit } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/request";
import { isDatabaseConfigured } from "@/lib/db";
import type { Product } from "@/lib/types";

export interface SearchHit {
  slug: string;
  name: string;
  category: string;
  price: number;
  media: Product["media"];
  flat: Product["flat"];
  colorway: Product["variants"][number]["colorway"];
}

/** Live product search for the search overlay. */
export async function searchProductsAction(query: string): Promise<SearchHit[]> {
  if (!isDatabaseConfigured() || typeof query !== "string" || query.trim().length < 2) return [];
  if (!(await rateLimit(`search:${await clientIp()}`, 90, 60)).ok) return [];
  const products = await searchProducts(query.slice(0, 100), 6);
  return products.map((p) => ({
    slug: p.slug,
    name: p.name,
    category: p.category,
    price: p.price,
    media: p.media,
    flat: p.flat,
    colorway: p.variants[0]?.colorway ?? "apparel",
  }));
}

/** Live products for wishlist / recently viewed (slugs come from the browser's storage). */
export async function productsBySlugsAction(slugs: string[]): Promise<Product[]> {
  if (!isDatabaseConfigured() || !Array.isArray(slugs)) return [];
  const clean = [...new Set(slugs.filter((s) => typeof s === "string" && /^[a-z0-9-]{1,96}$/.test(s)))].slice(0, 40);
  if (!clean.length) return [];
  return getEnrichedProductsByHandles(clean);
}
