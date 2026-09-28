import { Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Clock,
  FlaskConical,
  HelpCircle,
  Info,
  LogIn,
  Mail,
  ShieldCheck,
  Trophy,
  User as UserIcon,
  Radio,
  Users,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";

const MENU_GROUPS = [
  {
    title: "The club",
    items: [
      { label: "About", to: "/about", icon: Info },
      { label: "Rosters", to: "/rosters", icon: Trophy },
      { label: "Our Team", to: "/our-team", icon: Users },
      { label: "Research", to: "/research", icon: FlaskConical },
    ],
  },
  {
    title: "Visit & shop",
    items: [
      { label: "Live", to: "/live", icon: Radio },
      { label: "Opening Hours", to: "/opening-hours", icon: Clock },
      { label: "Shop", to: "/shop", icon: BadgeCheck },
      { label: "FAQ", to: "/faq", icon: HelpCircle },
      { label: "Contact", to: "/contact", icon: Mail },
    ],
  },
] as const;

function MenuGlyph({ open }: { open: boolean }) {
  return (
    <span className="relative block size-5" aria-hidden="true">
      <span
        className={`absolute left-0 top-1 block h-0.5 w-5 rounded-full bg-current transition-transform duration-300 ${open ? "translate-y-1.5 rotate-45" : ""}`}
      />
      <span
        className={`absolute left-0 top-2.5 block h-0.5 w-5 rounded-full bg-current transition-opacity duration-200 ${open ? "opacity-0" : "opacity-100"}`}
      />
      <span
        className={`absolute left-0 top-4 block h-0.5 w-5 rounded-full bg-current transition-transform duration-300 ${open ? "-translate-y-1.5 -rotate-45" : ""}`}
      />
    </span>
  );
}

/** Mobile + tablet slide-in navigation panel. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const { user, profile, isAdmin } = useAuth();
  const t = useT();
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={open ? "Close menu" : "Open menu"}
          className="size-11 border border-border bg-surface text-foreground hover:border-primary hover:bg-accent hover:text-primary"
        >
          <MenuGlyph open={open} />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        showClose={false}
        className="menu-panel flex h-dvh w-[92vw] max-w-sm flex-col gap-0 border-l border-primary/20 p-0 shadow-[-24px_0_60px_-30px_rgba(0,0,0,0.9)] data-[state=closed]:duration-300 data-[state=open]:duration-400"
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-5">
          <SheetTitle className="font-display text-xl tracking-wide text-foreground">
            <span className="gradient-text">Breda</span> Guardians
          </SheetTitle>
          <SheetClose asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close menu"
              className="size-11 rounded-full border border-primary/30 bg-primary/10 text-primary transition-transform duration-300 hover:rotate-90 hover:bg-primary/20"
            >
              <MenuGlyph open />
            </Button>
          </SheetClose>
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-6">
          {/* Account block */}
          <div className="menu-item" style={{ animationDelay: "60ms" }}>
            {user ? (
              <Link
                to="/account"
                onClick={close}
                className="menu-row flex min-h-16 items-center gap-3 rounded-2xl border border-border/70 bg-surface/70 px-4"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    width={40}
                    height={40}
                    className="size-10 rounded-full object-cover ring-2 ring-primary/40"
                  />
                ) : (
                  <span className="grid size-10 place-items-center rounded-full bg-primary/15 text-primary">
                    {isAdmin ? <ShieldCheck className="size-5" /> : <UserIcon className="size-5" />}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-foreground">
                    {profile?.display_name ?? t("My Account")}
                  </span>
                  <span className="block text-xs text-muted-foreground">{t("View your account")}</span>
                </span>
              </Link>
            ) : (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="min-h-14 w-full rounded-2xl border-primary/30 bg-surface/60 text-base font-bold"
              >
                <Link to="/auth" onClick={close}>
                  <LogIn className="size-5" />
                  {t("Login or create an account")}
                </Link>
              </Button>
            )}
          </div>

          <nav aria-label="Mobile navigation" className="mt-6 space-y-6">
            {MENU_GROUPS.map((group, groupIndex) => (
              <div key={group.title}>
                <p
                  className="menu-label menu-item px-2"
                  style={{ animationDelay: `${120 + groupIndex * 40}ms` }}
                >
                  {t(group.title)}
                </p>
                <ul className="mt-2 space-y-1">
                  {group.items.map((item, index) => (
                    <li
                      key={item.label}
                      className="menu-item"
                      style={{ animationDelay: `${150 + groupIndex * 60 + index * 45}ms` }}
                    >
                      <Link
                        to={item.to}
                        onClick={close}
                        activeOptions={{ exact: true }}
                        activeProps={{
                          className:
                            "bg-primary/12 font-extrabold text-primary [&_span:first-child]:bg-primary/20 [&_span:first-child]:text-primary",
                        }}
                        inactiveProps={{ className: "text-foreground/85 hover:text-primary" }}
                        className="menu-row flex min-h-13 items-center gap-3.5 rounded-xl px-3 text-[1.05rem] font-semibold"
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface/80 text-primary transition-colors">
                          <item.icon className="size-4.5" />
                        </span>
                        <span className="relative z-10">{t(item.label)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

        </div>
      </SheetContent>
    </Sheet>
  );
}
