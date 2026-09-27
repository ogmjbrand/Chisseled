import Link from "next/link";
import { SectionBackdrop } from "@/components/primitives/SectionBackdrop";
import { ATHLETES } from "@/lib/catalog";
import { Sculpture } from "@/components/primitives/Visual";
import { EditorialImage } from "@/components/primitives/EditorialImage";
import { ArrowMark } from "@/components/primitives/Marks";

/**
 * This section used to also carry a row of headline stats ("50,000+
 * athletes," "4.9/5," etc.) and a grid of named-customer review quotes
 * pulled from src/lib/reviews.ts. Both were removed as fabricated social
 * proof: the stats were an explicitly-flagged placeholder never replaced
 * with verified numbers, and reviews.ts's own header comment says its
 * content is "illustrative sample data... production must render only
 * verified purchase reviews from the live review store" — i.e. the names,
 * star ratings, dates, and "verified" badges attached to every product's
 * reviews are all invented, not real customer testimonials. Neither had a
 * live source to swap in, so per this project's own no-fabrication rule
 * they're removed rather than replaced with different invented content.
 * What's left is exactly what's real: one named, credited coach.
 */

export function SocialProof() {
  return (
    <section
      className="relative grain border-t border-bone/10 bg-carbon section-pad"
      aria-labelledby="proof-heading"
    >
      <SectionBackdrop src="push-up" strength="whisper" position="center 20%" />

      <div className="shell relative z-[3]">
        <div className="mb-14 max-w-[46rem]">
          <p className="eyebrow mb-5">10 — Proof</p>
          <h2 id="proof-heading" className="display-lg text-bone" data-reveal>
            Built by people who do the work.
          </h2>
        </div>

        {/* Coach spotlight — real, named, credited; not a customer review */}
        <Link
          href={`/community#${ATHLETES[3].slug}`}
          className="group relative grain vignette block min-h-[24rem] overflow-hidden bg-ink sm:min-h-[28rem]"
          data-reveal
        >
          {ATHLETES[3].photo ? (
            <EditorialImage
              src={ATHLETES[3].photo}
              alt={`${ATHLETES[3].name}, ${ATHLETES[3].role}`}
              sizes="100vw"
              className="absolute inset-0 size-full transition-transform duration-[1600ms] ease-[var(--ease-out-expo)] group-hover:scale-105"
            />
          ) : (
            <Sculpture
              seed={`proof-${ATHLETES[3].slug}`}
              tone={ATHLETES[3].tone}
              pose={ATHLETES[3].pose}
              anchor={0.5}
              scale={0.98}
              className="absolute inset-0 size-full transition-transform duration-[1600ms] ease-[var(--ease-out-expo)] group-hover:scale-105"
            />
          )}
          <span aria-hidden className="absolute inset-0 z-[2] bg-gradient-to-t from-ink via-ink/40 to-transparent" />

          <div className="relative z-[3] flex h-full max-w-[34rem] flex-col justify-end p-7 sm:p-10">
            <p className="eyebrow mb-3 text-purple-bright">{ATHLETES[3].discipline}</p>
            <p className="display-sm mb-3 text-bone">{ATHLETES[3].name}</p>
            <p className="mb-5 max-w-[36ch] text-body-sm italic leading-relaxed text-fog">
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
