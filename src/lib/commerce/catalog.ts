import { cache } from "react";
import { COLORWAYS } from "@/lib/art";
import type { ColorwayKey, FlatKey, Tone } from "@/lib/art";
import { db, isDatabaseConfigured } from "@/lib/db";
import { assertServer } from "@/lib/security/server-only";
import type { CollectionSlug, Fit, Product, Variant } from "@/lib/types";

assertServer("src/lib/commerce/catalog");

/**
 * Storefront catalogue — reads ACTIVE products from the CHISSELED commerce
 * database and maps them onto the storefront's existing `Product` shape, so
 * every page and component keeps working unchanged. This replaces the
 * former third-party storefront API layer.
 *
 * Pages are rendered dynamically, so an admin change is visible on the next
 * request. One query set per request (React `cache`) feeds every section.
 */

interface ProductRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  gender: "women" | "men" | "unisex";
  tags: string[];
  options: { name: string; values: string[] }[];
  details: Record<string, unknown>;
  featured: boolean;
  product_type: string;
  published_at: Date | null;
  created_at: Date;
  category_slug: string | null;
  category_name: string | null;
  collections: string[];
}

interface VariantRow {
  id: string;
  product_id: string;
  title: string;
  sku: string | null;
  price_cents: number;
  compare_at_cents: number | null;
  options: Record<string, string>;
  track_inventory: boolean;
  available: number;
  low_stock_threshold: number;
}

interface ImageRow {
  product_id: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = out.get(k);
    if (list) list.push(item);
    else out.set(k, [item]);
  }
  return out;
}

const COLOR_RE = /^colou?r$/i;
const SIZE_RE = /^size$/i;

function optionValue(options: Record<string, string>, re: RegExp): string | undefined {
  const key = Object.keys(options).find((k) => re.test(k));
  return key ? options[key] : undefined;
}

/** A colour value maps to a curated colourway key when one matches, else stays the real colour name. */
export function colorwayFor(value: string | undefined): ColorwayKey {
  if (!value) return "apparel";
  const lower = value.trim().toLowerCase();
  const key = (Object.keys(COLORWAYS) as ColorwayKey[]).find(
    (k) => k.toLowerCase() === lower || COLORWAYS[k].name.toLowerCase() === lower,
  );
  return key ?? (value.trim() as ColorwayKey);
}

export function colorMatches(variantColor: string | undefined, requested: string): boolean {
  if (!variantColor) return true;
  if (requested === "apparel") return true;
  const v = variantColor.trim().toLowerCase();
  const r = requested.trim().toLowerCase();
  const named = COLORWAYS[requested as ColorwayKey]?.name?.toLowerCase();
  return v === r || v === named;
}

const FLAT_RULES: [RegExp, FlatKey][] = [
  [/hoodie|sweatshirt/, "hoodie"],
  [/jacket/, "jacket"],
  [/legging|pant|jogger/, "leggings"],
  [/short/, "shorts"],
  [/crop/, "crop"],
  [/compression/, "compressionTop"],
  [/bra\b/, "bra"],
  [/sock/, "socks"],
  [/cap\b|hat/, "cap"],
  [/bag/, "bag"],
];

