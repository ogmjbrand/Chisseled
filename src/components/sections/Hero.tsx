"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
  /**
   * A slug under /media/product. The hero shows the same matted file the grid
   * and the PDP show — there is no second copy to fall out of date when a
   * matte is corrected.
   */
  cutout: string;
  script: string;
  word: string;
  accent: string;
  onAccent: string;
  specs: { k: string; v: string }[];
}

const SLIDES: Slide[] = [
  {
    slug: "scarred-hoodie",
    cutout: "scarred-hoodie--onyx",
    script: "The signature",
    word: "SCARRED",
    accent: "#6d28d9",
    onAccent: "#f5f5f5",
    specs: [
      { k: "380 GSM", v: "Brushed fleece" },
      { k: "5 colourways", v: "Stronger today" },
      { k: "$118", v: "Oversized cut" },
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

/** Shared type spec for the oversized word, so probe and render cannot drift. */
const WORD_CLASS =
  "whitespace-nowrap text-center font-display font-black leading-[0.78] tracking-[-0.05em]";
const WORD_STYLE: React.CSSProperties = { fontStretch: "112%" };

/**
 * Size each word so it spans the frame without losing a letter off the edge.
 *
 * The previous version guessed an average character advance and multiplied.
 * That guess was wrong for this face at font-stretch 112% — SCARRED rendered
 * about twice the viewport wide, so the storefront's own name read "CARRE".
 * A display face's advance is not derivable from a character count, so it is
 * measured instead: one offscreen probe per word at a known size gives the
 * exact width-per-pixel ratio, and the real size falls out of it.
 */
function useFittedWords(words: string[]) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<number[]>(() => words.map(() => 0));

  useLayoutEffect(() => {
    const PROBE = 100;

    const measure = () => {
      const host = hostRef.current;
      if (!host) return;
      const avail = host.clientWidth;
      if (!avail) return;

      const probe = document.createElement("span");
      probe.className = WORD_CLASS;
      Object.assign(probe.style, WORD_STYLE, {
        position: "absolute",
        visibility: "hidden",
        left: "-9999px",
        top: "0",
        fontSize: `${PROBE}px`,
      });
      host.appendChild(probe);

      const next = words.map((w) => {
        probe.textContent = w;
        const ratio = probe.getBoundingClientRect().width / PROBE;
        if (!ratio) return 0;
        // 0.94 leaves the terminal letters clear of the frame and keeps the
        // word from running under the slide index on the right.
        return Math.max(40, Math.min((avail * 0.94) / ratio, 340));
      });

      host.removeChild(probe);
      setSize((prev) =>
        prev.length === next.length && prev.every((v, k) => Math.abs(v - next[k]) < 0.5)
          ? prev
          : next,
      );
    };

    measure();
    // Webfonts land after first paint; a measurement taken before they do is
    // a measurement of the fallback face.
    document.fonts?.ready.then(measure).catch(() => {});
    const ro = new ResizeObserver(measure);
    if (hostRef.current) ro.observe(hostRef.current);
    return () => ro.disconnect();
  }, [words]);

  return { hostRef, size };
}

const WORDS = SLIDES.map((s) => s.word);

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const p = useScrollProgress(ref, "--hero-p");
  const exit = Math.max(0, (p - 0.5) * 2);

  const { hostRef, size } = useFittedWords(WORDS);

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
        <div ref={hostRef} className="relative h-full w-full overflow-hidden">
          {SLIDES.map((s, n) => (
            <span
              key={s.slug}
              className={`absolute inset-x-0 flex -translate-y-1/2 justify-center text-bone ${WORD_CLASS}`}
              style={{
                ...WORD_STYLE,
                top: "50%",
                fontSize: size[n] ? `${size[n]}px` : undefined,
                // Hold the word back until it has been measured, so it never
                // flashes at the fallback face's width.
                visibility: size[n] ? "visible" : "hidden",
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
            /* A phone has no spare vertical budget: at full height the garment
               sat directly behind the lede and the buttons, and the scrim that
               made the copy readable flattened the garment to a silhouette. So
               on narrow viewports the subject gets the upper band and the copy
               gets the lower one, and neither has to be dimmed for the other.
               The wide layout keeps the full-height subject — there the split
               already separates them horizontally. */
            className="absolute bottom-[34%] left-[46%] top-[8%] w-[clamp(12rem,34vw,30rem)] lg:inset-y-[6%] lg:left-[38%]"
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
              src={`/media/product/${s.cutout}.webp`}
              alt=""
              fill
              sizes="(min-width: 1024px) 34vw, 70vw"
              priority={n === 0}
              className="object-contain object-bottom drop-shadow-[0_40px_70px_rgba(0,0,0,0.55)]"
            />
          </div>
        ))}
      </div>

      {/* ---------- 4. Numbered index, down the right ----------
          The oversized word passes behind this column, so a fixed ink colour
          is legible against one of them and invisible against the other —
          "01" disappeared entirely where it sat on the white of SCARRED.
          Difference blending resolves it against whatever is actually behind:
          white over black, black over white. */}
      <div
        className="absolute right-[var(--gutter)] top-1/2 z-[7] hidden -translate-y-1/2 flex-col gap-4 lg:flex"
        style={{ mixBlendMode: "difference" }}
      >
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
                "numeric text-micro text-white transition-opacity duration-400",
                n === i ? "opacity-100" : "opacity-45 group-hover:opacity-75",
              ].join(" ")}
            >
              0{n + 1}
            </span>
            <span
              className={[
                "h-px bg-white transition-all duration-[600ms] ease-[var(--ease-out-expo)]",
                n === i ? "w-9 opacity-100" : "w-4 opacity-45 group-hover:w-6 group-hover:opacity-75",
              ].join(" ")}
            />
          </button>
        ))}
      </div>

      {/* ---------- 5. Copy and CTA ----------
          On a narrow viewport the subject and the copy occupy the same band,
          so the lede and the buttons landed on top of the hoodie. This floor
          sits above the subject and below the copy and buys the contrast back
          without dimming the garment across the whole frame. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[46%]"
        style={{
          background:
            "linear-gradient(to top, color-mix(in oklab, var(--color-ink) 78%, transparent), color-mix(in oklab, var(--color-ink) 38%, transparent) 52%, transparent 100%)",
        }}
      />


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
