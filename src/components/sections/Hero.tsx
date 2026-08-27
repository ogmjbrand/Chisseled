"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useScrollProgress } from "@/lib/motion";
import { ArrowMark } from "@/components/primitives/Marks";

/**
 * Hero, built on the car-slider reference.
 *
 * What makes that reference work, and what is reproduced here:
 *   1. A hard vertical split — saturated colour block against black — with
 *      the subject straddling the seam so it reads as one composition rather
 *      than two panels.
 *   2. An oversized condensed word sitting BEHIND the subject. The overlap is
 *      the whole trick: it puts the product in front of the brand.
 *   3. A small script line above the big word, for contrast of voice.
 *   4. Type and subject travelling at different rates on transition, so the
 *      slide has depth instead of sliding as one flat plane.
 *   5. A spec strip along the bottom and a numbered index down the side —
 *      the "catalogue" register that makes it feel like a product, not an ad.
 *
 * The assets are CHISSELED's own: real garment cutouts, real fabric weights,
 * real prices. Nothing from the reference clip ships.
 */

interface Slide {
  slug: string;
  cutout: string;
  script: string;
  word: string;
  accent: string;
  onAccent: string;
  specs: { k: string; v: string }[];
}

const SLIDES: Slide[] = [
  {
    slug: "heavyweight-hoodie-set",
    cutout: "hoodie-green",
    script: "The layer",
    word: "HEAVY",
    accent: "#6d28d9",
    onAccent: "#f5f5f5",
    specs: [
      { k: "420 GSM", v: "Brushed fleece" },
      { k: "3 colourways", v: "Dyed as a set" },
      { k: "$158", v: "Two pieces" },
    ],
  },
  {
    slug: "fitted-training-set",
    cutout: "fitted-set",
    script: "The session",
    word: "FITTED",
    accent: "#7c3aed",
    onAccent: "#f5f5f5",
    specs: [
      { k: "280 GSM", v: "Double-knit" },
      { k: "Squat-tested", v: "Opacity at depth" },
      { k: "$95", v: "Top and legging" },
    ],
  },
  {
    slug: "tech-fleece-set",
    cutout: "hoodie-set-gray",
    script: "The move",
    word: "TECH",
    accent: "#3b0f7a",
    onAccent: "#f5f5f5",
    specs: [
      { k: "3-layer", v: "Bonded fleece" },
      { k: "Articulated", v: "Shaped at the knee" },
      { k: "$168", v: "Two pieces" },
    ],
  },
];

