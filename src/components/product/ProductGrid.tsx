"use client";

import { useMemo, useState } from "react";
import { COLORWAYS } from "@/lib/art";
import { ProductCard } from "@/components/product/ProductCard";
import { CloseMark } from "@/components/primitives/Marks";
import type { Activity, Fit, Product } from "@/lib/types";

/**
 * The filtering surface. Everything is derived from the products actually
 * present, so a collection never offers a filter that would return nothing.
 */

type SortKey = "featured" | "price-asc" | "price-desc" | "rating" | "new";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "new", label: "Newest" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "rating", label: "Top rated" },
];

const ACTIVITY_LABELS: Record<Activity, string> = {
  lifting: "Lifting",
  running: "Running",
  training: "Training",
  yoga: "Yoga",
  recovery: "Recovery",
  everyday: "Everyday",
};

const FIT_LABELS: Record<Fit, string> = {
  compression: "Compression",
  sculpt: "Sculpt",
  regular: "Regular",
  relaxed: "Relaxed",
  oversized: "Oversized",
};

interface Filters {
  category: string[];
  size: string[];
  colorway: string[];
  activity: Activity[];
  fit: Fit[];
  maxPrice: number | null;
}

const EMPTY: Filters = {
  category: [],
  size: [],
  colorway: [],
  activity: [],
  fit: [],
  maxPrice: null,
};

