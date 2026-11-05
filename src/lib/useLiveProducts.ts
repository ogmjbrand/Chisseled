"use client";

import { useEffect, useState } from "react";
import { productsBySlugsAction } from "@/lib/commerce/catalog-actions";
import type { Product } from "@/lib/types";

/** Resolves slugs to live, purchasable products. `null` while loading. */
export function useLiveProducts(slugs: string[]): Product[] | null {
  const key = slugs.join(",");
  const [state, setState] = useState<{ key: string; products: Product[] } | null>(null);
  useEffect(() => {
    let cancelled = false;
    productsBySlugsAction(key ? key.split(",") : [])
      .then((products) => !cancelled && setState({ key, products }))
      .catch(() => !cancelled && setState({ key, products: [] }));
    return () => {
      cancelled = true;
    };
  }, [key]);
  if (!state || state.key !== key) return null;
  // Keep the caller's order (most recent first).
  const bySlug = new Map(state.products.map((p) => [p.slug, p]));
  return slugs.map((s) => bySlug.get(s)).filter((p): p is Product => Boolean(p));
}