const DWELL = 6200;

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const p = useScrollProgress(ref, "--hero-p");
  const exit = Math.max(0, (p - 0.5) * 2);

  const [i, setI] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);

  // Auto-advance, but never against someone who asked for stillness, and
  // never while they are reading a slide they chose.
  useEffect(() => {
    if (reduced || paused) return;
    const t = setInterval(() => setI((n) => (n + 1) % SLIDES.length), DWELL);
    return () => clearInterval(t);
  }, [reduced, paused]);

  const go = useCallback((n: number) => {
    setI(n);
    setPaused(true);
  }, []);

  const slide = SLIDES[i];

  return (
    <section
      ref={ref}
      className="relative grain flex min-h-[100svh] flex-col justify-end overflow-hidden bg-ink"
      aria-labelledby="hero-heading"
      aria-roledescription="carousel"
    >
      {/* ---------- 1. The split. Colour block against obsidian. ---------- */}
      <div className="absolute inset-0" aria-hidden>
        <div
          className="absolute inset-y-0 left-0 w-[46%] transition-[background-color] duration-[900ms] ease-[var(--ease-out-expo)] lg:w-[38%]"
          style={{ backgroundColor: slide.accent }}
        />
        <div className="absolute inset-y-0 right-0 w-[54%] bg-ink lg:w-[62%]" />
      </div>

      {/* ---------- 2. The oversized word, behind the subject ---------- */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center"
        style={{
          transform: `translate3d(0, ${exit * -5}%, 0)`,
          opacity: 1 - exit * 0.8,
        }}
      >
        <div className="relative h-full w-full overflow-hidden">
          {SLIDES.map((s, n) => (
            <span
              key={s.slug}
              className="absolute inset-x-0 flex -translate-y-1/2 justify-center whitespace-nowrap text-center font-display font-black leading-[0.78] tracking-[-0.05em] text-bone"
              style={{
                top: "50%",
                fontSize: "clamp(4.5rem, 20vw, 20rem)",
                fontStretch: "112%",
                // Type trails the subject: slower, and it fades rather than flies.
                transform: `translate3d(${(n - i) * 26}%, -50%, 0)`,
                opacity: n === i ? 1 : 0,
                transition: reduced
                  ? "opacity 1ms"
                  : "transform 1100ms var(--ease-out-expo), opacity 700ms linear",
              }}
            >
              {s.word}
            </span>
          ))}
        </div>
      </div>

      {/* ---------- 3. The subject, straddling the seam, in front ---------- */}
      <div
        aria-hidden
        className="absolute inset-0 z-[3]"
        style={{
          transform: `translate3d(0, ${exit * -8}%, 0) scale(${1 + exit * 0.05})`,
          opacity: 1 - exit * 0.7,
        }}
      >
        {SLIDES.map((s, n) => (
          <div
            key={s.slug}
            className="absolute inset-y-[6%] left-[46%] w-[clamp(15rem,34vw,30rem)] lg:left-[38%]"
            style={{
              // Subject leads: further and faster than the word behind it.
              transform: `translate3d(calc(-50% + ${(n - i) * 62}%), 0, 0)`,
              opacity: n === i ? 1 : 0,
              transition: reduced
                ? "opacity 1ms"
                : "transform 1100ms var(--ease-out-expo), opacity 520ms linear",
            }}
          >
            <Image
              src={`/media/cutout/${s.cutout}.webp`}
              alt=""
              fill
              sizes="(min-width: 1024px) 34vw, 70vw"
              priority={n === 0}
              className="object-contain object-bottom drop-shadow-[0_40px_70px_rgba(0,0,0,0.55)]"
            />
          </div>
        ))}
      </div>

      {/* ---------- 4. Numbered index, down the right ---------- */}
      <div className="absolute right-[var(--gutter)] top-1/2 z-[7] hidden -translate-y-1/2 flex-col gap-4 lg:flex">
        {SLIDES.map((s, n) => (
          <button
            key={s.slug}
            type="button"
            onClick={() => go(n)}
            aria-label={`Show ${s.word}`}
            aria-current={n === i}
            className="group flex items-center gap-3"
          >
            <span
              className={[
                "numeric text-micro transition-colors duration-400",
                n === i ? "text-bone" : "text-ash group-hover:text-fog",
              ].join(" ")}
            >
              0{n + 1}
            </span>
            <span
              className={[
                "h-px transition-all duration-[600ms] ease-[var(--ease-out-expo)]",
                n === i ? "w-9 bg-bone" : "w-4 bg-ash group-hover:w-6 group-hover:bg-fog",
              ].join(" ")}
            />
          </button>
        ))}
      </div>

      {/* ---------- 5. Copy and CTA ---------- */}
      <div
        className="shell pointer-events-none relative z-[6] pb-[clamp(2rem,5vw,4rem)] pt-[calc(var(--nav-h)+3rem)]"
        style={{
          transform: `translate3d(0, ${exit * -34}px, 0)`,
          opacity: 1 - exit * 1.1,
        }}
      >
        <p className="eyebrow mb-5 text-bone/75">{slide.script}</p>

        <h1 id="hero-heading" className="sr-only">
          CHISSELED — built different. Premium performance apparel, training,
          nutrition and essentials.
        </h1>

        <p className="lede mb-8 max-w-[34ch] text-bone">
          Built different. Apparel, training and fuel engineered to work as one system.
        </p>

        <div className="pointer-events-auto flex flex-col gap-3 sm:flex-row">
          <Link href={`/product/${slide.slug}`} className="btn btn-primary">
            Shop this piece
            <ArrowMark className="size-4" />
          </Link>
          <Link href="/shop" className="btn btn-ghost">
            All collections
          </Link>
        </div>
      </div>

      {/* ---------- 6. Spec strip ---------- */}
      <div className="relative z-[6] border-t border-bone/12 bg-ink/70 backdrop-blur-sm">
        <div className="shell flex items-stretch justify-between gap-6 overflow-x-auto py-4">
          {slide.specs.map((s) => (
            <div key={s.k} className="min-w-0 shrink-0">
              <p className="numeric text-body-sm text-bone">{s.k}</p>
              <p className="eyebrow mt-1 text-ash">{s.v}</p>
            </div>
          ))}
          <div className="ml-auto hidden shrink-0 items-center sm:flex">
            <Link href="/shop" className="link-rule text-caption text-fog">
              Discover now
              <ArrowMark className="ml-2 inline size-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile index */}
      <div className="relative z-[6] flex justify-center gap-2 pb-5 lg:hidden">
        {SLIDES.map((s, n) => (
          <button
            key={s.slug}
            type="button"
            onClick={() => go(n)}
            aria-label={`Show ${s.word}`}
            aria-current={n === i}
            className={[
              "h-1 rounded-full transition-all duration-500",
              n === i ? "w-8 bg-bone" : "w-3 bg-ash",
            ].join(" ")}
          />
        ))}
      </div>
    </section>
  );
}
