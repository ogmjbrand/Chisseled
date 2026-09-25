import { COLORWAYS } from "@/lib/art";
import type { ColorwayKey } from "@/lib/art";
import type { CollectionSlug, Product, ShopifyProductOptionView, ShopifyVariantView, Variant } from "@/lib/types";
import type {
  ShopifyProduct,
  ShopifyProductVariant,
} from "@/lib/shopify/types";
import {
  getProductByHandle,
  getProducts as getShopifyProducts,
} from "@/lib/shopify";

function moneyToCents(amount: string | undefined): number {
  const value = Number.parseFloat(amount ?? "");
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

function optionValue(
  variant: ShopifyProductVariant,
  names: string[],
): string | undefined {
  for (const name of names) {
    const match = variant.selectedOptions.find(
      (option) => option.name.toLowerCase() === name.toLowerCase(),
    );

    if (match?.value) {
      return match.value;
    }
  }

  return undefined;
}

function colorwayForValue(value: string | undefined): ColorwayKey {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return "apparel";
  }

  for (const [key, colorway] of Object.entries(COLORWAYS)) {
    if (
      key.toLowerCase() === normalized ||
      colorway.name.toLowerCase() === normalized
    ) {
      return key as ColorwayKey;
    }
  }

  // Unknown Shopify colors must not be forced to "onyx".
  return "apparel";
}

function getSizes(product: ShopifyProduct): string[] {
  const sizeOption = product.options.find(
    (option) => option.name.toLowerCase() === "size",
  );

  if (sizeOption?.values?.length) {
    return sizeOption.values;
  }

  const sizes = product.variants.edges
    .map(({ node }) => optionValue(node, ["Size"]))
    .filter((value): value is string => Boolean(value));

  return [...new Set(sizes)];
}

function getVariants(product: ShopifyProduct): Variant[] {
  const variants = product.variants.edges.map(({ node }) => node);

  const hasColor = product.options.some((option) =>
    /^colou?r$/i.test(option.name),
  );

  /*
   * Shopify product has no color option.
   *
   * We use "apparel" as the internal compatibility key instead of
   * "onyx", because the product does not actually have an Onyx color.
   */
  if (!hasColor) {
    const inStock = variants
      .filter((variant) => variant.availableForSale)
      .map((variant) => optionValue(variant, ["Size"]))
      .filter((value): value is string => Boolean(value));

    const low = variants
      .filter(
        (variant) =>
          variant.availableForSale &&
          variant.quantityAvailable !== null &&
          variant.quantityAvailable > 0 &&
          variant.quantityAvailable < 10,
      )
      .map((variant) => optionValue(variant, ["Size"]))
      .filter((value): value is string => Boolean(value));

    return [
      {
        colorway: "apparel",
        inStock: [...new Set(inStock)],
        low: [...new Set(low)],
      },
    ];
  }

  const colorValues =
    product.options.find((option) =>
      /^colou?r$/i.test(option.name),
    )?.values ?? [];

  return colorValues.map((colorValue) => {
    const matching = variants.filter((variant) => {
      const value = optionValue(variant, ["Color", "Colour"]);

      return value?.trim().toLowerCase() === colorValue.trim().toLowerCase();
    });

    const inStock = matching
      .filter((variant) => variant.availableForSale)
      .map((variant) => optionValue(variant, ["Size"]))
      .filter((value): value is string => Boolean(value));

    const low = matching
      .filter(
        (variant) =>
          variant.availableForSale &&
          variant.quantityAvailable !== null &&
          variant.quantityAvailable > 0 &&
          variant.quantityAvailable < 10,
      )
      .map((variant) => optionValue(variant, ["Size"]))
      .filter((value): value is string => Boolean(value));

    return {
      colorway: colorwayForValue(colorValue),
      inStock: [...new Set(inStock)],
      low: [...new Set(low)],
    };
  });
}

function getShopifyOptions(product: ShopifyProduct): ShopifyProductOptionView[] {
  return product.options.map((option) => ({
    name: option.name,
    values: [...option.values],
  }));
}

