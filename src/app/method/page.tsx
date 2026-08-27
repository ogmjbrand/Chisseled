import Link from "next/link";
import { PROGRAMS, getProductsByWorld } from "@/lib/catalog";
import { Method, PILLARS } from "@/components/sections/Method";
import { PageHeader } from "@/components/primitives/PageHeader";
import { ProductCard } from "@/components/product/ProductCard";
import { Specimen } from "@/components/primitives/Visual";
import { JsonLd } from "@/components/primitives/JsonLd";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { ArrowMark } from "@/components/primitives/Marks";

export const metadata = pageMetadata({
  title: "The Chisseled Method",
  description:
    "Train with purpose. Eat with intention. Recover with discipline. The methodology behind CHISSELED — three pillars, one system.",
  path: "/method",
});

const PRINCIPLES = [
  {
    n: "01",
    title: "Consistency beats optimality",
    body: "An adequate programme you will still be running in eighteen months beats a perfect one you abandon in six weeks. Every decision in the method is weighted toward the version you will actually sustain.",
  },
  {
    n: "02",
    title: "The boring part is the part that works",
    body: "Strength is a skill expressed under load, and skills consolidate through repetition. Variety belongs in the accessories, not in the lifts that carry the block.",
  },
  {
    n: "03",
    title: "Recovery is a training variable",
    body: "Adaptation happens between the sessions, not during them. Sleep, nutrition and deload are programmed here with the same seriousness as the work they serve.",
  },
  {
    n: "04",
    title: "Autoregulate honestly",
    body: "The programme reads the effort you logged. That only works if what you log is true. Reporting a hard set as easy does not make you stronger — it makes the next week wrong.",
  },
  {
    n: "05",
    title: "Claims should be checkable",
    body: "Every fabric composition, every ingredient dose, every measurement is on the page. If we cannot show you the number, we do not make the claim.",
  },
  {
    n: "06",
    title: "Remove the decision, not the difficulty",
    body: "People who train consistently are not winning a daily argument with themselves — they removed the argument. The method is built to eliminate friction, not effort.",
  },
];

