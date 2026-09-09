import { COLORWAYS } from "@/lib/art";
import type { ColorwayKey } from "@/lib/art";
import type { Product } from "@/lib/types";
import type { ShopifyMoney, ShopifyProduct, ShopifyProductVariant, ShopifySelectedOption } from "@/lib/shopify/types";

/**
 * The bridge between Shopify's product/variant shape and this project's own
 * `Product`/`Variant` types.
 *
 * WHAT STAYS LOCAL: name, tagline, story, benefits, fabric, care, photography
 * (`media`/`flat`), reviews, nutrition copy — none of this has a Shopify
 * equivalent, and dumping Shopify's raw `descriptionHtml` over it would be
 * exactly the "generic AI-generated UI" this build has spent the whole
 * project avoiding. Shopify becomes authoritative for the numbers that
 * actually have to be correct to sell something: price, compare-at price,
 * and per-size/per-colour availability.
 *
 * MATCHING: a local product is matched to a Shopify product by
 * `handle === slug` — the two catalogues are expected to share the same
 * product identifiers. A local product with no matching Shopify handle is
 * returned unchanged (falls back to the static catalogue entry) rather than
 * hidden or zeroed out; that is the graceful-degradation path this project's
 * error-handling requirements call for.
 */

export function moneyToCents(money: ShopifyMoney | null | undefined): number | undefined {
  if (!money) return undefined;
  const n = Number.parseFloat(money.amount);
  if (Number.isNaN(n)) return undefined;
  return Math.round(n * 100);
}

function optionValue(options: ShopifySelectedOption[], name: string): string | undefined {
  const lower = name.toLowerCase();
  return options.find((o) => o.name.toLowerCase() === lower)?.value;
}

/**
 * A Shopify "Color" option value is matched against either the local
 * colourway's key ("royal") or its display name ("Steel Blue") —
 * case-insensitively — since a merchant's own option-value spelling can't be
 * known in advance from this codebase alone.
 */
function colorMatches(options: ShopifySelectedOption[], colorway: ColorwayKey): boolean {
  const value = (optionValue(options, "Color") ?? optionValue(options, "Colour"))?.trim().toLowerCase();
  if (!value) return false;
  const displayName = COLORWAYS[colorway]?.name?.toLowerCase();
  return value === colorway.toLowerCase() || (displayName ? value === displayName : false);
}

function sizeMatches(options: ShopifySelectedOption[], size: string): boolean {
  const value = optionValue(options, "Size")?.trim().toLowerCase();
  return value === size.trim().toLowerCase();
}

/** Only a product with real colour variation carries a "Color" option; a single-colourway product may only have "Size". */
export function findShopifyVariant(
  product: ShopifyProduct,
  colorway: ColorwayKey,
  size: string,
): ShopifyProductVariant | null {
  const hasColorOption = product.options.some((o) => /^colou?r$/i.test(o.name));
  return (
    product.variants.find((v) => {
      if (hasColorOption && !colorMatches(v.selectedOptions, colorway)) return false;
      return sizeMatches(v.selectedOptions, size);
    }) ?? null
  );
}

/**
 * Merges Shopify's live price/availability onto a local catalogue product.
 * `shopify` is `null` when the store has no product at this handle, or when
 * Shopify was unreachable — either way the local product is returned as-is.
 */
export function enrichProduct(local: Product, shopify: ShopifyProduct | null): Product {
  if (!shopify) return local;

  const hasColorOption = shopify.options.some((o) => /^colou?r$/i.test(o.name));

  const variants = local.variants.map((variant) => {
    const matching = shopify.variants.filter((v) =>
      hasColorOption ? colorMatches(v.selectedOptions, variant.colorway) : true,
    );
    // No Shopify variant at all for this colourway — leave the local stock
    // read alone rather than incorrectly zeroing out a colour Shopify simply
    // doesn't carry data for (e.g. a handle mismatch on this one colourway).
    if (matching.length === 0) return variant;

    const inStock = local.sizes.filter((size) =>
      matching.some((v) => sizeMatches(v.selectedOptions, size) && v.availableForSale),
    );
    const low = local.sizes.filter((size) =>
      matching.some((v) => {
        if (!sizeMatches(v.selectedOptions, size)) return false;
        return v.availableForSale && v.quantityAvailable !== null && v.quantityAvailable > 0 && v.quantityAvailable < 10;
      }),
    );

    return { ...variant, inStock, low };
  });

  const price = moneyToCents(shopify.priceRange.minVariantPrice) ?? local.price;
  const compareAtRaw = moneyToCents(shopify.compareAtPriceRange.minVariantPrice);
  const compareAt = compareAtRaw && compareAtRaw > price ? compareAtRaw : undefined;

  return { ...local, price, compareAt, variants };
}

export function enrichProducts(locals: Product[], shopifyProducts: ShopifyProduct[]): Product[] {
  const byHandle = new Map(shopifyProducts.map((p) => [p.handle, p]));
  return locals.map((p) => enrichProduct(p, byHandle.get(p.slug) ?? null));
}
