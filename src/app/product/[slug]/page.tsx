import { notFound } from "next/navigation";
import { PRODUCTS, getProduct, relatedProducts } from "@/lib/catalog";
import { ProductDetail, ReviewList } from "@/components/product/ProductDetail";
import { ProductCard } from "@/components/product/ProductCard";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { JsonLd } from "@/components/primitives/JsonLd";
import { breadcrumbSchema, pageMetadata, productSchema } from "@/lib/seo";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return pageMetadata({ title: "Not found", description: "", path: "/shop" });

  return pageMetadata({
    title: product.name,
    description: `${product.tagline} ${product.fabric}`,
    path: `/product/${product.slug}`,
  });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const related = relatedProducts(product);
  const collectionName = product.collection.charAt(0).toUpperCase() + product.collection.slice(1);

  return (
    <>
      <JsonLd
        data={[
          productSchema(product),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Shop", path: "/shop" },
            { name: collectionName, path: `/shop/${product.collection}` },
            { name: product.name, path: `/product/${product.slug}` },
          ]),
        ]}
      />

      <nav aria-label="Breadcrumb" className="shell pt-[calc(var(--nav-h)+1.5rem)]">
        <ol className="flex flex-wrap items-center gap-2">
          {[
            { name: "Home", path: "/" },
            { name: "Shop", path: "/shop" },
            { name: collectionName, path: `/shop/${product.collection}` },
            { name: product.name, path: `/product/${product.slug}` },
          ].map((t, i, arr) => (
            <li key={t.path} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden className="text-ash">/</span>}
              {i === arr.length - 1 ? (
                <span aria-current="page" className="font-mono text-micro uppercase tracking-[0.16em] text-fog">
                  {t.name}
                </span>
              ) : (
                <a href={t.path} className="font-mono text-micro uppercase tracking-[0.16em] text-ash transition-colors hover:text-bone">
                  {t.name}
                </a>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <ProductDetail product={product} />

      <ReviewList product={product} />

      {/* Related */}
      <section className="border-t border-bone/10 bg-ink section-pad" aria-labelledby="related-heading">
        <div className="shell">
          <h2 id="related-heading" className="display-md mb-12 text-bone">
            Completes the kit.
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {related.map((p, i) => (
              <ProductCard key={p.slug} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      <RecentlyViewed exclude={product.slug} />
    </>
  );
}
