import Link from "next/link";
import { ARTICLES } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { Specimen } from "@/components/primitives/Visual";
import { ArrowMark } from "@/components/primitives/Marks";

export function JournalStrip() {
  const [lead, ...rest] = ARTICLES.slice(0, 4);

  return (
    <section
      className="border-t border-bone/10 bg-carbon section-pad"
      aria-labelledby="journal-heading"
    >
      <div className="shell">
        <div className="mb-14 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow mb-5">12 — Journal</p>
            <h2 id="journal-heading" className="display-lg text-bone" data-reveal>
              The thinking behind the work.
            </h2>
          </div>
          <Link href="/journal" className="btn btn-ghost btn-sm justify-self-start lg:justify-self-end">
            All articles
            <ArrowMark className="size-4" />
          </Link>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
          {/* Lead */}
          <Link
            href={`/journal/${lead.slug}`}
            className="group relative grain vignette flex min-h-[26rem] flex-col justify-end overflow-hidden bg-ink p-8"
            data-reveal
          >
            <Specimen
              seed={`journal-${lead.slug}`}
              tone={lead.tone}
              className="absolute inset-0 size-full opacity-45 transition-transform duration-[1600ms] ease-[var(--ease-out-expo)] group-hover:scale-105"
            />
            <span aria-hidden className="absolute inset-0 z-[2] bg-gradient-to-t from-ink via-ink/70 to-ink/20" />

            <div className="relative z-[3] max-w-[38ch]">
              <p className="eyebrow mb-4 text-purple-bright">{lead.category}</p>
              <h3 className="display-md mb-4 text-bone">{lead.title}</h3>
              <p className="mb-5 text-body-sm leading-relaxed text-fog">{lead.excerpt}</p>
              <p className="font-mono text-micro uppercase tracking-[0.14em] text-ash">
                {lead.author} · {lead.readMinutes} min read · {formatDate(lead.date)}
              </p>
            </div>
          </Link>

          {/* Stack */}
          <ul className="grid gap-px bg-bone/10">
            {rest.map((a, i) => (
              <li key={a.slug} className="bg-ink">
                <Link
                  href={`/journal/${a.slug}`}
                  className="group flex h-full flex-col justify-center p-6 transition-colors duration-500 hover:bg-carbon"
                  data-reveal
                  style={{ "--reveal-delay": `${i * 80}ms` } as React.CSSProperties}
                >
                  <p className="eyebrow mb-3">{a.category}</p>
                  <h3 className="mb-2.5 font-display text-h6 font-bold uppercase leading-tight tracking-tight text-bone">
                    <span className="link-rule">{a.title}</span>
                  </h3>
                  <p className="mb-3 line-clamp-2 text-body-sm text-smoke">{a.excerpt}</p>
                  <p className="font-mono text-micro uppercase tracking-[0.14em] text-ash">
                    {a.readMinutes} min read
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
