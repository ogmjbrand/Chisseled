import Link from "next/link";
import { BrandVideo } from "@/components/primitives/BrandVideo";
import { ArrowMark } from "@/components/primitives/Marks";
import type { FilmRole } from "@/lib/video";

const PANELS: { role: FilmRole; label: string; caption: string; href: string }[] = [
  { role: "campaign", label: "The Campaign", caption: "Built different, in full.", href: "/about" },
  { role: "training", label: "In Session", caption: "A programme, as it is actually run.", href: "/train" },
  { role: "method", label: "The Method", caption: "Train, nourish, recover.", href: "/method" },
  { role: "drop", label: "The Drop", caption: "What lands next.", href: "/shop" },
];

/**
 * The films run at their native 9:16 rather than cropped into a landscape
 * band — phone video is the format, so the layout is built around it instead
 * of fighting it. Horizontal scroll on narrow viewports, four across on wide.
 */
export function FilmStrip() {
  return (
    <section
      className="relative border-t border-bone/10 bg-ink section-pad"
      aria-labelledby="film-heading"
    >
      <div className="shell">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow mb-4 text-purple-bright">08 — On film</p>
            <h2 id="film-heading" className="display-lg max-w-[15ch] text-bone" data-reveal>
              The work, moving.
            </h2>
          </div>
          <Link href="/about" className="link-rule text-body-sm text-fog">
            The full campaign
            <ArrowMark className="ml-2 inline size-3.5" />
          </Link>
        </div>

        <ul className="-mx-[var(--gutter)] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--gutter)] pb-4 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
          {PANELS.map((p, i) => (
            <li
              key={p.role}
              className="w-[68vw] shrink-0 snap-start sm:w-[42vw] lg:w-auto"
              data-reveal
              style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}
            >
              <Link href={p.href} className="group block">
                <div className="relative aspect-[9/16] overflow-hidden border border-bone/10 transition-colors duration-500 group-hover:border-purple/45">
                  <BrandVideo
                    role={p.role}
                    fit="cover"
                    grade="signal"
                    className="size-full transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
                  />
                  <span className="absolute inset-x-4 bottom-4 z-[3]">
                    <span className="eyebrow block text-purple-bright">{p.label}</span>
                    <span className="mt-1.5 block text-body-sm text-bone">{p.caption}</span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
