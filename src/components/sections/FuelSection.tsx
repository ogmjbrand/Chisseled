import Link from "next/link";
import { SectionBackdrop } from "@/components/primitives/SectionBackdrop";
import { getNutritionProducts } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { Flat, Specimen } from "@/components/primitives/Visual";
import { ArrowMark, CheckMark } from "@/components/primitives/Marks";

const CATEGORIES = [
  { id: "protein", name: "Protein", note: "Close the daily gap." },
  { id: "performance", name: "Performance", note: "Dosed to the research." },
  { id: "recovery", name: "Recovery", note: "The half nobody sells." },
  { id: "daily", name: "Daily Essentials", note: "The unglamorous things." },
];

export function FuelSection() {
  const products = getNutritionProducts();

  return (
    <section
      id="fuel"
      className="relative grain border-t border-bone/10 bg-carbon section-pad"
      aria-labelledby="fuel-heading"
    >
      <SectionBackdrop src="mountain" strength="whisper" position="center 60%" />

      {/* A single steel plane — the one neutral warm-up on the homepage */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] opacity-[0.09]"
        style={{
          background: "radial-gradient(60% 100% at 70% 0%, var(--color-steel), transparent 70%)",
        }}
      />

      <div className="shell relative z-[3]">
        <div className="mb-14 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow mb-5">08 — Nutrition</p>
            <h2 id="fuel-heading" className="display-lg mb-5 text-bone" data-reveal>
              Fuel the work.
            </h2>
            <p
              className="lede max-w-[54ch]"
              data-reveal
              style={{ "--reveal-delay": "90ms" } as React.CSSProperties}
            >
              Every dose declared on the front of the tub. No proprietary blends hiding an
              under-dosed formula behind a trademark. If it is in there, it is doing a job.
            </p>
          </div>

          <Link href="/fuel" className="btn btn-ghost btn-sm justify-self-start lg:justify-self-end">
            Explore nutrition
            <ArrowMark className="size-4" />
          </Link>
        </div>

        {/* Category rail */}
        <ul className="mb-4 grid gap-px border border-bone/10 bg-bone/10 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c, i) => (
            <li key={c.id} className="bg-ink">
              <Link
                href={`/fuel#${c.id}`}
                className="group block p-6 transition-colors duration-500 hover:bg-carbon"
                data-reveal
                style={{ "--reveal-delay": `${i * 70}ms` } as React.CSSProperties}
              >
                <p className="numeric mb-4 text-micro text-steel">0{i + 1}</p>
                <p className="font-display text-h5 font-bold uppercase tracking-tight text-bone">
                  {c.name}
                </p>
                <p className="mt-2 text-body-sm text-smoke">{c.note}</p>
                <ArrowMark className="mt-5 size-4 text-ash transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1.5 group-hover:text-bone" />
              </Link>
            </li>
          ))}
        </ul>

        {/* Product row with education built in */}
        <div className="grid gap-3 lg:grid-cols-2">
          {products.slice(0, 2).map((p, i) => (
            <article
              key={p.slug}
              className="group relative grain overflow-hidden border border-bone/10 bg-ink"
              data-reveal
              style={{ "--reveal-delay": `${i * 110}ms` } as React.CSSProperties}
            >
              <Specimen
                seed={`fuel-${p.slug}`}
                tone={p.tone}
                className="absolute inset-0 size-full opacity-20"
              />
              <span aria-hidden className="absolute inset-0 bg-gradient-to-br from-ink via-ink/90 to-ink/60" />

              <div className="relative z-[3] grid gap-6 p-7 sm:grid-cols-[9rem_1fr] sm:p-8">
                <Link
                  href={`/product/${p.slug}`}
                  className="block overflow-hidden bg-graphite/60"
                  aria-label={p.name}
                >
                  <Flat
                    flat={p.flat}
                    colorway={p.variants[0].colorway}
                    seed={`fuelcard-${p.slug}`}
                    className="size-full transition-transform duration-[1200ms] ease-[var(--ease-out-expo)] group-hover:scale-105"
                  />
                </Link>

                <div>
                  <p className="eyebrow mb-2.5 text-steel">{p.category}</p>
                  <h3 className="display-sm mb-2.5 text-bone">
                    <Link href={`/product/${p.slug}`} className="link-rule">
                      {p.name}
                    </Link>
                  </h3>
                  <p className="mb-5 text-body-sm leading-relaxed text-fog">{p.tagline}</p>

                  {p.nutrition && (
                    <dl className="mb-5 space-y-2.5 border-t border-bone/10 pt-4">
                      {[
                        ["What it does", p.nutrition.what],
                        ["When to take it", p.nutrition.when],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <dt className="eyebrow mb-1">{k}</dt>
                          <dd className="text-body-sm leading-relaxed text-smoke">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  <ul className="mb-5 flex flex-wrap gap-x-4 gap-y-1.5">
                    {["Third-party tested", "Full disclosure label", `${p.nutrition?.servings ?? 30} servings`].map(
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

                  <div className="flex flex-wrap items-center gap-4">
                    <span className="numeric text-h6 text-bone">{formatPrice(p.price)}</span>
                    {p.nutrition && (
                      <span className="badge badge-purple">
                        Subscribe &amp; save {p.nutrition.subscribeDiscount}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
