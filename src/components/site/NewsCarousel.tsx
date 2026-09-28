import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef } from "react";

import { ArticleImage } from "@/components/site/ArticleImage";
import { Tag } from "@/components/site/Bits";
import { formatDate, type PublicNews } from "@/lib/queries";

/** Swipeable row of news stories for the homepage. */
export function NewsCarousel({ items }: { items: PublicNews[] }) {
  const railRef = useRef<HTMLDivElement | null>(null);

  const scrollBy = (direction: 1 | -1): void => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * Math.min(rail.clientWidth * 0.9, 520), behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <div className="relative">
      <div className="mb-5 flex justify-end gap-2">
        <button
          type="button"
          aria-label="Previous stories"
          onClick={() => scrollBy(-1)}
          className="grid size-11 place-items-center rounded-full border border-border bg-surface-2 text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="More stories"
          onClick={() => scrollBy(1)}
          className="grid size-11 place-items-center rounded-full border border-border bg-surface-2 text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
        >
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>

      <div
        ref={railRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2"
      >
        {items.map((item) => (
          <Link
            key={item.id}
            to="/news/$slug"
            params={{ slug: item.slug }}
            className="surface-card group w-[85%] shrink-0 snap-start overflow-hidden bg-surface-2 sm:w-[48%] lg:w-[32%]"
          >
            <ArticleImage
              src={item.image_url}
              alt={item.title}
              label="News"
              title={item.title}
              className="h-48 w-full"
            />
            <div className="p-5">
              <Tag>{formatDate(item.publish_date)}</Tag>
              <h3 className="mt-3 text-xl leading-tight">{item.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{item.excerpt}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                Read story <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
