import { notFound } from "next/navigation";
import { getCollection } from "@/lib/catalog";
import { getEnrichedProductsByCollection, getStoreCollection } from "@/lib/commerce/catalog";
import { ProductGrid } from "@/components/product/ProductGrid";
import { PageHeader } from "@/components/primitives/PageHeader";
import { JsonLd } from "@/components/primitives/JsonLd";
import { breadcrumbSchema, collectionSchema, pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * Collections are managed in /admin. The local editorial definition (statement,
 * lines, tone) still dresses the header for the brand's core collections;
 * any other admin-created collection uses its own title and description.
 */
async function resolve(slug: string) {
  const store = await getStoreCollection(slug);
  if (!store) return null;
  const editorial = getCollection(slug);
  return {
    slug: store.slug,
    name: store.title,
    statement: editorial?.statement ?? store.title,
    lede: editorial?.lines.join(" · ") ?? store.description,
    description: store.seoDescription ?? (editorial ? `${editorial.lines.join(", ")}. Engineered performance from CHISSELED.` : store.description),
    seoTitle: store.seoTitle,
    tone: editorial?.tone ?? "apparel",
    pose: editorial?.pose,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ collection: string }> }) {
  const { collection: slug } = await params;
  const c = await resolve(slug);
  if (!c) return pageMetadata({ title: "Not found", description: "", path: "/shop" });
  return pageMetadata({
    title: c.seoTitle ?? `${c.name} — ${c.statement}`,
    description: c.description,
    path: `/shop/${c.slug}`,
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
  const collection = await resolve(slug);
  if (!collection) notFound();

  const products = await getEnrichedProductsByCollection(collection.slug);
  // A collection with a name but nothing to sell is not a page.
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
        lede={collection.lede}
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
