import Link from "next/link";
import { PageHeader } from "@/components/primitives/PageHeader";
import { Sculpture, Specimen } from "@/components/primitives/Visual";
import { JsonLd } from "@/components/primitives/JsonLd";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { ArrowMark } from "@/components/primitives/Marks";

export const metadata = pageMetadata({
  title: "Our Story",
  description:
    "CHISSELED exists because most performance brands sell an image. We would rather sell the things that produce it.",
  path: "/about",
});

const FAQ_SECTIONS = [
  {
    id: "shipping",
    title: "Shipping",
    items: [
      ["United States", "3–5 business days. Free on orders over $100, otherwise $7. Express is 1–2 business days at $18."],
      ["International", "6–12 business days to 38 countries at $35. Duties and import taxes are calculated at checkout so nothing arrives as a surprise."],
      ["Tracking", "Every order ships with tracking. You will get the number the moment the parcel is scanned, not when the label is printed."],
    ],
  },
  {
    id: "returns",
    title: "Returns",
    items: [
      ["Window", "30 days from delivery. Unworn, unwashed, tags attached."],
      ["Cost", "Free within the US. International returns are at your cost unless the item is faulty."],
      ["Nutrition", "Unopened tubs and boxes only, for obvious reasons."],
      ["Refunds", "Processed within 3 working days of the return arriving, back to the original payment method."],
    ],
  },
  {
    id: "sizing",
    title: "Sizing",
    items: [
      ["Between sizes", "Compression and sculpt fits run close. Take the larger size for comfort, the smaller for hold."],
      ["Measurements", "Every product page carries the full measurement table in centimetres, plus the height and size of the model shown."],
      ["Exchanges", "Wrong size is the most common return, so exchanges within the US ship the replacement before the original arrives back."],
    ],
  },
  {
    id: "accessibility",
    title: "Accessibility",
    items: [
      ["Standard", "This site targets WCAG 2.2 AA. Every interactive element is reachable by keyboard, every control is labelled, and focus is always visible."],
      ["Motion", "All animation respects prefers-reduced-motion. With it enabled, nothing moves and no content is lost."],
      ["Problems", "If something on this site is not usable for you, tell us and we will fix it. That is not a form letter — it is the fastest route to a defect report we care about."],
    ],
  },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />

      <PageHeader
        eyebrow="The Studio"
        title="Your body is the project."
        lede="CHISSELED exists because most performance brands sell you an image of the person you want to be. We would rather sell the things that produce them."
        seed="about-header"
        tone="void"
        trail={[
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ]}
      />

      {/* --- The story --- */}
      <section className="border-b border-bone/10 bg-ink section-pad" aria-labelledby="story-heading">
        <div className="shell grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <div className="relative grain vignette aspect-[4/5] overflow-hidden bg-carbon lg:sticky lg:top-[calc(var(--nav-h)+2rem)] lg:h-fit" data-reveal-media>
            <Sculpture seed="about-story" tone="apparel" pose="back" anchor={0.5} scale={1} className="size-full" />
          </div>

          <div>
            <p className="eyebrow mb-5">The story</p>
            <h2 id="story-heading" className="display-md mb-9 text-bone" data-reveal>
              We started with the fabric.
            </h2>

            <div className="max-w-[54ch] space-y-6 text-body-lg leading-[1.75] text-fog">
              <p>
                CHISSELED began with a specific frustration: buying training clothes and being
                unable to find out what they were made of. Not the marketing name for the
                fabric — the actual composition, the weight, whether the compression was
                graduated or simply tight. That information exists. It is just not usually
                published, because publishing it invites comparison.
              </p>
              <p>
                So we published it. Every product page on this site carries the fibre
                composition, the fabric weight in grams per square metre, the full measurement
                table, and the height and size of the person shown wearing it. Every supplement
                carries its complete label with each ingredient at its exact dose.
              </p>
              <p>
                That decision drove everything else. If you have to publish the number, you have
                to be willing to defend it, which means you have to make something worth
                defending. It is a slower way to build a range and a considerably better one.
              </p>
              <p>
                The training platform came next, for the same reason. Most fitness services sell
                a PDF and call it coaching. We wanted something that reads what you actually
                logged and adapts — because a programme that ignores your week is a programme
                that will be wrong by Wednesday.
              </p>
              <p>
                Nutrition followed, then recovery, and at that point it stopped being a clothing
                company. It became a method: train with purpose, eat with intention, recover
                with discipline. Three things that only work because they were designed against
                each other.
              </p>
            </div>

            <Link href="/method" className="btn btn-ghost mt-10">
              Read the Method
              <ArrowMark className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* --- The studio --- */}
      <section
        id="studio"
        className="relative grain border-b border-bone/10 bg-carbon section-pad"
        aria-labelledby="studio-heading"
      >
        <Specimen seed="about-studio" tone="void" className="absolute inset-0 size-full opacity-15" />
        <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-carbon via-carbon/92 to-carbon" />

        <div className="shell relative z-[3]">
          <div className="mb-14 max-w-[44rem]">
            <p className="eyebrow mb-5">The studio</p>
            <h2 id="studio-heading" className="display-lg mb-6 text-bone">
              How we make things.
            </h2>
            <p className="lede">
              Four commitments that decide what ships and what does not.
            </p>
          </div>

          <ol className="grid gap-px border border-bone/10 bg-bone/10 sm:grid-cols-2">
            {[
              {
                n: "01",
                t: "Publish the number",
                b: "Composition, weight, dose, measurement. If we cannot show you the figure, we do not make the claim. This rule has killed more products than any other.",
              },
              {
                n: "02",
                t: "Test it before it ships",
                b: "Every apparel colourway is squat-tested at depth under direct light. Every supplement batch is third-party tested. Failures do not become a discount line — they do not ship.",
              },
              {
                n: "03",
                t: "Design against wear, not against a photograph",
                b: "The target is a garment that still looks right after a hundred washes, which is a harder problem than one that photographs well once.",
              },
              {
                n: "04",
                t: "Sell the honest version",
                b: "Compression helps recovery and does not reliably make you faster. Protein powder is convenient food, not magic. Saying so costs us some sales and buys something worth more.",
              },
            ].map((c) => (
              <li key={c.n} className="bg-ink p-8">
                <p className="numeric mb-6 text-caption text-purple-bright">{c.n}</p>
                <h3 className="mb-4 font-display text-h5 font-bold uppercase leading-tight tracking-tight text-bone">
                  {c.t}
                </h3>
                <p className="text-body-sm leading-relaxed text-smoke">{c.b}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* --- Support / FAQ --- */}
      <section className="bg-ink section-pad" aria-labelledby="support-heading">
        <div className="shell">
          <div className="mb-14 max-w-[44rem]">
            <p className="eyebrow mb-5">Support</p>
            <h2 id="support-heading" className="display-lg text-bone">
              The practical things.
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_SECTIONS.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="border border-bone/10 bg-carbon p-7 lg:p-9"
                aria-labelledby={`${section.id}-heading`}
              >
                <h3
                  id={`${section.id}-heading`}
                  className="display-sm mb-7 text-bone"
                >
                  {section.title}
                </h3>
                <dl className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                  {section.items.map(([k, v]) => (
                    <div key={k}>
                      <dt className="eyebrow mb-2">{k}</dt>
                      <dd className="text-body-sm leading-relaxed text-smoke">{v}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        </div>
      </section>

      {/* --- Contact --- */}
      <section
        id="contact"
        className="border-t border-bone/10 bg-carbon section-pad"
        aria-labelledby="contact-heading"
      >
        <div className="shell grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="eyebrow mb-5">Contact</p>
            <h2 id="contact-heading" className="display-md mb-7 text-bone">
              Talk to a person.
            </h2>
            <p className="mb-8 max-w-[46ch] text-body leading-relaxed text-smoke">
              Support is answered by people who have used the products. Expect a reply within
              one working day, and expect it to actually address what you asked.
            </p>

            <dl className="space-y-5">
              {[
                ["Support", "support@chisseled.com"],
                ["Wholesale & press", "studio@chisseled.com"],
                ["Accessibility issues", "access@chisseled.com"],
                ["Studio", "Florida, USA — shipping to 38 countries"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="eyebrow mb-1.5">{k}</dt>
                  <dd className="text-body-sm text-fog">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="border border-bone/10 bg-ink p-8 lg:p-10">
            <p className="eyebrow mb-5 text-steel">The Studio</p>
            <h2 className="display-sm mb-6 text-bone">Built as one system.</h2>
            <p className="mb-6 text-body-sm leading-relaxed text-smoke">
              CHISSELED exists because most performance brands sell an image. We would
              rather sell the things that produce it — apparel, training, nutrition and
              recovery designed together rather than assembled after the fact.
            </p>
            <p className="text-body-sm leading-relaxed text-smoke">
              The design system, the art direction, the training platform and the commerce
              layer were built as a single system, and every piece of it is meant to scale.
            </p></div>
        </div>

        <div id="legal" className="shell mt-16 border-t border-bone/10 pt-10">
          <p className="eyebrow mb-4">Legal</p>
          <p className="max-w-[70ch] text-body-sm leading-relaxed text-ash">
            This is a demonstration storefront. Product specifications, prices, stock levels,
            ratings, review counts and the headline community figures shown throughout are
            illustrative sample data and must be replaced with verified values before any
            commercial launch. No payment is processed and no order is dispatched.
          </p>
        </div>
      </section>
    </>
  );
}