function flatFor(title: string, explicit: unknown): FlatKey {
  if (typeof explicit === "string" && explicit) return explicit as FlatKey;
  const t = title.toLowerCase();
  return FLAT_RULES.find(([re]) => re.test(t))?.[1] ?? "tee";
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function sizesFor(row: ProductRow, variants: VariantRow[]): string[] {
  const opt = row.options.find((o) => SIZE_RE.test(o.name));
  if (opt?.values.length) return [...opt.values];
  return [...new Set(variants.map((v) => optionValue(v.options, SIZE_RE)).filter((s): s is string => Boolean(s)))];
}

function variantsFor(row: ProductRow, variants: VariantRow[]): Variant[] {
  const colorOpt = row.options.find((o) => COLOR_RE.test(o.name));
  const groups: { key: ColorwayKey; rows: VariantRow[] }[] = colorOpt?.values.length
    ? colorOpt.values.map((c) => ({
        key: colorwayFor(c),
        rows: variants.filter((v) => optionValue(v.options, COLOR_RE)?.toLowerCase() === c.toLowerCase()),
      }))
    : [{ key: "apparel", rows: variants }];

  return groups
    .filter((g) => g.rows.length > 0)
    .map((g) => {
      const purchasable = g.rows.filter((v) => !v.track_inventory || v.available > 0);
      const label = (v: VariantRow) => optionValue(v.options, SIZE_RE) ?? v.title;
      return {
        colorway: g.key,
        inStock: [...new Set(purchasable.map(label))],
        low: [
          ...new Set(
            purchasable
              .filter((v) => v.track_inventory && v.available <= Math.max(v.low_stock_threshold, 1))
              .map(label),
          ),
        ],
      };
    });
}

function toProduct(row: ProductRow, variants: VariantRow[], images: ImageRow[]): Product {
  const d = row.details ?? {};
  const prices = variants.map((v) => v.price_cents);
  const price = prices.length ? Math.min(...prices) : 0;
  const cheapest = variants.find((v) => v.price_cents === price);
  const compareAt = cheapest?.compare_at_cents && cheapest.compare_at_cents > price ? cheapest.compare_at_cents : undefined;
  const collections = row.collections ?? [];
  const isNew =
    typeof d.isNew === "boolean"
      ? d.isNew
      : Date.now() - new Date(row.published_at ?? row.created_at).getTime() < 30 * 86400_000;

  return {
    slug: row.slug,
    name: row.title,
    tagline: row.subtitle || row.description.slice(0, 160),
    collection: (collections[0] ?? "essentials") as CollectionSlug,
    collections,
    gender: row.gender,
    category: row.category_name ?? (row.product_type || "Apparel"),
    categorySlug: row.category_slug ?? undefined,
    price,
    compareAt,
    flat: flatFor(row.title, d.flat),
    media: images[0]?.url,
    gallery: images.map((i) => ({ url: i.url, altText: i.alt || null, width: i.width, height: i.height })),
    variants: variantsFor(row, variants),
    sizes: sizesFor(row, variants),
    options: row.options.map((o) => ({ name: o.name, values: [...o.values] })),
    liveVariants: variants.map((v) => ({
      id: v.id,
      title: v.title,
      sku: v.sku,
      availableForSale: !v.track_inventory || v.available > 0,
      quantityAvailable: v.track_inventory ? v.available : null,
      selectedOptions: Object.entries(v.options).map(([name, value]) => ({ name, value })),
      priceCents: v.price_cents,
      compareAtCents: v.compare_at_cents ?? undefined,
    })),
    activities: asArray(d.activities),
    fit: (asString(d.fit) || "regular") as Fit,
    badges: asArray<string>(d.badges).length ? asArray<string>(d.badges) : row.tags.slice(0, 3),
    tags: row.tags,
    story: asString(d.story) || row.description,
    benefits: asArray(d.benefits),
    fabric: asString(d.fabric),
    care: asString(d.care),
    modelNote: asString(d.modelNote),
    nutrition: (d.nutrition as Product["nutrition"]) ?? undefined,
    // No review system yet — never fabricate ratings.
    rating: 0,
    reviewCount: 0,
    reviews: [],
    related: asArray(d.related),
    tone: (asString(d.tone) || (d.nutrition ? "fuel" : "apparel")) as Tone,
    isNew,
    isMemberOnly: d.isMemberOnly === true,
  };
}

/** Every active product, once per request. Never throws: a database outage renders an empty catalogue. */
const loadCatalog = cache(async (): Promise<Product[]> => {
  if (!isDatabaseConfigured()) return [];
  try {
    const sql = db();
    const rows = await sql<ProductRow[]>`
      select p.id, p.slug, p.title, p.subtitle, p.description, p.gender, p.tags, p.options, p.details,
             p.featured, p.product_type, p.published_at, p.created_at,
             c.slug as category_slug, c.name as category_name,
             coalesce((select array_agg(col.slug::text order by col.position)
                       from product_collections pc join collections col on col.id = pc.collection_id
                       where pc.product_id = p.id and col.status = 'active'), '{}') as collections
      from products p left join categories c on c.id = p.category_id
      where p.status = 'active'
      order by p.featured desc, coalesce(p.published_at, p.created_at) desc`;
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const [variants, images] = await Promise.all([
      sql<VariantRow[]>`
        select v.id, v.product_id, v.title, v.sku, v.price_cents, v.compare_at_cents, v.options, v.track_inventory,
               coalesce(i.on_hand - i.reserved, 0)::int as available, coalesce(i.low_stock_threshold, 5) as low_stock_threshold
        from product_variants v left join inventory i on i.variant_id = v.id
        where v.product_id = any(${ids}::uuid[])
        order by v.position, v.created_at`,
      sql<ImageRow[]>`
        select product_id, url, alt, width, height from product_images
        where product_id = any(${ids}::uuid[]) order by position, created_at`,
    ]);
    const vBy = groupBy(variants, (v) => v.product_id);
    const iBy = groupBy(images, (i) => i.product_id);
    return rows
      .map((r) => toProduct(r, vBy.get(r.id) ?? [], iBy.get(r.id) ?? []))
      .filter((p) => (p.liveVariants?.length ?? 0) > 0);
  } catch (err) {
    console.error("[catalog] failed to load products", err);
    return [];
  }
});

export async function getEnrichedProducts(): Promise<Product[]> {
  return loadCatalog();
}

export async function getEnrichedProduct(slug: string): Promise<Product | undefined> {
  return (await loadCatalog()).find((p) => p.slug === slug.toLowerCase());
}

/** Slugs of products that really exist and are on sale — gates every "shop this" affordance. */
export async function getRealProductHandles(): Promise<Set<string>> {
  return new Set((await loadCatalog()).map((p) => p.slug));
}

/** Resolves an ordered list of slugs, dropping any that aren't live products. */
export async function getEnrichedProductsByHandles(handles: string[]): Promise<Product[]> {
  const bySlug = new Map((await loadCatalog()).map((p) => [p.slug, p]));
  return handles.map((h) => bySlug.get(h)).filter((p): p is Product => Boolean(p));
}

export async function getEnrichedProductsByCollection(collection: string): Promise<Product[]> {
  return (await loadCatalog()).filter((p) => p.collections?.includes(collection));
}

export async function getEnrichedFeatured(): Promise<Product[]> {
  return (await loadCatalog()).slice(0, 8);
}

/**
 * Live database data is authoritative for price and availability; the local
 * editorial catalogue keeps supplying copy the database row doesn't carry.
 */
export function mergeEditorial(local: Product, live: Product | undefined): Product {
  if (!live) return local;
  return {
    ...local,
    ...live,
    tagline: live.tagline || local.tagline,
    story: live.story || local.story,
    benefits: live.benefits.length ? live.benefits : local.benefits,
    fabric: live.fabric || local.fabric,
    care: live.care || local.care,
    modelNote: live.modelNote || local.modelNote,
    nutrition: live.nutrition ?? local.nutrition,
    media: live.media ?? local.media,
  };
}

export interface StoreCollection {
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

export const getStoreCollection = cache(async (slug: string): Promise<StoreCollection | null> => {
  if (!isDatabaseConfigured()) return null;
  try {
    const [row] = await db()<{ slug: string; title: string; description: string; image_url: string | null; seo_title: string | null; seo_description: string | null }[]>`
      select slug, title, description, image_url, seo_title, seo_description
      from collections where slug = ${slug} and status = 'active'`;
    return row
      ? { slug: row.slug, title: row.title, description: row.description, imageUrl: row.image_url, seoTitle: row.seo_title, seoDescription: row.seo_description }
      : null;
  } catch (err) {
    console.error("[catalog] failed to load collection", err);
    return null;
  }
});

/** Full-text product search (title weighted over description). */
export async function searchProducts(query: string, limit = 24): Promise<Product[]> {
  const q = query.trim().slice(0, 100);
  if (!q || !isDatabaseConfigured()) return [];
  try {
    const rows = await db()<{ slug: string }[]>`
      select slug from products
      where status = 'active'
        and (search @@ websearch_to_tsquery('simple', ${q}) or title ilike ${"%" + q.replace(/[%_\\]/g, "\\$&") + "%"})
      order by ts_rank(search, websearch_to_tsquery('simple', ${q})) desc
      limit ${limit}`;
    return getEnrichedProductsByHandles(rows.map((r) => r.slug));
  } catch (err) {
    console.error("[catalog] search failed", err);
    return [];
  }
}
