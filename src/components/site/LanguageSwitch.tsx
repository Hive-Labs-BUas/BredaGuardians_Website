import { useLanguage, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const OPTIONS: { code: Language; label: string; name: string }[] = [
  { code: "en", label: "EN", name: "English" },
  { code: "nl", label: "NL", name: "Nederlands" },
];

/** Small EN / NL toggle. */
export function LanguageSwitch({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Language"
      className={cn("flex items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5", className)}
    >
      {OPTIONS.map((option) => (
        <button
          key={option.code}
          type="button"
          onClick={() => setLang(option.code)}
          aria-pressed={lang === option.code}
          title={option.name}
          className={cn(
            "min-h-9 rounded-md px-2.5 text-xs font-bold transition-colors",
            lang === option.code
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
