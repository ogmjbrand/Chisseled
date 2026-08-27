import Link from "next/link";
import { ATHLETES, PROGRAMS } from "@/lib/catalog";
import { CoachDeck } from "@/components/sections/CoachDeck";
import { formatPrice } from "@/lib/format";
import { PageHeader } from "@/components/primitives/PageHeader";
import { TrainingPlatform } from "@/components/sections/TrainingPlatform";
import { Specimen } from "@/components/primitives/Visual";
import { JsonLd } from "@/components/primitives/JsonLd";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { ArrowMark, CheckMark } from "@/components/primitives/Marks";

export const metadata = pageMetadata({
  title: "Training Platform",
  description:
    "Programmes that read the effort you log and adapt. Strength, physique, conditioning and recovery blocks written by coaches who train on them.",
  path: "/train",
});

const TIERS = [
  {
    name: "Programme",
    price: 18000,
    cadence: "one time",
    note: "A single block, yours permanently.",
    features: [
      "One complete programme",
      "Full exercise library",
      "Session logging & history",
      "Progress metrics",
    ],
    cta: "Buy a programme",
    accent: false,
  },
  {
    name: "Training",
    price: 9500,
    cadence: "per month",
    note: "Every programme, always current.",
    features: [
      "All programmes, unlimited",
      "Autoregulated volume",
      "Progress & 1RM tracking",
      "Community challenges",
      "New blocks each quarter",
      "Cancel any time",
    ],
    cta: "Start training",
    accent: true,
  },
  {
    name: "Coached",
    price: 78000,
    cadence: "per month",
    note: "A coach reading your logs.",
    features: [
      "Everything in Training",
      "A named coach",
      "Programme written for you",
      "Weekly video review",
      "Direct messaging",
      "Technique feedback",
    ],
    cta: "Apply for coaching",
    accent: false,
  },
];

const CHALLENGES = [
  { name: "100 Sessions, 100 Days", live: true, entrants: 8420, ends: "31 days left" },
  { name: "The Winter Base", live: true, entrants: 3190, ends: "12 days left" },
  { name: "Squat Every Day", live: false, entrants: 5610, ends: "Opens 1 October" },
];

/** Everyone on the bench who writes or reviews programmes. */
const COACHES = ATHLETES.filter((a) => a.role.includes("Coach"));

