import Link from "next/link";
import { ARTICLES } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/primitives/PageHeader";
import { Specimen } from "@/components/primitives/Visual";
import { JsonLd } from "@/components/primitives/JsonLd";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "The Journal",
  description:
    "Training, nutrition, recovery, mindset and style. The thinking behind the work, written by the coaches who do it.",
  path: "/journal",
});

const CATEGORIES = [
  "Training",
  "Nutrition",
  "Recovery",
  "Mindset",
  "Style",
  "Performance",
] as const;

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  const filtered = category
    ? ARTICLES.filter((a) => a.category === category)
    : ARTICLES;

  const [lead, ...rest] = filtered;

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Journal", path: "/journal" },
        ])}
      />

      <PageHeader
        eyebrow="The Journal"
        title="The thinking behind the work."
        lede="Long-form writing on training, nutrition, recovery and the psychology of showing up. No listicles, no supplement advertorial dressed as advice."
        seed="journal-header"
        tone="void"
        compact
        trail={[
          { name: "Home", path: "/" },
          { name: "Journal", path: "/journal" },
        ]}
      />

      {/* --- Category filter --- */}
      <nav aria-label="Journal categories" className="border-b border-bone/10 bg-ink">
        <div className="shell flex gap-1 overflow-x-auto py-4">
          <Link
            href="/journal"
            aria-current={!category ? "page" : undefined}
            className={[
              "shrink-0 border px-4 py-2.5 font-mono text-micro uppercase tracking-[0.14em] transition-colors duration-300",
              !category
                ? "border-bone bg-bone text-ink"
                : "border-bone/15 text-fog hover:border-bone/40 hover:text-bone",
            ].join(" ")}
          >
            All
          </Link>
          {CATEGORIES.map((c) => {
            const active = category === c;
            return (
              <Link
                key={c}
                href={`/journal?category=${encodeURIComponent(c)}`}
                aria-current={active ? "page" : undefined}
                className={[
                  "shrink-0 border px-4 py-2.5 font-mono text-micro uppercase tracking-[0.14em] transition-colors duration-300",
                  active
                    ? "border-bone bg-bone text-ink"
                    : "border-bone/15 text-fog hover:border-bone/40 hover:text-bone",
                ].join(" ")}
              >
                {c}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="shell section-pad">
        {filtered.length === 0 ? (
          <p className="py-20 text-center text-body text-smoke">
            Nothing published in that category yet.
          </p>
        ) : (
          <>
            {/* Lead */}
            <Link
              href={`/journal/${lead.slug}`}
              className="group relative grain vignette mb-3 flex min-h-[32rem] flex-col justify-end overflow-hidden bg-carbon p-8 lg:p-12"
              data-reveal
            >
              <Specimen
                seed={`journal-lead-${lead.slug}`}
                tone={lead.tone}
                className="absolute inset-0 size-full opacity-45 transition-transform duration-[1800ms] ease-[var(--ease-out-expo)] group-hover:scale-105"
              />
              <span aria-hidden className="absolute inset-0 z-[2] bg-gradient-to-t from-ink via-ink/75 to-ink/20" />

              <div className="relative z-[3] max-w-[46ch]">
                <p className="eyebrow mb-5 text-lime-bright">{lead.category}</p>
                <h2 className="display-lg mb-5 text-bone">{lead.title}</h2>
                <p className="mb-6 text-body leading-relaxed text-fog">{lead.excerpt}</p>
                <p className="font-mono text-micro uppercase tracking-[0.14em] text-ash">
                  {lead.author} · {lead.readMinutes} min read · {formatDate(lead.date)}
                </p>
              </div>
            </Link>

            {/* Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((a, i) => (
                <article
                  key={a.slug}
                  className="group border border-bone/10 bg-carbon"
                  data-reveal
                  style={{ "--reveal-delay": `${(i % 3) * 90}ms` } as React.CSSProperties}
                >
                  <Link href={`/journal/${a.slug}`} className="block h-full">
                    <div className="relative grain aspect-[16/10] overflow-hidden bg-ink">
                      <Specimen
                        seed={`journal-${a.slug}`}
                        tone={a.tone}
                        className="size-full opacity-70 transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
                      />
                    </div>

                    <div className="p-6">
                      <p className="eyebrow mb-4">{a.category}</p>
                      <h2 className="mb-3 font-display text-h5 font-bold uppercase leading-tight tracking-tight text-bone">
                        <span className="link-rule">{a.title}</span>
                      </h2>
                      <p className="mb-5 text-body-sm leading-relaxed text-smoke">{a.excerpt}</p>
                      <p className="font-mono text-micro uppercase tracking-[0.14em] text-ash">
                        {a.author} · {a.readMinutes} min read
                      </p>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
