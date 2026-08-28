import Image from "next/image";

/**
 * The CH shield — the real mark, not a redrawing of it.
 *
 * The header and footer used to carry a hand-drawn `Monogram`, an angular "C"
 * that predated the brand having a logo. It no longer matches the identity it
 * is standing in for, which on the one element that appears on every page is
 * the worst place to be approximate.
 *
 * The supplied artwork is an additive glow on pure black, so it has been keyed
 * on its own luminance: bright where the mark is, transparent where the ground
 * was. That gives an asset that composites correctly on any surface with plain
 * alpha — no `mix-blend-mode: screen`, which would otherwise have to fight the
 * translucent, blurred header background it sits on.
 */
export function BrandMark({
  className = "",
  priority = false,
  tone = "mono",
}: {
  className?: string;
  priority?: boolean;
  /**
   * `mono` is the chrome mark — bone ink, coverage taken from the artwork's
   * own luminance. It exists because the full-colour shield sank into the
   * purple hero block it sits over in the header: a brand mark disappearing
   * into the brand colour. `colour` is the real artwork, for surfaces dark
   * enough to carry it.
   */
  tone?: "mono" | "colour";
}) {
  return (
    <Image
      src={
        tone === "mono"
          ? "/media/brand/ch-shield-mono.webp"
          : "/media/brand/ch-shield.webp"
      }
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
