import type { Metadata } from "next";
import type { Article, Product } from "@/lib/types";

export const SITE = {
  name: "CHISSELED",
  legalName: "Chisseled Inc",
  tagline: "Look Chisseled. Move Chisseled. Live Chisseled.",
  description:
    "Premium performance apparel, training, nutrition and essentials engineered for people committed to becoming more.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://chisseled.com",
  locale: "en_US",
} as const;

export function pageMetadata({
  title,
  description,
  path = "/",
  type = "website",
}: {
  title: string;
  description: string;
  path?: string;
  type?: "website" | "article";
}): Metadata {
  const url = `${SITE.url}${path}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} · ${SITE.name}`,
      description,
      url,
      siteName: SITE.name,
      locale: SITE.locale,
      type,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${SITE.name}`,
      description,
    },
  };
}

/* ==================================================================
   STRUCTURED DATA
   ================================================================== */

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    slogan: SITE.tagline,
    description: SITE.description,
    sameAs: [
      "https://instagram.com",
      "https://tiktok.com",
      "https://youtube.com",
    ],
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE.url}/shop?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * aggregateRating/review previously emitted product.rating/reviewCount/
 * reviews as schema.org structured data — those fields are illustrative
 * sample data (see src/lib/reviews.ts's own header comment), not real
 * customer reviews, so surfacing them to search engines as AggregateRating/
 * Review markup would be publishing fabricated review data as fact. Omitted
 * entirely rather than emitted with placeholder values; add back only once
 * a real review platform is wired up.
 */
export function productSchema(product: Product) {
  const available = product.variants.some((v) => v.inStock.length > 0);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.tagline,
    sku: product.slug,
    brand: { "@type": "Brand", name: SITE.name },
    category: product.category,
    material: product.fabric,
    color: product.variants.map((v) => v.colorway).join(", "),
    offers: {
      "@type": "Offer",
      url: `${SITE.url}/product/${product.slug}`,
      priceCurrency: "USD",
      price: product.price,
      availability: available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}

export function collectionSchema(name: string, path: string, products: Product[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url: `${SITE.url}${path}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE.url}/product/${p.slug}`,
        name: p.name,
      })),
    },
  };
}

export function articleSchema(article: Article) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.date,
    dateModified: article.date,
    author: { "@type": "Person", name: article.author },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
    },
    articleSection: article.category,
    mainEntityOfPage: `${SITE.url}/journal/${article.slug}`,
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${SITE.url}${t.path}`,
    })),
  };
}
