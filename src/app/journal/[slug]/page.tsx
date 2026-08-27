import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES, getArticle } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { Specimen } from "@/components/primitives/Visual";
import { JsonLd } from "@/components/primitives/JsonLd";
import { articleSchema, breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { ArrowMark } from "@/components/primitives/Marks";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return pageMetadata({ title: "Not found", description: "", path: "/journal" });

  return pageMetadata({
    title: article.title,
    description: article.excerpt,
    path: `/journal/${article.slug}`,
    type: "article",
  });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const more = ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 3);

  return (
    <>
      <JsonLd
        data={[
          articleSchema(article),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Journal", path: "/journal" },
            { name: article.title, path: `/journal/${article.slug}` },
          ]),
        ]}
      />

      {/* --- Masthead --- */}
      <header
        className="relative grain vignette overflow-hidden border-b border-bone/10 bg-ink pb-16"
        style={{ paddingTop: "calc(var(--nav-h) + clamp(3rem,6vw,5.5rem))" }}
      >
        <Specimen
          seed={`article-${article.slug}`}
          tone={article.tone}
          className="absolute inset-0 size-full opacity-40"
        />
        <span aria-hidden className="absolute inset-0 z-[2] bg-gradient-to-t from-ink via-ink/85 to-ink/55" />

        <div className="shell relative z-[4] max-w-[52rem]">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/journal" className="font-mono text-micro uppercase tracking-[0.16em] text-ash transition-colors hover:text-bone">
                  Journal
                </Link>
              </li>
              <li aria-hidden className="text-ash">/</li>
              <li>
                <Link
                  href={`/journal?category=${encodeURIComponent(article.category)}`}
                  className="font-mono text-micro uppercase tracking-[0.16em] text-emerald-bright"
                >
                  {article.category}
                </Link>
              </li>
            </ol>
          </nav>

          <h1 className="display-lg mb-7 text-bone">{article.title}</h1>

          <p className="lede mb-8 max-w-[48ch]">{article.excerpt}</p>

          <dl className="flex flex-wrap gap-x-10 gap-y-3 border-t border-bone/10 pt-6">
            {[
              ["Written by", article.author],
              ["Published", formatDate(article.date)],
              ["Reading time", `${article.readMinutes} minutes`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="eyebrow mb-1.5">{k}</dt>
                <dd className="text-caption text-fog">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      {/* --- Body --- */}
      <article className="shell section-pad">
        <div className="mx-auto max-w-[40rem]">
          {article.body.map((para, i) => (
            <p
              key={i}
              className={[
                "mb-7 leading-[1.75] text-fog",
                // The opening paragraph carries the reader in at a larger size.
                i === 0 ? "text-lede text-bone" : "text-body-lg",
              ].join(" ")}
            >
              {para}
            </p>
          ))}

          <div className="mt-14 border-t border-bone/10 pt-8">
            <p className="eyebrow mb-4">Written by</p>
            <p className="display-sm mb-3 text-bone">{article.author}</p>
            <p className="text-body-sm leading-relaxed text-smoke">
              Part of the CHISSELED coaching and studio team. Everything published here is
              written by people who train, program or build the products they are writing about.
            </p>
          </div>
        </div>
      </article>

      {/* --- More --- */}
      <section className="border-t border-bone/10 bg-carbon section-pad" aria-labelledby="more-heading">
        <div className="shell">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <h2 id="more-heading" className="display-md text-bone">
              Keep reading.
            </h2>
            <Link href="/journal" className="btn btn-ghost btn-sm">
              All articles
              <ArrowMark className="size-4" />
            </Link>
          </div>

          <ul className="grid gap-px border border-bone/10 bg-bone/10 sm:grid-cols-3">
            {more.map((a) => (
              <li key={a.slug} className="bg-ink">
                <Link href={`/journal/${a.slug}`} className="group block h-full p-7 transition-colors duration-500 hover:bg-carbon">
                  <p className="eyebrow mb-4">{a.category}</p>
                  <h3 className="mb-3 font-display text-h6 font-bold uppercase leading-tight tracking-tight text-bone">
                    <span className="link-rule">{a.title}</span>
                  </h3>
                  <p className="mb-4 text-body-sm leading-relaxed text-smoke">{a.excerpt}</p>
                  <p className="font-mono text-micro uppercase tracking-[0.14em] text-ash">
                    {a.readMinutes} min read
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
