import Link from "next/link";
import { Specimen } from "@/components/primitives/Visual";
import { ArrowMark } from "@/components/primitives/Marks";
import type { Tone } from "@/lib/art";

export interface Pillar {
  id: string;
  number: string;
  title: string;
  statement: string;
  body: string;
  lines: string[];
  href: string;
  tone: Tone;
}

export const PILLARS: Pillar[] = [
  {
    id: "train",
    number: "01",
    title: "Train",
    statement: "Train with purpose.",
    body:
      "Programmes written by coaches who log their own sessions, structured in blocks with a stated intent. You always know what this week is for.",
    lines: ["Workout programmes", "Personal training", "Performance coaching"],
    href: "/train",
    tone: "train",
  },
  {
    id: "nourish",
    number: "02",
    title: "Nourish",
    statement: "Eat with intention.",
    body:
      "Full-disclosure labels, doses matched to the research they cite, third-party tested. Nothing in the tub that is not doing a job.",
    lines: ["Supplements", "Nutrition guidance", "Performance nutrition"],
    href: "/fuel",
    tone: "fuel",
  },
  {
    id: "recover",
    number: "03",
    title: "Recover",
    statement: "Recover with discipline.",
    body:
      "The adaptation happens between the sessions. Recovery is programmed here with the same seriousness as the training it serves.",
    lines: ["Recovery products", "Mobility", "Rest & regeneration"],
    href: "/method#recover",
    tone: "recover",
  },
];

export function Method({ compact = false }: { compact?: boolean }) {
  return (
    <section
      id="method"
      className="relative grain border-t border-bone/10 bg-carbon section-pad"
      aria-labelledby="method-heading"
    >
      <div className="shell relative z-[3]">
        <div className="mb-16 max-w-[62rem]">
          {!compact && <p className="eyebrow mb-5">06 — The Method</p>}

          <h2 id="method-heading" className="display-lg mb-8 text-bone" data-reveal>
            The Chisseled Method
          </h2>

          <div
            className="grid gap-1 border-l-2 border-emerald pl-6 sm:grid-cols-3"
            data-reveal
            style={{ "--reveal-delay": "100ms" } as React.CSSProperties}
          >
            {PILLARS.map((p) => (
              <p
                key={p.id}
                className="font-display text-h5 font-bold uppercase leading-[1.1] tracking-tight text-bone"
              >
                {p.statement}
              </p>
            ))}
          </div>
        </div>

        {/* --- Pillars --- */}
        <div className="grid gap-3 lg:grid-cols-3">
          {PILLARS.map((pillar, i) => (
            <Link
              key={pillar.id}
              id={pillar.id}
              href={pillar.href}
              className="group relative grain flex min-h-[26rem] flex-col justify-between overflow-hidden border border-bone/10 bg-ink p-8 transition-colors duration-700 hover:border-bone/25"
              data-reveal
              style={{ "--reveal-delay": `${i * 110}ms` } as React.CSSProperties}
            >
              <Specimen
                seed={`pillar-${pillar.id}`}
                tone={pillar.tone}
                rings={3 + i}
                className="absolute inset-0 size-full opacity-30 transition-opacity duration-[1200ms] group-hover:opacity-55"
              />
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/40"
              />

              <div className="relative z-[3]">
                <p className="numeric mb-6 text-caption text-emerald">{pillar.number}</p>
                <h3 className="display-md mb-4 text-bone">{pillar.title}</h3>
                <p className="max-w-[34ch] text-body-sm leading-relaxed text-fog">{pillar.body}</p>
              </div>

              <div className="relative z-[3] mt-8">
                <ul className="mb-6 space-y-2 border-t border-bone/10 pt-5">
                  {pillar.lines.map((line) => (
                    <li key={line} className="font-mono text-micro uppercase tracking-[0.14em] text-smoke">
                      {line}
                    </li>
                  ))}
                </ul>
                <span className="inline-flex items-center gap-2 font-mono text-label uppercase tracking-[0.18em] text-bone">
                  Explore
                  <ArrowMark className="size-4 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {!compact && (
          <div className="mt-12 flex justify-center">
            <Link href="/method" className="btn btn-primary">
              Discover the Method
              <ArrowMark className="size-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
