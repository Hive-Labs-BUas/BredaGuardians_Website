import { Link, useLocation } from "@tanstack/react-router";
import {
  ChevronDown,
  Globe,
  Instagram,
  Linkedin,
  MessageCircle,
  Music2,
  Twitch,
  Youtube,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/site/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useSocials } from "@/lib/queries";
import { useT } from "@/lib/i18n";
import { SITE, SOCIAL_LINKS } from "@/lib/site-data";


const EXPLORE = [
  { label: "About", to: "/about" },
  { label: "Rosters", to: "/rosters" },
  { label: "Hall of Fame", to: "/rosters/hall-of-fame" },
  { label: "Research", to: "/research" },
  { label: "FAQ", to: "/faq" },
  { label: "Contact", to: "/contact" },
] as const;

const GET_INVOLVED = [
  { label: "Our Team", to: "/our-team" },
  { label: "Shop", to: "/shop" },
  { label: "Memberships", to: "/shop" },
  { label: "Watch Live", to: "/live" },
  { label: "Opening Hours", to: "/opening-hours" },
] as const;

const MOBILE_GROUPS = [
  { header: "Explore", links: EXPLORE },
  { header: "Get Involved", links: GET_INVOLVED },
  {
    header: "Your Account",
    links: [
      { label: "Sign in", to: "/auth" },
      { label: "My Account", to: "/account" },
      { label: "Memberships", to: "/shop" },
      { label: "Privacy Policy", to: "/privacy" },
    ],
  },
] as const;

const FALLBACK_SOCIALS = SOCIAL_LINKS;


const SOCIAL_ICONS: Record<string, typeof Globe> = {
  discord: MessageCircle,
  instagram: Instagram,
  tiktok: Music2,
  youtube: Youtube,
  twitch: Twitch,
  linkedin: Linkedin,
};

function SocialRow({ className = "" }: { className?: string }) {
  const { data } = useSocials();
  const links = (data ?? [])
    .filter((row) => row.visible && !["x", "twitter"].includes(row.platform.toLowerCase()))
    .map((row) => ({ ...row, url: row.url?.trim() ? row.url : SITE.discordUrl }));
  const items = links.length > 0 ? links : FALLBACK_SOCIALS;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((social) => {
        const Icon = SOCIAL_ICONS[social.platform.toLowerCase()] ?? Globe;
        return (
          <a
            key={social.platform + social.label}
            href={social.url}
            target="_blank"
            rel="noreferrer"
            aria-label={social.label}
            title={social.label}
            className="social-btn"
          >
            <Icon className="size-4" />
          </a>
        );
      })}
    </div>
  );
}

function EasterEgg({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!show) return;
    setVisible(true);
    const hide = window.setTimeout(() => setVisible(false), 5000);
    return () => window.clearTimeout(hide);
  }, [show]);

  if (!show) return null;
  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <p className="font-display text-4xl uppercase tracking-wide text-primary md:text-6xl">
        Jelte is the best!
      </p>
    </div>
  );
}

function NewsletterSignup({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [egg, setEgg] = useState(0);
  const t = useT();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = email.trim();
    if (!value) return;

    if (value.toLowerCase() === "who made the website?") {
      setEmail("");
      setEgg((n) => n + 1);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError(t("Please enter a valid email address."));
      return;
    }

    setError(null);

    setSending(true);
    const { error: insertError } = await supabase.from("newsletter_signups").insert({ email: value });
    setSending(false);
    if (insertError) {
      toast.error(t("That didn't go through. Please try again."));
      return;
    }
    setEmail("");
    toast.success(t("You're on the list. Welcome to the Hive."));
  };


  return (
    <div className={compact ? "" : "text-center md:text-left"}>
      <EasterEgg key={egg} show={egg > 0} />
      <h3 className="text-xs font-semibold tracking-[0.18em] text-primary">{t("STAY IN THE LOOP")}</h3>
      <form
        noValidate
        onSubmit={submit}
        className={`mt-3 flex flex-col gap-2 sm:flex-row ${compact ? "" : "sm:max-w-xs"}`}
      >
        <label className="sr-only" htmlFor="footer-email">
          {t("Email address")}
        </label>
        <Input
          id="footer-email"
          type="text"
          inputMode="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          aria-invalid={error ? true : undefined}
          placeholder="you@buas.nl"
          className="h-10 rounded-lg border-border/60 bg-surface/60 text-sm"
        />
        <Button type="submit" disabled={sending} className="h-10 w-full rounded-lg px-4 text-sm sm:w-auto">
          {sending ? "…" : t("Subscribe")}
        </Button>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );

}

