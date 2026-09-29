import { notFound } from "next/navigation";
import { COLLECTIONS, getCollection } from "@/lib/catalog";
import { getEnrichedProductsByCollection } from "@/lib/shopify/catalog";
import { ProductGrid } from "@/components/product/ProductGrid";
import { PageHeader } from "@/components/primitives/PageHeader";
import { JsonLd } from "@/components/primitives/JsonLd";
import { breadcrumbSchema, collectionSchema, pageMetadata } from "@/lib/seo";
import type { CollectionSlug } from "@/lib/types";

/**
 * Only pre-builds collections that currently hold at least one real,
 * live Shopify product — collectionForProduct() (src/lib/shopify/catalog.ts)
 * buckets real products by a title/tag keyword guess, and some of the local
 * catalogue's editorial collections (e.g. "scarred") have no matching
 * keyword at all, so they can never hold a real product. A collection
 * dropped from here still gets a request-time attempt if linked directly —
 * the page itself 404s rather than rendering an empty grid.
 */
export async function generateStaticParams() {
  const withCounts = await Promise.all(
    COLLECTIONS.map(async (w) => ({
      slug: w.slug,
      count: (await getEnrichedProductsByCollection(w.slug as CollectionSlug)).length,
    })),
  );

  return withCounts.filter((w) => w.count > 0).map((w) => ({ collection: w.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection: slug } = await params;
  const collection = getCollection(slug);
  if (!collection) return pageMetadata({ title: "Not found", description: "", path: "/shop" });

  return pageMetadata({
    title: `${collection.name} — ${collection.statement}`,
    description: `${collection.lines.join(", ")}. Engineered performance from CHISSELED.`,
    path: `/shop/${collection.slug}`,
  });
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ collection: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { collection: slug } = await params;
  const { category } = await searchParams;

  const collection = getCollection(slug);
  if (!collection) notFound();

  const products = await getEnrichedProductsByCollection(collection.slug as CollectionSlug);

  // A collection with a name and a statement but nothing real to sell is not
  // a page — 404 rather than render an editorial header over an empty grid.
  if (products.length === 0) notFound();

  return (
    <>
      <JsonLd
        data={[
          collectionSchema(collection.name, `/shop/${collection.slug}`, products),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Shop", path: "/shop" },
            { name: collection.name, path: `/shop/${collection.slug}` },
          ]),
        ]}
      />

      <PageHeader
        eyebrow={`${products.length} pieces`}
        title={collection.statement}
        lede={collection.lines.join(" · ")}
        seed={`collection-page-${collection.slug}`}
        tone={collection.tone}
        pose={collection.pose}
        trail={[
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
          { name: collection.name, path: `/shop/${collection.slug}` },
        ]}
      />

      <div className="shell section-pad">
        <ProductGrid products={products} initialCategory={category} />
      </div>
    </>
  );
}
