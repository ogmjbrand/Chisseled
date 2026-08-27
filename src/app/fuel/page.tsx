import Link from "next/link";
import { getNutritionProducts, getProduct } from "@/lib/catalog";
import { PageHeader } from "@/components/primitives/PageHeader";
import { ProductCard } from "@/components/product/ProductCard";
import { Flat, Specimen } from "@/components/primitives/Visual";
import { JsonLd } from "@/components/primitives/JsonLd";
import { breadcrumbSchema, collectionSchema, pageMetadata } from "@/lib/seo";
import { ArrowMark, CheckMark } from "@/components/primitives/Marks";

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

const SECTIONS = [
  { id: "protein", category: "Protein", title: "Close the daily gap.", tone: "fuel" as const },
  { id: "performance", category: "Performance", title: "Dosed to the research.", tone: "train" as const },
  { id: "recovery", category: "Recovery", title: "The half nobody sells.", tone: "recover" as const },
  { id: "daily", category: "Daily Essentials", title: "The unglamorous things.", tone: "void" as const },
];

export default function FuelPage() {
  const products = getNutritionProducts();
  const hero = getProduct("creatine-monohydrate");

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
              <Flat
                flat={hero.flat}
                colorway={hero.variants[0].colorway}
                seed="fuel-hero-flat"
                className="size-full"
                label={hero.name}
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

      {/* --- Category sections --- */}
      {SECTIONS.map((section, si) => {
        const items = products.filter((p) => p.category === section.category);
        if (items.length === 0) return null;

        return (
          <section
            key={section.id}
            id={section.id}
            className={[
              "border-b border-bone/10 section-pad",
              si % 2 === 0 ? "bg-carbon" : "bg-ink",
            ].join(" ")}
            aria-labelledby={`${section.id}-heading`}
          >
            <div className="shell">
              <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
                <div>
                  <p className="eyebrow mb-4">{section.category}</p>
                  <h2 id={`${section.id}-heading`} className="display-md text-bone">
                    {section.title}
                  </h2>
                </div>
                <p className="numeric text-caption text-ash">
                  {items.length} {items.length === 1 ? "product" : "products"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
                {items.map((p, i) => (
                  <ProductCard key={p.slug} product={p} index={i} />
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* --- Stack recommendations --- */}
      <section className="bg-ink section-pad" aria-labelledby="stacks-heading">
        <div className="shell">
          <div className="mb-14 max-w-[44rem]">
            <p className="eyebrow mb-5">Recommended combinations</p>
            <h2 id="stacks-heading" className="display-lg mb-5 text-bone">
              What actually pairs.
            </h2>
            <p className="lede">
              These are not upsells. They are the combinations where one product covers what
              another leaves open.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {[
              {
                title: "The training stack",
                items: ["drive-pre-training", "base-whey-isolate"],
                why: "Output before the session, material to rebuild with after it. The two ends of the same workout.",
              },
              {
                title: "The recovery stack",
                items: ["recover-magnesium", "recovery-roller"],
                why: "Sleep quality and tissue quality. Between them they cover most of what makes tomorrow's session possible.",
              },
              {
                title: "The everything stack",
                items: ["daily-foundation", "base-whey-isolate", "recover-magnesium"],
                why: "Baseline nutrients, daily protein, and the night formula. Nothing acute, everything cumulative.",
              },
            ].map((stack, i) => (
              <article
                key={stack.title}
                className="border border-bone/10 bg-carbon p-7"
                data-reveal
                style={{ "--reveal-delay": `${i * 100}ms` } as React.CSSProperties}
              >
                <h3 className="display-sm mb-4 text-bone">{stack.title}</h3>
                <p className="mb-7 text-body-sm leading-relaxed text-smoke">{stack.why}</p>

                <ul className="space-y-2.5">
                  {stack.items.map((slug) => {
                    const p = getProduct(slug);
                    if (!p) return null;
                    return (
                      <li key={slug}>
                        <Link
                          href={`/product/${slug}`}
                          className="group flex items-center gap-3 border border-bone/10 p-2.5 transition-colors duration-400 hover:border-bone/30"
                        >
                          <span className="size-11 shrink-0 overflow-hidden bg-graphite">
                            <Flat
                              flat={p.flat}
                              colorway={p.variants[0].colorway}
                              seed={`stack-${slug}`}
                              className="size-full"
                            />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-caption text-bone">
                            {p.name}
                          </span>
                          <ArrowMark className="size-4 shrink-0 -translate-x-1 text-ash opacity-0 transition-all duration-400 group-hover:translate-x-0 group-hover:opacity-100" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
