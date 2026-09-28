import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarClock, Crown, Radio, Shield, Swords, Trophy, Users } from "lucide-react";

import { Tag } from "@/components/site/Bits";
import { SafeImage } from "@/components/site/SafeImage";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/queries";
import { ageFrom, countryFlag, nationalityCodes } from "@/lib/people";
import { COUNTRIES } from "@/lib/countries";
import { useTeamPage } from "@/lib/teams";
import { SITE, SITE_URL } from "@/lib/site-data";
import { getPublicTeamPage } from "@/lib/public-content.functions";

export const Route = createFileRoute("/teams/$slug")({
  head: ({ params }) => {
    const label = params.slug
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    const title = `${label} Roster — Breda Guardians`;
    const description = `The Breda Guardians ${label} roster: players, nationalities, upcoming matches, results and how to try out. Based at The Hive at BUas in Breda.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { property: "og:url", content: `${SITE_URL}/teams/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `${SITE_URL}/teams/${params.slug}` }],
    };
  },
  loader: ({ params }) => getPublicTeamPage({ data: { slug: params.slug } }),
  component: TeamPage,
});

function countryName(code: string | null | undefined): string | null {
  if (!code) return null;
  const match = COUNTRIES.find((country) => country.code === code.toUpperCase());
  return match?.name ?? code.toUpperCase();
}

type MatchRow = {
  id: string;
  outcome: string | null;
  competition: string;
  stage: string;
  opponent: string;
  opponent_logo_url: string | null;
  score_us: number | null;
  score_them: number | null;
  played_at: string;
  status?: string | null;
};

function isUpcoming(row: MatchRow): boolean {
  if (row.status === "scheduled") return true;
  if (row.status === "played") return false;
  return (
    (row.score_us === null || row.score_them === null) && new Date(row.played_at).getTime() > Date.now()
  );
}

function outcomeTone(outcome: string | null): string {
  const value = outcome?.trim().toLowerCase();
  if (value === "win" || value === "won" || value === "w") return "border-primary text-primary";
  if (value === "loss" || value === "lost" || value === "l") return "border-destructive text-destructive";
  return "border-border text-muted-foreground";
}

