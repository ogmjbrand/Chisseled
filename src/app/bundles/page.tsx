import Link from "next/link";
import { BUNDLES, getProduct } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { Bundles } from "@/components/sections/Bundles";
import { PageHeader } from "@/components/primitives/PageHeader";
import { JsonLd } from "@/components/primitives/JsonLd";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { CheckMark } from "@/components/primitives/Marks";

export const metadata = pageMetadata({
  title: "Performance Bundles",
  description:
    "Curated performance systems — apparel, training, nutrition and recovery chosen to work together. Save up to ₦86,000.",
  path: "/bundles",
});

export default function BundlesPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Bundles", path: "/bundles" },
        ])}
      />

      <PageHeader
        eyebrow="Systems"
        title="Curated, not bundled."
        lede="Each of these is a system where every piece was chosen against every other piece. The compression layers under the tee. The recovery formula pairs with the roller. The membership sequences all of it into a block."
        seed="bundles-header"
        tone="void"
        trail={[
          { name: "Home", path: "/" },
          { name: "Bundles", path: "/bundles" },
        ]}
      />

      <Bundles heading={false} />

      {/* Comparison */}
      <section
        className="border-t border-bone/10 bg-carbon section-pad"
        aria-labelledby="compare-heading"
      >
        <div className="shell">
          <h2 id="compare-heading" className="display-md mb-12 text-bone">
            Compare the systems.
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-left">
              <caption className="sr-only">
                What each CHISSELED performance bundle includes, and what it costs.
              </caption>
              <thead>
                <tr className="border-b border-bone/15">
                  <th scope="col" className="py-4 pr-6 eyebrow">
                    Includes
                  </th>
                  {BUNDLES.map((b) => (
                    <th key={b.slug} scope="col" className="py-4 pr-6 align-bottom">
                      <span className="block font-display text-h6 font-bold uppercase tracking-tight text-bone">
                        {b.name}
                      </span>
                      <span className="numeric mt-1.5 block text-caption text-lime-bright">
                        {formatPrice(b.price)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-bone/8">
                {[...new Set(BUNDLES.flatMap((b) => b.items))].map((slug) => {
                  const p = getProduct(slug);
                  if (!p) return null;
                  return (
                    <tr key={slug}>
                      <th scope="row" className="py-3.5 pr-6 text-body-sm font-normal text-fog">
                        <Link href={`/product/${slug}`} className="link-rule">
                          {p.name}
                        </Link>
                      </th>
                      {BUNDLES.map((b) => (
                        <td key={b.slug} className="py-3.5 pr-6">
                          {b.items.includes(slug) ? (
                            <CheckMark className="size-4 text-lime" />
                          ) : (
                            <span aria-hidden className="text-ash">
                              —
                            </span>
                          )}
                          <span className="sr-only">
                            {b.items.includes(slug) ? "Included" : "Not included"}
                          </span>
                        </td>
                      ))}
                    </tr>
                  );
                })}

                <tr>
                  <th scope="row" className="py-3.5 pr-6 text-body-sm font-normal text-steel">
                    Training membership
                  </th>
                  {BUNDLES.map((b) => (
                    <td key={b.slug} className="py-3.5 pr-6 text-caption text-fog">
                      {b.extras?.find((e) => e.includes("Training")) ?? (
                        <span aria-hidden className="text-ash">—</span>
                      )}
                    </td>
                  ))}
                </tr>

                <tr className="border-t border-bone/15">
                  <th scope="row" className="py-4 pr-6 eyebrow">
                    You save
                  </th>
                  {BUNDLES.map((b) => (
                    <td key={b.slug} className="numeric py-4 pr-6 text-body-sm text-lime-bright">
                      {formatPrice(b.saves)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-6 text-micro text-ash">
            Savings are calculated against the sum of each item&apos;s individual price at time of
            listing.
          </p>
        </div>
      </section>
    </>
  );
}
