import Link from "next/link";
import { ARTICLES, ATHLETES } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/primitives/PageHeader";
import { Community } from "@/components/sections/Community";
import { Sculpture } from "@/components/primitives/Visual";
import { JsonLd } from "@/components/primitives/JsonLd";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { ArrowMark } from "@/components/primitives/Marks";

export const metadata = pageMetadata({
  title: "The Chisseled Community",
  description:
    "Coaches, athletes and members whose progress is the ordinary kind — slow, consistent, and available to anyone willing to do the work.",
  path: "/community",
});

const EVENTS = [
  { name: "Lagos Lift-Off", date: "2026-09-19", place: "Victoria Island, Lagos", spots: "40 places" },
  { name: "The Base Run", date: "2026-10-04", place: "Jabi Lake, Abuja", spots: "Open" },
  { name: "Recovery Workshop", date: "2026-10-25", place: "Online", spots: "Unlimited" },
];

export default function CommunityPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Community", path: "/community" },
        ])}
      />

      <PageHeader
        eyebrow="The Community"
        title="Meet the people behind the discipline."
        lede="The coaches who write the programmes train on them. The athletes here were chosen for their consistency, not their genetics."
        seed="community-header"
        tone="void"
        pose="back"
        trail={[
          { name: "Home", path: "/" },
          { name: "Community", path: "/community" },
        ]}
      />

      <Community heading={false} />

      {/* --- Full athlete stories --- */}
      <section
        id="stories"
        className="border-t border-bone/10 bg-carbon section-pad"
        aria-labelledby="stories-heading"
      >
        <div className="shell">
          <div className="mb-14 max-w-[44rem]">
            <p className="eyebrow mb-5">Stories</p>
            <h2 id="stories-heading" className="display-lg text-bone">
              The ordinary kind of progress.
            </h2>
          </div>

          <div className="space-y-3">
            {ATHLETES.map((a, i) => (
              <article
                key={a.slug}
                className="grid gap-8 border border-bone/10 bg-ink p-7 lg:grid-cols-[16rem_1fr] lg:gap-12 lg:p-9"
                data-reveal
                style={{ "--reveal-delay": `${(i % 2) * 90}ms` } as React.CSSProperties}
              >
                <div className="relative grain vignette aspect-[3/4] overflow-hidden bg-carbon">
                  <Sculpture
                    seed={`story-${a.slug}`}
                    tone={a.tone}
                    pose={a.pose}
                    anchor={0.5}
                    scale={0.9}
                    className="size-full"
                  />
                </div>

                <div className="flex flex-col justify-center">
                  <p className="eyebrow mb-4 text-emerald-bright">
                    {a.discipline} · {a.location}
                  </p>
                  <h3 className="display-sm mb-1.5 text-bone">{a.name}</h3>
                  <p className="mb-6 font-mono text-micro uppercase tracking-[0.12em] text-smoke">
                    {a.role}
                  </p>

                  <blockquote className="mb-6 border-l-2 border-emerald/50 pl-5">
                    <p className="font-display text-h5 font-bold uppercase leading-tight tracking-tight text-bone">
                      “{a.quote}”
                    </p>
                  </blockquote>

                  <p className="mb-7 max-w-[62ch] text-body-sm leading-relaxed text-smoke">
                    {a.story}
                  </p>

                  <dl className="flex flex-wrap gap-x-10 gap-y-4 border-t border-bone/10 pt-5">
                    {a.stats.map((s) => (
                      <div key={s.label}>
                        <dt className="eyebrow mb-1.5">{s.label}</dt>
                        <dd className="numeric text-h6 text-bone">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* --- Events --- */}
      <section
        id="events"
        className="border-t border-bone/10 bg-ink section-pad"
        aria-labelledby="events-heading"
      >
        <div className="shell">
          <div className="mb-12 max-w-[44rem]">
            <p className="eyebrow mb-5">Events</p>
            <h2 id="events-heading" className="display-lg text-bone">
              Show up in person.
            </h2>
          </div>

          <ul className="divide-y divide-bone/10 border-y border-bone/10">
            {EVENTS.map((e) => (
              <li key={e.name}>
                <div className="grid items-center gap-4 py-6 sm:grid-cols-[1fr_auto] sm:gap-8">
                  <div className="grid gap-2 sm:grid-cols-[12rem_1fr] sm:items-baseline sm:gap-8">
                    <p className="numeric text-caption text-emerald">{formatDate(e.date)}</p>
                    <div>
                      <h3 className="font-display text-h5 font-bold uppercase leading-tight tracking-tight text-bone">
                        {e.name}
                      </h3>
                      <p className="mt-1 text-body-sm text-smoke">
                        {e.place} · {e.spots}
                      </p>
                    </div>
                  </div>

                  <Link href="/account" className="btn btn-ghost btn-sm justify-self-start sm:justify-self-end">
                    Register
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* --- Journal cross-link --- */}
      <section className="border-t border-bone/10 bg-carbon section-pad">
        <div className="shell">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow mb-5">Journal</p>
              <h2 className="display-md text-bone">Written by the same people.</h2>
            </div>
            <Link href="/journal" className="btn btn-ghost btn-sm">
              All articles
              <ArrowMark className="size-4" />
            </Link>
          </div>

          <ul className="grid gap-px border border-bone/10 bg-bone/10 sm:grid-cols-3">
            {ARTICLES.slice(0, 3).map((a) => (
              <li key={a.slug} className="bg-ink">
                <Link href={`/journal/${a.slug}`} className="group block h-full p-7 transition-colors duration-500 hover:bg-carbon">
                  <p className="eyebrow mb-4">{a.category}</p>
                  <h3 className="mb-3 font-display text-h6 font-bold uppercase leading-tight tracking-tight text-bone">
                    <span className="link-rule">{a.title}</span>
                  </h3>
                  <p className="mb-4 text-body-sm leading-relaxed text-smoke">{a.excerpt}</p>
                  <p className="font-mono text-micro uppercase tracking-[0.14em] text-ash">
                    {a.author} · {a.readMinutes} min
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
