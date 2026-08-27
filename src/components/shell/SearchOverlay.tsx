"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useEffect } from "react";
import { ARTICLES, PROGRAMS, PRODUCTS, WORLDS } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useEscape, useFocusTrap, useScrollLock } from "@/lib/motion";
import { Flat } from "@/components/primitives/Visual";
import { ArrowMark, CloseMark, SearchMark } from "@/components/primitives/Marks";

type Result =
  | { kind: "product"; slug: string; title: string; meta: string; href: string; price: number }
  | { kind: "collection" | "programme" | "article"; slug: string; title: string; meta: string; href: string };

const SUGGESTED = ["Leggings", "Compression", "Protein", "Sports bra", "Recovery", "Bundles"];

export function SearchOverlay() {
  const { searchOpen, setSearchOpen, currency } = useStore();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useScrollLock(searchOpen);
  useEscape(searchOpen, () => setSearchOpen(false));
  const trapRef = useFocusTrap<HTMLDivElement>(searchOpen);

  useEffect(() => {
    if (!searchOpen) {
      setQuery("");
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [searchOpen]);

  // Global ⌘K / Ctrl-K — the shortcut people already expect.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen]);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const match = (...fields: string[]) =>
      fields.some((f) => f.toLowerCase().includes(q));

    const products: Result[] = PRODUCTS.filter((p) =>
      match(p.name, p.category, p.tagline, p.world, ...p.activities),
    )
      .slice(0, 5)
      .map((p) => ({
        kind: "product",
        slug: p.slug,
        title: p.name,
        meta: p.category,
        href: `/product/${p.slug}`,
        price: p.price,
      }));

    const collections: Result[] = WORLDS.filter((w) => match(w.name, ...w.lines))
      .slice(0, 2)
      .map((w) => ({
        kind: "collection",
        slug: w.slug,
        title: w.name,
        meta: "Collection",
        href: `/shop/${w.slug}`,
      }));

    const programmes: Result[] = PROGRAMS.filter((p) =>
      match(p.name, p.discipline, p.focus, p.level),
    )
      .slice(0, 3)
      .map((p) => ({
        kind: "programme",
        slug: p.slug,
        title: p.name,
        meta: `${p.discipline} · ${p.weeks} weeks`,
        href: `/train#${p.slug}`,
      }));

    const articles: Result[] = ARTICLES.filter((a) => match(a.title, a.category, a.excerpt))
      .slice(0, 3)
      .map((a) => ({
        kind: "article",
        slug: a.slug,
        title: a.title,
        meta: `Journal · ${a.category}`,
        href: `/journal/${a.slug}`,
      }));

    return [...products, ...collections, ...programmes, ...articles];
  }, [query]);

  const grouped = useMemo(() => {
    return {
      product: results.filter((r) => r.kind === "product"),
      collection: results.filter((r) => r.kind === "collection"),
      programme: results.filter((r) => r.kind === "programme"),
      article: results.filter((r) => r.kind === "article"),
    };
  }, [results]);

  return (
    <>
      <div
        aria-hidden
        onClick={() => setSearchOpen(false)}
        className={[
          "fixed inset-0 z-[80] bg-void/80 backdrop-blur-md transition-opacity duration-400",
          searchOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className={[
          "fixed inset-x-0 top-0 z-[81] border-b border-bone/10 bg-ink transition-transform duration-[560ms] ease-[var(--ease-out-expo)]",
          searchOpen ? "translate-y-0" : "-translate-y-full",
        ].join(" ")}
        {...(!searchOpen ? { inert: "" as unknown as boolean } : {})}
      >
        <div className="shell py-6">
          {/* --- Input --- */}
          <div className="flex items-center gap-4 border-b border-bone/15 pb-5">
            <SearchMark className="size-5 shrink-0 text-smoke" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, programmes, journal…"
              aria-label="Search CHISSELED"
              className="w-full bg-transparent text-h5 font-light text-bone outline-none placeholder:text-ash"
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="shrink-0 p-2 text-fog transition-colors hover:text-bone"
              aria-label="Close search"
            >
              <CloseMark className="size-5" />
            </button>
          </div>

          {/* --- Results --- */}
          <div className="max-h-[62vh] overflow-y-auto overscroll-contain pt-6">
            {query.trim().length < 2 ? (
              <div>
                <h2 className="eyebrow mb-4">Popular</h2>
                <ul className="flex flex-wrap gap-2">
                  {SUGGESTED.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => setQuery(s)}
                        className="border border-bone/15 px-4 py-2 font-mono text-micro uppercase tracking-[0.14em] text-fog transition-colors duration-300 hover:border-bone/40 hover:text-bone"
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : results.length === 0 ? (
              <p className="py-8 text-body-sm text-smoke">
                Nothing matched <span className="text-bone">“{query}”</span>. Try a category, a
                fabric, or the thing you train for.
              </p>
            ) : (
              <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
                {/* Products */}
                {grouped.product.length > 0 && (
                  <div>
                    <h2 className="eyebrow mb-4">Products</h2>
                    <ul className="space-y-1">
                      {grouped.product.map((r) => {
                        const p = PRODUCTS.find((x) => x.slug === r.slug)!;
                        return (
                          <li key={r.slug}>
                            <Link
                              href={r.href}
                              onClick={() => setSearchOpen(false)}
                              className="group flex items-center gap-4 p-2 transition-colors duration-300 hover:bg-bone/5"
                            >
                              <div className="size-14 shrink-0 overflow-hidden bg-graphite">
                                <Flat
                                  flat={p.flat}
                                  colorway={p.variants[0].colorway}
                                  seed={`search-${p.slug}`}
                                  className="size-full"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-body-sm text-bone">{r.title}</p>
                                <p className="font-mono text-micro uppercase tracking-[0.12em] text-smoke">
                                  {r.meta}
                                </p>
                              </div>
                              <span className="numeric shrink-0 text-caption text-fog">
                                {"price" in r ? formatPrice(r.price, currency) : null}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Everything else */}
                <div className="space-y-7">
                  {(["collection", "programme", "article"] as const).map((kind) =>
                    grouped[kind].length > 0 ? (
                      <div key={kind}>
                        <h2 className="eyebrow mb-3">
                          {kind === "collection"
                            ? "Collections"
                            : kind === "programme"
                              ? "Training"
                              : "Journal"}
                        </h2>
                        <ul className="space-y-2">
                          {grouped[kind].map((r) => (
                            <li key={r.slug}>
                              <Link
                                href={r.href}
                                onClick={() => setSearchOpen(false)}
                                className="group flex items-baseline justify-between gap-4 py-1.5"
                              >
                                <span className="text-body-sm text-fog transition-colors group-hover:text-bone">
                                  {r.title}
                                </span>
                                <ArrowMark className="size-4 shrink-0 -translate-x-1 text-ash opacity-0 transition-all duration-400 group-hover:translate-x-0 group-hover:opacity-100" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null,
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
