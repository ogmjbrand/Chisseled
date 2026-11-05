"use client";

import { useLiveProducts } from "@/lib/useLiveProducts";
import { useStore } from "@/lib/store";
import { ProductCard } from "@/components/product/ProductCard";

/** Renders nothing until there is genuinely a history worth showing. */
export function RecentlyViewed({ exclude }: { exclude?: string }) {
  const { recent } = useStore();

  const products = (useLiveProducts(recent.filter((s) => s !== exclude).slice(0, 8)) ?? []).slice(0, 4);

  if (products.length < 2) return null;

  return (
    <section
      className="border-t border-bone/10 bg-carbon section-pad"
      aria-labelledby="recent-heading"
    >
      <div className="shell">
        <h2 id="recent-heading" className="eyebrow mb-10">
          Recently viewed
        </h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
          {products.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
