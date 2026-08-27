import Image from "next/image";
import { Flat } from "@/components/primitives/Visual";
import { COLORWAYS } from "@/lib/art";
import type { FlatKey, ColorwayKey } from "@/lib/art";

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
 * Where real photography exists at a resolution the pane can carry, it is
 * used. Where it does not, we render the technical flat rather than
 * upscaling a 480px packshot or generating a substitute — a product image
 * that subtly differs from what ships is worse than an honest drawing, both
 * for the customer and for the return rate.
 *
 * Photography is front-view only for now, so the detail view falls back to
 * the flat, which is what actually carries construction detail anyway.
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
      <Image
        src={`/media/product/${shot}.webp`}
        alt={`${name} in ${colourName}`}
        width={1400}
        height={1400}
        sizes={sizes}
        priority={priority}
        className={`size-full object-contain ${className}`}
      />
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