export default function MethodPage() {
  const recovery = getProductsByWorld("accessories").filter((p) =>
    p.activities.includes("recovery"),
  );

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "The Method", path: "/method" },
        ])}
      />

      <PageHeader
        eyebrow="The Methodology"
        title="The Chisseled Method."
        lede="Train with purpose. Eat with intention. Recover with discipline. Three pillars that only work because they were designed against each other."
        seed="method-header"
        tone="train"
        pose="front"
        trail={[
          { name: "Home", path: "/" },
          { name: "The Method", path: "/method" },
        ]}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/train" className="btn btn-primary">
            Start a programme
            <ArrowMark className="size-4" />
          </Link>
          <Link href="/fit" className="btn btn-ghost">
            Find your fit
          </Link>
        </div>
      </PageHeader>

      <Method compact />

      {/* --- Principles --- */}
      <section
        className="border-t border-bone/10 bg-ink section-pad"
        aria-labelledby="principles-heading"
      >
        <div className="shell">
          <div className="mb-14 max-w-[46rem]">
            <p className="eyebrow mb-5">The principles</p>
            <h2 id="principles-heading" className="display-lg text-bone" data-reveal>
              Six things we will not compromise.
            </h2>
          </div>

          <ol className="grid gap-px border border-bone/10 bg-bone/10 sm:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((p, i) => (
              <li
                key={p.n}
                className="bg-carbon p-7 lg:p-8"
                data-reveal
                style={{ "--reveal-delay": `${(i % 3) * 90}ms` } as React.CSSProperties}
              >
                <p className="numeric mb-6 text-caption text-emerald">{p.n}</p>
                <h3 className="mb-3.5 font-display text-h5 font-bold uppercase leading-tight tracking-tight text-bone">
                  {p.title}
                </h3>
                <p className="text-body-sm leading-relaxed text-smoke">{p.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* --- How the pillars connect --- */}
      <section
        className="relative grain border-t border-bone/10 bg-carbon section-pad"
        aria-labelledby="system-heading"
      >
        <div className="shell relative z-[3]">
          <div className="mb-14 max-w-[46rem]">
            <p className="eyebrow mb-5">The system</p>
            <h2 id="system-heading" className="display-lg mb-6 text-bone" data-reveal>
              Nothing here works alone.
            </h2>
            <p className="lede" data-reveal style={{ "--reveal-delay": "90ms" } as React.CSSProperties}>
              The reason we sell all three is not range — it is that each one degrades without
              the others. Training without recovery is just accumulated fatigue. Nutrition
              without a stimulus is just calories. Recovery without work is just rest.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {PILLARS.map((pillar, i) => (
              <article
                key={pillar.id}
                id={`${pillar.id}-detail`}
                className="relative grain overflow-hidden border border-bone/10 bg-ink p-8"
                data-reveal
                style={{ "--reveal-delay": `${i * 110}ms` } as React.CSSProperties}
              >
                <Specimen
                  seed={`method-detail-${pillar.id}`}
                  tone={pillar.tone}
                  className="absolute inset-0 size-full opacity-25"
                />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/85 to-ink/50" />

                <div className="relative z-[3]">
                  <p className="numeric mb-6 text-caption text-emerald">{pillar.number}</p>
                  <h3 className="display-sm mb-4 text-bone">{pillar.statement}</h3>
                  <p className="mb-6 text-body-sm leading-relaxed text-fog">{pillar.body}</p>

                  <p className="eyebrow mb-3">Without it</p>
                  <p className="mb-6 border-l border-signal-low/40 pl-4 text-body-sm leading-relaxed text-smoke">
                    {pillar.id === "train"
                      ? "Nutrition and recovery have nothing to serve. You feel maintained rather than built."
                      : pillar.id === "nourish"
                        ? "The stimulus lands but the material to rebuild with is not there. You train hard and stay the same."
                        : "The work accumulates as fatigue instead of adaptation. Progress stalls and something starts to hurt."}
                  </p>

                  <Link href={pillar.href} className="btn btn-ghost btn-sm">
                    {pillar.title}
                    <ArrowMark className="size-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* --- Recovery products --- */}
      <section
        id="recover"
        className="border-t border-bone/10 bg-ink section-pad"
        aria-labelledby="recovery-heading"
      >
        <div className="shell">
          <div className="mb-12 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="eyebrow mb-5">Recover</p>
              <h2 id="recovery-heading" className="display-md max-w-[18ch] text-bone">
                The half almost nobody bothers to sell you.
              </h2>
            </div>
            <Link href="/fuel" className="btn btn-ghost btn-sm justify-self-start lg:justify-self-end">
              All nutrition
              <ArrowMark className="size-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {recovery.map((p, i) => (
              <ProductCard key={p.slug} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* --- Programmes built on the method --- */}
      <section
        className="border-t border-bone/10 bg-carbon section-pad"
        aria-labelledby="method-programmes"
      >
        <div className="shell">
          <h2 id="method-programmes" className="display-md mb-12 max-w-[20ch] text-bone">
            Programmes built on it.
          </h2>

          <ul className="grid gap-px border border-bone/10 bg-bone/10 sm:grid-cols-2 lg:grid-cols-3">
            {PROGRAMS.slice(0, 3).map((p) => (
              <li key={p.slug} className="bg-ink">
                <Link
                  href={`/train#${p.slug}`}
                  className="group block h-full p-7 transition-colors duration-500 hover:bg-carbon"
                >
                  <p className="eyebrow mb-4">
                    {p.discipline} · {p.level}
                  </p>
                  <h3 className="display-sm mb-3 text-bone">{p.name}</h3>
                  <p className="mb-6 text-body-sm leading-relaxed text-smoke">{p.focus}</p>
                  <p className="numeric text-micro text-ash">
                    {p.weeks} weeks · {p.daysPerWeek} days a week
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
