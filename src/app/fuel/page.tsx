import Link from "next/link";
import { getProduct } from "@/lib/catalog";
import { PageHeader } from "@/components/primitives/PageHeader";
import { ProductCard } from "@/components/product/ProductCard";
import { Specimen } from "@/components/primitives/Visual";
import { ProductMedia } from "@/components/product/ProductMedia";
import { JsonLd } from "@/components/primitives/JsonLd";
import { breadcrumbSchema, collectionSchema, pageMetadata } from "@/lib/seo";
import { ArrowMark, CheckMark } from "@/components/primitives/Marks";
import { getProductByHandle } from "@/lib/shopify";
import { enrichProduct } from "@/lib/shopify/mappers";

/**
 * Of this project's local nutrition catalogue (whey-protein,
 * creatine-monohydrate, c4-pre-workout, detox-tea), only these two are also
 * real handles in the connected Shopify store. Listing the other two would
 * link to a product page that 404s and an Add to Bag that fails — the same
 * regression already fixed for bundles/cart-drawer recommendations. Real
 * Shopify price/availability is merged onto the local editorial copy via
 * enrichProduct() so the nutrition-panel content (which Shopify doesn't
 * model) is preserved.
 */
const REAL_NUTRITION_HANDLES = ["creatine-monohydrate", "detox-tea"];

export const metadata = pageMetadata({
  title: "Fuel the Work",
  description:
    "Protein, performance, recovery and daily essentials. Full-disclosure labels, research-matched doses, third-party tested.",
  path: "/fuel",
});

const STANDARDS = [
  {
    title: "Full disclosure, always",
    body: "Every ingredient at its exact dose. No proprietary blends, which exist for one reason: to hide how little of the expensive thing is actually in there.",
  },
  {
    title: "Doses matched to the research",
    body: "If a formula cites a study, it carries the dose that study used. A gram of creatine in a product that references a five-gram trial is not a formulation, it is a reference.",
  },
  {
    title: "Third-party tested, every batch",
    body: "Identity, heavy metals and banned substances. Batch certificates are published, not summarised.",
  },
  {
    title: "Nothing that isn't doing a job",
    body: "No filler bulking the scoop, no ingredient added because it looks good on a label. If we cannot say what it does, it is not in the tub.",
  },
];

