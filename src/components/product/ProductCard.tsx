"use client";

import Link from "next/link";
import { useState } from "react";
import { COLORWAYS } from "@/lib/art";
import { stockLevel } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Flat } from "@/components/primitives/Visual";
import { CheckMark, StarMark, WishMark } from "@/components/primitives/Marks";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  /** Index within a grid — staggers the reveal. */
  index?: number;
  /** A wider card for hero merchandising rows. */
  feature?: boolean;
}

export function ProductCard({ product, index = 0, feature = false }: ProductCardProps) {
  const { add, toggleWishlist, wishlist, currency } = useStore();
  const [variantIndex, setVariantIndex] = useState(0);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [added, setAdded] = useState(false);

  const variant = product.variants[variantIndex];
  const saved = wishlist.includes(product.slug);
  const stock = stockLevel(product);

  const quickAdd = (size: string) => {
    add({ slug: product.slug, colorway: variant.colorway, size, qty: 1 });
    setSizeOpen(false);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  };

  return (
    <article
      className="group relative"
      data-reveal
      style={{ "--reveal-delay": `${Math.min(index, 7) * 70}ms` } as React.CSSProperties}
    >
      {/* --- Media --- */}
      <div className="relative overflow-hidden bg-graphite">
        <Link
          href={`/product/${product.slug}`}
          className="block"
          aria-label={`${product.name} — ${product.tagline}`}
        >
          <div className={feature ? "aspect-[3/4]" : "aspect-[4/5]"}>
            {/* Primary view */}
            <Flat
              flat={product.flat}
              colorway={variant.colorway}
              seed={`${product.slug}-${variant.colorway}`}
              view="front"
              className="absolute inset-0 size-full transition-opacity duration-[700ms] ease-[var(--ease-out-expo)] group-hover:opacity-0"
            />
            {/* Alternate view, revealed on hover — the merchandising standard */}
            <Flat
              flat={product.flat}
              colorway={variant.colorway}
              seed={`${product.slug}-${variant.colorway}`}
              view="detail"
              className="absolute inset-0 size-full scale-[1.03] opacity-0 transition-all duration-[700ms] ease-[var(--ease-out-expo)] group-hover:scale-100 group-hover:opacity-100"
            />
          </div>
        </Link>

        {/* Badges */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.isNew && <span className="badge badge-bone">New</span>}
          {product.badges?.map((b) => (
            <span key={b} className="badge badge-outline bg-ink/60 backdrop-blur-sm">
              {b}
            </span>
          ))}
          {stock === "low" && <span className="badge badge-low bg-ink/60 backdrop-blur-sm">Low stock</span>}
          {product.compareAt && <span className="badge badge-lime">Save {formatPrice(product.compareAt - product.price, currency)}</span>}
        </div>

        {/* Wishlist */}
        <button
          type="button"
          onClick={() => toggleWishlist(product.slug)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className={[
            "absolute right-3 top-3 p-2 backdrop-blur-sm transition-all duration-400",
            saved
              ? "text-lime-bright opacity-100"
              : "text-bone opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
          ].join(" ")}
        >
          <WishMark className="size-5" filled={saved} />
        </button>

        {/* Quick add — appears on hover, always reachable by keyboard */}
        <div
          className={[
            "absolute inset-x-0 bottom-0 translate-y-full bg-ink/92 backdrop-blur-md transition-transform duration-[520ms] ease-[var(--ease-out-expo)]",
            "group-hover:translate-y-0 group-focus-within:translate-y-0",
          ].join(" ")}
        >
          {added ? (
            <p className="flex items-center justify-center gap-2 py-4 font-mono text-micro uppercase tracking-[0.16em] text-lime-bright">
              <CheckMark className="size-4" /> Added to bag
            </p>
          ) : sizeOpen ? (
            <div className="p-3">
              <p className="eyebrow mb-2.5 text-center">Select size</p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {product.sizes.map((size) => {
                  const available = variant.inStock.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={!available}
                      onClick={() => quickAdd(size)}
                      className={[
                        "min-w-9 border px-2.5 py-2 font-mono text-micro uppercase tracking-[0.08em] transition-colors duration-300",
                        available
                          ? "border-bone/25 text-bone hover:border-bone hover:bg-bone hover:text-ink"
                          : "cursor-not-allowed border-bone/8 text-ash line-through",
                      ].join(" ")}
                      aria-label={available ? `Add size ${size}` : `Size ${size} out of stock`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSizeOpen(true)}
              className="w-full py-4 font-mono text-micro uppercase tracking-[0.18em] text-bone transition-colors duration-300 hover:text-lime-bright"
            >
              Quick add
            </button>
          )}
        </div>
      </div>

      {/* --- Detail --- */}
      <div className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-body-sm font-medium text-bone">
              <Link href={`/product/${product.slug}`} className="link-rule">
                {product.name}
              </Link>
            </h3>
            <p className="mt-1 font-mono text-micro uppercase tracking-[0.12em] text-smoke">
              {product.category}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="numeric text-body-sm text-bone">{formatPrice(product.price, currency)}</p>
            {product.compareAt && (
              <p className="numeric text-micro text-ash line-through">
                {formatPrice(product.compareAt, currency)}
              </p>
            )}
          </div>
        </div>

        {/* Rating */}
        <div className="mt-2 flex items-center gap-1.5">
          <StarMark className="size-3 text-lime-bright" />
          <span className="numeric text-micro text-fog">{product.rating.toFixed(1)}</span>
          <span className="text-micro text-ash">({product.reviewCount.toLocaleString()})</span>
        </div>

        {/* Colourways */}
        {product.variants.length > 1 && (
          <fieldset className="mt-3.5">
            <legend className="sr-only">Colour for {product.name}</legend>
            <div className="flex items-center gap-2">
              {product.variants.map((v, i) => {
                const c = COLORWAYS[v.colorway];
                const active = i === variantIndex;
                return (
                  <button
                    key={v.colorway}
                    type="button"
                    onClick={() => setVariantIndex(i)}
                    aria-pressed={active}
                    aria-label={`View in ${c.name}`}
                    title={c.name}
                    className={[
                      "relative size-4 border transition-all duration-300",
                      active ? "border-bone" : "border-bone/25 hover:border-bone/60",
                    ].join(" ")}
                  >
                    <span
                      aria-hidden
                      className="absolute inset-[2px]"
                      style={{ background: c.hex }}
                    />
                  </button>
                );
              })}
              <span className="ml-1 text-micro text-ash">
                {COLORWAYS[variant.colorway]?.name}
              </span>
            </div>
          </fieldset>
        )}
      </div>
    </article>
  );
}
