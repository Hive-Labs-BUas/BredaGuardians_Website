import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarClock,
  ChevronRight,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Inbox,
  Menu,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Trophy,
  UserCog,
  Users,
  Swords,
} from "lucide-react";
import { useState } from "react";

import { Articles } from "@/components/admin/sections/Articles";
import { Hive } from "@/components/admin/sections/Hive";
import { Members } from "@/components/admin/sections/Members";
import { Overview, type AdminSectionId } from "@/components/admin/sections/Overview";
import { Requests } from "@/components/admin/sections/Requests";
import { Results } from "@/components/admin/sections/Results";
import { Shop } from "@/components/admin/sections/Shop";
import { Staff } from "@/components/admin/sections/Staff";
import { Teams } from "@/components/admin/sections/Teams";
import { SiteContent } from "@/components/admin/sections/SiteContent";
import { PageHeader } from "@/components/site/Bits";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useAdminData, useRosterData } from "@/lib/admin-data";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Control Room — Breda Guardians" },
      { name: "description", content: "Staff control room for articles, results, requests, members and The Hive." },
      { property: "og:title", content: "Admin Control Room — Breda Guardians" },
      { property: "og:description", content: "Staff control room for Breda Guardians." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Admin,
});

type SectionMeta = {
  id: AdminSectionId;
  label: string;
  icon: typeof Users;
  group: string;
  help: string;
  adminOnly?: boolean;
};

const SECTIONS: SectionMeta[] = [
  {
    id: "overview",
    label: "Dashboard",
    icon: LayoutDashboard,
    group: "Start here",
    help: "Your daily summary: what needs attention, how the club is doing and how many people visit the website.",
  },
  {
    id: "articles",
    label: "Articles",
    icon: FileText,
    group: "Content",
    help: "News, research and Hall of Fame entries. Write text, add pictures, buttons and documents, then publish. Use the arrow button to open a page exactly as visitors see it.",
  },
  {
    id: "results",
    label: "Match results",
    icon: Trophy,
    group: "Content",
    help: "Add finished matches with scores, or schedule an upcoming match by leaving the score empty. Both show on the team pages.",
  },
  {
    id: "teams",
    label: "Teams & rosters",
    icon: Swords,
    group: "Content",
    help: "Create a team, then add players with their role, nationality and date of birth. Each team gets its own public page.",
  },
  {
    id: "staff",
    label: "Staff",
    icon: UserCog,
    group: "People",
    help: "The people behind the club: core team, intern profiles and the internship positions we have open.",
  },
  {
    id: "site",
    label: "Site content",
    icon: Sparkles,
    group: "Content",
    help: "FAQ answers and the social links shown across the website.",
  },
  {
    id: "requests",
    label: "Requests",
    icon: Inbox,
    group: "People",
    help: "Contact messages and applications. Mark an item done once it has been answered so nobody replies twice.",
  },

  {
    id: "members",
    label: "Members",
    icon: Users,
    group: "People",
    adminOnly: true,
    help: "Memberships and subscriptions. Admins only, because it holds personal details.",
  },
  {
    id: "shop",
    label: "Shop",
    icon: ShoppingBag,
    group: "Business",
    help: "Products, prices, pictures, sizes and discount vouchers.",
  },
  {
    id: "hive",
    label: "The Hive",
    icon: CalendarClock,
    group: "Business",
    help: "Opening times, events and everything about our 16-station space at BUas.",
  },
];

const GROUP_ORDER = ["Start here", "Content", "People", "Business"];
const MOBILE_PRIMARY: AdminSectionId[] = ["overview", "articles", "requests", "shop"];

function Badge({ count }: { count: number }) {
  if (count < 1) return null;
  return (
    <span
      className="ml-auto grid min-w-5 place-items-center rounded-full bg-primary px-1.5 py-0.5 text-[0.7rem] font-bold text-primary-foreground"
      aria-label={`${count} new`}
    >
      {count}
    </span>
  );
}

