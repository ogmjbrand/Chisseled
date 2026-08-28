"use client";

import Link from "next/link";
import { useRef } from "react";
import { usePrefersReducedMotion, useScrollProgress } from "@/lib/motion";
import { Flat, Sculpture } from "@/components/primitives/Visual";
import { ArrowMark } from "@/components/primitives/Marks";
import type { Tone } from "@/lib/art";
import type { FlatKey, ColorwayKey } from "@/lib/art";

/**
 * THE SIGNATURE SEQUENCE
 * ------------------------------------------------------------------
 * One pinned viewport that the whole brand argument passes through.
 * As the page scrolls, the environment itself changes state — palette,
 * figure, typography and product all advance together through
 * WEAR IT → TRAIN IN IT → LIVE IT, resolving on BECOME CHISSELED.
 *
 * Scroll drives a single 0 → 1 value. Every layer derives its own
 * transform from that one number, which is why the whole thing stays
 * in step and costs one rAF-throttled listener.
 *
 * Under `prefers-reduced-motion` the sequence renders as three static
 * editorial panels: the same content, the same argument, no movement.
 */

interface Stage {
  id: string;
  word: string;
  line: string;
  body: string;
  tone: Tone;
  pose: "front" | "back";
  flat: FlatKey;
  colorway: ColorwayKey;
  /** The environment colour this stage settles into. */
  bg: string;
}

const STAGES: Stage[] = [
  {
    id: "wear",
    word: "Wear it.",
    line: "Apparel",
    body:
      "Squat-tested at depth. Seam-mapped to the body. Specified on the page so you can check the claim before you buy it.",
    tone: "apparel",
    pose: "front",
    flat: "leggings",
    colorway: "onyx",
    bg: "#07070a",
  },
  {
    id: "train",
    word: "Train in it.",
    line: "Training",
    body:
      "Programmes that read the effort you logged and move the volume accordingly. A coach behind every block, not a PDF behind a paywall.",
    tone: "train",
    pose: "back",
    flat: "compressionTop",
    colorway: "purple",
    bg: "#04120d",
  },
  {
    id: "live",
    word: "Live it.",
    line: "Nutrition & Recovery",
    body:
      "Full-disclosure labels, research-matched doses, and the recovery half that almost nobody bothers to sell you.",
    tone: "fuel",
    pose: "front",
    flat: "tub",
    colorway: "gold",
    bg: "#0c0a05",
  },
];

/**
 * Type needs a sharper curve than the figure does.
 *
 * The triangular falloff crossfades beautifully for a photograph — at the
 * handover both stages sit at 0.5 and read as one dissolving image. Words do
 * not dissolve; two headlines and two paragraphs at 0.5 stack into a double
 * exposure that neither can be read through, which is what "Live it." over
 * "Train in it." was doing at the midpoint. So the copy holds back until its
 * stage is actually dominant and then arrives quickly, leaving a brief clean
 * gap at the handover instead of an illegible overlap.
 */
function typeWeight(w: number) {
  return Math.max(0, Math.min(1, (w - 0.46) / 0.34));
}

/** Triangular falloff — 1 at the stage centre, 0 at its neighbours. */
function stageWeight(p: number, index: number, count: number) {
  const centre = (index + 0.5) / count;
  const span = 1 / count;
  return Math.max(0, 1 - Math.abs(p - centre) / span);
}

