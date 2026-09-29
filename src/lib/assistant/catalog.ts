import "server-only";
import { getEnrichedProducts } from "@/lib/shopify/catalog";
import type { AssistantProduct } from "@/lib/assistant/types";
import type { Product } from "@/lib/types";

const MAX_RESULTS = 6;

function toAssistantProduct(p: Product): AssistantProduct {
  const variant = p.variants[0];
  return {
    slug: p.slug,
    name: p.name,
    category: p.category,
    tagline: p.tagline,
    priceCents: p.price,
    compareAtCents: p.compareAt,
    imageUrl: (typeof p.media === "string" ? p.media : undefined) ?? p.shopifyImages?.[0]?.url ?? null,
    colorway: variant?.colorway ?? "apparel",
    sizes: p.sizes,
    inStockSizes: variant?.inStock ?? [],
  };
}

/**
 * The assistant's one and only source of product truth. Always the live,
 * cached Shopify catalogue (`getEnrichedProducts`, same call every storefront
 * page already uses) — never the local editorial catalogue, which is mostly
 * not real, purchasable inventory. A query with no match returns an empty
 * array rather than the nearest thing to it, so the model has an honest
 * "nothing found" to report instead of a near-miss to pass off as a match.
 */
export async function searchAssistantProducts(params: {
  query?: string;
  category?: string;
}): Promise<AssistantProduct[]> {
  const products = await getEnrichedProducts();
  const query = params.query?.trim().toLowerCase();
  const category = params.category?.trim().toLowerCase();

  const matches = products.filter((p) => {
    if (category && !p.category.toLowerCase().includes(category)) return false;
    if (!query) return true;
    const haystack = `${p.name} ${p.category} ${p.tagline} ${p.story}`.toLowerCase();
    return query.split(/\s+/).some((term) => term.length > 1 && haystack.includes(term));
  });

  return (matches.length > 0 ? matches : query || category ? [] : products)
    .slice(0, MAX_RESULTS)
    .map(toAssistantProduct);
}

/** Looks up one product by its exact handle — used for page-context awareness. */
export async function getAssistantProductBySlug(slug: string): Promise<AssistantProduct | null> {
  const products = await getEnrichedProducts();
  const match = products.find((p) => p.slug === slug);
  return match ? toAssistantProduct(match) : null;
}
