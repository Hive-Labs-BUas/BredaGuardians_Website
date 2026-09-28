import { ArrowLeft, Clock } from "lucide-react";

import { ArticleImage } from "@/components/site/ArticleImage";
import { Tag } from "@/components/site/Bits";
import { useT } from "@/lib/i18n";

export function ArticleHero({
  backTo,
  backLabel,
  category,
  title,
  date,
  minutes,
  meta,
  image,
}: {
  backTo: string;
  backLabel: string;
  category: string;
  title: string;
  date?: string;
  minutes?: number;
  meta?: string;
  image?: string | null;
}) {
  const t = useT();
  return (
    <header className="relative isolate flex min-h-[24rem] flex-col justify-end overflow-hidden border-b border-border md:min-h-[32rem]">
      <ArticleImage
        src={image ?? null}
        alt={`Featured image for ${title}`}
        label={category}
        title={title}
        width={1600}
        height={900}
        priority
        className="absolute inset-0 -z-10 size-full"
      />
      <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/80 to-background/35" />
      <div className="container-site py-10 md:py-16">
        <a href={backTo} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:text-gold-bright">
          <ArrowLeft className="size-4" aria-hidden /> {backLabel}
        </a>
        <div className="mt-6"><Tag>{category}</Tag></div>
        <h1 className="mt-4 max-w-5xl text-4xl leading-[1.02] sm:text-5xl md:text-6xl lg:text-7xl">{title}</h1>
        {(date || minutes || meta) && (
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold uppercase text-foreground/70">
            {date ? <span className="text-primary">{date}</span> : null}
            {minutes ? <span className="inline-flex items-center gap-1.5"><Clock className="size-3.5" aria-hidden /> {minutes} {t("min read")}</span> : null}
            {meta ? <span>{meta}</span> : null}
          </div>
        )}
      </div>
    </header>
  );
}