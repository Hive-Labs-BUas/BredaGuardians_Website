import { ArticleImage } from "@/components/site/ArticleImage";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Download } from "lucide-react";

import { formatDate } from "@/lib/queries";
import { readingMinutes } from "@/lib/research-utils";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export type ResearchEntry = {
  id: string;
  title: string;
  category: string;
  summary: string;
  cover_image_url: string | null;
  entry_date: string;
  game?: string | null;
  document_url?: string | null;
  document_size_bytes?: number | null;
};

/** Image tile with a dark gradient, topic label and title — the archive grid unit. */
export function ResearchCard({
  entry,
  size = "sm",
  className,
}: {
  entry: ResearchEntry;
  size?: "sm" | "lg";
  className?: string;
}) {
  const t = useT();
  const large = size === "lg";
  return (
    <article
      className={cn(
        "group relative isolate flex flex-col justify-end overflow-hidden rounded-2xl border border-border bg-surface-2 transition-all duration-500 hover:-translate-y-1 hover:border-primary/50 hover:shadow-gold",
        large ? "min-h-[24rem] md:min-h-[30rem]" : "min-h-[19rem]",
        className,
      )}
    >
      <Link to="/research/$id" params={{ id: entry.id }} className="absolute inset-0 z-10" aria-label={`Read ${entry.title}`} />
      <ArticleImage
        src={entry.cover_image_url}
        alt={entry.title}
        label={entry.category}
        title={entry.title}
        className="absolute inset-0 -z-10 size-full"
        imgClassName="transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
      />
      <span
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/75 to-background/10"
      />

      <div className={cn("relative flex flex-col gap-3 p-6", large && "md:p-8")}>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex w-fit items-center rounded-md border border-primary/40 bg-primary/12 px-2.5 py-1 text-[0.68rem] font-semibold uppercase text-primary backdrop-blur-sm">{entry.category}</span>
          {entry.game ? <span className="inline-flex w-fit items-center rounded-md border border-border bg-background/70 px-2.5 py-1 text-[0.68rem] font-semibold uppercase text-foreground/80 backdrop-blur-sm">{entry.game}</span> : null}
        </div>
        <h3 className={cn("text-xl leading-tight", large && "text-2xl md:text-3xl")}>{entry.title}</h3>
        {large && <p className="max-w-xl line-clamp-3 text-sm text-foreground/75">{entry.summary}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="text-primary">{formatDate(entry.entry_date)}</span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" /> {readingMinutes(entry.summary)} {t("min read")}
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-primary">
            {t("Read")} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
        {entry.document_url ? (
          <a href={entry.document_url} download target="_blank" rel="noreferrer" className="relative z-20 mt-1 inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold text-primary hover:text-gold-bright">
            <Download className="size-4" aria-hidden /> {t("Download PDF")}
          </a>
        ) : null}
      </div>
    </article>
  );
}
