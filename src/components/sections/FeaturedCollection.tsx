import Link from "next/link";
import { SectionBackdrop } from "@/components/primitives/SectionBackdrop";
import { getFeatured } from "@/lib/catalog";
import { ProductCard } from "@/components/product/ProductCard";
import { ArrowMark } from "@/components/primitives/Marks";

export function FeaturedCollection() {
  const products = getFeatured();

  return (
    <section
      id="collection"
      className="relative border-t border-bone/10 bg-carbon section-pad"
      aria-labelledby="featured-heading"
    >
      <SectionBackdrop src="rope-climb" strength="quiet" position="center 30%" />

      <div className="relative z-[1] shell mb-14 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="eyebrow mb-5">03 — New Collection</p>
          <h2 id="featured-heading" className="display-lg mb-5 max-w-[14ch] text-bone" data-reveal>
            Engineered to perform.
          </h2>
          <p
            className="lede max-w-[52ch]"
            data-reveal
            style={{ "--reveal-delay": "100ms" } as React.CSSProperties}
          >
            Six pieces the studio builds everything else around. Squat-tested at depth,
            seam-mapped to the body, and specified on the page so you can check the claim.
          </p>
        </div>

        <Link href="/shop" className="btn btn-ghost btn-sm justify-self-start lg:justify-self-end">
          View all
          <ArrowMark className="size-4" />
        </Link>
      </div>

      <div className="shell grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3 lg:gap-x-6">
        {products.map((product, i) => (
          <ProductCard key={product.slug} product={product} index={i} />
        ))}
      </div>
    </section>
  );
}