export function ProductGrid({
  products,
  initialCategory,
}: {
  products: Product[];
  initialCategory?: string;
}) {
  const [filters, setFilters] = useState<Filters>(() =>
    initialCategory ? { ...EMPTY, category: [initialCategory] } : EMPTY,
  );
  const [sort, setSort] = useState<SortKey>("featured");
  const [panelOpen, setPanelOpen] = useState(false);

  // Facets are computed from the collection, never hard-coded.
  const facets = useMemo(() => {
    const categories = [...new Set(products.map((p) => p.category))].sort();
    const sizes = [...new Set(products.flatMap((p) => p.sizes))];
    const colorways = [...new Set(products.flatMap((p) => p.variants.map((v) => v.colorway)))];
    const activities = [...new Set(products.flatMap((p) => p.activities))];
    const fits = [...new Set(products.map((p) => p.fit))];
    const prices = products.map((p) => p.price);

    return {
      categories,
      sizes,
      colorways,
      activities,
      fits,
      min: Math.min(...prices, 0),
      max: Math.max(...prices, 0),
    };
  }, [products]);

  const filtered = useMemo(() => {
    const out = products.filter((p) => {
      if (filters.category.length && !filters.category.includes(p.category)) return false;
      if (filters.activity.length && !p.activities.some((a) => filters.activity.includes(a)))
        return false;
      if (filters.fit.length && !filters.fit.includes(p.fit)) return false;
      if (filters.maxPrice !== null && p.price > filters.maxPrice) return false;

      if (filters.size.length) {
        const available = new Set(p.variants.flatMap((v) => v.inStock));
        if (!filters.size.some((s) => available.has(s))) return false;
      }

      if (filters.colorway.length) {
        const ways = p.variants.map((v) => v.colorway as string);
        if (!filters.colorway.some((c) => ways.includes(c))) return false;
      }

      return true;
    });

    switch (sort) {
      case "price-asc":
        return [...out].sort((a, b) => a.price - b.price);
      case "price-desc":
        return [...out].sort((a, b) => b.price - a.price);
      case "rating":
        return [...out].sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
      case "new":
        return [...out].sort((a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false));
      default:
        return out;
    }
  }, [products, filters, sort]);

  const activeCount =
    filters.category.length +
    filters.size.length +
    filters.colorway.length +
    filters.activity.length +
    filters.fit.length +
    (filters.maxPrice !== null ? 1 : 0);

  const toggle = <K extends keyof Filters>(key: K, value: string) => {
    setFilters((f) => {
      const list = f[key] as string[];
      return {
        ...f,
        [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      } as Filters;
    });
  };

  return (
    <div>
      {/* --- Control bar --- */}
      <div className="sticky top-[var(--nav-h)] z-30 -mx-[var(--gutter)] mb-10 border-y border-bone/10 bg-ink/92 px-[var(--gutter)] py-3.5 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setPanelOpen((o) => !o)}
            aria-expanded={panelOpen}
            aria-controls="filter-panel"
            className="inline-flex items-center gap-2.5 font-mono text-label uppercase tracking-[0.18em] text-bone"
          >
            Filter
            {activeCount > 0 && (
              <span className="flex size-5 items-center justify-center bg-emerald text-[0.625rem] text-ink">
                {activeCount}
              </span>
            )}
          </button>

          <p className="numeric hidden text-caption text-smoke sm:block" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
          </p>

          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="hidden font-mono text-label uppercase tracking-[0.18em] text-smoke sm:block">
              Sort
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="border border-bone/15 bg-transparent px-3 py-2 font-mono text-micro uppercase tracking-[0.12em] text-fog transition-colors hover:border-bone/35 focus:border-emerald focus:outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key} className="bg-ink">
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active chips */}
        {activeCount > 0 && (
          <ul className="mt-3 flex flex-wrap items-center gap-1.5">
            {[
              ...filters.category.map((v) => ["category", v] as const),
              ...filters.size.map((v) => ["size", v] as const),
              ...filters.colorway.map((v) => ["colorway", v] as const),
              ...filters.activity.map((v) => ["activity", v] as const),
              ...filters.fit.map((v) => ["fit", v] as const),
            ].map(([key, value]) => (
              <li key={`${key}-${value}`}>
                <button
                  type="button"
                  onClick={() => toggle(key as keyof Filters, value)}
                  className="inline-flex items-center gap-1.5 border border-bone/20 px-2.5 py-1.5 font-mono text-micro uppercase tracking-[0.12em] text-fog transition-colors hover:border-bone/45 hover:text-bone"
                >
                  {key === "colorway"
                    ? COLORWAYS[value]?.name ?? value
                    : key === "activity"
                      ? ACTIVITY_LABELS[value as Activity]
                      : key === "fit"
                        ? FIT_LABELS[value as Fit]
                        : value}
                  <CloseMark className="size-3" />
                  <span className="sr-only">Remove filter</span>
                </button>
              </li>
            ))}
            {filters.maxPrice !== null && (
              <li>
                <button
                  type="button"
                  onClick={() => setFilters((f) => ({ ...f, maxPrice: null }))}
                  className="inline-flex items-center gap-1.5 border border-bone/20 px-2.5 py-1.5 font-mono text-micro uppercase tracking-[0.12em] text-fog"
                >
                  Under ₦{filters.maxPrice.toLocaleString()}
                  <CloseMark className="size-3" />
                </button>
              </li>
            )}
            <li>
              <button
                type="button"
                onClick={() => setFilters(EMPTY)}
                className="px-2 py-1.5 font-mono text-micro uppercase tracking-[0.12em] text-ash transition-colors hover:text-signal-low"
              >
                Clear all
              </button>
            </li>
          </ul>
        )}
      </div>

      {/* --- Filter panel --- */}
      <div
        id="filter-panel"
        className={[
          "grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-[600ms] ease-[var(--ease-out-expo)]",
          panelOpen ? "mb-12 grid-rows-[1fr] opacity-100" : "mb-0 grid-rows-[0fr] opacity-0",
        ].join(" ")}
      >
        <div className="min-h-0">
          <div className="grid gap-8 border border-bone/10 bg-carbon p-6 sm:grid-cols-2 lg:grid-cols-5 lg:p-8">
            <FacetGroup title="Category">
              {facets.categories.map((c) => (
                <Check
                  key={c}
                  label={c}
                  checked={filters.category.includes(c)}
                  onChange={() => toggle("category", c)}
                />
              ))}
            </FacetGroup>

            <FacetGroup title="Size">
              <div className="flex flex-wrap gap-1.5">
                {facets.sizes.map((s) => {
                  const on = filters.size.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggle("size", s)}
                      aria-pressed={on}
                      className={[
                        "min-w-10 border px-2.5 py-2 font-mono text-micro uppercase tracking-[0.08em] transition-colors duration-300",
                        on
                          ? "border-bone bg-bone text-ink"
                          : "border-bone/20 text-fog hover:border-bone/50 hover:text-bone",
                      ].join(" ")}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </FacetGroup>

            <FacetGroup title="Colour">
              <div className="flex flex-wrap gap-2">
                {facets.colorways.map((c) => {
                  const on = filters.colorway.includes(c);
                  const swatch = COLORWAYS[c];
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggle("colorway", c)}
                      aria-pressed={on}
                      title={swatch?.name}
                      className={[
                        "relative size-7 border transition-all duration-300",
                        on ? "border-bone" : "border-bone/20 hover:border-bone/55",
                      ].join(" ")}
                    >
                      <span
                        aria-hidden
                        className="absolute inset-[3px]"
                        style={{ background: swatch?.hex }}
                      />
                      <span className="sr-only">{swatch?.name}</span>
                    </button>
                  );
                })}
              </div>
            </FacetGroup>

            <FacetGroup title="Activity">
              {facets.activities.map((a) => (
                <Check
                  key={a}
                  label={ACTIVITY_LABELS[a]}
                  checked={filters.activity.includes(a)}
                  onChange={() => toggle("activity", a)}
                />
              ))}
            </FacetGroup>

            <FacetGroup title="Fit">
              {facets.fits.map((f) => (
                <Check
                  key={f}
                  label={FIT_LABELS[f]}
                  checked={filters.fit.includes(f)}
                  onChange={() => toggle("fit", f)}
                />
              ))}

              <div className="mt-5">
                <label htmlFor="price" className="eyebrow mb-3 block">
                  Max price
                </label>
                <input
                  id="price"
                  type="range"
                  min={facets.min}
                  max={facets.max}
                  step={2000}
                  value={filters.maxPrice ?? facets.max}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, maxPrice: Number(e.target.value) }))
                  }
                  className="w-full accent-[var(--color-emerald)]"
                />
                <p className="numeric mt-2 text-micro text-smoke">
                  Up to ₦{(filters.maxPrice ?? facets.max).toLocaleString()}
                </p>
              </div>
            </FacetGroup>
          </div>
        </div>
      </div>

      {/* --- Grid --- */}
      {filtered.length === 0 ? (
        <div className="border border-bone/10 bg-carbon px-8 py-20 text-center">
          <p className="display-sm mb-3 text-bone">Nothing matches those filters.</p>
          <p className="mb-7 text-body-sm text-smoke">
            Loosen one and the collection will come back.
          </p>
          <button type="button" onClick={() => setFilters(EMPTY)} className="btn btn-ghost btn-sm">
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
          {filtered.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */

function FacetGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="eyebrow mb-4">{title}</legend>
      <div className="space-y-2.5">{children}</div>
    </fieldset>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-body-sm text-fog transition-colors hover:text-bone">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-4 shrink-0 appearance-none border border-bone/25 transition-colors duration-300 checked:border-emerald checked:bg-emerald focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-bright"
      />
      {label}
    </label>
  );
}
