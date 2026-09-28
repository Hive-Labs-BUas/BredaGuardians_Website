import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string | undefined;
  children?: ReactNode;
}) {
  return (
    <header className="warm-band-plain relative overflow-hidden">
      <div aria-hidden className="absolute inset-y-0 right-0 w-2/5 bg-primary/8 [clip-path:polygon(45%_0,100%_0,100%_100%,0_100%)]" />
      <div className="container-site py-12 md:py-16">

        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-3xl md:text-4xl">{title}</h1>
        {intro && <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">{intro}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
      <div aria-hidden className="hairline-gold absolute inset-x-0 bottom-0" />
    </header>
  );
}

export function EsportsPageHero({
  eyebrow,
  title,
  accent,
  intro,
  image,
  imageAlt,
  imageWidth = 1600,
  imageHeight = 1000,
  imageClassName,
  className,
  children,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  intro: string;
  image: string;
  imageAlt: string;
  imageWidth?: number;
  imageHeight?: number;
  imageClassName?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <header
      className={cn(
        "warm-band-plain clip-diagonal-bottom relative min-h-[30rem] overflow-hidden pb-10 sm:min-h-[34rem] md:min-h-[38rem]",
        className,
      )}
    >
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/20 md:from-background md:via-background/90 md:to-background/25" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 z-[2] h-1/2 bg-gradient-to-t from-background via-background/10 to-transparent md:hidden" />
      <img
        src={image}
        alt={imageAlt}
        width={imageWidth}
        height={imageHeight}
        fetchPriority="high"
        className={cn(
          "hero-media-drift image-fade-bottom pointer-events-none absolute z-[1] max-w-none object-contain opacity-60 drop-shadow-[0_18px_45px_oklch(0.865_0.125_92/0.2)] sm:opacity-65 md:opacity-90",
          imageClassName,
        )}
      />
      <div aria-hidden className="hero-hem absolute inset-x-0 bottom-0 z-[3] h-28" />
      <div className="container-site relative z-10 flex min-h-[26rem] items-end pb-12 pt-20 sm:min-h-[30rem] md:min-h-[34rem] md:items-center md:pb-16 md:pt-16">

        <div className="max-w-2xl">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-4 text-4xl drop-shadow-[0_3px_18px_var(--background)] sm:text-5xl md:text-6xl">
            {title}
            {accent && <span className="block text-primary">{accent}</span>}
          </h1>
          <p className="mt-5 max-w-lg text-base text-foreground/80 drop-shadow-[0_2px_10px_var(--background)] md:text-lg">
            {intro}
          </p>
          {children && <div className="mt-7 flex flex-wrap items-center gap-4">{children}</div>}
        </div>
      </div>
    </header>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  className,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="mt-3 text-3xl md:text-4xl">{title}</h2>
      {intro && <p className="mt-4 text-base text-muted-foreground">{intro}</p>}
    </div>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-primary/40 bg-primary/12 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-primary">
      {children}
    </span>
  );
}

/** Horizontally swipeable on phones, grid on larger screens. */
export function CardRail({
  children,
  cols = "md:grid-cols-3",
  className,
}: {
  children: ReactNode;
  cols?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "swipe-rail no-scrollbar -mx-5 px-10 md:mx-0 md:grid md:gap-6 md:overflow-visible md:px-0",
        cols,
        className,
      )}
    >
      {children}
    </div>
  );
}

export function RailItem({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("swipe-item md:flex-none md:w-auto", className)}>{children}</div>;
}

export function Marquee<T = string>({
  items,
  reverse = false,
  slow = false,
  repeat = 4,
  fade = false,
  className,
  renderItem,
}: {
  items: T[];
  reverse?: boolean;
  slow?: boolean;
  repeat?: number;
  fade?: boolean;
  className?: string;
  renderItem?: (item: T) => ReactNode;
}) {
  const track = Array.from({ length: Math.max(2, repeat) }, () => items).flat();

  const renderTrack = (ariaHidden: boolean) => (
    <div
      aria-hidden={ariaHidden || undefined}
      className={cn(
        "flex w-max shrink-0 items-center",
        slow ? "animate-marquee-slow" : "animate-marquee",
      )}
      style={reverse ? { animationDirection: "reverse" } : undefined}
    >
      {track.map((item, i) => (
        <span key={i} className="flex items-center">
          {renderItem ? (
            renderItem(item)
          ) : (
            <>
              <span className="px-5 text-sm font-semibold uppercase tracking-[0.18em] text-foreground/85">
                {String(item)}
              </span>
              <span aria-hidden className="text-primary">
                /
              </span>
            </>
          )}
        </span>
      ))}
    </div>
  );

  return (
    <div className={cn("relative flex overflow-hidden", fade && "marquee-fade", className)}>
      {renderTrack(false)}
      {renderTrack(true)}
    </div>
  );
}
