"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { COLORWAYS } from "@/lib/art";
import { stockLevel } from "@/lib/catalog";
import { formatDate, formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Flat, Sculpture } from "@/components/primitives/Visual";
import {
  ArrowMark,
  CheckMark,
  ReturnMark,
  ShieldMark,
  StarMark,
  TruckMark,
  WishMark,
} from "@/components/primitives/Marks";
import type { Product } from "@/lib/types";

const VIEWS = ["front", "detail"] as const;

export function ProductDetail({ product }: { product: Product }) {
  const { add, toggleWishlist, wishlist, currency, markViewed } = useStore();

  const [variantIndex, setVariantIndex] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [view, setView] = useState<(typeof VIEWS)[number]>("front");
  const [sizeError, setSizeError] = useState(false);
  const [subscribe, setSubscribe] = useState(false);
  const [openPanel, setOpenPanel] = useState<string | null>("benefits");

  const variant = product.variants[variantIndex];
  const saved = wishlist.includes(product.slug);
  const stock = stockLevel(product);
  const isNutrition = Boolean(product.nutrition);

  useEffect(() => {
    markViewed(product.slug);
  }, [product.slug, markViewed]);

  // A colourway change can strand a selected size that this colour lacks.
  useEffect(() => {
    if (size && !variant.inStock.includes(size)) setSize(null);
  }, [variant, size]);

  const price = useMemo(() => {
    if (!subscribe || !product.nutrition) return product.price;
    return Math.round(product.price * (1 - product.nutrition.subscribeDiscount / 100));
  }, [subscribe, product]);

  const needsSize = product.sizes.length > 1;

  const addToBag = () => {
    if (needsSize && !size) {
      setSizeError(true);
      document.getElementById("size-selector")?.scrollIntoView({ block: "center" });
      return;
    }
    setSizeError(false);
    add({
      slug: product.slug,
      colorway: variant.colorway,
      size: size ?? product.sizes[0],
      qty: 1,
    });
  };

  return (
    <>
      <div className="shell grid gap-10 pb-16 pt-[calc(var(--nav-h)+2.5rem)] lg:grid-cols-2 lg:gap-16">
        {/* ============ MEDIA ============ */}
        <div className="lg:sticky lg:top-[calc(var(--nav-h)+2rem)] lg:h-fit">
          <div className="relative grain aspect-square overflow-hidden bg-graphite">
            <Flat
              flat={product.flat}
              colorway={variant.colorway}
              seed={`pdp-${product.slug}-${variant.colorway}`}
              view={view}
              className="size-full"
              label={`${product.name} in ${COLORWAYS[variant.colorway]?.name}, ${view} view`}
            />

            <div className="pointer-events-none absolute left-4 top-4 flex flex-col items-start gap-1.5">
              {product.isNew && <span className="badge badge-bone">New</span>}
              {product.badges?.map((b) => (
                <span key={b} className="badge badge-outline bg-ink/60 backdrop-blur-sm">
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Thumbnails — the alternate views and a campaign frame */}
          <div className="mt-3 grid grid-cols-4 gap-3">
            {VIEWS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                aria-label={`View ${v}`}
                className={[
                  "aspect-square overflow-hidden border bg-graphite transition-colors duration-300",
                  view === v ? "border-bone" : "border-transparent hover:border-bone/35",
                ].join(" ")}
              >
                <Flat
                  flat={product.flat}
                  colorway={variant.colorway}
                  seed={`pdp-${product.slug}-${variant.colorway}`}
                  view={v}
                  className="size-full"
                />
              </button>
            ))}

            <div className="col-span-2 overflow-hidden bg-carbon grain">
              <Sculpture
                seed={`pdp-campaign-${product.slug}`}
                tone={product.tone}
                pose="front"
                anchor={0.5}
                scale={0.9}
                className="size-full"
              />
            </div>
          </div>
        </div>

        {/* ============ PURCHASE ============ */}
        <div>
          <p className="eyebrow mb-4">{product.category}</p>

          <h1 className="display-md mb-4 text-bone">{product.name}</h1>

          <p className="lede mb-6 max-w-[46ch]">{product.tagline}</p>

          {/* Rating */}
          <a
            href="#reviews"
            className="mb-7 inline-flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <span className="flex gap-0.5" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <StarMark
                  key={i}
                  className={
                    i < Math.round(product.rating)
                      ? "size-3.5 text-lime-bright"
                      : "size-3.5 text-iron"
                  }
                  filled={i < Math.round(product.rating)}
                />
              ))}
            </span>
            <span className="numeric text-caption text-bone">{product.rating.toFixed(1)}</span>
            <span className="text-caption text-smoke underline decoration-bone/20 underline-offset-4">
              {product.reviewCount.toLocaleString()} reviews
            </span>
          </a>

          {/* Price */}
          <div className="mb-8 flex flex-wrap items-baseline gap-3">
            <span className="numeric text-h4 text-bone">{formatPrice(price, currency)}</span>
            {product.compareAt && (
              <span className="numeric text-body text-ash line-through">
                {formatPrice(product.compareAt, currency)}
              </span>
            )}
            {subscribe && product.nutrition && (
              <span className="badge badge-lime">
                {product.nutrition.subscribeDiscount}% off, every delivery
              </span>
            )}
          </div>

          {/* Subscription — nutrition only */}
          {isNutrition && product.nutrition && (
            <fieldset className="mb-8">
              <legend className="eyebrow mb-3">Purchase type</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { on: false, title: "One time", note: formatPrice(product.price, currency) },
                  {
                    on: true,
                    title: "Subscribe & save",
                    note: `${formatPrice(
                      Math.round(product.price * (1 - product.nutrition.subscribeDiscount / 100)),
                      currency,
                    )} · every 30 days`,
                  },
                ].map((opt) => (
                  <button
                    key={String(opt.on)}
                    type="button"
                    onClick={() => setSubscribe(opt.on)}
                    aria-pressed={subscribe === opt.on}
                    className={[
                      "border p-4 text-left transition-colors duration-400",
                      subscribe === opt.on
                        ? "border-lime bg-lime/8"
                        : "border-bone/15 hover:border-bone/35",
                    ].join(" ")}
                  >
                    <span className="block text-body-sm font-medium text-bone">{opt.title}</span>
                    <span className="numeric mt-1 block text-micro text-smoke">{opt.note}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2.5 text-micro text-ash">
                Skip, pause or cancel any time from your account.
              </p>
            </fieldset>
          )}

          {/* Colourway */}
          {product.variants.length > 1 && (
            <fieldset className="mb-8">
              <legend className="eyebrow mb-3">
                Colour —{" "}
                <span className="text-bone">{COLORWAYS[variant.colorway]?.name}</span>
              </legend>
              <div className="flex flex-wrap gap-2.5">
                {product.variants.map((v, i) => {
                  const c = COLORWAYS[v.colorway];
                  const active = i === variantIndex;
                  const empty = v.inStock.length === 0;
                  return (
                    <button
                      key={v.colorway}
                      type="button"
                      onClick={() => setVariantIndex(i)}
                      aria-pressed={active}
                      title={empty ? `${c.name} — out of stock` : c.name}
                      className={[
                        "relative size-11 border transition-all duration-300",
                        active ? "border-bone" : "border-bone/20 hover:border-bone/55",
                        empty ? "opacity-40" : "",
                      ].join(" ")}
                    >
                      <span aria-hidden className="absolute inset-1" style={{ background: c.hex }} />
                      <span className="sr-only">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* Size */}
          {needsSize && (
            <fieldset id="size-selector" className="mb-8">
              <div className="mb-3 flex items-baseline justify-between">
                <legend className="eyebrow">
                  Size {size && <span className="text-bone">— {size}</span>}
                </legend>
                <a
                  href="#sizing"
                  className="font-mono text-micro uppercase tracking-[0.14em] text-smoke underline decoration-bone/20 underline-offset-4 transition-colors hover:text-bone"
                >
                  Size guide
                </a>
              </div>

              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => {
                  const available = variant.inStock.includes(s);
                  const low = variant.low.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={!available}
                      onClick={() => {
                        setSize(s);
                        setSizeError(false);
                      }}
                      aria-pressed={size === s}
                      className={[
                        "relative min-w-14 border px-4 py-3 font-mono text-caption uppercase tracking-[0.08em] transition-colors duration-300",
                        !available
                          ? "cursor-not-allowed border-bone/8 text-ash line-through"
                          : size === s
                            ? "border-bone bg-bone text-ink"
                            : "border-bone/20 text-bone hover:border-bone/55",
                      ].join(" ")}
                    >
                      {s}
                      {available && low && size !== s && (
                        <span
                          aria-hidden
                          className="absolute -right-0.5 -top-0.5 size-1.5 bg-signal-low"
                        />
                      )}
                      {!available && <span className="sr-only"> — out of stock</span>}
                      {available && low && <span className="sr-only"> — low stock</span>}
                    </button>
                  );
                })}
              </div>

              {sizeError && (
                <p role="alert" className="mt-3 text-caption text-signal-low">
                  Choose a size to continue.
                </p>
              )}

              {size && variant.low.includes(size) && (
                <p className="mt-3 inline-flex items-center gap-2 text-caption text-signal-low">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full bg-signal-low" style={{ animation: "chisseled-pulse-ring 2s ease-out infinite" }} />
                    <span className="relative inline-flex size-2 bg-signal-low" />
                  </span>
                  Low stock in {size} — fewer than 10 left.
                </p>
              )}

              {/* Back-in-stock */}
              {product.sizes.some((s) => !variant.inStock.includes(s)) && (
                <p className="mt-3 text-micro text-ash">
                  Sold out in your size?{" "}
                  <Link href="/account#alerts" className="link-rule text-smoke">
                    Get a back-in-stock alert
                  </Link>
                  .
                </p>
              )}
            </fieldset>
          )}

          {/* CTAs */}
          <div className="mb-6 flex gap-2.5">
            <button type="button" onClick={addToBag} className="btn btn-primary flex-1">
              Add to bag
            </button>
            <button
              type="button"
              onClick={() => toggleWishlist(product.slug)}
              aria-pressed={saved}
              aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
              className={[
                "flex size-[3.4375rem] shrink-0 items-center justify-center border transition-colors duration-400",
                saved
                  ? "border-lime text-lime-bright"
                  : "border-bone/25 text-bone hover:border-bone",
              ].join(" ")}
            >
              <WishMark className="size-5" filled={saved} />
            </button>
          </div>

          <Link href="/checkout" className="btn btn-ghost btn-block mb-7">
            Buy now
            <ArrowMark className="size-4" />
          </Link>

          {/* Assurances */}
          <ul className="mb-9 grid gap-px border border-bone/10 bg-bone/10 sm:grid-cols-3">
            {[
              { icon: TruckMark, title: "Free over ₦120,000", note: "2–5 days in Nigeria" },
              { icon: ReturnMark, title: "30-day returns", note: "Unworn, tags on" },
              { icon: ShieldMark, title: "2-year guarantee", note: "Against defects" },
            ].map((a) => (
              <li key={a.title} className="bg-ink p-4">
                <a.icon className="mb-2.5 size-4 text-lime" />
                <p className="text-caption text-bone">{a.title}</p>
                <p className="mt-0.5 text-micro text-ash">{a.note}</p>
              </li>
            ))}
          </ul>

          {/* Accordions */}
          <div className="border-t border-bone/10">
            <Panel
              id="benefits"
              title={isNutrition ? "Why it matters" : "Performance benefits"}
              open={openPanel === "benefits"}
              onToggle={setOpenPanel}
            >
              <ul className="space-y-5">
                {product.benefits.map((b) => (
                  <li key={b.title} className="flex gap-3">
                    <CheckMark className="mt-1 size-4 shrink-0 text-lime" />
                    <div>
                      <p className="text-body-sm font-medium text-bone">{b.title}</p>
                      <p className="mt-1 text-body-sm leading-relaxed text-smoke">{b.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>

            {product.nutrition && (
              <Panel
                id="nutrition"
                title="What it does, when, and who for"
                open={openPanel === "nutrition"}
                onToggle={setOpenPanel}
              >
                <dl className="space-y-5">
                  {[
                    ["What it does", product.nutrition.what],
                    ["When to take it", product.nutrition.when],
                    ["Who it's for", product.nutrition.who],
                    ["Why it matters", product.nutrition.why],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="eyebrow mb-1.5">{k}</dt>
                      <dd className="text-body-sm leading-relaxed text-smoke">{v}</dd>
                    </div>
                  ))}
                </dl>

                <h3 className="eyebrow mb-3 mt-8">Full disclosure label</h3>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-bone/10">
                      <th scope="col" className="py-2 font-mono text-micro uppercase tracking-[0.12em] text-ash">
                        Ingredient
                      </th>
                      <th scope="col" className="py-2 text-right font-mono text-micro uppercase tracking-[0.12em] text-ash">
                        Per serving
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bone/8">
                    {product.nutrition.ingredients.map((ing) => (
                      <tr key={ing.name}>
                        <td className="py-3">
                          <p className="text-body-sm text-bone">{ing.name}</p>
                          <p className="mt-0.5 text-micro text-ash">{ing.note}</p>
                        </td>
                        <td className="numeric py-3 text-right align-top text-body-sm text-fog">
                          {ing.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
            )}

            <Panel id="story" title="The story" open={openPanel === "story"} onToggle={setOpenPanel}>
              <p className="text-body-sm leading-relaxed text-smoke">{product.story}</p>
            </Panel>

            <Panel
              id="sizing"
              title={isNutrition ? "Format & storage" : "Fit, fabric & care"}
              open={openPanel === "sizing"}
              onToggle={setOpenPanel}
            >
              <dl className="space-y-5">
                {[
                  [isNutrition ? "Format" : "Fabric", product.fabric],
                  [isNutrition ? "Storage" : "Care", product.care],
                  [isNutrition ? "Servings" : "Model & fit", product.modelNote],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="eyebrow mb-1.5">{k}</dt>
                    <dd className="text-body-sm leading-relaxed text-smoke">{v}</dd>
                  </div>
                ))}
              </dl>

              {!isNutrition && <SizeTable sizes={product.sizes} />}
            </Panel>

            <Panel
              id="shipping"
              title="Shipping & returns"
              open={openPanel === "shipping"}
              onToggle={setOpenPanel}
            >
              <dl className="space-y-5">
                {[
                  ["Nigeria", "2–5 working days. Free over ₦120,000, otherwise ₦4,500."],
                  ["International", "5–12 working days to 38 countries. Duties calculated at checkout."],
                  ["Returns", "30 days from delivery, unworn with tags attached. Return shipping is free within Nigeria."],
                  ["Guarantee", "Two years against manufacturing defects. Wear and tear is not a defect, and we will tell you which one we think it is."],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="eyebrow mb-1.5">{k}</dt>
                    <dd className="text-body-sm leading-relaxed text-smoke">{v}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </div>
        </div>
      </div>

      {/* --- Sticky purchase bar --- */}
      <StickyBar
        product={product}
        price={price}
        size={size}
        colorwayName={COLORWAYS[variant.colorway]?.name ?? ""}
        onAdd={addToBag}
        stock={stock}
      />
    </>
  );
}

/* ================================================================== */

function Panel({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: (id: string | null) => void;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="border-b border-bone/10">
      <h2>
        <button
          type="button"
          onClick={() => onToggle(open ? null : id)}
          aria-expanded={open}
          aria-controls={`panel-body-${id}`}
          className="flex w-full items-center justify-between gap-4 py-5 text-left"
        >
          <span className="font-mono text-label uppercase tracking-[0.16em] text-bone">
            {title}
          </span>
          <span
            aria-hidden
            className={[
              "relative size-4 shrink-0 text-smoke transition-transform duration-500 ease-[var(--ease-out-expo)]",
              open ? "rotate-45" : "",
            ].join(" ")}
          >
            <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current" />
            <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current" />
          </span>
        </button>
      </h2>

      <div
        id={`panel-body-${id}`}
        className={[
          "grid transition-[grid-template-rows,opacity] duration-[520ms] ease-[var(--ease-out-expo)]",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        ].join(" ")}
      >
        <div className="overflow-hidden">
          <div className="pb-7">{children}</div>
        </div>
      </div>
    </div>
  );
}

function SizeTable({ sizes }: { sizes: string[] }) {
  // Illustrative measurements; production must publish the real spec sheet.
  const ROWS: Record<string, [string, string, string]> = {
    XS: ["78–83", "60–65", "86–91"],
    S: ["83–88", "65–70", "91–96"],
    M: ["88–96", "70–78", "96–104"],
    L: ["96–104", "78–86", "104–112"],
    XL: ["104–112", "86–94", "112–120"],
    XXL: ["112–120", "94–102", "120–128"],
  };

  const rows = sizes.filter((s) => s in ROWS);
  if (rows.length === 0) return null;

  return (
    <div className="mt-8 overflow-x-auto">
      <h3 className="eyebrow mb-3">Measurements (cm)</h3>
      <table className="w-full min-w-[24rem] text-left">
        <thead>
          <tr className="border-b border-bone/10">
            {["Size", "Chest", "Waist", "Hip"].map((h) => (
              <th
                key={h}
                scope="col"
                className="py-2 font-mono text-micro uppercase tracking-[0.12em] text-ash"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-bone/8">
          {rows.map((s) => (
            <tr key={s}>
              <th scope="row" className="py-2.5 font-mono text-caption text-bone">
                {s}
              </th>
              {ROWS[s].map((v, i) => (
                <td key={i} className="numeric py-2.5 text-caption text-smoke">
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-micro text-ash">
        Between sizes? Compression and sculpt fits run close — take the larger size for comfort,
        the smaller for hold.
      </p>
    </div>
  );
}

/** Appears once the primary CTA has scrolled away. */
function StickyBar({
  product,
  price,
  size,
  colorwayName,
  onAdd,
  stock,
}: {
  product: Product;
  price: number;
  size: string | null;
  colorwayName: string;
  onAdd: () => void;
  stock: "in" | "low" | "out";
}) {
  const [visible, setVisible] = useState(false);
  const { currency } = useStore();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 640);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={[
        "fixed inset-x-0 bottom-0 z-40 border-t border-bone/10 bg-ink/95 backdrop-blur-xl transition-transform duration-[520ms] ease-[var(--ease-out-expo)]",
        visible ? "translate-y-0" : "translate-y-full",
      ].join(" ")}
    >
      <div className="shell flex items-center justify-between gap-4 py-3.5">
        <div className="hidden min-w-0 items-center gap-3.5 sm:flex">
          <div className="size-12 shrink-0 overflow-hidden bg-graphite">
            <Flat
              flat={product.flat}
              colorway={product.variants[0].colorway}
              seed={`sticky-${product.slug}`}
              className="size-full"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-caption font-medium text-bone">{product.name}</p>
            <p className="truncate font-mono text-micro uppercase tracking-[0.12em] text-smoke">
              {colorwayName}
              {size ? ` · ${size}` : ""}
              {stock === "low" ? " · Low stock" : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-4 sm:flex-none">
          <span className="numeric text-body-sm text-bone">{formatPrice(price, currency)}</span>
          <button type="button" onClick={onAdd} className="btn btn-primary btn-sm">
            Add to bag
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */

export function ReviewList({ product }: { product: Product }) {
  const [shown, setShown] = useState(3);
  const distribution = [78, 16, 4, 1, 1];

  return (
    <section id="reviews" className="border-t border-bone/10 bg-carbon section-pad">
      <div className="shell">
        <div className="mb-12 grid gap-10 lg:grid-cols-[20rem_1fr] lg:gap-20">
          {/* Summary */}
          <div>
            <p className="eyebrow mb-5">Reviews</p>
            <p className="numeric mb-2 text-mega leading-none text-bone">
              {product.rating.toFixed(1)}
            </p>
            <div className="mb-2 flex gap-0.5" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <StarMark
                  key={i}
                  className={
                    i < Math.round(product.rating)
                      ? "size-4 text-lime-bright"
                      : "size-4 text-iron"
                  }
                  filled={i < Math.round(product.rating)}
                />
              ))}
            </div>
            <p className="mb-8 text-caption text-smoke">
              Based on {product.reviewCount.toLocaleString()} verified purchases
            </p>

            <ul className="space-y-2">
              {distribution.map((pct, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="numeric w-3 text-micro text-ash">{5 - i}</span>
                  <span className="h-1 flex-1 overflow-hidden bg-bone/10">
                    <span
                      className="block h-full bg-lime/70"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="numeric w-8 text-right text-micro text-ash">{pct}%</span>
                </li>
              ))}
            </ul>
          </div>

          {/* The reviews themselves */}
          <div>
            <ul className="divide-y divide-bone/10">
              {product.reviews.slice(0, shown).map((r) => (
                <li key={r.id} className="py-7 first:pt-0">
                  <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="flex gap-0.5" aria-label={`${r.rating} out of 5`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarMark
                          key={i}
                          className={i < r.rating ? "size-3.5 text-lime-bright" : "size-3.5 text-iron"}
                          filled={i < r.rating}
                        />
                      ))}
                    </span>
                    {r.verified && (
                      <span className="inline-flex items-center gap-1.5 font-mono text-micro uppercase tracking-[0.12em] text-lime">
                        <CheckMark className="size-3" />
                        Verified purchase
                      </span>
                    )}
                    <span className="numeric text-micro text-ash">{formatDate(r.date)}</span>
                  </div>

                  <h3 className="mb-2 text-body-sm font-medium text-bone">{r.title}</h3>
                  <p className="mb-4 text-body-sm leading-relaxed text-smoke">{r.body}</p>

                  <dl className="flex flex-wrap gap-x-8 gap-y-2">
                    <div className="flex gap-2">
                      <dt className="text-micro text-ash">By</dt>
                      <dd className="text-micro text-fog">{r.author}</dd>
                    </div>
                    {r.fitNote && (
                      <div className="flex gap-2">
                        <dt className="text-micro text-ash">Fit</dt>
                        <dd className="text-micro text-fog">{r.fitNote}</dd>
                      </div>
                    )}
                    {r.height && (
                      <div className="flex gap-2">
                        <dt className="text-micro text-ash">Height</dt>
                        <dd className="text-micro text-fog">{r.height}</dd>
                      </div>
                    )}
                    {r.sizeWorn && (
                      <div className="flex gap-2">
                        <dt className="text-micro text-ash">Size worn</dt>
                        <dd className="text-micro text-fog">{r.sizeWorn}</dd>
                      </div>
                    )}
                  </dl>
                </li>
              ))}
            </ul>

            {shown < product.reviews.length && (
              <button
                type="button"
                onClick={() => setShown(product.reviews.length)}
                className="btn btn-ghost btn-sm mt-8"
              >
                Show all reviews
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
