import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Clock3, FileText, Newspaper } from "lucide-react";

import { ArticleImage } from "@/components/site/ArticleImage";
import { ArticleHero } from "@/components/site/ArticleHero";
import { Tag } from "@/components/site/Bits";
import { RichText } from "@/components/site/RichText";
import { ScrollProgress } from "@/components/site/Motion";
import { Button } from "@/components/ui/button";
import { getPublicNewsArticle } from "@/lib/public-content.functions";
import { formatDate } from "@/lib/queries";
import { hasRichText } from "@/lib/sanitize-html";
import { SITE_URL } from "@/lib/site-data";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/news/$slug")({
  loader: async ({ params }) => {
    const found = await getPublicNewsArticle({ data: { slug: params.slug } });
    if (!found) throw notFound();
    return found;
  },
  head: ({ loaderData }) => {
    const article = loaderData?.article;
    const title = article ? `${article.title} — Breda Guardians` : "Story unavailable — Breda Guardians";
    const description = article?.excerpt?.slice(0, 155) ?? "Breda Guardians news.";
    const image = article?.image_url?.startsWith("https://") ? article.image_url : undefined;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
        ...(article ? [{ property: "og:url", content: `${SITE_URL}/news/${article.slug}` }] : []),
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
        ...(article ? [] : [{ name: "robots", content: "noindex" }]),
      ],
      links: article ? [{ rel: "canonical", href: `${SITE_URL}/news/${article.slug}` }] : [],
    };
  },
  notFoundComponent: () => (
    <Message title="Story not found" text="This story may have moved or is no longer published." />
  ),
  errorComponent: () => (
    <Message title="Story unavailable" text="We couldn't load this story right now. Please try again shortly." />
  ),
  component: NewsArticle,
});

function Message({ title, text }: { title: string; text: string }) {
  const t = useT();
  return (
    <section className="section-y">
      <div className="container-site max-w-2xl text-center">
        <h1 className="text-4xl">{t(title)}</h1>
        <p className="mt-4 text-muted-foreground">{t(text)}</p>
        <Button asChild variant="secondary" className="mt-7">
          <Link to="/">{t("Back to the homepage")}</Link>
        </Button>
      </div>
    </section>
  );
}

function NewsArticle() {
  const t = useT();
  const { article, more } = Route.useLoaderData();
  const body = (article as { content?: string | null }).content;
  const doc = article as { document_url?: string | null; document_name?: string | null };
  const words = `${article.excerpt} ${body ?? ""}`.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 220));

  const schema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    datePublished: article.publish_date,
    description: article.excerpt.slice(0, 300),
    ...(article.image_url?.startsWith("https://") ? { image: article.image_url } : {}),
    author: { "@type": "Organization", name: "Breda Guardians" },
    publisher: { "@type": "Organization", name: "Breda Guardians" },
    mainEntityOfPage: `${SITE_URL}/news/${article.slug}`,
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <ScrollProgress />

      <ArticleHero backTo="/" backLabel={t("Back to the Hive")} category={t("News")} title={article.title} date={formatDate(article.publish_date)} minutes={minutes} image={article.image_url} />

      <section className="article-shell">
        <div className="container-site grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="article-prose min-w-0 justify-self-center lg:justify-self-start">
            {hasRichText(body) && <RichText html={body} />}
            {doc.document_url && (
              <a href={doc.document_url} target="_blank" rel="noreferrer" className="article-action">
                <FileText className="size-4" aria-hidden /> {doc.document_name || t("Open document")}
              </a>
            )}
          </div>
          <aside className="article-facts lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow inline-flex items-center gap-2"><Newspaper className="size-4" /> {t("Story details")}</p>
            <dl className="mt-6 space-y-5 text-sm">
              <div><dt className="article-fact-label"><CalendarDays className="size-4" /> {t("Published")}</dt><dd className="mt-1.5 text-foreground">{formatDate(article.publish_date)}</dd></div>
              <div><dt className="article-fact-label"><Clock3 className="size-4" /> {t("Reading time")}</dt><dd className="mt-1.5 text-foreground">{minutes} {t("min read")}</dd></div>
            </dl>
          </aside>
        </div>
      </section>

      {more.length > 0 && (
        <section className="warm-band section-y-sm">
          <div className="container-site">
            <h2 className="text-2xl md:text-3xl">{t("More From The Hive")}</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {more.map((item) => (
                <Link
                  key={item.id}
                  to="/news/$slug"
                  params={{ slug: item.slug }}
                  className="surface-card group overflow-hidden bg-surface-2"
                >
                  <ArticleImage
                    src={item.image_url}
                    alt={item.title}
                    label="News"
                    title={item.title}
                    className="h-40 w-full"
                  />
                  <div className="p-5">
                    <Tag>{formatDate(item.publish_date)}</Tag>
                    <h3 className="mt-3 text-lg leading-tight">{item.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{item.excerpt}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                      {t("Read story")} <ArrowRight className="size-4" aria-hidden />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
