import { MessageCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site-data";
import { useT } from "@/lib/i18n";

const SESSION_KEY = "bg-discord-cta-shown";

export function DiscordCTA({ pathname }: { pathname: string }) {
  const t = useT();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const excluded =
      pathname === "/auth" ||
      pathname === "/admin-login" ||
      pathname === "/membership" ||
      pathname.startsWith("/checkout");
    if (excluded || sessionStorage.getItem(SESSION_KEY)) return;

    const reveal = () => {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
      setVisible(true);
      window.removeEventListener("scroll", onScroll);
    };
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable > 0 && window.scrollY / scrollable >= 0.55) reveal();
    };
    const timer = window.setTimeout(reveal, 15_000);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <aside
      aria-label={t("Join the Breda Guardians Discord")}
      className="fixed inset-x-4 bottom-5 z-40 animate-fade-up rounded-lg border border-primary/40 bg-popover p-4 shadow-gold sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[22rem]"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2"
        aria-label={t("Dismiss Discord invitation")}
        onClick={() => setVisible(false)}
      >
        <X className="size-4" />
      </Button>
      <div className="flex gap-3 pr-10">
        <span className="icon-tile size-11 shrink-0">
          <MessageCircle className="size-5" aria-hidden />
        </span>
        <div>
          <p className="font-display text-xl uppercase leading-tight">{t("Join 500+ members in our Discord")}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("Find teammates, events and roster updates.")}</p>
        </div>
      </div>
      <Button asChild className="mt-4 w-full">
        <a href={SITE.discordUrl} target="_blank" rel="noopener noreferrer">{t("Join Discord")}</a>
      </Button>
    </aside>
  );
}