function TeamPage() {
  const { slug } = Route.useParams();
  const { data } = useTeamPage(slug, Route.useLoaderData() ?? undefined);

  if (!data) {
    return (
      <section className="flex min-h-[60vh] items-center">
        <div className="container-site max-w-md text-center">
          <h1 className="text-4xl">Roster not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This team page isn't live yet. Check the full list of rosters instead.
          </p>
          <Button asChild size="lg" className="mt-7">
            <Link to="/rosters">All rosters</Link>
          </Button>
        </div>
      </section>
    );
  }

  const { team, players } = data;
  const allResults = (data.results ?? []) as MatchRow[];
  const upcoming = allResults
    .filter(isUpcoming)
    .sort((a, b) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime());
  const played = allResults.filter((row) => !isUpcoming(row));
  const nextMatch = upcoming[0];

  const schema = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: team.name,
    sport: team.game,
    description: team.blurb || team.tagline,
    url: `${SITE_URL}/teams/${team.slug}`,
    memberOf: { "@type": "SportsOrganization", name: "Breda Guardians", url: SITE_URL },
    location: { "@type": "Place", name: "The Hive, BUas Campus", address: "Breda, Netherlands" },
    athlete: players.map((player) => ({ "@type": "Person", name: player.handle || player.name })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main className="team-command-page">
        <header className="team-command-hero">
          {team.image_url ? (
            <SafeImage
              src={team.image_url}
              alt=""
              width={1800}
              height={900}
              loading="eager"
              className="absolute inset-0 size-full opacity-20 grayscale"
            />
          ) : null}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/60" />
          <div aria-hidden className="team-command-grid absolute inset-0 opacity-35" />

          <div className="container-site relative z-10 py-8 md:py-12">
            <Button asChild variant="ghost" size="sm" className="-ml-3 mb-7 text-muted-foreground hover:text-primary">
              <Link to="/rosters">
                <ArrowLeft className="size-4" aria-hidden /> All teams
              </Link>
            </Button>

            <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
                <div className="team-command-logo">
                  <SafeImage
                    src={team.logo_url}
                    alt={`${team.name} logo`}
                    width={144}
                    height={144}
                    contain
                    loading="eager"
                    className="size-full p-4"
                    logoClassName="size-3/4"
                  />
                </div>
                <div className="min-w-0">
                  <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-primary">
                    <span className="size-2 bg-primary shadow-gold" aria-hidden /> Active roster
                  </p>
                  <h1 className="text-4xl text-foreground sm:text-5xl md:text-6xl">{team.name}</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    <span>{team.game}</span>
                    <span aria-hidden className="h-4 w-px bg-border" />
                    <span>{players.length} players</span>
                    {team.tagline ? (
                      <>
                        <span aria-hidden className="h-4 w-px bg-border" />
                        <span>{team.tagline}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <nav aria-label="Team page sections" className="flex w-full gap-2 overflow-x-auto pb-1 lg:w-auto">
                <Button asChild size="sm" className="shrink-0">
                  <a href="#roster">Roster</a>
                </Button>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <a href="#matches">Matches</a>
                </Button>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <a href="#tryouts">Tryouts</a>
                </Button>
              </nav>
            </div>

            <div className="mt-8 grid grid-cols-3 border-y border-primary/20 bg-background/45 backdrop-blur-sm">
              <div className="team-command-stat">
                <Users className="size-4 text-primary" aria-hidden />
                <span className="text-2xl font-bold text-foreground">{players.length}</span>
                <span>Players</span>
              </div>
              <div className="team-command-stat">
                <CalendarClock className="size-4 text-primary" aria-hidden />
                <span className="text-2xl font-bold text-foreground">{upcoming.length}</span>
                <span>Upcoming</span>
              </div>
              <div className="team-command-stat">
                <Trophy className="size-4 text-primary" aria-hidden />
                <span className="text-2xl font-bold text-foreground">{played.length}</span>
                <span>Results</span>
              </div>
            </div>
          </div>
        </header>

        <section className="section-y-sm">
          <div className="container-site">
            {team.blurb ? (
              <div className="mb-8 border-l-2 border-primary pl-5 md:mb-10">
                <p className="max-w-[72ch] text-base leading-relaxed text-foreground/80 md:text-lg">{team.blurb}</p>
              </div>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,0.85fr)]">
              <div className="space-y-6">
                <section id="roster" className="scroll-mt-24">
                  <div className="team-command-heading">
                    <div>
                      <p className="text-xs font-bold uppercase text-primary">Team unit</p>
                      <h2 className="mt-1 text-2xl md:text-3xl">Active roster</h2>
                    </div>
                    <span className="text-xs text-muted-foreground">{players.length} slots filled</span>
                  </div>
            {players.length === 0 ? (
                    <div className="team-command-panel mt-4 p-6 text-sm text-muted-foreground">
                This roster is being finalised — announcements land in our Discord first.
                    </div>
            ) : (
                    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {players.map((player) => {
                  const codes = nationalityCodes(player);
                  const nations = codes.map((code) => countryName(code)).filter(Boolean) as string[];
                  const nation = nations.join(" · ") || null;
                  const age = ageFrom(player.birth_date);
                  return (
                          <article key={player.id} className="team-player-card group">
                            <div className="relative aspect-[4/5] overflow-hidden bg-background">
                      <SafeImage
                        src={player.photo_url}
                        alt={player.handle || player.name}
                        width={400}
                                height={500}
                                className="size-full opacity-80 transition duration-300 group-hover:scale-[1.03] group-hover:opacity-100"
                      />
                              <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/35 to-transparent" />
                              <div className="absolute inset-x-0 bottom-0 p-4">
                                <p className="text-xs font-bold uppercase text-primary">{player.role || "Player"}</p>
                                <h3 className="mt-1 truncate text-xl text-foreground md:text-2xl">{player.handle || player.name}</h3>
                                {player.handle && player.name !== player.handle ? (
                                  <p className="mt-1 truncate text-xs text-muted-foreground">{player.name}</p>
                                ) : null}
                              </div>
                              {player.is_captain ? (
                                <span className="absolute right-3 top-3 grid size-8 place-items-center border border-primary/40 bg-background/80 text-primary backdrop-blur-sm" title="Captain">
                                  <Crown className="size-4" aria-hidden />
                                </span>
                              ) : null}
                            </div>
                            {(nation || age !== null) ? (
                              <div className="flex min-h-11 items-center justify-between gap-2 border-t border-primary/15 px-4 py-2 text-xs text-muted-foreground">
                                <span className="truncate" title={nation ?? undefined}>{codes.map((code) => countryFlag(code)).join(" ")} {nation}</span>
                                {age !== null ? <span className="shrink-0">Age {age}</span> : null}
                              </div>
                            ) : null}
                            <div className="sr-only">
                        <div className="flex flex-wrap gap-2">
                          {player.is_captain ? (
                            <Tag>
                              <Crown className="mr-1 size-3" aria-hidden /> Captain
                            </Tag>
                          ) : null}
                          {player.role ? <Tag>{player.role}</Tag> : null}
                        </div>
                        <h3 className="mt-3 flex items-center gap-2 text-xl">
                          {player.handle || player.name}
                          {codes.length > 0 ? (
                            <span aria-label={nation ?? undefined} title={nation ?? undefined}>
                              {codes.map((code) => countryFlag(code)).join(" ")}
                            </span>
                          ) : null}
                        </h3>
                        {player.handle && player.name !== player.handle ? (
                          <p className="mt-1 text-sm text-muted-foreground">{player.name}</p>
                        ) : null}
                        <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
                          {nation ? (
                            <div className="flex gap-2">
                              <dt className="font-semibold uppercase tracking-wider">
                                {nations.length > 1 ? "Nationalities" : "Nationality"}
                              </dt>
                              <dd>{nation}</dd>
                            </div>
                          ) : null}
                          {age !== null ? (
                            <div className="flex gap-2">
                              <dt className="font-semibold uppercase tracking-wider">Age</dt>
                              <dd>{age}</dd>
                            </div>
                          ) : null}
                        </dl>
                            </div>
                    </article>
                  );
                })}
              </div>
            )}
                </section>

                <section id="matches" className="team-command-panel scroll-mt-24 p-5 md:p-6">
                  <div className="team-command-heading border-0 p-0">
                    <div>
                      <p className="text-xs font-bold uppercase text-primary">Match feed</p>
                      <h2 className="mt-1 text-2xl md:text-3xl">Mission log</h2>
                    </div>
                    <Radio className="size-5 text-primary" aria-hidden />
                  </div>

                  {allResults.length === 0 ? (
                    <p className="mt-5 border-l-2 border-border bg-background/45 p-4 text-sm text-muted-foreground">No matches published for this roster yet.</p>
                  ) : (
                    <ul className="mt-5 space-y-3">
                      {[...upcoming, ...played].map((row) => {
                        const scheduled = isUpcoming(row);
                        return (
                  <li
                    key={row.id}
                            className={`grid gap-3 border-l-2 bg-background/65 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center ${scheduled ? "border-primary" : outcomeTone(row.outcome)}`}
                  >
                            <span className="flex min-w-0 items-center gap-3">
                              {row.opponent_logo_url ? (
                                <SafeImage src={row.opponent_logo_url} alt={`${row.opponent} logo`} width={36} height={36} contain className="size-9 shrink-0" />
                              ) : (
                                <span className="grid size-9 shrink-0 place-items-center border border-border bg-surface"><Shield className="size-4 text-primary" aria-hidden /></span>
                              )}
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-foreground">vs {row.opponent}</span>
                                <span className="block truncate text-xs text-muted-foreground">{row.competition}{row.stage ? ` · ${row.stage}` : ""}</span>
                              </span>
                            </span>
                            <span className="text-lg font-bold text-foreground">
                              {scheduled ? "Scheduled" : `${row.score_us ?? "–"} – ${row.score_them ?? "–"}`}
                            </span>
                            <span className="text-xs text-muted-foreground">{formatDateTime(row.played_at)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </div>

              <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
                <section className="team-command-panel overflow-hidden">
                  <div className="border-b border-primary/15 bg-primary/8 p-5">
                    <p className="text-xs font-bold uppercase text-primary">Next deployment</p>
                    <h2 className="mt-1 text-2xl">Upcoming match</h2>
                  </div>
                  {nextMatch ? (
                    <div className="p-5">
                      <div className="flex items-center gap-4">
                        {nextMatch.opponent_logo_url ? (
                          <SafeImage src={nextMatch.opponent_logo_url} alt={`${nextMatch.opponent} logo`} width={52} height={52} contain className="size-13" />
                        ) : (
                          <span className="grid size-13 place-items-center border border-primary/20 bg-background"><Shield className="size-5 text-primary" aria-hidden /></span>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground">Breda Guardians vs</p>
                          <p className="font-display text-xl font-bold uppercase text-foreground">{nextMatch.opponent}</p>
                        </div>
                      </div>
                      <div className="mt-5 border-t border-border pt-4 text-sm">
                        <p className="font-semibold text-foreground">{nextMatch.competition}</p>
                        {nextMatch.stage ? <p className="mt-1 text-muted-foreground">{nextMatch.stage}</p> : null}
                        <p className="mt-3 flex items-center gap-2 text-primary"><CalendarClock className="size-4" aria-hidden /> {formatDateTime(nextMatch.played_at)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="p-5 text-sm text-muted-foreground">No upcoming match published.</p>
                  )}
                </section>

                <section id="tryouts" className="team-recruit-panel scroll-mt-24 p-5 md:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <Swords className="size-6 text-primary" aria-hidden />
                    <Tag>Recruitment</Tag>
                  </div>
                  <h2 className="mt-8 text-3xl">Join the frontline</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Tryout windows for every roster are announced in our Discord server.
                  </p>
                  <Button asChild size="lg" className="mt-6 w-full">
                    <a href={SITE.discordUrl} target="_blank" rel="noreferrer">Join Our Discord</a>
                  </Button>
                </section>
              </aside>
            </div>
        </div>
      </section>
      </main>
    </>
  );
}