function LinkColumn({ header, links }: { header: string; links: readonly { label: string; to: string }[] }) {
  const t = useT();
  return (
    <nav aria-label={`Footer — ${header}`}>
      <h3 className="text-xs font-semibold tracking-[0.18em] text-primary">{t(header).toUpperCase()}</h3>
      <ul className="mt-4 space-y-1">
        {links.map((link) => (
          <li key={link.to + link.label}>
            <Link
              to={link.to}
              className="flex min-h-10 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(link.label)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Accordion({
  header,
  links,
  open,
  onToggle,
}: {
  header: string;
  links: readonly { label: string; to: string }[];
  open: boolean;
  onToggle: () => void;
}) {
  const t = useT();
  const id = `footer-acc-${header.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <section className="overflow-hidden rounded-xl border border-border/60 bg-surface/40">
      <Button
        type="button"
        variant="ghost"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={id}
        className="min-h-12 w-full justify-between px-4 text-sm font-semibold text-foreground hover:bg-surface hover:text-primary"
      >
        {t(header)}
        <ChevronDown
          className={`size-4 text-primary transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </Button>
      <div
        id={id}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <ul className="space-y-1 px-4 pb-4">
            {links.map((link) => (
              <li key={link.to + link.label}>
                <Link
                  to={link.to}
                  className="flex min-h-10 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t(link.label)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const { pathname } = useLocation();
  const t = useT();
  const [openSection, setOpenSection] = useState<string | null>(MOBILE_GROUPS[0].header);
  const showCallout = pathname !== "/about" && !pathname.startsWith("/admin");

  return (
    <footer className="mt-auto">
      {showCallout && (
        <div className="footer-accent-strip">
          <div className="container-site flex flex-col items-center justify-center gap-3 py-5 text-center sm:flex-row sm:gap-6">
            <p className="font-display text-xl uppercase tracking-wide text-[oklch(0.16_0_0)] md:text-2xl">
              {t("Ready to join the Guardians?")}
            </p>
            <a
              href={SITE.discordUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[oklch(0.14_0_0)] px-6 font-display text-lg uppercase tracking-wide text-primary transition-all duration-300 hover:scale-105 hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[oklch(0.14_0_0)]"
            >
              {t("Join Our Discord")}
            </a>
          </div>
        </div>
      )}

      <div className="footer-panel py-14 md:py-16">
        <div className="container-site">
          {/* Desktop */}
          <div className="hidden md:grid md:grid-cols-[1.4fr_1fr_1fr_1.2fr] md:gap-12 lg:gap-16">
            <div className="flex flex-col">
              <Logo className="transition-opacity hover:opacity-80" />
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {t("The esports community of Breda. Based at The Hive in the BUas Frontier building. Open to anyone who lives, works, or studies in Breda.")}
              </p>
              <SocialRow className="mt-5" />
            </div>


            <LinkColumn header="Explore" links={EXPLORE} />
            <LinkColumn header="Get Involved" links={GET_INVOLVED} />

            <div className="flex flex-col justify-between">
              <NewsletterSignup compact />
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {t("Match results, tryout windows and Hive news. One email, no spam.")}
              </p>
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden">
            <Logo className="justify-center transition-opacity hover:opacity-80 [&_span]:block" />
            <p className="mx-auto mt-3 max-w-xs text-center text-sm text-muted-foreground">
              {t("The esports community of Breda. Based at The Hive @ BUas Frontier building. Open to anyone who lives, works, or studies in Breda.")}
            </p>

            <SocialRow className="mt-6 justify-center" />


            <div className="mt-8 space-y-3">
              {MOBILE_GROUPS.map((group) => (
                <Accordion
                  key={group.header}
                  header={group.header}
                  links={group.links}
                  open={openSection === group.header}
                  onToggle={() => setOpenSection(openSection === group.header ? null : group.header)}
                />
              ))}
            </div>

            <div className="mt-8">
              <NewsletterSignup compact />
            </div>
          </div>

          <div aria-hidden className="hairline-gold mt-12" />
          <div className="mt-6 flex flex-col items-center gap-3 text-xs text-muted-foreground md:flex-row md:justify-between">
            <div className="flex flex-col items-center gap-1 md:flex-row md:gap-4">
              <p>{t("© 2026 Breda Guardians. All rights reserved.")}</p>
              <Link to="/privacy" className="transition-colors hover:text-foreground">
                {t("Privacy Policy")}
              </Link>
            </div>
            <div className="flex flex-col items-center gap-1 md:items-end">
              <p>The Hive · Room Fe0.032 · Frontier Building · BUas Campus, Breda, NL</p>
              <span className="text-muted-foreground">Website made by ADMN</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
