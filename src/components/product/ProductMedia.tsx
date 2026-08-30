import Image from "next/image";
import { Flat } from "@/components/primitives/Visual";
import { COLORWAYS } from "@/lib/art";
import type { FlatKey, ColorwayKey } from "@/lib/art";

/**
 * THE CHISSELED STUDIO.
 *
 * Every photographed product is composited into the same set: an obsidian
 * ground, one purple key from the upper left, a cooler purple bounce opposite
 * it, a floor the subject stands on, and a contact shadow under it. Same light,
 * same direction, same falloff on every product in the catalogue, so a page of
 * them reads as one shoot rather than as forty supplier photographs.
 *
 * It replaced three gradients assigned by a hash of the slug. That was the
 * opposite of a photographic standard: adjacent cards were lit differently for
 * no reason, which is exactly what stops a grid looking like a campaign.
 *
 * WHY THE SET IS DRAWN HERE AND NOT BAKED INTO THE FILES.
 *   1. The assets stay pure product on transparency, so the look is one file to
 *      change rather than eighty images to reprocess.
 *   2. Nothing is ever composited INTO the garment. The product pixels are the
 *      supplier's, scaled and positioned by scripts/studio.py and otherwise
 *      untouched — no relighting, no sharpening, no generative fill. At the
 *      resolutions in this catalogue a generative upscaler has no real detail
 *      to recover, so it invents seams, logo edges and camouflage. An invented
 *      seam on a real product is a lie about the merchandise. Soft and true
 *      beats sharp and wrong.
 *
 * Cost: four gradient layers and one image per pane. No filter, no blend mode,
 * no `will-change` — this site has already lost a GPU process once to
 * per-element effects, and product cards are the most-repeated element there is.
 */

const STUDIO = {
  /* The key. Upper left on every product, so highlights fall the same way. */
  key: "radial-gradient(58% 48% at 22% 12%, color-mix(in oklab, var(--color-purple) 46%, transparent), transparent 72%)",
  /* The bounce, opposite and cooler, so the far side is not dead black. */
  bounce:
    "radial-gradient(46% 42% at 88% 34%, color-mix(in oklab, var(--color-purple-bright) 20%, transparent), transparent 70%)",
  /* Haze low in the frame — the drifting smoke a dark studio set is lit through. */
  haze: "radial-gradient(120% 45% at 50% 96%, color-mix(in oklab, var(--color-purple) 26%, transparent), transparent 68%)",
  /* The floor. A horizon low in the frame gives the subject somewhere to stand. */
  floor:
    "linear-gradient(to top, color-mix(in oklab, var(--color-void) 88%, transparent) 0%, color-mix(in oklab, var(--color-void) 34%, transparent) 16%, transparent 34%)",
};

interface ProductMediaProps {
  /** One shot, or a shot per colourway. */
  media?: string | Partial<Record<string, string>>;
  flat: FlatKey;
  colorway: ColorwayKey;
  seed: string;
  view: "front" | "detail";
  name: string;
  /** Rendered width in CSS px at the largest breakpoint, for sizing the srcset. */
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * The single decision point for what a product looks like.
 *
 * Where real photography exists it is used. Where it does not, we render the
 * technical flat rather than upscaling a 240px packshot or generating a
 * substitute — a product image that subtly differs from what ships is worse
 * than an honest drawing, both for the customer and for the return rate.
 *
 * Photography is front-view only for now, so the detail view falls back to the
 * flat, which is what actually carries construction detail anyway.
 */
export function ProductMedia({
  media,
  flat,
  colorway,
  seed,
  view,
  name,
  sizes = "(min-width: 1024px) 45vw, 100vw",
  priority = false,
  className = "",
}: ProductMediaProps) {
  const colourName = COLORWAYS[colorway]?.name ?? colorway;

  // Per-colourway photography resolves to the chosen colour; a bare string is
  // one shot for every colour. A colour we have not photographed falls through
  // to the flat rather than showing a different colour's garment.
  const shot = typeof media === "string" ? media : media?.[colorway];

  if (shot && view === "front") {
    return (
      <span
        className={`relative block size-full overflow-hidden ${className}`}
        style={{ backgroundColor: "var(--color-ink)" }}
      >
        <span
          aria-hidden
          className="absolute inset-0"
          style={{ background: STUDIO.haze }}
        />
        <span
          aria-hidden
          className="absolute inset-0"
          style={{ background: STUDIO.key }}
        />
        <span
          aria-hidden
          className="absolute inset-0"
          style={{ background: STUDIO.bounce }}
        />
        <span
          aria-hidden
          className="absolute inset-0"
          style={{ background: STUDIO.floor }}
        />

        {/* The contact shadow. An ellipse under the subject, at the height the
            floor meets it — without one the cutout hovers, which is the single
            clearest tell that a product was pasted onto a background rather
            than photographed on it. scripts/studio.py seats every subject at
            the same fraction of the frame so this lands correctly on all of
            them. */}
        <span
          aria-hidden
          className="absolute inset-x-[18%] bottom-[7%] h-[9%]"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 50%, color-mix(in oklab, var(--color-void) 78%, transparent), transparent 72%)",
          }}
        />

        <Image
          src={`/media/product/${shot}.webp`}
          alt={`${name} in ${colourName}`}
          width={1400}
          height={1867}
          sizes={sizes}
          priority={priority}
          className="relative size-full object-contain"
        />
      </span>
    );
  }

  return (
    <Flat
      flat={flat}
      colorway={colorway}
      seed={seed}
      view={view}
      className={`size-full ${className}`}
      label={`${name} in ${colourName}, ${view} view — technical drawing`}
    />
  );
}

/**
 * Shown alongside the flat so nobody mistakes a drawing for a photograph.
 * Deliberately plain: this is a note about the catalogue, not a promotion.
 */
export function MediaNote() {
  return (
    <p className="mt-3 text-caption text-ash">
      Technical drawing. Studio photography for this piece is in production.
    </p>
  );
}
