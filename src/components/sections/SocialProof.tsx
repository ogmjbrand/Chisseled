import Link from "next/link";
import { ATHLETES, PRODUCTS } from "@/lib/catalog";
import { Sculpture } from "@/components/primitives/Visual";
import { ArrowMark, StarMark } from "@/components/primitives/Marks";

/**
 * A transformation wall rather than a testimonial carousel: measurable
 * numbers, named people, and real review text pulled from the catalogue.
 *
 * PRODUCTION NOTE: the headline figures below must be replaced with
 * verified values from the analytics and review platforms before launch.
 */

const FIGURES = [
  { value: "50,000+", label: "Athletes training" },
  { value: "4.9 / 5", label: "Customer rating" },
  { value: "100,000+", label: "Sessions logged" },
  { value: "38", label: "Countries shipped" },
];

export function SocialProof() {
  // Pull the strongest review from across the catalogue.
  const quotes = PRODUCTS.slice(0, 8)
    .flatMap((p) => p.reviews.slice(0, 1).map((r) => ({ ...r, product: p.name, slug: p.slug })))
    .slice(0, 5);

  return (
    <section
      className="relative grain border-t border-bone/10 bg-carbon section-pad"
      aria-labelledby="proof-heading"
    >
      <div className="shell relative z-[3]">
        <div className="mb-14 max-w-[46rem]">
          <p className="eyebrow mb-5">10 — Proof</p>
          <h2 id="proof-heading" className="display-lg text-bone" data-reveal>
            Built by people who do the work.
          </h2>
        </div>

        {/* Figures */}
        <ul className="mb-4 grid gap-px border border-bone/10 bg-bone/10 sm:grid-cols-2 lg:grid-cols-4">
          {FIGURES.map((f, i) => (
            <li
              key={f.label}
              className="bg-ink p-7"
              data-reveal
              style={{ "--reveal-delay": `${i * 70}ms` } as React.CSSProperties}
            >
              <p className="numeric mb-2 text-h3 text-bone">{f.value}</p>
              <p className="eyebrow">{f.label}</p>
            </li>
          ))}
        </ul>

        {/* The wall */}
        <div className="grid gap-3 lg:grid-cols-3">
          {/* Athlete portrait */}
          <Link
            href={`/community#${ATHLETES[3].slug}`}
            className="group relative grain vignette row-span-2 hidden min-h-[30rem] overflow-hidden bg-ink lg:block"
            data-reveal
          >
            <Sculpture
              seed={`proof-${ATHLETES[3].slug}`}
              tone={ATHLETES[3].tone}
              pose={ATHLETES[3].pose}
              anchor={0.5}
              scale={0.98}
              className="absolute inset-0 size-full transition-transform duration-[1600ms] ease-[var(--ease-out-expo)] group-hover:scale-105"
            />
            <span aria-hidden className="absolute inset-0 z-[2] bg-gradient-to-t from-ink via-ink/30 to-transparent" />

            <div className="relative z-[3] flex h-full flex-col justify-end p-7">
              <p className="eyebrow mb-3 text-purple-bright">{ATHLETES[3].discipline}</p>
              <p className="display-sm mb-3 text-bone">{ATHLETES[3].name}</p>
              <p className="mb-5 max-w-[30ch] text-body-sm italic leading-relaxed text-fog">
                “{ATHLETES[3].quote}”
              </p>
              <ul className="flex gap-6 border-t border-bone/12 pt-4">
                {ATHLETES[3].stats.map((s) => (
                  <li key={s.label}>
                    <p className="numeric text-caption text-bone">{s.value}</p>
                    <p className="text-[0.5625rem] uppercase tracking-[0.14em] text-ash">{s.label}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Link>

          {/* Review cards */}
          {quotes.map((q, i) => (
            <figure
              key={q.id}
              className="flex flex-col justify-between border border-bone/10 bg-ink p-6"
              data-reveal
              style={{ "--reveal-delay": `${i * 80}ms` } as React.CSSProperties}
            >
              <div>
                <div className="mb-4 flex items-center gap-0.5" aria-label={`${q.rating} out of 5`}>
                  {Array.from({ length: 5 }).map((_, s) => (
                    <StarMark
                      key={s}
                      className={s < q.rating ? "size-3.5 text-purple-bright" : "size-3.5 text-iron"}
                      filled={s < q.rating}
                    />
                  ))}
                </div>
                <blockquote>
                  <p className="mb-3 text-body-sm font-medium text-bone">{q.title}</p>
                  <p className="text-body-sm leading-relaxed text-smoke">
                    {q.body.length > 168 ? `${q.body.slice(0, 168).trimEnd()}…` : q.body}
                  </p>
                </blockquote>
              </div>

              <figcaption className="mt-6 flex items-baseline justify-between gap-3 border-t border-bone/10 pt-4">
                <span className="text-caption text-fog">{q.author}</span>
                <Link
                  href={`/product/${q.slug}`}
                  className="truncate font-mono text-micro uppercase tracking-[0.12em] text-ash transition-colors hover:text-purple-bright"
                >
                  {q.product}
                </Link>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link href="/community#stories" className="btn btn-ghost btn-sm">
            Read member stories
            <ArrowMark className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
