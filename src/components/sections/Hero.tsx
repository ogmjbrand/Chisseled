"use client";

import Link from "next/link";
import { useRef } from "react";
import { useScrollProgress } from "@/lib/motion";
import { EditorialImage } from "@/components/primitives/EditorialImage";
import { ArrowMark } from "@/components/primitives/Marks";

/**
 * The hero does not cut to the next section — it dissolves into it. As the
 * viewport leaves, the figure drifts and the type lifts, so the transition
 * reads as one continuous camera move rather than two stacked blocks.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const p = useScrollProgress(ref, "--hero-p");

  // 0 → 0.5 is the section entering; we only care about the exit half.
  const exit = Math.max(0, (p - 0.5) * 2);

  return (
    <section
      ref={ref}
      className="relative grain vignette flex min-h-[100svh] flex-col justify-end overflow-hidden bg-ink"
      aria-labelledby="hero-heading"
    >
      {/*
        The race film is 9:16 phone video. Covering a landscape viewport with
        it would show 35% of the frame and upscale 720p by 2x, so it plays
        full-bleed only where the viewport is itself portrait. On landscape
        the still carries the ground and the film runs at native aspect in
        the composed column below — downscaled, which is where it looks best.
      */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate3d(0, ${exit * -6}%, 0) scale(${1 + exit * 0.08})`,
          opacity: 1 - exit * 0.55,
          willChange: "transform, opacity",
        }}
      >
        <EditorialImage
          src="push-up"
          alt="An athlete holding a one-arm push-up at the bottom of the rep, outdoors at first light."
          sizes="100vw"
          priority
          grade="deep"
          position="72% center"
          className="size-full"
        />
      </div>

      {/* Type legibility gradient — never a flat scrim */}
      <div
        aria-hidden
        className="absolute inset-0 z-[2] bg-gradient-to-t from-ink via-ink/55 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-0 z-[2] bg-gradient-to-r from-ink/85 via-ink/25 to-transparent"
      />

      {/*
        The hero film column lived here. It was wired to the car-race brief but
        pointed at the envelope clip, which belongs on the order confirmation.
        Restore it once the race film is identified: drop a `hero` entry into
        FILMS and render <BrandVideo role="hero" /> in a 9:16 frame — the clip
        is phone video, so it must not be stretched across a landscape hero.
      */}

      {/* --- Content --- */}
      <div
        className="shell relative z-[4] pb-[clamp(3rem,8vw,7rem)] pt-[calc(var(--nav-h)+4rem)]"
        style={{
          transform: `translate3d(0, ${exit * -34}px, 0)`,
          opacity: 1 - exit * 1.1,
        }}
      >
        <p className="eyebrow mb-6 animate-fade text-purple-bright" style={{ animationDelay: "200ms" }}>
          Performance Division — Est. Florida
        </p>

        <h1 id="hero-heading" className="display-mega text-bone">
          <span className="sr-only">
            CHISSELED — built different. Premium performance apparel, training,
            nutrition and essentials.
          </span>

          <span aria-hidden className="block">
            <span data-reveal-line>
              <span>Built</span>
            </span>
            <span
              data-reveal-line
              style={{ "--reveal-delay": "110ms" } as React.CSSProperties}
            >
              <span>
                <em className="not-italic text-purple-bright">different.</em>
              </span>
            </span>
          </span>
        </h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,34rem)_auto] lg:items-end lg:justify-between">
          <p
            className="lede max-w-[46ch] animate-fade"
            style={{ animationDelay: "520ms" }}
          >
            Premium performance apparel, training, nutrition and essentials engineered for
            people committed to becoming more.
          </p>

          <div
            className="flex flex-col gap-3 animate-fade sm:flex-row"
            style={{ animationDelay: "640ms" }}
          >
            <Link href="/shop" className="btn btn-primary">
              Shop the collection
              <ArrowMark className="size-4" />
            </Link>
            <Link href="/method" className="btn btn-ghost">
              Explore the Chisseled Method
            </Link>
          </div>
        </div>

        {/* Live signal strip — the laboratory register */}
        <ul className="mt-12 hidden gap-10 border-t border-bone/10 pt-6 lg:flex">
          {[
            { k: "Athletes", v: "50,000+" },
            { k: "Customer rating", v: "4.9 / 5" },
            { k: "Training sessions logged", v: "100,000+" },
            { k: "Ships from", v: "Florida, worldwide" },
          ].map((s, i) => (
            <li
              key={s.k}
              className="animate-fade"
              style={{ animationDelay: `${760 + i * 80}ms` }}
            >
              <p className="numeric text-h6 text-bone">{s.v}</p>
              <p className="eyebrow mt-1.5">{s.k}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Scroll cue */}
      <div
        aria-hidden
        className="absolute bottom-6 right-[var(--gutter)] z-[4] hidden flex-col items-center gap-3 lg:flex"
        style={{ opacity: 1 - exit * 2 }}
      >
        <span className="font-mono text-micro uppercase tracking-[0.24em] text-ash [writing-mode:vertical-rl]">
          Scroll
        </span>
        <span className="relative h-14 w-px overflow-hidden bg-bone/15">
          <span
            className="absolute inset-x-0 top-0 h-1/2 bg-purple-bright"
            style={{ animation: "chisseled-scan 2.6s var(--ease-in-out-quint) infinite" }}
          />
        </span>
      </div>
    </section>
  );
}
