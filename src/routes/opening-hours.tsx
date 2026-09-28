import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Clock, MapPin, MessageCircle } from "lucide-react";

import { PageHeader, Tag } from "@/components/site/Bits";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, useOpeningHours } from "@/lib/queries";
import { getPublicOpeningHours } from "@/lib/public-content.functions";
import { DAY_NAMES, SITE, SITE_URL } from "@/lib/site-data";

const TITLE = "Opening Hours — The Hive at BUas | Breda Guardians";
const DESCRIPTION =
  "When the Hive is open: weekly opening hours for our on-campus gaming space in Breda, plus upcoming closures and special event days.";

export const Route = createFileRoute("/opening-hours")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: `${SITE_URL}/opening-hours` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/opening-hours` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "The Hive — Breda Guardians",
          description:
            "The on-campus gaming space of Breda Guardians at Breda University of Applied Sciences.",
          url: `${SITE_URL}/opening-hours`,
          address: {
            "@type": "PostalAddress",
            streetAddress: "Monseigneur Hopmansstraat 1",
            postalCode: "4817 JT",
            addressLocality: "Breda",
            addressRegion: "North Brabant",
            addressCountry: "NL",
          },
          parentOrganization: { "@type": "SportsOrganization", name: "Breda Guardians", url: SITE_URL },
        }),
      },
    ],
  }),
  loader: () => getPublicOpeningHours(),
  errorComponent: () => (
    <div className="container-site py-24 text-center">
      <h1 className="text-3xl">Hours not available</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        We couldn&apos;t load the opening hours right now. Please try again shortly.
      </p>
    </div>
  ),
  component: OpeningHours,
});

const ORDER = [1, 2, 3, 4, 5, 6, 0];

function trim(value: string | null) {
  return value ? value.slice(0, 5) : "";
}

function parseTime(time: string | null): { h: number; m: number } | null {
  if (!time) return null;
  const parts = time.split(":").map(Number);
  const h = parts[0];
  const m = parts[1] ?? 0;
  if (h === undefined || Number.isNaN(h) || Number.isNaN(m)) return null;
  return { h, m };
}

function getStatus(entry: { opens_at: string | null; closes_at: string | null; closed: boolean }) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const opens = parseTime(entry.opens_at);
  const closes = parseTime(entry.closes_at);

  if (entry.closed || !opens || !closes) {
    return { open: false, closesIn: null };
  }

  const openMinutes = opens.h * 60 + opens.m;
  const closeMinutes = closes.h * 60 + closes.m;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const open = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  const closesIn = open ? closeMinutes - currentMinutes : null;
  return { open, closesIn };
}

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} minute${m === 1 ? "" : "s"}`;
  if (m === 0) return `${h} hour${h === 1 ? "" : "s"}`;
  return `${h}h ${m}m`;
}

