import { notFound } from "next/navigation";
import { getEnrichedProduct, getEnrichedProducts } from "@/lib/shopify/catalog";
import { ProductDetail, ReviewList } from "@/components/product/ProductDetail";
import { ProductCard } from "@/components/product/ProductCard";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { JsonLd } from "@/components/primitives/JsonLd";
import { breadcrumbSchema, pageMetadata, productSchema } from "@/lib/seo";

export async function generateStaticParams() {
  const products = await getEnrichedProducts();

  return products.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getEnrichedProduct(slug);

  if (!product) {
    return pageMetadata({
      title: "Not found",
      description: "",
      path: "/shop",
    });
  }

  return pageMetadata({
    title: product.name,
    description: product.tagline,
    path: `/product/${product.slug}`,
  });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await getEnrichedProduct(slug);

  if (!product) {
    notFound();
  }

  const allProducts = await getEnrichedProducts();

  const related = allProducts
    .filter((item) => item.slug !== product.slug)
    .filter(
      (item) =>
        item.category === product.category ||
        item.gender === product.gender,
    )
    .slice(0, 4);

  const collectionName =
    product.collection.charAt(0).toUpperCase() +
    product.collection.slice(1);

  return (
    <>
      <JsonLd
        data={[
          productSchema(product),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Shop", path: "/shop" },
            {
              name: collectionName,
              path: `/shop/${product.collection}`,
            },
            {
              name: product.name,
              path: `/product/${product.slug}`,
            },
          ]),
        ]}
      />

      <nav
        aria-label="Breadcrumb"
        className="shell pt-[calc(var(--nav-h)+1.5rem)]"
      >
        <ol className="flex flex-wrap items-center gap-2">
          {[
            { name: "Home", path: "/" },
            { name: "Shop", path: "/shop" },
            {
              name: collectionName,
              path: `/shop/${product.collection}`,
            },
            {
              name: product.name,
              path: `/product/${product.slug}`,
            },
          ].map((item, index, items) => (
            <li
              key={item.path}
              className="flex items-center gap-2"
            >
              {index > 0 && (
                <span aria-hidden className="text-ash">
                  /
                </span>
              )}

              {index === items.length - 1 ? (
                <span
                  aria-current="page"
                  className="font-mono text-micro uppercase tracking-[0.16em] text-fog"
                >
                  {item.name}
                </span>
              ) : (
                <a
                  href={item.path}
                  className="font-mono text-micro uppercase tracking-[0.16em] text-ash transition-colors hover:text-bone"
                >
                  {item.name}
                </a>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <ProductDetail product={product} />

      <ReviewList product={product} />

      {related.length > 0 ? (
        <section
          className="border-t border-bone/10 bg-ink section-pad"
          aria-labelledby="related-heading"
        >
          <div className="shell">
            <h2
              id="related-heading"
              className="display-md mb-12 text-bone"
            >
              Completes the kit.
            </h2>

            <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
              {related.map((item, index) => (
                <ProductCard
                  key={item.slug}
                  product={item}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <RecentlyViewed exclude={product.slug} />
    </>
  );
}
