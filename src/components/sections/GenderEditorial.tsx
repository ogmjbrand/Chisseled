import Link from "next/link";
import { getProductsByGender } from "@/lib/catalog";
import { Sculpture, Flat } from "@/components/primitives/Visual";
import { ArrowMark } from "@/components/primitives/Marks";
import type { Tone } from "@/lib/art";

interface GenderEditorialProps {
  gender: "women" | "men";
  index: string;
  headline: string;
  body: string;
  tone: Tone;
  pose: "front" | "back";
  /** Reverses the composition so the two sections don't mirror each other. */
  flip?: boolean;
}

/**
 * The women's and men's sections use the same component deliberately: an
 * equally premium treatment for both is a design requirement, not a
 * coincidence, and sharing the implementation is how it stays that way.
 */
export function GenderEditorial({
  gender,
  index,
  headline,
  body,
  tone,
  pose,
  flip = false,
}: GenderEditorialProps) {
  const products = getProductsByGender(gender).slice(0, 4);
  const label = gender === "women" ? "Women" : "Men";

  return (
    <section
      className="relative border-t border-bone/10 bg-ink section-pad"
      aria-labelledby={`${gender}-heading`}
    >
      <div className="shell grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        {/* --- Campaign --- */}
        <div
          className={[
            "relative grain vignette aspect-[4/5] overflow-hidden bg-carbon",
            flip ? "lg:order-2" : "",
          ].join(" ")}
          data-reveal-media
        >
          <Sculpture
            seed={`editorial-${gender}`}
            tone={tone}
            pose={pose}
            anchor={flip ? 0.38 : 0.6}
            scale={1.04}
            className="size-full"
          />

          {/* Floating flat — a product lifted out of the campaign */}
          <div className="absolute bottom-6 left-6 z-[3] w-28 border border-bone/12 bg-ink/70 p-2 backdrop-blur-md sm:w-32">
            <Flat
              flat={products[0]?.flat ?? "tee"}
              colorway={products[0]?.variants[0].colorway ?? "onyx"}
              seed={`float-${gender}`}
              className="size-full"
            />
            <p className="mt-1.5 truncate px-1 pb-0.5 font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-fog">
              {products[0]?.name}
            </p>
          </div>
        </div>

        {/* --- Copy --- */}
        <div className={flip ? "lg:order-1" : ""}>
          <p className="eyebrow mb-5">
            {index} — {label}&apos;s Performance
          </p>

          <h2
            id={`${gender}-heading`}
            className="display-lg mb-6 max-w-[13ch] text-bone"
            data-reveal
          >
            {headline}
          </h2>

          <p
            className="lede mb-10 max-w-[46ch]"
            data-reveal
            style={{ "--reveal-delay": "90ms" } as React.CSSProperties}
          >
            {body}
          </p>

          {/* Category rail */}
          <ul className="mb-10 grid grid-cols-2 gap-px border border-bone/10 bg-bone/10">
            {products.map((p) => (
              <li key={p.slug} className="bg-ink">
                <Link
                  href={`/product/${p.slug}`}
                  className="group flex items-center gap-3 p-3.5 transition-colors duration-400 hover:bg-carbon"
                >
                  <span className="size-12 shrink-0 overflow-hidden bg-graphite">
                    <Flat
                      flat={p.flat}
                      colorway={p.variants[0].colorway}
                      seed={`rail-${p.slug}`}
                      className="size-full"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-caption text-bone">{p.name}</span>
                    <span className="block font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-smoke">
                      {p.category}
                    </span>
                  </span>
                  <ArrowMark className="size-4 shrink-0 -translate-x-1 text-ash opacity-0 transition-all duration-400 group-hover:translate-x-0 group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>

          <Link href="/shop" className="btn btn-primary">
            Shop {label.toLowerCase()}&apos;s
            <ArrowMark className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
