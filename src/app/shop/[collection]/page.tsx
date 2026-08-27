import { notFound } from "next/navigation";
import { COLLECTIONS, getProductsByCollection, getCollection } from "@/lib/catalog";
import { ProductGrid } from "@/components/product/ProductGrid";
import { PageHeader } from "@/components/primitives/PageHeader";
import { JsonLd } from "@/components/primitives/JsonLd";
import { breadcrumbSchema, collectionSchema, pageMetadata } from "@/lib/seo";
import type { CollectionSlug } from "@/lib/types";

export function generateStaticParams() {
  return COLLECTIONS.map((w) => ({ collection: w.slug }));
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

  const products = getProductsByCollection(collection.slug as CollectionSlug);

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
