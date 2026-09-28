import { SITE_URL } from "@/lib/site-data";
import { ArticleHero } from "@/components/site/ArticleHero";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Check, Download, ExternalLink, Link2, Lightbulb, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

import { ScrollProgress } from "@/components/site/Motion";
import { ResearchCard } from "@/components/site/ResearchCard";
import { RichText } from "@/components/site/RichText";
import { Tag } from "@/components/site/Bits";
import { Button } from "@/components/ui/button";
import { getRelatedResearch, getResearchEntry } from "@/lib/articles.functions";
import { formatDate } from "@/lib/queries";
import { hasRichText } from "@/lib/sanitize-html";
import { formatFileSize, readingMinutes } from "@/lib/research-utils";
import { useT } from "@/lib/i18n";


export const Route = createFileRoute("/research/$id")({
  loader: async ({ params }) => {
    const entry = await getResearchEntry({ data: { id: params.id } });
    if (!entry) throw notFound();
    const related = await getRelatedResearch({ data: { id: entry.id, category: entry.category } });
    return { entry, related: related ?? [] };
  },
  head: ({ loaderData }) => {
    const entry = loaderData?.entry;
    const title = entry ? `${entry.title} — Breda Guardians Research` : "Research — Breda Guardians";
    const description = entry?.summary?.slice(0, 155) ?? "Read Breda Guardians esports research.";
    const image = entry?.cover_image_url?.startsWith("https://") ? entry.cover_image_url : undefined;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        ...(entry ? [{ property: "og:url", content: `${SITE_URL}/research/${entry.id}` }] : []),
        { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
      ],
      links: entry ? [{ rel: "canonical", href: `${SITE_URL}/research/${entry.id}` }] : [],
    };
  },
  notFoundComponent: ResearchNotFound,
  errorComponent: ResearchUnavailable,
  component: ResearchEntry,
});

function ResearchNotFound() {
  return <EntryMessage title="Research not found" text="This entry may have moved or is no longer published." />;
}

function ResearchUnavailable() {
  return <EntryMessage title="Research unavailable" text="We couldn't load this entry right now. Please try again shortly." />;
}

function EntryMessage({ title, text }: { title: string; text: string }) {
  const t = useT();
  return (
    <section className="section-y">
      <div className="container-site max-w-2xl text-center">
        <h1 className="text-4xl">{t(title)}</h1>
        <p className="mt-4 text-muted-foreground">{t(text)}</p>
        <Button asChild variant="secondary" className="mt-7">
          <Link to="/research">{t("Back to research")}</Link>
        </Button>
      </div>
    </section>
  );
}

function ShareRow({ title }: { title: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const links = [
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
  ];

  return (
    <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-border pt-7">
      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        <Share2 className="size-4 text-primary" /> {t("Share")}
      </span>
      <Button
        type="button"
        variant="outline"
        onClick={copy}
      >
        {copied ? <Check className="size-4 text-primary" /> : <Link2 className="size-4 text-primary" />}
        {copied ? t("Link copied") : t("Copy link")}
      </Button>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-4 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

function ResearchEntry() {
  const t = useT();
  const { entry, related } = Route.useLoaderData();
  const points = String((entry as { takeaways?: string | null }).takeaways ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const schema = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: entry.title,
    datePublished: entry.entry_date,
    articleSection: entry.category,
    description: entry.summary.slice(0, 300),
    author: { "@type": "Organization", name: "Breda Guardians" },
    publisher: { "@type": "Organization", name: "Breda Guardians" },
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <ScrollProgress />

      <ArticleHero backTo="/research" backLabel={t("Research archive")} category={entry.category} title={entry.title} date={formatDate(entry.entry_date)} minutes={readingMinutes(`${entry.summary} ${(entry as { content?: string | null }).content ?? ""}`)} meta={(entry as { game?: string | null }).game || "Breda Guardians · BUas"} image={entry.cover_image_url} />

      {/* ---------- BODY ---------- */}
      <div className="article-shell">
        <div className="container-site grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_22rem]">
          {points.length > 0 && (
            <aside className="article-facts order-first lg:order-last lg:sticky lg:top-28 lg:self-start">
              <p className="eyebrow inline-flex items-center gap-2">
                <Lightbulb className="size-4" /> {t("Key takeaways")}
              </p>
              <ul className="mt-5 space-y-4">
                {points.map((point) => (
                  <li key={point} className="flex gap-3 text-sm leading-relaxed text-foreground/80">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {point}
                  </li>
                ))}
              </ul>
            </aside>
          )}

          <div className="article-prose min-w-0 justify-self-center lg:justify-self-start">
            {hasRichText((entry as { content?: string | null }).content) && (
              <RichText html={(entry as { content?: string | null }).content} />
            )}
            {(entry as { document_url?: string | null }).document_url && (
              <a
                href={(entry as { document_url?: string | null }).document_url as string}
                target="_blank"
                rel="noreferrer"
                className="article-action"
              >
                <Download className="size-4" aria-hidden />
                {t("Download PDF")}{formatFileSize((entry as { document_size_bytes?: number | null }).document_size_bytes) ? ` · ${formatFileSize((entry as { document_size_bytes?: number | null }).document_size_bytes)}` : ""}
              </a>
            )}
            {entry.link_url && (
              <Button asChild size="lg" className="mt-8">
                <a href={entry.link_url} target="_blank" rel="noopener noreferrer">
                  {t("Open published study")} <ExternalLink className="size-4" />
                </a>
              </Button>
            )}
            <ShareRow title={entry.title} />
          </div>

        </div>
      </div>

      {/* ---------- RELATED ---------- */}
      {related.length > 0 && (
        <section className="section-y-sm warm-band">
          <div className="container-site">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-2xl md:text-3xl">{t("More Research")}</h2>
              <Link
                to="/research"
                className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary hover:text-gold-bright"
              >
                {t("Full archive")}
              </Link>
            </div>
            <div className="mt-12 md:mt-14 grid gap-6 md:grid-cols-3">
              {related.map((item) => (
                <ResearchCard key={item.id} entry={item} className="h-full" />
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
