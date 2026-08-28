import Link from "next/link";
import { SectionBackdrop } from "@/components/primitives/SectionBackdrop";
import { COLLECTIONS, getProductsByCollection } from "@/lib/catalog";
import { Sculpture } from "@/components/primitives/Visual";
import { ArrowMark } from "@/components/primitives/Marks";

/**
 * Not category cards — portals. Each panel is a full editorial composition
 * that transforms on hover, with the product count carried as data so the
 * panel still says something concrete.
 */
export function ShopByCollection() {
  return (
    <section className="relative bg-ink section-pad" aria-labelledby="collections-heading">
      <SectionBackdrop src="trail" strength="quiet" />

      <div className="relative z-[1] shell mb-14 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-5">02 — Navigate</p>
          <h2 id="collections-heading" className="display-lg text-bone" data-reveal>
            Enter your collection.
          </h2>
        </div>
        <Link href="/shop" className="btn btn-ghost btn-sm">
          Shop everything
          <ArrowMark className="size-4" />
        </Link>
      </div>

      <div className="shell grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {COLLECTIONS.map((collection, i) => {
          const count = getProductsByCollection(collection.slug).length;
          // The signature collection anchors the mosaic; five panels then fill
          // a 4x2 grid exactly instead of orphaning the fifth on its own row.
          const feature = i === 0;

          return (
            <Link
              key={collection.slug}
              href={`/shop/${collection.slug}`}
              className={[
                "group relative grain vignette block overflow-hidden bg-carbon",
                feature
                  ? "aspect-[3/4] sm:col-span-2 sm:aspect-[16/10] lg:row-span-2 lg:aspect-auto"
                  : "aspect-[3/4] lg:aspect-[3/4.4]",
              ].join(" ")}
              /* The reticle reads the same hover the panel already responds to. */
              data-reveal
              style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}
            >
              <Sculpture
                seed={`collection-${collection.slug}`}
                tone={collection.tone}
                pose={collection.pose}
                anchor={collection.anchor}
                scale={0.92}
                className="absolute inset-0 size-full transition-transform duration-[1600ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.07]"
              />

              {/* Emerald wash on hover — the portal opening */}
              <span
                aria-hidden
                className="absolute inset-0 z-[2] bg-gradient-to-t from-purple-shade/70 via-transparent to-transparent opacity-0 transition-opacity duration-[900ms] group-hover:opacity-100"
              />
              <span
                aria-hidden
                className="absolute inset-0 z-[2] bg-gradient-to-t from-ink via-ink/25 to-transparent"
              />

              {/*
                Lock-on brackets, from the glowing-icon reference. They sit
                proud of the panel at rest and pull flush to the corners on
                hover, so selecting a collection reads as targeting it. One
                accent only — the reference's five saturated hues would read
                as a logo bar.
              */}
              <span aria-hidden className="pointer-events-none absolute inset-0 z-[4]">
                {[
                  "left-3 top-3 border-l border-t group-hover:left-0 group-hover:top-0",
                  "right-3 top-3 border-r border-t group-hover:right-0 group-hover:top-0",
                  "bottom-3 left-3 border-b border-l group-hover:bottom-0 group-hover:left-0",
                  "bottom-3 right-3 border-b border-r group-hover:bottom-0 group-hover:right-0",
                ].map((pos) => (
                  <span
                    key={pos}
                    className={`absolute size-4 border-bone/25 transition-all duration-[520ms] ease-[var(--ease-out-expo)] group-hover:size-7 group-hover:border-purple-bright ${pos}`}
                  />
                ))}
              </span>

              <div className="relative z-[3] flex h-full flex-col justify-end p-6">
                <p className="eyebrow mb-3 text-purple-bright">
                  {count} {count === 1 ? "piece" : "pieces"}
                </p>

                <h3
                  className={[
                    "mb-3 text-balance text-bone",
                    feature ? "display-lg" : "display-sm",
                  ].join(" ")}
                >
                  {collection.name}
                </h3>

                <p className="mb-4 text-body-sm text-fog">{collection.statement}</p>

                {/* Product lines slide in on hover */}
                <ul className="mb-5 max-h-0 overflow-hidden opacity-0 transition-[max-height,opacity] duration-[700ms] ease-[var(--ease-out-expo)] group-hover:max-h-32 group-hover:opacity-100 group-focus-visible:max-h-32 group-focus-visible:opacity-100">
                  {collection.lines.map((line) => (
                    <li
                      key={line}
                      className="border-t border-bone/12 py-2 font-mono text-micro uppercase tracking-[0.14em] text-fog first:border-t-0"
                    >
                      {line}
                    </li>
                  ))}
                </ul>

                <span className="inline-flex items-center gap-2 font-mono text-label uppercase tracking-[0.18em] text-bone">
                  Enter
                  <ArrowMark className="size-4 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1.5" />
                </span>
              </div>

              {/* Metal edge */}
              <span aria-hidden className="metal-edge-line z-[4] opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