/** Team captains get one job: keeping their roster up to date. */
function CaptainPanel() {
  const { data } = useRosterData(true);
  return (
    <>
      <PageHeader
        eyebrow="Team captain"
        title="Roster Room"
        intro="You can add players and keep their details up to date. Everything else on the website stays with the club staff."
      />
      <section className="section-y">
        <div className="container-site">
          <Teams data={data} rosterOnly />
        </div>
      </section>
    </>
  );
}

function Admin() {
  const { isAdmin, isStaff, isCaptain, loading, user } = useAuth();
  const { data, isLoading } = useAdminData(isStaff);
  const [section, setSection] = useState<AdminSectionId>("overview");
  const [moreOpen, setMoreOpen] = useState(false);

  const newRequests =
    (data?.messages ?? []).filter((row) => row.status === "new").length +
    (data?.applications ?? []).filter((row) => row.status === "new").length;

  const pendingCounts: Partial<Record<AdminSectionId, number>> = {
    requests: newRequests,
    shop: (data?.shopRequests ?? []).filter((row) => row.status === "awaiting_payment").length,
    members: (data?.memberships ?? []).filter((row) => row.status === "awaiting_payment").length,
  };




  if (loading) {
    return (
      <div className="container-site py-24">
        <Skeleton className="h-64 rounded-xl bg-surface" />
      </div>
    );
  }

  if (!isStaff && isCaptain) return <CaptainPanel />;

  if (!isStaff) {
    return (
      <section className="flex min-h-[70vh] items-center">
        <div className="container-site max-w-md text-center">
          <ShieldAlert className="mx-auto size-10 text-primary" />
          <h1 className="mt-5 text-4xl">Staff only</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This account doesn't have staff access. Sign in with a staff account to continue.
          </p>
          <Button asChild size="lg" className="mt-7">
            <Link to="/auth">Go to sign in</Link>
          </Button>
        </div>
      </section>
    );
  }

  const visible = SECTIONS.filter((item) => isAdmin || !item.adminOnly);
  const active = visible.find((item) => item.id === section) ?? visible[0];
  if (!active) return null;

  const selectSection = (id: AdminSectionId) => {
    setSection(id);
    setMoreOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const mobilePrimary = MOBILE_PRIMARY.map((id) => visible.find((item) => item.id === id)).filter(
    (item): item is SectionMeta => Boolean(item),
  );
  const isMoreActive = !MOBILE_PRIMARY.includes(section);

  return (
    <div className="admin-shell min-h-screen lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <aside className="admin-sidebar hidden border-r border-border/70 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="border-b border-border/70 px-5 py-6">
          <Link to="/" className="flex items-center gap-3" aria-label="Back to Breda Guardians website">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-primary/50 bg-primary/10 text-primary">
              <ShieldAlert className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-lg leading-none">Breda Guardians</p>
              <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary">Admin workspace</p>
            </div>
          </Link>
        </div>

        <nav aria-label="Admin sections" className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-6">
              {GROUP_ORDER.map((group) => {
                const items = visible.filter((item) => item.group === group);
                if (items.length === 0) return null;
                return (
                  <div key={group}>
                    <p className="px-3 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      {group}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {items.map((item) => (
                        <li key={item.id}>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => selectSection(item.id)}
                            className={cn(
                              "relative flex min-h-11 w-full justify-start gap-3 overflow-hidden border border-transparent px-3 text-sm font-medium",
                              section === item.id
                                ? "border-primary/35 bg-primary/10 text-primary shadow-[inset_3px_0_0_var(--primary)]"
                                : "text-muted-foreground hover:border-border hover:bg-surface-2 hover:text-foreground",
                            )}
                          >
                            <item.icon className="size-4" aria-hidden />
                            <span className="truncate">{item.label}</span>
                            <Badge count={pendingCounts[item.id] ?? 0} />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
          </div>
        </nav>

        <div className="border-t border-border/70 p-4">
          <Button asChild variant="outline" className="w-full justify-between">
            <Link to="/">
              View website <ExternalLink className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="admin-topbar sticky top-0 z-30 border-b border-border/70 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-primary/40 bg-primary/10 text-primary">
                <active.icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary">{active.group}</p>
                <h1 className="truncate text-xl sm:text-2xl">{active.label}</h1>
              </div>
            </div>
            <Button asChild variant="outline" size="icon" className="lg:hidden" aria-label="View website">
              <Link to="/"><ExternalLink aria-hidden /></Link>
            </Button>
            <div className="hidden items-center gap-2 lg:flex">
              <span className="size-2 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" aria-hidden />
              <span className="text-xs font-semibold text-muted-foreground">{isAdmin ? "Administrator" : "Staff access"}</span>
            </div>
          </div>
        </header>

        <main className="container-site pb-28 pt-5 lg:pb-10 lg:pt-7">
          <div className="space-y-6">
            <section className="admin-section-intro grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-border/60 pb-5">
              <div className="min-w-0">
                <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{active.help}</p>
                {!isAdmin && (
                  <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldAlert className="size-3.5 shrink-0 text-primary" aria-hidden />
                    You can add and edit here. Permanent deletion stays with administrators.
                  </p>
                )}
              </div>
              <span className="hidden rounded-md border border-border bg-surface px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:block">
                Live data
              </span>
            </section>

            {section === "overview" && <Overview data={data} isLoading={isLoading} onGo={selectSection} />}
            {section === "articles" && <Articles data={data} />}
            {section === "results" && <Results data={data} />}
            {section === "requests" && <Requests data={data} userId={user?.id ?? ""} />}
            {section === "teams" && <Teams data={data} />}
            {section === "members" && isAdmin && <Members data={data} />}
            {section === "shop" && <Shop data={data} />}
            {section === "hive" && <Hive data={data} />}
            {section === "staff" && <Staff data={data} />}
            {section === "site" && <SiteContent data={data} />}
          </div>
        </main>
      </div>

      <nav className="admin-mobile-nav fixed inset-x-0 bottom-0 z-40 border-t border-border/80 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden" aria-label="Primary admin sections">
        <ul className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {mobilePrimary.map((item) => (
            <li key={item.id}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => selectSection(item.id)}
                aria-current={section === item.id ? "page" : undefined}
                className={cn(
                  "relative h-14 w-full min-w-0 flex-col gap-1 px-1 py-1 text-[0.65rem]",
                  section === item.id ? "bg-primary/10 text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-5" aria-hidden />
                <span className="truncate">{item.id === "articles" ? "Content" : item.label}</span>
                <Badge count={pendingCounts[item.id] ?? 0} />
              </Button>
            </li>
          ))}
          <li>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMoreOpen(true)}
              aria-expanded={moreOpen}
              className={cn(
                "h-14 w-full min-w-0 flex-col gap-1 px-1 py-1 text-[0.65rem]",
                isMoreActive ? "bg-primary/10 text-primary" : "text-muted-foreground",
              )}
            >
              <Menu className="size-5" aria-hidden />
              <span>More</span>
            </Button>
          </li>
        </ul>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="admin-more-sheet max-h-[82vh] overflow-y-auto rounded-t-2xl border-border p-5 lg:hidden">
          <SheetHeader className="border-b border-border/70 pb-4 text-left">
            <SheetTitle className="font-display text-2xl uppercase">All admin sections</SheetTitle>
            <SheetDescription>Choose what you want to manage.</SheetDescription>
          </SheetHeader>
          <div className="mt-5 space-y-6">
            {GROUP_ORDER.map((group) => {
              const items = visible.filter((item) => item.group === group);
              if (items.length === 0) return null;
              return (
                <div key={group}>
                  <p className="px-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">{group}</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {items.map((item) => (
                      <SheetClose asChild key={item.id}>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => selectSection(item.id)}
                          className={cn(
                            "h-auto min-h-14 w-full justify-start gap-3 px-3 py-3 text-left",
                            section === item.id && "border-primary/60 bg-primary/10 text-primary",
                          )}
                        >
                          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                            <item.icon className="size-4" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          <Badge count={pendingCounts[item.id] ?? 0} />
                          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                        </Button>
                      </SheetClose>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
