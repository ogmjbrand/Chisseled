"use client";

import Link from "next/link";
import { useLiveProducts } from "@/lib/useLiveProducts";
import { useStore } from "@/lib/store";
import { ProductCard } from "@/components/product/ProductCard";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { ArrowMark, WishMark } from "@/components/primitives/Marks";

export function WishlistView() {
  const { wishlist, ready } = useStore();

  // Only products that are live in the store — a saved item that was archived
  // or sold out of existence simply drops off rather than 404ing.
  const live = useLiveProducts(ready ? wishlist : []);
  const products = live ?? [];
  const loading = !ready || live === null;

  return (
    <>
      <div className="shell pb-20 pt-[calc(var(--nav-h)+3rem)]">
        <p className="eyebrow mb-5">Saved</p>
        <h1 className="display-md mb-12 text-bone">Your wishlist.</h1>

        {/* `ready` gates the empty state so it never flashes before hydration. */}
        {loading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse bg-graphite" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center border border-bone/10 bg-carbon px-8 py-24 text-center">
            <WishMark className="mb-6 size-9 text-iron" />
            <p className="display-sm mb-3 text-bone">Nothing saved yet.</p>
            <p className="mb-8 max-w-[36ch] text-body-sm text-smoke">
              Tap the heart on any product and it will wait for you here.
            </p>
            <Link href="/shop" className="btn btn-primary">
              Shop the collection
              <ArrowMark className="size-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {products.map((p, i) => (
              <ProductCard key={p.slug} product={p} index={i} />
            ))}
          </div>
        )}
      </div>

      <RecentlyViewed />
    </>
  );
}
