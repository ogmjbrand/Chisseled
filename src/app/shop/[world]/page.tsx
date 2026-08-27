import { notFound } from "next/navigation";
import { WORLDS, getProductsByWorld, getWorld } from "@/lib/catalog";
import { ProductGrid } from "@/components/product/ProductGrid";
import { PageHeader } from "@/components/primitives/PageHeader";
import { JsonLd } from "@/components/primitives/JsonLd";
import { breadcrumbSchema, collectionSchema, pageMetadata } from "@/lib/seo";
import type { WorldSlug } from "@/lib/types";

export function generateStaticParams() {
  return WORLDS.map((w) => ({ world: w.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ world: string }>;
}) {
  const { world: slug } = await params;
  const world = getWorld(slug);
  if (!world) return pageMetadata({ title: "Not found", description: "", path: "/shop" });

  return pageMetadata({
    title: `${world.name} — ${world.statement}`,
    description: `${world.lines.join(", ")}. Engineered performance from CHISSELED.`,
    path: `/shop/${world.slug}`,
  });
}

export default async function WorldPage({
  params,
  searchParams,
}: {
  params: Promise<{ world: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { world: slug } = await params;
  const { category } = await searchParams;

  const world = getWorld(slug);
  if (!world) notFound();

  const products = getProductsByWorld(world.slug as WorldSlug);

  return (
    <>
      <JsonLd
        data={[
          collectionSchema(world.name, `/shop/${world.slug}`, products),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Shop", path: "/shop" },
            { name: world.name, path: `/shop/${world.slug}` },
          ]),
        ]}
      />

      <PageHeader
        eyebrow={`${products.length} pieces`}
        title={world.statement}
        lede={world.lines.join(" · ")}
        seed={`world-page-${world.slug}`}
        tone={world.tone}
        pose={world.pose}
        trail={[
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
          { name: world.name, path: `/shop/${world.slug}` },
        ]}
      />

      <div className="shell section-pad">
        <ProductGrid products={products} initialCategory={category} />
      </div>
    </>
  );
}
