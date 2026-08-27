import Image from "next/image";

interface EditorialImageProps {
  /** Slug under /media/editorial. */
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  /**
   * How hard the purple grade bites. `signal` is the default and stays a rim;
   * `deep` is for full-bleed frames that need to carry type over them.
   */
  grade?: "signal" | "deep" | "none";
  /** Position of the subject, for frames where the crop matters. */
  position?: string;
  className?: string;
}

/**
 * Photography, graded into the Black x Purple environment.
 *
 * The treatment is a rim and a floor, not a wash: a purple-lifted shadow at
 * one corner and an obsidian gradient at the base so type stays legible over
 * it. Colour survives in the midtones, which is the point — these are real
 * photographs of real people, and draining them to a duotone would make the
 * whole site look like a template.
 */
export function EditorialImage({
  src,
  alt,
  sizes = "100vw",
  priority = false,
  grade = "signal",
  position = "center",
  className = "",
}: EditorialImageProps) {
  return (
    <div className={`relative overflow-hidden bg-ink ${className}`}>
      <Image
        src={`/media/editorial/${src}.webp`}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
        style={{ objectPosition: position }}
      />

      {grade !== "none" && (
        <>
          {/* Purple rim — the brand signal, held to one corner */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(70% 90% at 82% 8%, color-mix(in oklab, var(--color-purple) 55%, transparent), transparent 62%)",
              mixBlendMode: "screen",
              opacity: grade === "deep" ? 0.5 : 0.34,
            }}
          />
          {/* Obsidian floor — legibility, not decoration */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, var(--color-ink) 4%, color-mix(in oklab, var(--color-ink) 74%, transparent) 34%, transparent 68%)",
              opacity: grade === "deep" ? 1 : 0.82,
            }}
          />
          {/* Cools the untouched midtones toward the palette */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-purple-shade"
            style={{ mixBlendMode: "color", opacity: grade === "deep" ? 0.3 : 0.18 }}
          />
        </>
      )}
    </div>
  );
}
