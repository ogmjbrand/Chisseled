import Link from "next/link";
import Image from "next/image";
import type { Tone } from "@/lib/art";

/**
 * Real training photography behind every route header, keyed by the same
 * `tone` each page already passed to the procedural figure this replaced.
 * One photo per tone, reused across pages the way SectionBackdrop already
 * reuses these same files lower on the homepage — a small real library
 * stretched deliberately, not a fabricated one grown to match.
 */
const TONE_BACKDROP: Record<Tone, string> = {
  apparel: "trail",
  train: "push-up",
  fuel: "mountain",
  recover: "swim",
  void: "rope-climb",
  bone: "trail",
};

/**
 * The standard route opening: a breadcrumb, an oversized editorial
 * headline, and a real photograph behind it. Consistent enough that every
 * route feels like the same brand, varied enough by tone that none of
 * them feel like the same page.
 */
export function PageHeader({
  eyebrow,
  title,
  lede,
  tone = "void",
  pose = "front",
  seed,
  trail,
  children,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  tone?: Tone;
  pose?: "front" | "back";
  seed: string;
  trail?: { name: string; path: string }[];
  children?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <header
      className={[
        "relative grain vignette overflow-hidden border-b border-bone/10 bg-ink",
        compact ? "pb-14" : "pb-[clamp(3.5rem,7vw,7rem)]",
      ].join(" ")}
      style={{ paddingTop: "calc(var(--nav-h) + clamp(3rem,6vw,6rem))" }}
    >
      <Image
        src={`/media/editorial/${TONE_BACKDROP[tone]}.webp`}
        alt=""
        fill
        sizes="100vw"
        priority
        className="object-cover"
        style={{ objectPosition: pose === "back" ? "center 25%" : "center 75%" }}
      />
      <span
        aria-hidden
        className="absolute inset-0 z-[2] bg-gradient-to-r from-ink via-ink/80 to-ink/20"
      />
      <span
        aria-hidden
        className="absolute inset-0 z-[2] bg-gradient-to-t from-ink via-transparent to-ink/40"
      />

      <div className="shell relative z-[4]">
        {trail && (
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2">
              {trail.map((t, i) => (
                <li key={t.path} className="flex items-center gap-2">
                  {i > 0 && <span aria-hidden className="text-ash">/</span>}
                  {i === trail.length - 1 ? (
                    <span
                      aria-current="page"
                      className="font-mono text-micro uppercase tracking-[0.16em] text-fog"
                    >
                      {t.name}
                    </span>
                  ) : (
                    <Link
                      href={t.path}
                      className="font-mono text-micro uppercase tracking-[0.16em] text-ash transition-colors hover:text-bone"
                    >
                      {t.name}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <p className="eyebrow mb-6 text-purple-bright">{eyebrow}</p>

        <h1 className={compact ? "display-lg max-w-[18ch] text-bone" : "display-xl max-w-[15ch] text-bone"}>
          {title}
        </h1>

        {lede && <p className="lede mt-7 max-w-[52ch]">{lede}</p>}

        {children && <div className="mt-9">{children}</div>}
      </div>
    </header>
  );
}
