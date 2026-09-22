"use client";

import Link from "next/link";
import { useState } from "react";
import { COLORWAYS } from "@/lib/art";
import { stockLevel } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store";
import { ProductMedia } from "@/components/product/ProductMedia";
import { CheckMark, StarMark, WishMark } from "@/components/primitives/Marks";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  index?: number;
  feature?: boolean;
}

function getColorInfo(colorway: string) {
  const color = COLORWAYS[colorway as keyof typeof COLORWAYS];

  if (color) {
    return {
      name: color.name,
      hex: color.hex,
    };
  }

  return {
    name: colorway,
    hex: "#888888",
  };
}

export function ProductCard({
  product,
  index = 0,
  feature = false,
}: ProductCardProps) {
  const { add, toggleWishlist, wishlist, currency } = useStore();

  const [variantIndex, setVariantIndex] = useState(0);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [added, setAdded] = useState(false);

  const variant =
    product.variants[variantIndex] ?? product.variants[0];

  const saved = wishlist.includes(product.slug);
  const stock = stockLevel(product);

  if (!variant) {
    return null;
  }

  const quickAdd = (size: string) => {
    add({
      slug: product.slug,
      colorway: variant.colorway,
      size,
      qty: 1,
    });

    setSizeOpen(false);
    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 2000);
  };

  return (
    <article
      className={[
        "group relative min-w-0",
        feature ? "col-span-2" : "",
      ].join(" ")}
    >
      <div className="relative">
        <Link
          href={`/product/${product.slug}`}
          className="block overflow-hidden bg-neutral-100"
        >
          <ProductMedia
            media={product.media}
            flat={product.flat}
            colorway={variant.colorway}
            seed={product.slug}
            name={product.name}
            view="front"
          />
        </Link>

        <button
          type="button"
          aria-label={
            saved
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          onClick={() => toggleWishlist(product.slug)}
          className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 backdrop-blur transition hover:bg-white"
        >
          <WishMark />
        </button>

        {product.badges?.length ? (
          <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1">
            {product.badges.map((badge, badgeIndex) => (
              <span
                key={`${product.slug}-badge-${badgeIndex}-${badge}`}
                className="bg-black px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white"
              >
                {badge}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              href={`/product/${product.slug}`}
              className="block truncate text-sm font-medium transition-opacity hover:opacity-60"
            >
              {product.name}
            </Link>

            <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-neutral-500">
              {product.category}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-sm font-medium">
              {formatPrice(product.price, currency)}
            </p>

            {product.compareAt ? (
              <p className="mt-0.5 text-xs text-neutral-400 line-through">
                {formatPrice(product.compareAt, currency)}
              </p>
            ) : null}
          </div>
        </div>

        {product.rating > 0 ? (
          <div className="mt-2 flex items-center gap-1 text-[11px] text-neutral-500">
            <StarMark />
            <span>{product.rating.toFixed(1)}</span>

            {product.reviewCount > 0 ? (
              <span>({product.reviewCount})</span>
            ) : null}
          </div>
        ) : null}

        {product.variants.length > 0 ? (
          <div className="mt-4 flex items-center gap-2">
            {product.variants.map((v, i) => {
              const c = getColorInfo(v.colorway);
              const active = i === variantIndex;

              return (
                <button
                  key={`${product.slug}-${v.colorway}-${i}`}
                  type="button"
                  onClick={() => setVariantIndex(i)}
                  aria-pressed={active}
                  aria-label={`View in ${c.name}`}
                  title={c.name}
                  className={[
                    "relative size-4 rounded-full border transition-all duration-300",
                    active
                      ? "ring-2 ring-black ring-offset-2"
                      : "hover:scale-110",
                  ].join(" ")}
                  style={{
                    backgroundColor: c.hex,
                  }}
                />
              );
            })}
          </div>
        ) : null}

        {sizeOpen ? (
          <div className="mt-4 grid grid-cols-4 gap-2">
            {product.sizes.map((size) => {
              const available = variant.inStock.includes(size);

              return (
                <button
                  key={`${product.slug}-${variant.colorway}-${size}`}
                  type="button"
                  disabled={!available}
                  onClick={() => quickAdd(size)}
                  className={[
                    "border px-2 py-2 text-[10px] uppercase tracking-[0.12em]",
                    available
                      ? "border-black hover:bg-black hover:text-white"
                      : "cursor-not-allowed border-neutral-200 text-neutral-300",
                  ].join(" ")}
                >
                  {size}
                </button>
              );
            })}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSizeOpen(true)}
            className="mt-4 flex w-full items-center justify-between border-b border-black pb-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
          >
            <span>{added ? "Added to bag" : "Quick add"}</span>

            {added ? <CheckMark /> : <span>+</span>}
          </button>
        )}

        {stock === "out" ? (
          <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-neutral-400">
            Sold out
          </p>
        ) : null}
      </div>
    </article>
  );
}