import { useState } from "react";

import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

/**
 * A person's short bio, clamped to a few lines with a Read more toggle so long
 * texts never stretch cards on phones or desktop.
 */
export function Bio({
  text,
  lines = 3,
  className,
}: {
  text: string | null | undefined;
  lines?: 2 | 3 | 4;
  className?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const value = (text ?? "").trim();
  if (!value) return null;

  const long = value.length > 130;
  const clamp = lines === 2 ? "line-clamp-2" : lines === 4 ? "line-clamp-4" : "line-clamp-3";

  return (
    <div className={cn("mt-2", className)}>
      <p className={cn("text-sm leading-relaxed text-muted-foreground", long && !open && clamp)}>{value}</p>
      {long ? (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="mt-1 inline-flex min-h-9 items-center text-xs font-semibold uppercase tracking-wider text-primary transition-colors hover:text-gold-bright"
        >
          {open ? t("Show less") : t("Read more")}
        </button>
      ) : null}
    </div>
  );
}
