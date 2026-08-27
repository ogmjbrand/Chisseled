"use client";

import Link from "next/link";
import { BUNDLES, getProduct } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Flat } from "@/components/primitives/Visual";
import { ArrowMark, CheckMark } from "@/components/primitives/Marks";

export function Bundles({ heading = true }: { heading?: boolean }) {
  const { add, currency } = useStore();

  return (
    <section
      id="bundles"
      className="border-t border-bone/10 bg-ink section-pad"
      aria-labelledby="bundles-heading"
    >
      <div className="shell">
        {heading && (
          <div className="mb-14 max-w-[52rem]">
            <p className="eyebrow mb-5">09 — Systems</p>
            <h2 id="bundles-heading" className="display-lg mb-5 text-bone" data-reveal>
              Performance bundles.
            </h2>
            <p
              className="lede"
              data-reveal
              style={{ "--reveal-delay": "90ms" } as React.CSSProperties}
            >
              Curated so that everything works with everything else — the compression layers
              under the tee, the recovery formula pairs with the roller, the membership
              sequences all of it. Not a discount on a random pile.
            </p>
          </div>
        )}

        <div className="grid gap-3 lg:grid-cols-3">
          {BUNDLES.slice(0, 3).map((bundle, i) => {
            const items = bundle.items.map(getProduct).filter(Boolean);
            const complete = bundle.tier === "Complete";

            return (
              <article
                key={bundle.slug}
                id={bundle.slug}
                className={[
                  "group relative grain flex flex-col overflow-hidden border p-7 transition-colors duration-700 lg:p-8",
                  complete
                    ? "border-steel/35 bg-gradient-to-b from-steel/[0.07] to-transparent"
                    : "border-bone/10 bg-carbon hover:border-bone/25",
                ].join(" ")}
                data-reveal
                style={{ "--reveal-delay": `${i * 110}ms` } as React.CSSProperties}
              >
                {complete && <span aria-hidden className="metal-edge-line" />}

                <div className="mb-6 flex items-start justify-between gap-4">
                  <span className={complete ? "badge badge-steel" : "badge badge-outline"}>
                    {bundle.tier}
                  </span>
                  <span className="badge badge-lime">
                    Save {formatPrice(bundle.saves, currency)}
                  </span>
                </div>

                <h3 className="display-sm mb-3 text-bone">{bundle.name}</h3>
                <p className="mb-5 text-body-sm font-medium text-lime-bright">{bundle.promise}</p>
                <p className="mb-7 text-body-sm leading-relaxed text-smoke">{bundle.description}</p>

                {/* The pieces, as flats */}
                <ul className="mb-7 flex flex-wrap gap-1.5">
                  {items.map((p) =>
                    p ? (
                      <li key={p.slug} className="size-14 overflow-hidden bg-graphite" title={p.name}>
                        <Flat
                          flat={p.flat}
                          colorway={p.variants[0].colorway}
                          seed={`bundle-${bundle.slug}-${p.slug}`}
                          className="size-full"
                        />
                      </li>
                    ) : null,
                  )}
                </ul>

                <ul className="mb-7 space-y-2 border-t border-bone/10 pt-5">
                  {items.map((p) =>
                    p ? (
                      <li key={p.slug} className="flex items-baseline gap-2 text-body-sm text-fog">
                        <CheckMark className="size-3.5 shrink-0 translate-y-0.5 text-lime" />
                        <span className="min-w-0 flex-1 truncate">{p.name}</span>
                      </li>
                    ) : null,
                  )}
                  {bundle.extras?.map((e) => (
                    <li key={e} className="flex items-baseline gap-2 text-body-sm text-steel">
                      <CheckMark className="size-3.5 shrink-0 translate-y-0.5" />
                      <span className="min-w-0 flex-1">{e}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <div className="mb-5 flex items-baseline gap-3">
                    <span className="numeric text-h4 text-bone">
                      {formatPrice(bundle.price, currency)}
                    </span>
                    <span className="numeric text-body-sm text-ash line-through">
                      {formatPrice(bundle.price + bundle.saves, currency)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      add({
                        slug: bundle.items[0],
                        bundleSlug: bundle.slug,
                        colorway: "onyx",
                        size: "Bundle",
                        qty: 1,
                      })
                    }
                    className={complete ? "btn btn-primary btn-block" : "btn btn-ghost btn-block"}
                  >
                    Add bundle to bag
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {heading && (
          <div className="mt-10 flex justify-center">
            <Link href="/bundles" className="btn btn-ghost btn-sm">
              Compare all bundles
              <ArrowMark className="size-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