export default function TrainPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Train", path: "/train" },
        ])}
      />

      <PageHeader
        eyebrow="The Platform"
        title="Training, measured."
        lede="Log the work and the programme reads it. Volume moves with the effort you actually reported — not with a spreadsheet written before your week happened."
        seed="train-header"
        tone="train"
        pose="back"
        trail={[
          { name: "Home", path: "/" },
          { name: "Train", path: "/train" },
        ]}
      >
        <ul className="flex flex-wrap gap-x-10 gap-y-5 border-t border-bone/10 pt-7">
          {[
            { v: "6", k: "Programmes" },
            { v: "72,000+", k: "Members training" },
            { v: "3", k: "Coaches" },
            { v: "100K+", k: "Sessions logged" },
          ].map((s) => (
            <li key={s.k}>
              <p className="numeric text-h5 text-bone">{s.v}</p>
              <p className="eyebrow mt-1.5">{s.k}</p>
            </li>
          ))}
        </ul>
      </PageHeader>

      <TrainingPlatform />

      {/* --- Programmes --- */}
      <section
        className="border-t border-bone/10 bg-carbon section-pad"
        aria-labelledby="programmes-heading"
      >
        <div className="shell">
          <div className="mb-14 max-w-[46rem]">
            <p className="eyebrow mb-5">Programmes</p>
            <h2 id="programmes-heading" className="display-lg mb-5 text-bone" data-reveal>
              Blocks with a stated intent.
            </h2>
            <p className="lede" data-reveal style={{ "--reveal-delay": "90ms" } as React.CSSProperties}>
              Every programme is divided into blocks, and every block says what it is for. You
              always know what this week is doing and why it looks different from last week.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {PROGRAMS.map((p, i) => (
              <article
                key={p.slug}
                id={p.slug}
                className="group relative grain overflow-hidden border border-bone/10 bg-ink p-7 transition-colors duration-700 hover:border-bone/25 lg:p-8"
                data-reveal
                style={{ "--reveal-delay": `${(i % 2) * 90}ms` } as React.CSSProperties}
              >
                <Specimen
                  seed={`prog-${p.slug}`}
                  tone={p.tone}
                  className="absolute inset-0 size-full opacity-20 transition-opacity duration-1000 group-hover:opacity-35"
                />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-br from-ink via-ink/92 to-ink/70" />

                <div className="relative z-[3]">
                  <div className="mb-5 flex flex-wrap items-center gap-2">
                    <span className="badge badge-outline">{p.discipline}</span>
                    <span className="badge badge-outline">{p.level}</span>
                    <span className="numeric ml-auto text-micro text-ash">
                      {p.members.toLocaleString()} training
                    </span>
                  </div>

                  <h3 className="display-sm mb-3 text-bone">{p.name}</h3>
                  <p className="mb-5 text-body-sm font-medium text-purple-bright">{p.focus}</p>
                  <p className="mb-7 text-body-sm leading-relaxed text-smoke">{p.summary}</p>

                  {/* Block structure */}
                  <ol className="mb-7 space-y-px overflow-hidden border border-bone/10 bg-bone/10">
                    {p.blocks.map((b) => (
                      <li key={b.name} className="flex gap-4 bg-ink p-3.5">
                        <span className="numeric w-16 shrink-0 font-mono text-micro uppercase tracking-[0.12em] text-purple-bright">
                          {b.weeks}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-caption font-medium text-bone">{b.name}</span>
                          <span className="block text-micro leading-relaxed text-smoke">
                            {b.intent}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>

                  <dl className="mb-7 flex flex-wrap gap-x-8 gap-y-3 border-t border-bone/10 pt-5">
                    {[
                      ["Length", `${p.weeks} weeks`],
                      ["Frequency", `${p.daysPerWeek} days / week`],
                      ["Equipment", p.equipment],
                      ["Coach", p.coach],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="eyebrow mb-1">{k}</dt>
                        <dd className="text-caption text-fog">{v}</dd>
                      </div>
                    ))}
                  </dl>

                  <Link href="#membership" className="btn btn-ghost btn-sm">
                    Start this programme
                    <ArrowMark className="size-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* --- Membership --- */}
      <section
        id="membership"
        className="border-t border-bone/10 bg-ink section-pad"
        aria-labelledby="membership-heading"
      >
        <div className="shell">
          <div className="mb-14 max-w-[44rem]">
            <p className="eyebrow mb-5">Membership</p>
            <h2 id="membership-heading" className="display-lg text-bone" data-reveal>
              Three ways in.
            </h2>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {TIERS.map((tier, i) => (
              <article
                key={tier.name}
                className={[
                  "relative flex flex-col border p-8",
                  tier.accent
                    ? "border-purple/40 bg-gradient-to-b from-purple/[0.08] to-transparent"
                    : "border-bone/10 bg-carbon",
                ].join(" ")}
                data-reveal
                style={{ "--reveal-delay": `${i * 100}ms` } as React.CSSProperties}
              >
                {tier.accent && <span aria-hidden className="metal-edge-line" />}

                {tier.accent && (
                  <span className="badge badge-purple absolute right-6 top-6">Most chosen</span>
                )}

                <h3 className="display-sm mb-2 text-bone">{tier.name}</h3>
                <p className="mb-7 text-body-sm text-smoke">{tier.note}</p>

                <p className="mb-8 flex items-baseline gap-2">
                  <span className="numeric text-h3 text-bone">{formatPrice(tier.price)}</span>
                  <span className="text-caption text-ash">{tier.cadence}</span>
                </p>

                <ul className="mb-9 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-baseline gap-2.5 text-body-sm text-fog">
                      <CheckMark className="size-3.5 shrink-0 translate-y-0.5 text-purple-bright" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/checkout"
                  className={[
                    "btn btn-block mt-auto",
                    tier.accent ? "btn-primary" : "btn-ghost",
                  ].join(" ")}
                >
                  {tier.cta}
                </Link>
              </article>
            ))}
          </div>

          <p className="mt-6 text-micro text-ash">
            Membership prices are illustrative for this storefront. Bundles that include
            CHISSELED Training carry the membership at no additional cost for their stated term.
          </p>
        </div>
      </section>

      {/* --- Coaching --- */}
      <section
        id="coaching"
        className="border-t border-bone/10 bg-carbon section-pad"
        aria-labelledby="coaching-heading"
      >
        <div className="shell">
          <div className="mb-14 max-w-[44rem]">
            <p className="eyebrow mb-5">Coaching</p>
            <h2 id="coaching-heading" className="display-lg mb-5 text-bone">
              A coach who reads your logs.
            </h2>
            <p className="lede">
              Not a template with your name on it. Coached members get a programme written
              against their own history, reviewed weekly, adjusted when life interferes.
            </p>
          </div>

          <CoachDeck coaches={COACHES} />
        </div>
      </section>

      {/* --- Challenges --- */}
      <section
        id="challenges"
        className="border-t border-bone/10 bg-ink section-pad"
        aria-labelledby="challenges-heading"
      >
        <div className="shell">
          <div className="mb-12 max-w-[44rem]">
            <p className="eyebrow mb-5">Challenges</p>
            <h2 id="challenges-heading" className="display-lg text-bone">
              Do it alongside other people.
            </h2>
          </div>

          <ul className="grid gap-px border border-bone/10 bg-bone/10 sm:grid-cols-3">
            {CHALLENGES.map((c) => (
              <li key={c.name} className="bg-carbon p-7">
                <div className="mb-5 flex items-center gap-2">
                  {c.live ? (
                    <span className="badge badge-purple">
                      <span className="relative flex size-1.5">
                        <span
                          className="absolute inline-flex size-full rounded-full bg-purple-bright"
                          style={{ animation: "chisseled-pulse-ring 2.4s ease-out infinite" }}
                        />
                        <span className="relative inline-flex size-1.5 rounded-full bg-purple-bright" />
                      </span>
                      Live
                    </span>
                  ) : (
                    <span className="badge badge-outline">Upcoming</span>
                  )}
                </div>

                <h3 className="mb-3 font-display text-h5 font-bold uppercase leading-tight tracking-tight text-bone">
                  {c.name}
                </h3>
                <p className="numeric mb-1 text-caption text-fog">
                  {c.entrants.toLocaleString()} entered
                </p>
                <p className="text-micro text-ash">{c.ends}</p>

                <Link href="/account" className="btn btn-ghost btn-sm mt-6">
                  {c.live ? "Join" : "Get notified"}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
