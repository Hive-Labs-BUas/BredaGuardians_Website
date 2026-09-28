import { cn } from "@/lib/utils";
import logoAsset from "@/assets/breda-guardians-logo.png.asset.json";

/**
 * Article artwork with a branded fallback.
 *
 * When a story has no picture we render a gold-on-black panel (crest, category
 * and title) instead of an empty grey box, so every card and article page
 * keeps a finished look.
 */
export function ArticleImage({
  src,
  alt,
  label,
  title,
  className,
  imgClassName,
  width = 1200,
  height = 750,
  priority = false,
}: {
  src?: string | null;
  alt: string;
  label?: string | undefined;
  title?: string | undefined;
  className?: string | undefined;
  imgClassName?: string | undefined;
  width?: number;
  height?: number;
  priority?: boolean;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        {...(priority ? { fetchPriority: "high" as const } : {})}
        className={cn("size-full object-cover", className, imgClassName)}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        "relative isolate flex size-full flex-col items-center justify-center overflow-hidden bg-[oklch(0.14_0_0)] px-6 py-8 text-center",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,color-mix(in_oklab,var(--color-primary)_22%,transparent),transparent_62%)]"
      />
      <span
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.12] [background-image:repeating-linear-gradient(135deg,var(--color-primary)_0_2px,transparent_2px_14px)]"
      />
      <img src={logoAsset.url} alt="" aria-hidden width={96} height={96} className="size-12 object-contain opacity-90" />
      {label && (
        <span className="mt-3 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary">{label}</span>
      )}
      {title && (
        <span className="mt-2 line-clamp-2 max-w-sm font-display text-lg uppercase leading-tight text-foreground/85">
          {title}
        </span>
      )}
    </div>
  );
}
