import { getProducts } from "@/lib/catalog";
import { ProductGrid } from "@/components/product/ProductGrid";
import { PageHeader } from "@/components/primitives/PageHeader";
import { JsonLd } from "@/components/primitives/JsonLd";
import { breadcrumbSchema, collectionSchema, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Shop All",
  description:
    "The full CHISSELED collection — performance apparel, compression, accessories and nutrition engineered for people who train with intent.",
  path: "/shop",
});

export default function ShopPage() {
  const products = getProducts();

  return (
    <>
      <JsonLd
        data={[
          collectionSchema("Shop All", "/shop", products),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Shop", path: "/shop" },
          ]),
        ]}
      />

      <PageHeader
        eyebrow={`${products.length} pieces`}
        title="The full collection."
        lede="Apparel, compression, accessories and nutrition. Every piece specified on its page so you can check the claim before you buy it."
        seed="shop-all"
        tone="apparel"
        trail={[
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
        ]}
      />

      <div className="shell section-pad">
        <ProductGrid products={products} />
      </div>
    </>
  );
}
