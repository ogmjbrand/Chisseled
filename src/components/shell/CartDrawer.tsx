"use client";

import Link from "next/link";
import { useMemo } from "react";
import { COLORWAYS } from "@/lib/art";
import { getBundle, getProduct, getProducts } from "@/lib/catalog";
import { FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useEscape, useFocusTrap, useScrollLock } from "@/lib/motion";
import { Flat } from "@/components/primitives/Visual";
import {
  ArrowMark,
  BagMark,
  CheckMark,
  CloseMark,
  MinusMark,
  PlusMark,
  ReturnMark,
  ShieldMark,
  TruckMark,
} from "@/components/primitives/Marks";

export function CartDrawer() {
  const { cartOpen, setCartOpen, lines, remove, setQty, subtotal, currency, add } = useStore();

  useScrollLock(cartOpen);
  useEscape(cartOpen, () => setCartOpen(false));
  const trapRef = useFocusTrap<HTMLDivElement>(cartOpen);

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  /**
   * "Complete your performance kit" — recommends the accessories and
   * nutrition that pair with what is already in the bag, never something
   * the customer has already added.
   */
  const recommendations = useMemo(() => {
    const inBag = new Set(lines.map((l) => l.slug));
    const KIT = ["carbon-crew-sock", "haul-training-bag", "recover-magnesium", "base-whey-isolate"];

    const fromKit = KIT.filter((s) => !inBag.has(s))
      .map((s) => getProduct(s))
      .filter(Boolean);

    if (fromKit.length >= 3) return fromKit.slice(0, 3);

    // Fall back to the cheapest complements so the slot is never empty.
    return [
      ...fromKit,
      ...getProducts()
        .filter((p) => !inBag.has(p.slug) && !KIT.includes(p.slug))
        .sort((a, b) => a.price - b.price),
    ].slice(0, 3);
  }, [lines]);

  return (
    <>
      {/* Scrim */}
      <div
        aria-hidden
        onClick={() => setCartOpen(false)}
        className={[
          "fixed inset-0 z-[70] bg-void/70 backdrop-blur-sm transition-opacity duration-500",
          cartOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        className={[
          "fixed inset-y-0 right-0 z-[71] flex w-full max-w-[30rem] flex-col border-l border-bone/10 bg-carbon transition-transform duration-[620ms] ease-[var(--ease-out-expo)]",
          cartOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        {...(!cartOpen ? { inert: "" as unknown as boolean } : {})}
      >
        {/* --- Head --- */}
        <div className="flex shrink-0 items-center justify-between border-b border-bone/10 px-6 py-5">
          <h2 className="font-mono text-label uppercase tracking-[0.22em] text-bone">
            Your Bag
            <span className="ml-2 text-smoke">({lines.length})</span>
          </h2>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            className="-mr-2 p-2 text-fog transition-colors hover:text-bone"
            aria-label="Close bag"
          >
            <CloseMark className="size-5" />
          </button>
        </div>

        {/* --- Free shipping progress --- */}
        {lines.length > 0 && (
          <div className="shrink-0 border-b border-bone/10 px-6 py-4">
            <p className="mb-2.5 text-caption text-fog">
              {remaining > 0 ? (
                <>
                  You&apos;re{" "}
                  <span className="numeric font-medium text-bone">
                    {formatPrice(remaining, currency)}
                  </span>{" "}
                  away from free shipping.
                </>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-purple-bright">
                  <CheckMark className="size-4" />
                  Free shipping unlocked.
                </span>
              )}
            </p>
            <div
              className="h-0.5 w-full overflow-hidden bg-bone/10"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progress toward free shipping"
            >
              <div
                className="h-full bg-purple-bright transition-[width] duration-700 ease-[var(--ease-out-expo)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* --- Lines --- */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {lines.length === 0 ? (
            <EmptyBag onClose={() => setCartOpen(false)} />
          ) : (
            <ul className="divide-y divide-bone/10">
              {lines.map((line) => {
                const bundle = line.bundleSlug ? getBundle(line.bundleSlug) : undefined;
                const product = getProduct(line.slug);
                const name = bundle?.name ?? product?.name ?? "Item";
                const unit = bundle?.price ?? product?.price ?? 0;

                return (
                  <li key={line.id} className="flex gap-4 p-5">
                    <div className="relative size-24 shrink-0 overflow-hidden bg-graphite">
                      {product ? (
                        <Flat
                          flat={product.flat}
                          colorway={line.colorway}
                          seed={line.id}
                          className="size-full"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <BagMark className="size-6 text-ash" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={bundle ? `/bundles#${bundle.slug}` : `/product/${line.slug}`}
                            onClick={() => setCartOpen(false)}
                            className="block truncate text-body-sm font-medium text-bone hover:text-purple-bright"
                          >
                            {name}
                          </Link>
                          <p className="mt-1 font-mono text-micro uppercase tracking-[0.12em] text-smoke">
                            {bundle
                              ? `${bundle.items.length} pieces`
                              : `${COLORWAYS[line.colorway]?.name ?? line.colorway} · ${line.size}`}
                          </p>
                        </div>
                        <span className="numeric shrink-0 text-body-sm text-bone">
                          {formatPrice(unit * line.qty, currency)}
                        </span>
                      </div>

                      <div className="mt-3.5 flex items-center justify-between">
                        <div className="flex items-center border border-bone/15">
                          <button
                            type="button"
                            onClick={() => setQty(line.id, line.qty - 1)}
                            className="p-2 text-fog transition-colors hover:text-bone"
                            aria-label={`Decrease quantity of ${name}`}
                          >
                            <MinusMark className="size-3.5" />
                          </button>
                          <span className="numeric w-7 text-center text-caption tabular-nums">
                            {line.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQty(line.id, line.qty + 1)}
                            className="p-2 text-fog transition-colors hover:text-bone"
                            aria-label={`Increase quantity of ${name}`}
                          >
                            <PlusMark className="size-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => remove(line.id)}
                          className="font-mono text-micro uppercase tracking-[0.14em] text-ash transition-colors hover:text-signal-low"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* --- Complete your kit --- */}
          {lines.length > 0 && recommendations.length > 0 && (
            <div className="border-t border-bone/10 p-5">
              <h3 className="eyebrow mb-4">Complete your performance kit</h3>
              <ul className="space-y-3">
                {recommendations.map((p) =>
                  p ? (
                    <li key={p.slug} className="flex items-center gap-3">
                      <div className="size-14 shrink-0 overflow-hidden bg-graphite">
                        <Flat
                          flat={p.flat}
                          colorway={p.variants[0].colorway}
                          seed={`rec-${p.slug}`}
                          className="size-full"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-caption font-medium text-bone">{p.name}</p>
                        <p className="numeric text-micro text-smoke">
                          {formatPrice(p.price, currency)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          add({
                            slug: p.slug,
                            colorway: p.variants[0].colorway,
                            size: p.variants[0].inStock[0] ?? p.sizes[0],
                            qty: 1,
                          })
                        }
                        className="btn btn-ghost btn-sm shrink-0"
                      >
                        Add
                      </button>
                    </li>
                  ) : null,
                )}
              </ul>
            </div>
          )}
        </div>

        {/* --- Foot --- */}
        {lines.length > 0 && (
          <div className="shrink-0 border-t border-bone/10 bg-ink px-6 py-5">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="font-mono text-label uppercase tracking-[0.18em] text-fog">
                Subtotal
              </span>
              <span className="numeric text-h5 font-medium text-bone">
                {formatPrice(subtotal, currency)}
              </span>
            </div>
            <p className="mb-4 text-micro text-ash">
              Taxes and shipping calculated at checkout.
            </p>

            <Link href="/checkout" onClick={() => setCartOpen(false)} className="btn btn-primary btn-block">
              Checkout
              <ArrowMark className="size-4" />
            </Link>

            <ul className="mt-4 flex items-center justify-between text-micro text-ash">
              <li className="inline-flex items-center gap-1.5">
                <ShieldMark className="size-3.5" /> Secure
              </li>
              <li className="inline-flex items-center gap-1.5">
                <TruckMark className="size-3.5" /> Fast delivery
              </li>
              <li className="inline-flex items-center gap-1.5">
                <ReturnMark className="size-3.5" /> 30-day returns
              </li>
            </ul>
          </div>
        )}
      </div>
    </>
  );
}

function EmptyBag({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <BagMark className="mb-5 size-9 text-iron" />
      <p className="display-sm mb-2 text-bone">Your bag is empty.</p>
      <p className="mb-7 max-w-[22rem] text-body-sm text-smoke">
        Start with the pieces the studio builds everything else around.
      </p>
      <div className="flex w-full max-w-[18rem] flex-col gap-2.5">
        <Link href="/shop" onClick={onClose} className="btn btn-primary btn-block">
          Shop the collection
        </Link>
        <Link href="/fit" onClick={onClose} className="btn btn-ghost btn-block">
          Find your fit
        </Link>
      </div>
    </div>
  );
}
