import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/breda-guardians-logo.png.asset.json";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link to="/" className={cn("group flex min-w-0 items-center gap-2.5", className)} aria-label="Breda Guardians home">
      <img src={logoAsset.url} alt="" width={48} height={48} className="size-12 shrink-0 object-contain transition-transform duration-300 group-hover:scale-105" />
      {!compact && (
        <span className="hidden whitespace-nowrap font-display text-2xl font-normal leading-none tracking-wide sm:block">
          <span className="text-foreground">Breda</span> <span className="text-foreground">Guardians</span>
        </span>
      )}
    </Link>
  );
}
