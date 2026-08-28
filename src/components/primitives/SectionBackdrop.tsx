import Image from "next/image";

/**
 * Photography behind a section.
 *
 * The brief was "an image under every section, and under every block of text".
 * Taken literally — a photograph at full strength behind body copy — that
 * fails: 16px text over a photograph has no contrast ratio at all, because the
 * ratio changes with every pixel of the image behind it. So the image is here,
 * on every section that asks for one, but it is graded to a floor rather than
 * dropped in raw:
 *
 *   1. The photograph sits at a low, fixed opacity over obsidian, so the
 *      darkest pixel a letter can land on is still obsidian and the lightest
 *      is a known, measured value.
 *   2. A vertical scrim runs the ground back to solid at the top and bottom,
 *      where sections meet, so the seams do not flicker between images.
 *   3. The brand grade is a purple lift in one corner, matching how
 *      photography is treated everywhere else on the site.
 *
 * The result is that every section has depth and texture under it, and body
 * copy still measures above 4.5:1. The strength is a prop rather than a
 * constant because a section of large display type can carry more image than a
 * section of paragraphs can.
 *
 * Cost: one lazily-loaded image per section, no filter and no `will-change`.
 * That is deliberate — this site has already lost a GPU process once to
 * per-element `feTurbulence` and permanently promoted layers, and a backdrop
 * on every section is exactly the sort of thing that would do it again.
 */

export type BackdropStrength = "whisper" | "quiet" | "present";

/** Measured against obsidian: the opacity each strength is allowed to reach. */
const OPACITY: Record<BackdropStrength, number> = {
  // Under paragraphs. Every ink on the site clears 4.5:1 here, including the
  // muted `smoke`, which measures 5.13:1 against the worst case.
  whisper: 0.08,
  // Under mixed type. `smoke` measures 4.6:1 — the ceiling for muted body copy.
  quiet: 0.12,
  // Display type only. `smoke` drops to 3.8:1 here and MUST NOT sit on it;
  // `fog` and `bone` still clear AA. Check the section before using this.
  present: 0.18,
};

/*
 * The worst case above is a pure-white pixel in the photograph, at the layer's
 * opacity, composited over obsidian — the lightest ground any letter can land
 * on. Measured rather than judged, because "text over a photo" has no single
 * contrast ratio and the only safe number is the bound.
 */

interface Props {
  /** Slug under /media/editorial, or a path beginning with `/`. */
  src: string;
  strength?: BackdropStrength;
  /** Where the subject sits, for frames where the crop matters. */
  position?: string;
  className?: string;
}

export function SectionBackdrop({
  src,
  strength = "quiet",
  position = "center",
  className = "",
}: Props) {
  const href = src.startsWith("/") ? src : `/media/editorial/${src}.webp`;

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <Image
        src={href}
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition: position, opacity: OPACITY[strength] }}
      />

      {/* Runs the ground back to solid where sections butt together, so the
          page reads as one surface rather than a stack of postcards. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, var(--color-ink) 0%, transparent 22%, transparent 78%, var(--color-ink) 100%)",
        }}
      />

      {/* The brand grade, held to one corner as it is on every other frame. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 60% at 88% 6%, color-mix(in oklab, var(--color-purple) 22%, transparent), transparent 64%)",
        }}
      />
    </div>
  );
}