function OpeningHours() {
  const { data } = useOpeningHours(Route.useLoaderData());
  const isLoading = false;
  const today = new Date().getDay();

  const hours = ORDER.map((day) => (data?.hours ?? []).find((h) => h.day_of_week === day)).filter(
    Boolean,
  );
  const todayEntry = hours.find((entry) => entry!.day_of_week === today);
  const todayStatus = todayEntry ? getStatus(todayEntry) : { open: false, closesIn: null };

  return (
    <>
      <PageHeader
        eyebrow="Opening hours"
        title="The Hive"
        intro="16 competitive stations, a broadcast desk and a lounge on the BUas campus in Breda."
      />

      <section className="section-y-first">
        <div className="container-site grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6">
            {/* Live status card */}
            <div className="surface-card bg-surface-2 p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl">Right now</h2>
                  {isLoading ? (
                    <Skeleton className="mt-4 h-8 w-40 rounded bg-surface" />
                  ) : todayEntry ? (
                    <div className="mt-4 flex items-center gap-3">
                      <Tag>{todayStatus.open ? "Open" : "Closed"}</Tag>
                      {todayStatus.open && todayStatus.closesIn !== null && (
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="size-4 text-primary" />
                          Closes in {formatMinutes(todayStatus.closesIn)}
                        </span>
                      )}
                      {!todayStatus.open && !todayEntry.closed && (
                        <span className="text-sm text-muted-foreground">
                          Opens {trim(todayEntry.opens_at)} today
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">No hours set for today.</p>
                  )}
                </div>
                {todayEntry && !todayEntry.closed && (
                  <p className="font-display text-2xl text-primary md:text-3xl">
                    {trim(todayEntry.opens_at)} – {trim(todayEntry.closes_at)}
                  </p>
                )}
              </div>
            </div>

            {/* Weekly schedule */}
            <div className="surface-card bg-surface-2 p-6 md:p-8">
              <h2 className="text-2xl">This week</h2>
              {isLoading ? (
                <Skeleton className="mt-6 h-72 rounded-lg bg-surface" />
              ) : (
                <ul className="mt-6 space-y-2">
                  {hours.map((entry) => {
                    const isToday = entry!.day_of_week === today;
                    return (
                      <li
                        key={entry!.id}
                        className={`flex items-center justify-between gap-4 rounded-lg border border-transparent px-3 py-3 transition-colors ${
                          isToday ? "border-primary/30 bg-primary/10" : "hover:bg-surface"
                        }`}
                      >
                        <span className="flex items-center gap-3 font-semibold">
                          <span
                            aria-hidden
                            className={`h-5 w-1 rounded-full ${
                              isToday ? "bg-primary" : "bg-border"
                            }`}
                          />
                          {DAY_NAMES[entry!.day_of_week]}
                          {isToday && <Tag>Today</Tag>}
                        </span>
                        <span
                          className={
                            entry!.closed
                              ? "text-sm text-muted-foreground"
                              : "font-display text-lg text-primary"
                          }
                        >
                          {entry!.closed
                            ? "Closed"
                            : `${trim(entry!.opens_at)} – ${trim(entry!.closes_at)}`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Special days */}
            <div className="surface-card bg-surface-2 p-6 md:p-8">
              <h2 className="flex items-center gap-2 text-2xl">
                <CalendarClock className="size-5 text-primary" />
                Special days
              </h2>
              {isLoading ? (
                <Skeleton className="mt-6 h-40 rounded-lg bg-surface" />
              ) : (
                <ul className="mt-5 grid gap-3">
                  {(data?.special ?? []).length === 0 && (
                    <li className="text-sm text-muted-foreground">
                      No closures or special days scheduled.
                    </li>
                  )}
                  {(data?.special ?? []).map((day) => (
                    <li
                      key={day.id}
                      className="relative overflow-hidden rounded-xl border border-border bg-surface p-4"
                    >
                      <span
                        aria-hidden
                        className="absolute inset-y-0 left-0 w-1 bg-primary/60"
                      />
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {formatDate(day.day)}
                      </p>
                      <p className="mt-1 font-semibold">
                        {day.label}
                        {day.is_closure && (
                          <span className="ml-2 text-xs font-normal text-destructive">Closed</span>
                        )}
                      </p>
                      {day.note && (
                        <p className="mt-1 text-sm text-muted-foreground">{day.note}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Find us */}
            <div className="surface-card bg-surface-2 p-6 md:p-8">
              <h2 className="flex items-center gap-2 text-2xl">
                <MapPin className="size-5 text-primary" />
                Find us
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Breda University of Applied Sciences, Monseigneur Hopmansstraat 1, 4817 JT Breda.
                Enter through the main hall and follow the gold signs to the Hive.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Want to book a PC? Reach out to our Hive interns on Discord.
              </p>
              <Button
                asChild
                size="sm"
                className="mt-4"
              >
                <a href={SITE.discordUrl} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-2 size-4" /> Join Discord
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