function getShopifyVariants(product: ShopifyProduct): ShopifyVariantView[] {
  return product.variants.edges.map(({ node }) => ({
    id: node.id,
    title: node.title,
    availableForSale: node.availableForSale,
    quantityAvailable: node.quantityAvailable,
    selectedOptions: node.selectedOptions.map((option) => ({
      name: option.name,
      value: option.value,
    })),
    priceCents: moneyToCents(node.price.amount),
    compareAtCents: node.compareAtPrice ? moneyToCents(node.compareAtPrice.amount) : undefined,
  }));
}

function categoryForProduct(product: ShopifyProduct): string {
  const title = product.title.toLowerCase();

  if (title.includes("hoodie")) return "Hoodies";
  if (title.includes("sweatshirt")) return "Sweatshirts";
  if (title.includes("jacket")) return "Jackets";
  if (title.includes("pant")) return "Pants";
  if (title.includes("legging")) return "Leggings";
  if (title.includes("short")) return "Shorts";
  if (title.includes("shirt")) return "Shirts";
  if (title.includes("top")) return "Tops";
  if (title.includes("bra")) return "Bras";
  if (title.includes("sock")) return "Socks";
  if (title.includes("cap")) return "Caps";
  if (title.includes("bag")) return "Bags";

  return "Apparel";
}

function genderForProduct(product: ShopifyProduct): Product["gender"] {
  const text = `${product.title} ${product.tags.join(" ")}`.toLowerCase();

  if (/\bwomen\b|\bwomen's\b|\bladies\b|\bfemale\b/.test(text)) {
    return "women";
  }

  if (/\bmen\b|\bmen's\b|\bmale\b/.test(text)) {
    return "men";
  }

  return "unisex";
}

function collectionForProduct(product: ShopifyProduct): CollectionSlug {
  const text = `${product.title} ${product.tags.join(" ")}`.toLowerCase();

  if (text.includes("camo")) return "camo";
  if (text.includes("track")) return "tracksuits";
  if (text.includes("essential")) return "essentials";
  if (text.includes("statement")) return "statement";
  if (text.includes("monogram")) return "monogram";

  return "essentials";
}

function productFromShopify(product: ShopifyProduct): Product {
  const price = moneyToCents(product.priceRange.minVariantPrice.amount);

  const compareAt = moneyToCents(
    product.compareAtPriceRange.minVariantPrice.amount,
  );

  const description =
    product.description?.trim() ||
    product.descriptionHtml?.replace(/<[^>]+>/g, " ").trim() ||
    "";

  const variants = getVariants(product);
  const sizes = getSizes(product);

  return {
    slug: product.handle,
    name: product.title,

    tagline: description.slice(0, 160),

    collection: collectionForProduct(product),
    gender: genderForProduct(product),
    category: categoryForProduct(product),

    price,
    compareAt: compareAt > price ? compareAt : undefined,

    /*
     * Compatibility with the existing Product type.
     * Actual Shopify images are supplied through media.
     */
    flat: "apparel",

    media: product.featuredImage?.url,

    variants,
    sizes,

    shopifyOptions: getShopifyOptions(product),
    shopifyVariants: getShopifyVariants(product),
    shopifyImages: product.images.edges.map(({ node }) => ({
      url: node.url,
      altText: node.altText,
      width: node.width,
      height: node.height,
    })),

    activities: [],
    fit: "regular",

    badges: product.tags.slice(0, 3),

    story: description,
    benefits: [],

    fabric: "",
    care: "",
    modelNote: "",

    /*
     * Shopify does not currently provide review information
     * through our Storefront query.
     */
    rating: 0,
    reviewCount: 0,
    reviews: [],

    related: [],

    tone: "apparel",

    isNew: false,
    isMemberOnly: false,
  };
}

export async function getEnrichedProduct(
  slug: string,
): Promise<Product | undefined> {
  const shopify = await getProductByHandle(slug);

  if (!shopify) {
    return undefined;
  }

  return productFromShopify(shopify);
}

export async function getEnrichedProducts(): Promise<Product[]> {
  const shopifyProducts = await getShopifyProducts(250);

  return shopifyProducts.map(productFromShopify);
}

export async function getEnrichedProductsByCollection(
  collection: CollectionSlug,
): Promise<Product[]> {
  const products = await getEnrichedProducts();

  return products.filter((product) => product.collection === collection);
}

export async function getEnrichedFeatured(): Promise<Product[]> {
  const products = await getEnrichedProducts();

  return products.slice(0, 8);
}