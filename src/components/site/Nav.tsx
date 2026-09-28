import { Link } from "@tanstack/react-router";
import { LogIn, ShieldCheck, User as UserIcon } from "lucide-react";

import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { Button } from "@/components/ui/button";
import { LanguageSwitch } from "./LanguageSwitch";
import { NAV_LINKS } from "@/lib/site-data";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";


function AccountButton() {
  const { user, profile, isAdmin } = useAuth();
  const t = useT();

  if (!user) {
    return (
      <Button asChild size="sm">
        <Link to="/auth">
          <LogIn className="size-4" />
          {t("Login")}
        </Link>
      </Button>
    );
  }

  return (
    <Link
      to="/account"
      className="flex min-h-11 items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-1.5 transition-colors hover:border-primary/60"
    >
      {profile?.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt=""
          width={32}
          height={32}
          className="size-8 rounded-lg object-cover"
        />
      ) : (
        <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
          {isAdmin ? <ShieldCheck className="size-4" /> : <UserIcon className="size-4" />}
        </span>
      )}
      <span className="max-w-28 truncate text-sm font-semibold">
        {profile?.display_name ?? t("Account")}
      </span>
    </Link>
  );
}

export function Nav() {
  const t = useT();

  return (
    <header className="header-gradient sticky top-0 z-50 border-b border-border shadow-sm backdrop-blur-xl">
      <div className="container-site flex h-14 items-center justify-between gap-3 lg:h-20">
        <div className="hidden lg:block">
          <Logo />
        </div>

        <Link
          to="/"
          aria-label="Breda Guardians home"
          className="whitespace-nowrap font-display text-[1.6rem] leading-none text-foreground lg:hidden"
        >
          <span className="gradient-text">Breda</span> Guardians
        </Link>

        {/* Desktop: every link visible, no collapsing */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={{ exact: true }}
              activeProps={{
                className:
                  "font-bold text-primary after:scale-x-100",
              }}
              className="relative px-2.5 py-2 text-sm font-semibold text-foreground/75 transition-colors duration-300 after:absolute after:inset-x-2.5 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:text-foreground hover:after:scale-x-100"
            >
              {t(link.label)}
            </Link>
          ))}
        </nav>

        {/* Desktop account + extra pages menu */}
        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitch />
          <AccountButton />
        </div>

        {/* Mobile: text wordmark and animated menu control only. */}
        <div className="lg:hidden">
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