export function Sequence() {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const raw = useScrollProgress(ref, "--seq");

  if (reduced) return <SequenceStatic />;

  // The pin occupies the middle of the section's travel; the leading and
  // trailing thirds are entry and exit, so remap to the pinned window.
  const p = Math.min(1, Math.max(0, (raw - 0.15) / 0.7));
  const resolve = Math.min(1, Math.max(0, (p - 0.82) / 0.18));
  // The resolve panel and the last stage's copy are both type in the same
  // place, so they must hand over rather than cross-fade: the stage clears
  // out over the first half of the resolve, and the panel arrives over the
  // second. Cross-fading them stacked "Live it." under "Become Chisseled."
  const typeOut = Math.min(1, resolve * 2);
  const panelIn = Math.max(0, (resolve - 0.45) / 0.55);

  // Blend the environment colour between adjacent stages.
  const idx = Math.min(STAGES.length - 1, Math.floor(p * STAGES.length));
  const bg = STAGES[idx].bg;

  return (
    <section
      ref={ref}
      className="relative h-[420svh] border-t border-bone/10"
      aria-labelledby="sequence-heading"
    >
      {/* Accessible summary — the sequence's argument, available without scroll */}
      <h2 id="sequence-heading" className="sr-only">
        Wear it. Train in it. Live it. Become Chisseled.
      </h2>

      <div
        className="grain vignette flex h-[100svh] items-center overflow-hidden"
        style={{
          // `grain` and `vignette` are utilities that set position: relative,
          // and they beat Tailwind's `sticky` class — so this viewport never
          // pinned. It scrolled away and left the section's four screens of
          // travel showing nothing at all, which is why the homepage's
          // centrepiece read as blank. The pin is the whole mechanism, so it
          // is set where no utility can override it.
          position: "sticky",
          top: 0,
          backgroundColor: bg,
          transition: "background-color 900ms var(--ease-brand)",
        }}
      >
        {/* --- Figure layers, cross-fading --- */}
        {STAGES.map((stage, i) => {
          const w = stageWeight(p, i, STAGES.length);
          return (
            <div
              key={stage.id}
              aria-hidden
              className="absolute inset-0"
              style={{
                opacity: w * (1 - resolve),
                transform: `scale(${1.16 - w * 0.14}) translate3d(${(1 - w) * (i % 2 ? 5 : -5)}%, 0, 0)`,
                // Promote only while this layer is actually on screen. Three
                // full-screen layers at 1670x1044 held ~7MB of GPU texture each,
                // permanently, whether or not they were the visible one.
                willChange: w > 0.01 ? "opacity, transform" : "auto",
              }}
            >
              <Sculpture
                seed={`seq-${stage.id}`}
                tone={stage.tone}
                pose={stage.pose}
                anchor={0.62}
                scale={1.05}
                className="size-full"
              />
            </div>
          );
        })}

        {/* Legibility */}
        <div
          aria-hidden
          className="absolute inset-0 z-[2] bg-gradient-to-r from-black/85 via-black/45 to-transparent"
        />

        {/* --- Product passing through the frame --- */}
        {STAGES.map((stage, i) => {
          const w = stageWeight(p, i, STAGES.length);
          const local = p * STAGES.length - i;
          return (
            <div
              key={`flat-${stage.id}`}
              aria-hidden
              className="absolute right-[6%] top-1/2 z-[3] hidden w-[clamp(9rem,16vw,17rem)] lg:block"
              style={{
                opacity: w * (1 - resolve),
                transform: `translate3d(0, calc(-50% + ${(0.5 - local) * 34}vh), 0) rotate(${(local - 0.5) * 10}deg)`,
                // Promote only while this layer is actually on screen. Three
                // full-screen layers at 1670x1044 held ~7MB of GPU texture each,
                // permanently, whether or not they were the visible one.
                willChange: w > 0.01 ? "opacity, transform" : "auto",
              }}
            >
              <div className="border border-bone/12 bg-black/40 p-3 backdrop-blur-md">
                <Flat
                  flat={stage.flat}
                  colorway={stage.colorway}
                  seed={`seqflat-${stage.id}`}
                  className="size-full"
                />
                <p className="mt-2 px-1 font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-fog">
                  {stage.line}
                </p>
              </div>
            </div>
          );
        })}

        {/* --- Typography --- */}
        <div className="shell relative z-[4] w-full">
          <div className="relative">
            {STAGES.map((stage, i) => {
              const w = stageWeight(p, i, STAGES.length);
              const t = typeWeight(w);
              return (
                <div
                  key={`type-${stage.id}`}
                  className={i === 0 ? "relative" : "absolute inset-0"}
                  style={{
                    opacity: t * (1 - typeOut),
                    // Nothing below the fade threshold should intercept a
                    // pointer or be read out mid-handover.
                    visibility: t > 0.02 ? "visible" : "hidden",
                    transform: `translate3d(0, ${(1 - w) * 40}px, 0) scale(${0.9 + w * 0.1})`,
                    transformOrigin: "left center",
                    // Promote only while this layer is actually on screen. Three
                // full-screen layers at 1670x1044 held ~7MB of GPU texture each,
                // permanently, whether or not they were the visible one.
                willChange: w > 0.01 ? "opacity, transform" : "auto",
                  }}
                  aria-hidden
                >
                  <p className="eyebrow mb-6 text-purple-bright">
                    0{i + 1} — {stage.line}
                  </p>
                  <p className="display-mega mb-7 text-bone">{stage.word}</p>
                  <p className="lede max-w-[44ch] text-fog">{stage.body}</p>
                </div>
              );
            })}

            {/* --- Resolution --- */}
            <div
              className="absolute inset-0 flex flex-col justify-center"
              style={{
                opacity: panelIn,
                transform: `scale(${0.94 + panelIn * 0.06})`,
                transformOrigin: "left center",
                pointerEvents: resolve > 0.5 ? "auto" : "none",
              }}
              aria-hidden={resolve <= 0.5}
            >
              <p className="eyebrow mb-6 text-purple-bright">The Method</p>
              <p className="display-mega text-bone">Become</p>
              <p className="display-mega mb-9 text-purple-bright">Chisseled.</p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/shop" className="btn btn-primary">
                  Shop the collection
                  <ArrowMark className="size-4" />
                </Link>
                <Link href="/method" className="btn btn-ghost">
                  Discover the Method
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* --- Stage index --- */}
        <ol
          aria-hidden
          className="absolute bottom-8 left-[var(--gutter)] z-[5] flex gap-2.5"
        >
          {STAGES.map((stage, i) => {
            const active = Math.floor(p * STAGES.length) === i && resolve < 0.5;
            return (
              <li key={stage.id} className="flex items-center gap-2.5">
                <span
                  className={[
                    "h-px transition-all duration-700 ease-[var(--ease-out-expo)]",
                    active ? "w-14 bg-purple-bright" : "w-7 bg-bone/25",
                  ].join(" ")}
                />
              </li>
            );
          })}
          <li>
            <span
              className={[
                "block h-px transition-all duration-700 ease-[var(--ease-out-expo)]",
                resolve >= 0.5 ? "w-14 bg-purple-bright" : "w-7 bg-bone/25",
              ].join(" ")}
            />
          </li>
        </ol>
      </div>
    </section>
  );
}