export default async function FuelPage() {
  const products = (
    await Promise.all(
      REAL_NUTRITION_HANDLES.map(async (slug) => {
        const local = getProduct(slug);
        if (!local) return null;
        const shopify = await getProductByHandle(slug);
        return enrichProduct(local, shopify);
      }),
    )
  ).filter((p): p is NonNullable<typeof p> => p !== null);
  const hero = products.find((p) => p.slug === "creatine-monohydrate");

  /*
   * Each stack's copy describes a pairing; several of the original items
   * (heavyweight-hoodie-set, chisseled-sling-bag, performance-crew-sock)
   * aren't real Shopify handles, so they're dropped rather than shown as
   * purchasable when they can't be bought. A stack that has no real product
   * left doesn't get rendered at all, rather than showing an empty card.
   */
  const STACKS = [
    {
      title: "The training stack",
      items: ["creatine-monohydrate", "performance-crew-sock"],
      why: "The one supplement the evidence agrees on, and cushioning where the load lands. Both are daily, neither is exciting.",
    },
    {
      title: "The recovery stack",
      items: ["detox-tea", "heavyweight-hoodie-set"],
      why: "A warm evening habit and something to stay warm in. Recovery is mostly the boring hours between sessions.",
    },
    {
      title: "The carry stack",
      items: ["chisseled-sling-bag", "creatine-monohydrate", "performance-crew-sock"],
      why: "What a session actually needs, sized so nothing else fits. Pack it once and stop deciding.",
    },
  ];

  const stacks = (
    await Promise.all(
      STACKS.map(async (stack) => {
        const stackProducts = (
          await Promise.all(
            stack.items.map(async (slug) => {
              const local = getProduct(slug);
              if (!local) return null;
              const shopify = await getProductByHandle(slug);
              return shopify ? enrichProduct(local, shopify) : null;
            }),
          )
        ).filter((p): p is NonNullable<typeof p> => p !== null);
        return { ...stack, products: stackProducts };
      }),
    )
  ).filter((stack) => stack.products.length > 0);

  return (
    <>
      <JsonLd
        data={[
          collectionSchema("Nutrition & Recovery", "/fuel", products),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Perform", path: "/fuel" },
          ]),
        ]}
      />

      <PageHeader
        eyebrow="Nutrition & Recovery"
        title="Fuel the work."
        lede="Every dose declared on the front of the tub. No proprietary blends hiding an under-dosed formula behind a trademark. If it is in there, it is doing a job."
        seed="fuel-header"
        tone="fuel"
        trail={[
          { name: "Home", path: "/" },
          { name: "Perform", path: "/fuel" },
        ]}
      />

      {/* --- Standards --- */}
      <section
        className="border-b border-bone/10 bg-carbon section-pad"
        aria-labelledby="standards-heading"
      >
        <div className="shell">
          <div className="mb-14 max-w-[44rem]">
            <p className="eyebrow mb-5">Our standards</p>
            <h2 id="standards-heading" className="display-lg text-bone" data-reveal>
              Four rules, no exceptions.
            </h2>
          </div>

          <ol className="grid gap-px border border-bone/10 bg-bone/10 sm:grid-cols-2 lg:grid-cols-4">
            {STANDARDS.map((s, i) => (
              <li
                key={s.title}
                className="bg-ink p-7"
                data-reveal
                style={{ "--reveal-delay": `${i * 80}ms` } as React.CSSProperties}
              >
                <p className="numeric mb-6 text-caption text-steel">0{i + 1}</p>
                <h3 className="mb-3.5 font-display text-h6 font-bold uppercase leading-tight tracking-tight text-bone">
                  {s.title}
                </h3>
                <p className="text-body-sm leading-relaxed text-smoke">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* --- Hero product, fully explained --- */}
      {hero?.nutrition && (
        <section
          className="relative grain border-b border-bone/10 bg-ink section-pad"
          aria-labelledby="hero-fuel-heading"
        >
          <Specimen
            seed="fuel-hero-field"
            tone="fuel"
            className="absolute inset-0 size-full opacity-15"
          />
          <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-ink via-ink/92 to-ink" />

          <div className="shell relative z-[3] grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="relative grain aspect-square overflow-hidden bg-graphite" data-reveal-media>
              <ProductMedia
                media={hero.media}
                flat={hero.flat}
                colorway={hero.variants[0].colorway}
                seed="fuel-hero-flat"
                view="front"
                name={hero.name}
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="size-full"
              />
            </div>

            <div>
              <p className="eyebrow mb-5 text-steel">The foundation</p>
              <h2 id="hero-fuel-heading" className="display-md mb-5 text-bone">
                {hero.name}
              </h2>
              <p className="lede mb-9 max-w-[44ch]">{hero.tagline}</p>

              <dl className="mb-9 space-y-6">
                {[
                  ["What it does", hero.nutrition.what],
                  ["When to take it", hero.nutrition.when],
                  ["Who it's for", hero.nutrition.who],
                  ["Why it matters", hero.nutrition.why],
                ].map(([k, v]) => (
                  <div key={k} className="border-l border-steel/35 pl-5">
                    <dt className="eyebrow mb-1.5">{k}</dt>
                    <dd className="text-body-sm leading-relaxed text-smoke">{v}</dd>
                  </div>
                ))}
              </dl>

              <ul className="mb-9 flex flex-wrap gap-x-5 gap-y-2">
                {["Third-party tested", "Full disclosure label", `${hero.nutrition.servings} servings`].map(
                  (t) => (
                    <li
                      key={t}
                      className="inline-flex items-center gap-1.5 font-mono text-micro uppercase tracking-[0.12em] text-smoke"
                    >
                      <CheckMark className="size-3 text-purple-bright" />
                      {t}
                    </li>
                  ),
                )}
              </ul>

              <Link href={`/product/${hero.slug}`} className="btn btn-primary">
                View the full label
                <ArrowMark className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/*
        --- The range ---
        This used to be four category sections (Protein/Performance/Recovery/
        Daily Essentials), each filtering by product category. That grouping
        never actually matched the catalogue's own category values, so every
        section rendered empty regardless of the Shopify-data fix above — a
        pre-existing content/taxonomy bug, not a Shopify staleness issue. At
        the current catalogue size (2 real nutrition products) a four-way
        split has nothing to divide; one honest grid replaces it rather than
        re-inventing categories the products don't actually carry.
      */}
      {products.length > 0 && (
        <section className="border-b border-bone/10 bg-carbon section-pad" aria-labelledby="range-heading">
          <div className="shell">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow mb-4">In stock now</p>
                <h2 id="range-heading" className="display-md text-bone">
                  The current range.
                </h2>
              </div>
              <p className="numeric text-caption text-ash">
                {products.length} {products.length === 1 ? "product" : "products"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
              {products.map((p, i) => (
                <ProductCard key={p.slug} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --- Stack recommendations --- */}
      {stacks.length > 0 && (
      <section className="bg-ink section-pad" aria-labelledby="stacks-heading">
        <div className="shell">
          <div className="mb-14 grid items-end gap-10 lg:grid-cols-[1fr_auto]">
            <div className="max-w-[44rem]">
            <p className="eyebrow mb-5">Recommended combinations</p>
            <h2 id="stacks-heading" className="display-lg mb-5 text-bone">
              What actually pairs.
            </h2>
            <p className="lede">
              These are not upsells. They are the combinations where one product covers what
              another leaves open.
            </p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {stacks.map((stack, i) => (
              <article
                key={stack.title}
                className="border border-bone/10 bg-carbon p-7"
                data-reveal
                style={{ "--reveal-delay": `${i * 100}ms` } as React.CSSProperties}
              >
                <h3 className="display-sm mb-4 text-bone">{stack.title}</h3>
                <p className="mb-7 text-body-sm leading-relaxed text-smoke">{stack.why}</p>

                <ul className="space-y-2.5">
                  {stack.products.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/product/${p.slug}`}
                        className="group flex items-center gap-3 border border-bone/10 p-2.5 transition-colors duration-400 hover:border-bone/30"
                      >
                        <span className="size-11 shrink-0 overflow-hidden bg-graphite">
                          <ProductMedia
                            media={p.media}
                            flat={p.flat}
                            colorway={p.variants[0].colorway}
                            seed={`stack-${p.slug}`}
                            view="front"
                            name={p.name}
                            className="size-full"
                          />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-caption text-bone">
                          {p.name}
                        </span>
                        <ArrowMark className="size-4 shrink-0 -translate-x-1 text-ash opacity-0 transition-all duration-400 group-hover:translate-x-0 group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>
      )}
    </>
  );
}
