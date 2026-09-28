import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownUp, ArrowRight, ChevronDown, Clock, Download, FlaskConical, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

import { Reveal } from "@/components/site/Motion";
import { ResearchCard } from "@/components/site/ResearchCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, useResearch } from "@/lib/queries";
import { getPublicResearch } from "@/lib/public-content.functions";
import { SITE_URL } from "@/lib/site-data";
import { formatFileSize, readingMinutes } from "@/lib/research-utils";
import { useT } from "@/lib/i18n";

const TITLE = "Research Archive — Student Esports Studies | Breda Guardians";
const DESCRIPTION =
  "Our published research on student esports: wellbeing, performance, venue design and community growth, produced with Breda University of Applied Sciences.";

export const Route = createFileRoute("/research/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: `${SITE_URL}/research` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/research` }],
  }),
  loader: () => getPublicResearch(),
  component: Research,
});

function Research() {
  const t = useT();
  const { data } = useResearch(Route.useLoaderData());
  const isLoading = false;
  const [topic, setTopic] = useState("all");
  const [year, setYear] = useState("all");
  const [game, setGame] = useState("all");
  const [newestFirst, setNewestFirst] = useState(true);

  const all = data ?? [];

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of all) counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1);
    return [
      ...[...counts.entries()].map(([label, count]) => ({ label, count })),
    ];
  }, [all]);

  const years = useMemo(() => [...new Set(all.map((entry) => entry.entry_date.slice(0, 4)))].sort().reverse(), [all]);
  const games = useMemo(() => [...new Set(all.map((entry) => entry.game?.trim()).filter(Boolean) as string[])].sort(), [all]);

  const entries = useMemo(() => {
    const filtered = all.filter((entry) =>
      (topic === "all" || entry.category === topic) &&
      (year === "all" || entry.entry_date.startsWith(year)) &&
      (game === "all" || entry.game === game),
    );
    return [...filtered].sort((a, b) =>
      newestFirst
        ? b.entry_date.localeCompare(a.entry_date)
        : a.entry_date.localeCompare(b.entry_date),
    );
  }, [all, game, newestFirst, topic, year]);

  const [featured, ...rest] = entries;

  return (
    <>
      {/* ---------- HERO ---------- */}
      <header className="relative overflow-hidden border-b border-border bg-background">
        <span
          aria-hidden
          className="absolute -right-24 -top-24 size-[26rem] rounded-full bg-primary/10 blur-[120px]"
        />
        <span
          aria-hidden
          className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_70%_40%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_65%)] md:block"
        />
        <div className="container-site relative py-14 md:py-20">
          <p className="eyebrow inline-flex items-center gap-2">
            <FlaskConical className="size-4" /> {t("Research")}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl leading-[0.95] sm:text-5xl md:text-6xl">
            {t("What We've Learned")}
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            We study our own community — student esports wellbeing, performance, venue design and
            growth — and publish the results with Breda University of Applied Sciences.
          </p>
          {all.length > 0 && (
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-foreground/60">
              {t(`${all.length} ${all.length === 1 ? "study" : "studies"} published · ${categories.length} topics`)}
            </p>
          )}
        </div>
      </header>

      <section className="warm-band section-y-sm border-b border-border">
        <div className="container-site">
          <div className="max-w-3xl">
            <p className="eyebrow">The Research pillar</p>
            <h2 className="mt-3 text-3xl md:text-4xl">Turning Esports Into Shared Knowledge</h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
              Breda Guardians contributes to PlaySmart research together with Breda University of Applied Sciences, connecting the questions inside esports with academic practice. The work helps players, students and partners understand performance, wellbeing and inclusive community design through findings they can use.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- FILTERS ---------- */}
      <section className="sticky top-14 z-20 border-b border-border bg-background/90 py-3 backdrop-blur-md sm:py-4 lg:top-20">
        {/* Phones: compact pill navigation */}
        <div className="container-site sm:hidden">
          <PillFilters
            year={year}
            game={game}
            topic={topic}
            years={years}
            games={games}
            topics={categories.map((item) => item.label)}
            newestFirst={newestFirst}
            onYear={setYear}
            onGame={setGame}
            onTopic={setTopic}
            onSort={() => setNewestFirst((value) => !value)}
            onClear={() => { setYear("all"); setGame("all"); setTopic("all"); }}
          />
        </div>

        {/* Tablet and up: labelled dropdowns */}
        <div className="container-site hidden flex-col gap-3 sm:flex xl:flex-row xl:items-end xl:justify-between">
          <div className="grid gap-3 sm:grid-cols-3 xl:w-[44rem]">
            <Filter label="Year" value={year} onChange={setYear} options={years} allLabel="All years" />
            <Filter label="Game" value={game} onChange={setGame} options={games} allLabel="All games" />
            <Filter label="Topic" value={topic} onChange={setTopic} options={categories.map((item) => item.label)} allLabel="All topics" />
          </div>
          <div className="flex flex-wrap gap-2">
            {(year !== "all" || game !== "all" || topic !== "all") ? (
              <Button type="button" variant="ghost" onClick={() => { setYear("all"); setGame("all"); setTopic("all"); }}>
                <RotateCcw className="size-4" /> Clear filters
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={() => setNewestFirst((value) => !value)}>
              <ArrowDownUp className="size-4 text-primary" /> {newestFirst ? "Newest first" : "Oldest first"}
            </Button>
          </div>
        </div>
      </section>


      {/* ---------- ARCHIVE ---------- */}
      <section className="section-y-first">
        <div className="container-site">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-[30rem] rounded-2xl bg-surface md:col-span-2" />
              <Skeleton className="h-72 rounded-2xl bg-surface" />
              <Skeleton className="h-72 rounded-2xl bg-surface" />
            </div>
          ) : entries.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nothing published in this topic yet.
            </p>
          ) : (
            <div key={`${topic}-${year}-${game}-${String(newestFirst)}`} className="animate-fade-in space-y-6">
              {featured && (
                <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
                  <ResearchCard entry={featured} size="lg" />
                  <div className="surface-card flex flex-col justify-between gap-6 bg-surface-2 p-7 md:p-9">
                    <div>
                      <p className="eyebrow">
                        {newestFirst ? "Latest study" : "Where it started"}
                      </p>
                      <h2 className="mt-3 text-2xl md:text-3xl">{featured.title}</h2>
                      <p className="mt-4 line-clamp-6 text-sm leading-relaxed text-muted-foreground">
                        {featured.summary}
                      </p>
                    </div>
                    <div className="space-y-5">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <span className="text-primary">{formatDate(featured.entry_date)}</span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="size-3.5" /> {readingMinutes(`${featured.summary} ${featured.content ?? ""}`)} min read
                        </span>
                      </div>
                      <Button asChild size="lg" className="w-full">
                        <Link to="/research/$id" params={{ id: featured.id }}>
                          Read the study <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                      {featured.document_url ? (
                        <Button asChild variant="secondary" className="w-full">
                          <a href={featured.document_url} download target="_blank" rel="noreferrer">
                            <Download className="size-4" /> Download PDF{formatFileSize(featured.document_size_bytes) ? ` · ${formatFileSize(featured.document_size_bytes)}` : ""}
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

              {rest.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {rest.map((entry, index) => (
                    <Reveal
                      key={entry.id}
                      delay={Math.min(index, 4) * 70}
                      className={index === 0 ? "md:col-span-2" : undefined}
                    >
                      <ResearchCard entry={entry} size={index === 0 ? "lg" : "sm"} className="h-full" />
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

type PillGroup = { id: "year" | "game" | "topic"; label: string; value: string; options: string[]; allLabel: string; onChange: (value: string) => void };

/** Phone-friendly filter bar: one row of pills that opens a compact option sheet. */
function PillFilters(props: {
  year: string; game: string; topic: string;
  years: string[]; games: string[]; topics: string[];
  newestFirst: boolean;
  onYear: (v: string) => void; onGame: (v: string) => void; onTopic: (v: string) => void;
  onSort: () => void; onClear: () => void;
}) {
  const [open, setOpen] = useState<PillGroup["id"] | null>(null);
  const groups: PillGroup[] = [
    { id: "year", label: "Year", value: props.year, options: props.years, allLabel: "All years", onChange: props.onYear },
    { id: "game", label: "Game", value: props.game, options: props.games, allLabel: "All games", onChange: props.onGame },
    { id: "topic", label: "Topic", value: props.topic, options: props.topics, allLabel: "All topics", onChange: props.onTopic },
  ];
  const active = groups.filter((group) => group.value !== "all").length;
  const openGroup = groups.find((group) => group.id === open);

  return (
    <div className="space-y-3">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {groups.map((group) => {
          const set = group.value !== "all";
          const isOpen = open === group.id;
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => setOpen(isOpen ? null : group.id)}
              aria-expanded={isOpen}
              className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors ${
                set || isOpen
                  ? "border-primary/60 bg-primary/15 text-foreground"
                  : "border-border bg-surface text-muted-foreground"
              }`}
            >
              <span className="max-w-[9rem] truncate">{set ? group.value : group.label}</span>
              <ChevronDown className={`size-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
          );
        })}
        <button
          type="button"
          onClick={props.onSort}
          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-muted-foreground"
        >
          <ArrowDownUp className="size-3.5 text-primary" />
          {props.newestFirst ? "Newest" : "Oldest"}
        </button>
        {active > 0 ? (
          <button
            type="button"
            onClick={() => { props.onClear(); setOpen(null); }}
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-muted-foreground"
          >
            <RotateCcw className="size-3.5" /> Clear
          </button>
        ) : null}
      </div>

      {openGroup ? (
        <div className="animate-fade-in surface-card bg-surface-2 p-2">
          <div className="flex flex-wrap gap-2">
            {[{ label: openGroup.allLabel, value: "all" }, ...openGroup.options.map((option) => ({ label: option, value: option }))].map((option) => {
              const selected = openGroup.value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => { openGroup.onChange(option.value); setOpen(null); }}
                  className={`inline-flex min-h-10 items-center rounded-full px-4 text-sm ${
                    selected ? "bg-primary text-primary-foreground" : "bg-surface text-foreground/85"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Filter({ label, value, onChange, options, allLabel }: { label: string; value: string; onChange: (value: string) => void; options: string[]; allLabel: string }) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold uppercase text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-11 bg-surface"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
        </SelectContent>
      </Select>
    </label>
  );
}
