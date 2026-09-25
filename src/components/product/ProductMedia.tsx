import Image from "next/image";
import { Flat } from "@/components/primitives/Visual";
import { COLORWAYS } from "@/lib/art";
import type { FlatKey, ColorwayKey } from "@/lib/art";

const STUDIO = {
  key: "radial-gradient(58% 48% at 22% 12%, color-mix(in oklab, var(--color-purple) 46%, transparent), transparent 72%)",
  bounce:
    "radial-gradient(46% 42% at 88% 34%, color-mix(in oklab, var(--color-purple-bright) 20%, transparent), transparent 70%)",
  haze:
    "radial-gradient(120% 45% at 50% 96%, color-mix(in oklab, var(--color-purple) 26%, transparent), transparent 68%)",
  floor:
    "linear-gradient(to top, color-mix(in oklab, var(--color-void) 88%, transparent) 0%, color-mix(in oklab, var(--color-void) 34%, transparent) 16%, transparent 34%)",
};

function StudioLighting() {
  return (
    <>
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
    </>
  );
}

interface ProductMediaProps {
  media?: string | Partial<Record<string, string>>;
  flat: FlatKey;
  colorway: ColorwayKey;
  seed: string;
  view: "front" | "detail";
  name: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

function isRemoteImage(source: string): boolean {
  return /^https?:\/\//i.test(source);
}

function resolveImageSource(source: string): string {
  if (isRemoteImage(source)) {
    return source;
  }

  return `/media/product/${source}.webp`;
}

function getColorName(colorway: ColorwayKey): string {
  const color = COLORWAYS[colorway];

  return color?.name ?? colorway;
}

function getMediaSource(
  media: string | Partial<Record<string, string>> | undefined,
  colorway: ColorwayKey,
): string | undefined {
  if (!media) {
    return undefined;
  }

  if (typeof media === "string") {
    return media;
  }

  return media[colorway] ?? Object.values(media)[0];
}

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
  const colourName = getColorName(colorway);
  const shot = getMediaSource(media, colorway);

  if (shot && view === "front") {
    const imageSrc = resolveImageSource(shot);

    return (
      <span
        className={`relative block size-full overflow-hidden ${className}`}
        style={{ backgroundColor: "var(--color-ink)" }}
      >
        <StudioLighting />

        <span
          aria-hidden
          className="absolute inset-x-[18%] bottom-[7%] h-[9%]"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 50%, color-mix(in oklab, var(--color-void) 78%, transparent), transparent 72%)",
          }}
        />

        <Image
          src={imageSrc}
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
    <span
      className={`relative block size-full overflow-hidden ${className}`}
      style={{ backgroundColor: "var(--color-ink)" }}
    >
      <StudioLighting />

      <Flat
        flat={flat}
        colorway={colorway}
        seed={seed}
        view={view}
        className="relative size-full"
        label={`${name} in ${colourName}, ${view} view — technical drawing`}
      />
    </span>
  );
}

export function MediaNote() {
  return (
    <p className="mt-3 text-caption text-ash">
      Technical drawing. Studio photography for this piece is in production.
    </p>
  );
}