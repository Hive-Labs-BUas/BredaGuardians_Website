import { useState } from "react";

import logoAsset from "@/assets/breda-guardians-logo.png.asset.json";
import { cn } from "@/lib/utils";

/**
 * Any picture that is missing, empty or fails to load falls back to a branded
 * Guardians panel instead of a broken image icon.
 */
export function SafeImage({
  src,
  alt,
  className,
  width,
  height,
  loading = "lazy",
  fallbackClassName,
  logoClassName = "size-1/2",
  contain = false,
}: {
  src?: string | null;
  alt: string;
  className?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  loading?: "lazy" | "eager";
  fallbackClassName?: string | undefined;
  logoClassName?: string | undefined;
  contain?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const usable = typeof src === "string" && src.trim().length > 0 && !failed;

  if (usable) {
    return (
      <img
        src={src as string}
        alt={alt}
        {...(width ? { width } : {})}
        {...(height ? { height } : {})}
        loading={loading}
        onError={() => setFailed(true)}
        className={cn(contain ? "object-contain" : "object-cover", className)}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={alt}
      className={cn(
        "relative isolate grid place-items-center overflow-hidden bg-[oklch(0.14_0_0)]",
        className,
        fallbackClassName,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,color-mix(in_oklab,var(--color-primary)_20%,transparent),transparent_65%)]"
      />
      <img
        src={logoAsset.url}
        alt=""
        aria-hidden
        width={96}
        height={96}
        className={cn("max-h-[70%] max-w-[70%] object-contain opacity-85", logoClassName)}
      />
    </span>
  );
}
