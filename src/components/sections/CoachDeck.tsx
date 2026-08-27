"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { EditorialImage } from "@/components/primitives/EditorialImage";
import { Sculpture } from "@/components/primitives/Visual";
import { ArrowMark } from "@/components/primitives/Marks";
import type { Athlete } from "@/lib/types";

/**
 * The coaching bench, built on the card-gallery reference.
 *
 * The reference's mechanic is a deck, not a slider: the whole set stays
 * physically present behind the active card, fanned back and desaturated, so
 * you can see how deep the bench is while reading one person at a time.
 * Advancing pulls the next card forward through the stack rather than sliding
 * the set sideways. The name sits beside the deck between two rules, with the
 * role under it and a dot index below — the deck carries the face, the type
 * carries the credential.
 *
 * Why here. This section answers "who wrote the programme you are about to
 * follow", and that is a question you read one answer at a time — the grid it
 * replaced showed three coaches at once and invited none of them to be read.
 * The reference's content shape is already this section's content shape:
 * portrait, name, role, discipline, one line in their own voice.
 *
 * The photography is the real thing, as everywhere else. Coaches without a
 * photograph fall back to the procedural figure rather than borrowing someone
 * else's face.
 */

export function CoachDeck({ coaches }: { coaches: Athlete[] }) {
  const [i, setI] = useState(0);
  const [reduced, setReduced] = useState(false);
  const uid = useId();
  const liveRef = useRef<HTMLParagraphElement>(null);
  const n = coaches.length;

  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);

  const go = useCallback((next: number) => setI(((next % n) + n) % n), [n]);

  if (!n) return null;
  const active = coaches[i];

  // The fan grows up and to the right, so that band is reserved inside the
  // frame rather than allowed to grow out of it — pushing the cards outward
  // put 22px of horizontal overflow on a 390px viewport.
  const FAN_X = 26;
  const FAN_Y = 20;
  const reserveX = FAN_X * (n - 1);
  const reserveY = FAN_Y * (n - 1);

  return (
    <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-16">
      {/* ---------- The deck ---------- */}
      <div className="relative mx-auto aspect-[3/4] w-full max-w-[24rem] overflow-hidden">
        {coaches.map((c, k) => {
          // Distance from the front of the stack, wrapping, so the deck is a
          // loop rather than a pile that empties.
          const d = (k - i + n) % n;
          const front = d === 0;
          return (
            <div
              key={c.slug}
              aria-hidden={!front}
              className="grain vignette overflow-hidden border border-bone/10 bg-ink"
              style={{
                // `grain` and `vignette` are utilities that set position:
                // relative, and they win over Tailwind's `absolute` class —
                // which collapsed every card in the stack to 2px tall. The
                // stack's geometry is not negotiable, so it is set here, where
                // nothing can override it.
                position: "absolute",
                left: 0,
                bottom: 0,
                right: reserveX,
                top: reserveY,
                zIndex: n - d,
                // The fan has to clear the front card or the deck reads as a
                // single photo: each step back moves right, lifts, tilts and
                // shrinks, so the bench is legible as a count at a glance.
                transform: `translate3d(${d * FAN_X}px, ${d * -FAN_Y}px, 0) rotate(${d * 1.6}deg) scale(${1 - d * 0.06})`,
                opacity: front ? 1 : Math.max(0.3, 0.62 - d * 0.14),
                filter: front ? "none" : `grayscale(1) brightness(${0.75 - d * 0.1})`,
                transition: reduced
                  ? "opacity 1ms"
                  : "transform 720ms var(--ease-out-expo), opacity 520ms linear, filter 520ms linear",
              }}
            >
              {c.photo ? (
                <EditorialImage
                  src={c.photo}
                  alt={front ? `${c.name}, ${c.role}` : ""}
                  sizes="(min-width: 1024px) 22rem, 90vw"
                  className="size-full"
                />
              ) : (
                <Sculpture
                  seed={`coach-${c.slug}`}
                  tone={c.tone}
                  pose={c.pose}
                  anchor={0.5}
                  scale={0.92}
                  className="size-full"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ---------- The credential ---------- */}
      <div>
        <p className="eyebrow mb-4 text-purple-bright">{active.discipline}</p>

        {/* Name between two rules, as the reference sets it. */}
        <div className="mb-3 flex items-center gap-4">
          <span aria-hidden className="h-px w-8 shrink-0 bg-bone/25 sm:w-12" />
          <h3 className="display-sm min-w-0 text-bone">{active.name}</h3>
          <span aria-hidden className="h-px flex-1 bg-bone/25" />
        </div>

        <p className="mb-7 font-mono text-micro uppercase tracking-[0.12em] text-smoke">
          {active.role} · {active.location}
        </p>

        <blockquote className="mb-8 border-l-2 border-purple/50 pl-5">
          <p className="text-body leading-relaxed text-fog">“{active.quote}”</p>
        </blockquote>

        <dl className="mb-9 flex flex-wrap gap-x-10 gap-y-4 border-t border-bone/10 pt-5">
          {active.stats.map((s) => (
            <div key={s.label}>
              <dt className="eyebrow mb-1.5">{s.label}</dt>
              <dd className="numeric text-h6 text-bone">{s.value}</dd>
            </div>
          ))}
        </dl>

        {/* Controls. The dots are the reference's index; the arrows exist
            because a dot row alone is a poor target on a phone. */}
        <div className="flex items-center gap-5">
          <div className="flex gap-2.5" role="tablist" aria-label="Coaches">
            {coaches.map((c, k) => (
              <button
                key={c.slug}
                type="button"
                role="tab"
                id={`${uid}-tab-${k}`}
                aria-selected={k === i}
                aria-label={c.name}
                onClick={() => go(k)}
                className="grid size-6 place-items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-bright"
              >
                <span
                  className={[
                    "block rounded-full transition-all duration-500",
                    k === i ? "size-2.5 bg-purple-bright" : "size-1.5 bg-bone/30 hover:bg-bone/60",
                  ].join(" ")}
                />
              </button>
            ))}
          </div>

          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => go(i - 1)}
              aria-label="Previous coach"
              className="grid size-10 place-items-center border border-bone/15 text-fog transition-colors hover:border-bone/40 hover:text-bone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-bright"
            >
              <ArrowMark className="size-4 rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => go(i + 1)}
              aria-label="Next coach"
              className="grid size-10 place-items-center border border-bone/15 text-fog transition-colors hover:border-bone/40 hover:text-bone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-bright"
            >
              <ArrowMark className="size-4" />
            </button>
          </div>
        </div>

        {/* The deck is a visual change; screen readers get it in words. */}
        <p ref={liveRef} aria-live="polite" className="sr-only">
          {active.name}, {active.role}. {i + 1} of {n}.
        </p>
      </div>
    </div>
  );
}