/* ==================================================================
   REDUCED MOTION
   The same three-beat argument, laid out rather than animated.
   ================================================================== */

function SequenceStatic() {
  return (
    <section className="border-t border-bone/10 bg-ink section-pad" aria-labelledby="sequence-heading-static">
      <div className="shell">
        <h2 id="sequence-heading-static" className="display-lg mb-14 text-bone">
          Wear it. Train in it. Live it.
        </h2>

        <div className="grid gap-3 lg:grid-cols-3">
          {STAGES.map((stage) => (
            <article
              key={stage.id}
              className="relative grain vignette flex min-h-[30rem] flex-col justify-end overflow-hidden bg-carbon p-8"
              style={{ backgroundColor: stage.bg }}
            >
              <Sculpture
                seed={`seq-${stage.id}`}
                tone={stage.tone}
                pose={stage.pose}
                anchor={0.55}
                scale={0.9}
                className="absolute inset-0 size-full"
              />
              <span aria-hidden className="absolute inset-0 z-[2] bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

              <div className="relative z-[3]">
                <p className="eyebrow mb-4 text-purple-bright">{stage.line}</p>
                <p className="display-md mb-4 text-bone">{stage.word}</p>
                <p className="text-body-sm leading-relaxed text-fog">{stage.body}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-14 border-t border-bone/10 pt-14">
          <p className="display-xl text-bone">Become</p>
          <p className="display-xl mb-9 text-purple-bright">Chisseled.</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/shop" className="btn btn-primary">
              Shop the collection
              <ArrowMark className="size-4" />
            </Link>
            <Link href="/method" className="btn btn-ghost">
              Discover the Method
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
