import Image from "next/image";
import { Flat } from "@/components/primitives/Visual";
import { COLORWAYS } from "@/lib/art";
import type { FlatKey, ColorwayKey } from "@/lib/art";

/**
 * Which of the three brand gradients a product sits on. Derived from the slug
 * so it is stable across renders and spreads neighbouring cards apart.
 */
function backdropFor(slug: string) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return `grad-${(h % 3) + 1}`;
}

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
      <span className={`relative block size-full overflow-hidden ${className}`}>
        {/* The garments are cut out on transparency, and most of them are
            black. On a black pane a black hoodie has nothing to sit against —
            the silhouette dissolves into the surface. The brand gradient gives
            the cutout a ground to read against, and which of the three a
            product gets is derived from its own slug so a card looks the same
            on every visit and adjacent cards do not land on the same one.

            Held well back. The gradient's job is to separate a black garment
            from a black page, and that only needs the ground to stop being
            the same colour as the product — past that it starts competing
            with the merchandise, which on a shop page is backwards. At 0.5
            the magenta reads as a lit wall rather than as artwork. */}
        <Image
          src={`/media/backdrop/${backdropFor(shot)}.webp`}
          alt=""
          aria-hidden
          fill
          sizes={sizes}
          className="object-cover"
          style={{ opacity: 0.5 }}
        />
        {/* Settles the gradient into the page: dark at the base so the garment
            has weight, and never so bright at the top that a light colourway
            loses its edge. Eased along with the gradient — two layers pulled
            down at once would have taken the middle of the pane back to the
            flat black the gradient exists to break up. */}
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, color-mix(in oklab, var(--color-ink) 72%, transparent), color-mix(in oklab, var(--color-ink) 14%, transparent) 55%, color-mix(in oklab, var(--color-ink) 30%, transparent) 100%)",
          }}
        />
        <Image
          src={`/media/product/${shot}.webp`}
          alt={`${name} in ${colourName}`}
          width={1400}
          height={1400}
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
