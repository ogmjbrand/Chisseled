import Image from "next/image";

/**
 * The CH shield — the real mark, in the brand's own colour.
 *
 * The header and footer used to carry a hand-drawn `Monogram`, an angular "C"
 * that predated the brand having a logo. It no longer matched the identity it
 * stood in for, which on the one element that appears on every page is the
 * worst place to be approximate.
 *
 * The supplied artwork is an additive glow on pure black, so it has been keyed
 * on its own luminance: bright where the mark is, transparent where the ground
 * was. That gives an asset that composites correctly on any surface with plain
 * alpha — no `mix-blend-mode: screen`, which would otherwise have to fight the
 * translucent, blurred header background it sits on.
 *
 * THE MARK IS NEVER RECOLOURED. There was briefly a bone monochrome variant,
 * introduced because the shield sank into the purple block behind the header
 * over the hero. Repainting a logo to solve a legibility problem is fixing the
 * wrong object: the mark is fixed and the ground is the variable. The header
 * carries its own scrim instead, and the shield ships in the colour it was
 * drawn in everywhere it appears.
 */
export function BrandMark({
  className = "",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/media/brand/ch-shield.webp"
      alt=""
      width={512}
      height={569}
      priority={priority}
      // The mark is decorative wherever it appears: every use sits beside the
      // CHISSELED wordmark or inside a link that already names itself.
      aria-hidden
      className={className}
      sizes="48px"
    />
  );
}

/** The full lockup — shield over wordmark. For places that carry no other name. */
export function BrandLockup({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/media/brand/logo.webp"
      alt="CHISSELED"
      width={1024}
      height={655}
      className={className}
      sizes="(min-width: 1024px) 22rem, 60vw"
    />
  );
}
