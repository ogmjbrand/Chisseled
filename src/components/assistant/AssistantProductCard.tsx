"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store";
import { ArrowMark, CheckMark } from "@/components/primitives/Marks";
import type { ColorwayKey } from "@/lib/art";
import type { AssistantProduct } from "@/lib/assistant/types";

/**
 * A compact card for inside a chat bubble — the same visual language as
 * ProductCard (image, eyebrow category, name, price) without its hover
 * cross-fade or quick-add popover, which need more room than a message
 * thread gives them. "Add to bag" reuses useStore().add() exactly as
 * ProductCard and addBundle() do — no separate cart path for the assistant.
 */
export function AssistantProductCard({ product }: { product: AssistantProduct }) {
  const { add, currency } = useStore();
  const [state, setState] = useState<"idle" | "adding" | "added">("idle");

  const size = product.inStockSizes[0];

  const handleAdd = async () => {
    if (!size || state !== "idle") return;
    setState("adding");
    await add({
      slug: product.slug,
      colorway: product.colorway as ColorwayKey,
      size,
      qty: 1,
    });
    setState("added");
    window.setTimeout(() => setState("idle"), 2000);
  };

  return (
    <article className="flex gap-3 border border-bone/10 bg-ink p-2.5">
      <Link
        href={`/product/${product.slug}`}
        className="relative size-16 shrink-0 overflow-hidden bg-graphite"
        aria-label={product.name}
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : null}
      </Link>

      <div className="min-w-0 flex-1">
        <p className="font-mono text-micro uppercase tracking-[0.12em] text-smoke">{product.category}</p>
        <Link href={`/product/${product.slug}`} className="link-rule block truncate text-body-sm font-medium text-bone">
          {product.name}
        </Link>
        <p className="numeric mt-0.5 text-caption text-bone">
          {formatPrice(product.priceCents, currency)}
          {product.compareAtCents && (
            <span className="ml-1.5 text-ash line-through">{formatPrice(product.compareAtCents, currency)}</span>
          )}
        </p>

        <div className="mt-2 flex items-center gap-3">
          <Link
            href={`/product/${product.slug}`}
            className="inline-flex items-center gap-1 font-mono text-micro uppercase tracking-[0.12em] text-fog transition-colors hover:text-bone"
          >
            View product
            <ArrowMark className="size-3" />
          </Link>

          {size && (
            <button
              type="button"
              onClick={handleAdd}
              disabled={state !== "idle"}
              className="inline-flex items-center gap-1 font-mono text-micro uppercase tracking-[0.12em] text-purple-bright transition-colors hover:text-bone disabled:opacity-70"
            >
              {state === "added" ? (
                <>
                  <CheckMark className="size-3" /> Added
                </>
              ) : state === "adding" ? (
                "Adding…"
              ) : (
                "Add to bag"
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
