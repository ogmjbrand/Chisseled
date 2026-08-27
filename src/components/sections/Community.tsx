import Link from "next/link";
import { ATHLETES } from "@/lib/catalog";
import { Sculpture } from "@/components/primitives/Visual";
import { EditorialImage } from "@/components/primitives/EditorialImage";
import { ArrowMark } from "@/components/primitives/Marks";

export function Community({ heading = true }: { heading?: boolean }) {
  return (
    <section
      id="athletes"
      className="border-t border-bone/10 bg-ink section-pad"
      aria-labelledby="community-heading"
    >
      <div className="shell">
        {heading && (
          <div className="mb-14 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="eyebrow mb-5">11 — Community</p>
              <h2 id="community-heading" className="display-lg mb-5 max-w-[16ch] text-bone" data-reveal>
                Meet the people behind the discipline.
              </h2>
              <p
                className="lede max-w-[50ch]"
                data-reveal
                style={{ "--reveal-delay": "90ms" } as React.CSSProperties}
              >
                The coaches who write the programmes train on them. The athletes here were
                chosen for their consistency, not their genetics.
              </p>
            </div>

            <Link href="/community" className="btn btn-ghost btn-sm justify-self-start lg:justify-self-end">
              The full community
              <ArrowMark className="size-4" />
            </Link>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ATHLETES.map((a, i) => (
            <article
              key={a.slug}
              id={a.slug}
              className="group relative grain vignette aspect-[3/4.2] overflow-hidden bg-carbon"
              data-reveal
              style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}
            >
              {a.photo ? (
                <EditorialImage
                  src={a.photo}
                  alt={`${a.name}, ${a.role}`}
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="absolute inset-0 size-full transition-transform duration-[1600ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
                />
              ) : (
                <Sculpture
                  seed={`athlete-${a.slug}`}
                  tone={a.tone}
                  pose={a.pose}
                  anchor={0.5}
                  scale={0.94}
                  className="absolute inset-0 size-full transition-transform duration-[1600ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
                />
              )}
              <span
                aria-hidden
                className="absolute inset-0 z-[2] bg-gradient-to-t from-ink via-ink/35 to-transparent"
              />

              <div className="relative z-[3] flex h-full flex-col justify-end p-6">
                <p className="eyebrow mb-2.5 text-purple-bright">{a.discipline}</p>
                <h3 className="display-sm mb-1 text-bone">{a.name}</h3>
                <p className="mb-4 font-mono text-micro uppercase tracking-[0.12em] text-smoke">
                  {a.role} · {a.location}
                </p>

                {/* The quote and stats reveal on hover — the card stays quiet at rest */}
                <div className="max-h-0 overflow-hidden opacity-0 transition-[max-height,opacity] duration-[800ms] ease-[var(--ease-out-expo)] group-hover:max-h-56 group-hover:opacity-100 group-focus-within:max-h-56 group-focus-within:opacity-100">
                  <p className="mb-4 text-body-sm italic leading-relaxed text-fog">“{a.quote}”</p>
                  <ul className="flex flex-wrap gap-x-5 gap-y-2 border-t border-bone/12 pt-4">
                    {a.stats.map((s) => (
                      <li key={s.label}>
                        <p className="numeric text-caption text-bone">{s.value}</p>
                        <p className="text-[0.5625rem] uppercase tracking-[0.14em] text-ash">
                          {s.label}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
