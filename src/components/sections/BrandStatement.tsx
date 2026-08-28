"use client";

import Link from "next/link";
import { SectionBackdrop } from "@/components/primitives/SectionBackdrop";
import { useRef } from "react";
import { useScrollProgress } from "@/lib/motion";

/**
 * A luxury campaign beat, not an "About Us" block. The type is the image:
 * two lines of oversized display that separate as the section passes.
 */
export function BrandStatement() {
  const ref = useRef<HTMLElement>(null);
  const p = useScrollProgress(ref, "--stmt-p");

  const drift = (p - 0.5) * 2;

  return (
    <section
      ref={ref}
      className="relative grain overflow-hidden border-y border-bone/10 bg-ink section-pad"
      aria-labelledby="statement-heading"
    >
      <SectionBackdrop src="mountain" strength="quiet" />

      {/* A single purple plane, barely there */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 h-[42rem] -translate-y-1/2 opacity-[0.16]"
        style={{
          background:
            "radial-gradient(58% 46% at 50% 50%, var(--color-purple-shade), transparent 72%)",
        }}
      />

      <div className="shell relative z-[3]">
        <p className="eyebrow mb-14">01 — The Philosophy</p>

        <h2 id="statement-heading" className="mb-16">
          <span className="sr-only">Your body is the project. Build it.</span>

          <span aria-hidden className="block">
            <span
              data-reveal-line
              className="display-mega block text-bone"
              style={{ transform: `translate3d(${drift * -3}%, 0, 0)` }}
            >
              <span>Your body is</span>
            </span>
            <span
              data-reveal-line
              className="display-mega block text-bone"
              style={
                {
                  "--reveal-delay": "90ms",
                  transform: `translate3d(${drift * 4}%, 0, 0)`,
                } as React.CSSProperties
              }
            >
              <span>the project.</span>
            </span>
            <span
              data-reveal-line
              className="display-mega block text-purple-bright"
              style={
                {
                  "--reveal-delay": "180ms",
                  transform: `translate3d(${drift * -6}%, 0, 0)`,
                } as React.CSSProperties
              }
            >
              <span>Build it.</span>
            </span>
          </span>
        </h2>

        <div className="grid gap-10 border-t border-bone/10 pt-12 lg:grid-cols-3 lg:gap-16">
          <p className="lede max-w-[42ch] text-bone lg:col-span-2" data-reveal>
            Most performance brands sell you an image of the person you want to be. We would
            rather sell the things that produce them — apparel engineered to survive five
            sessions a week, programmes written by coaches who log their own work, and
            nutrition with the whole label on the front.
          </p>

          <div data-reveal style={{ "--reveal-delay": "140ms" } as React.CSSProperties}>
            <ul className="mb-8 space-y-4">
              {[
                ["Look Chisseled.", "Apparel that earns its place in the drawer."],
                ["Move Chisseled.", "Programmes that adapt to the effort you actually log."],
                ["Live Chisseled.", "Nutrition, recovery and a community that keeps going."],
              ].map(([title, body]) => (
                <li key={title} className="border-l border-purple/40 pl-5">
                  <p className="font-display text-h6 font-bold uppercase tracking-tight text-bone">
                    {title}
                  </p>
                  <p className="mt-1 text-body-sm text-smoke">{body}</p>
                </li>
              ))}
            </ul>

            <Link href="/about" className="btn btn-ghost btn-sm">
              Read our story
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
