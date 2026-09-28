import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, ChevronRight, MessageCircle, Shield, Swords, Trophy, Users } from "lucide-react";

import { SafeImage } from "@/components/site/SafeImage";
import { SITE, SITE_URL } from "@/lib/site-data";
import { getPublicRosters } from "@/lib/public-content.functions";

const TITLE = "Rosters — Breda Guardians Teams & Line-ups";
const DESCRIPTION =
  "Every Breda Guardians team and the game it competes in. Pick a team to see its full roster, players, upcoming matches and latest results.";

export const Route = createFileRoute("/rosters/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: `${SITE_URL}/rosters` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/rosters` }],
  }),
  loader: () => getPublicRosters(),
  component: Rosters,
});

type LoaderData = Awaited<ReturnType<typeof getPublicRosters>>;
type Squad = LoaderData["teams"][number];
type Match = Squad["results"][number];

function formatMatchDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(new Date(value));
}

function MatchPreview({ label, match, upcoming = false }: { label: string; match?: Match | undefined; upcoming?: boolean }) {
  return (
    <div className="min-w-0 border-t border-border/70 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
      <p className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase text-muted-foreground">
        {upcoming ? <CalendarDays className="size-3.5 text-primary" aria-hidden /> : <Trophy className="size-3.5 text-primary" aria-hidden />}
        {label}
      </p>
      {match ? (
        <div className="mt-2 flex min-w-0 items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">vs {match.opponent}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {formatMatchDate(match.played_at)}{match.competition ? ` · ${match.competition}` : ""}
            </p>
          </div>
          {!upcoming && match.score_us !== null && match.score_them !== null ? (
            <span className="shrink-0 font-display text-xl text-primary">{match.score_us}—{match.score_them}</span>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">No match published</p>
      )}
    </div>
  );
}

function TeamCard({ team }: { team: Squad }) {
  const latestResult = team.results[0];
  const nextMatch = team.upcoming[0];

  return (
    <Link
      to="/teams/$slug"
      params={{ slug: team.slug }}
      className="surface-card group relative grid min-h-44 w-full min-w-0 overflow-hidden bg-surface transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-gold md:grid-cols-[13rem_minmax(0,1fr)]"
    >
      <div className="relative hidden overflow-hidden border-r border-border/70 bg-surface-2 md:block">
        {team.image_url ? (
          <SafeImage
            src={team.image_url}
            alt=""
            width={520}
            height={440}
            className="absolute inset-0 size-full opacity-35 grayscale transition duration-500 group-hover:scale-105 group-hover:opacity-50 group-hover:grayscale-0"
          />
        ) : null}
        <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-transparent to-surface" />
        <SafeImage
          src={team.logo_url ?? team.image_url}
          alt={`${team.name} logo`}
          width={112}
          height={112}
          contain
          className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 bg-background/75 p-4 shadow-surface"
        />
      </div>
      <div className="grid min-w-0 gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(15rem,1.35fr)_minmax(10rem,0.8fr)_minmax(10rem,0.8fr)_auto] lg:items-center lg:gap-6 lg:p-8">
        <div className="flex min-w-0 items-center gap-4">
          <SafeImage
            src={team.logo_url ?? team.image_url}
            alt={`${team.name} logo`}
            width={72}
            height={72}
            contain
            className="size-14 shrink-0 bg-background/70 p-2 md:hidden"
          />
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold uppercase text-primary">{team.game}</p>
            <h2 className="mt-1 truncate text-2xl sm:text-3xl">{team.name}</h2>
            <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="size-3.5 text-primary" aria-hidden />
              {team.players.length} player{team.players.length === 1 ? "" : "s"}
              {team.tagline ? ` · ${team.tagline}` : ""}
            </p>
          </div>
        </div>
        <MatchPreview label="Next match" match={nextMatch} upcoming />
        <MatchPreview label="Latest result" match={latestResult} />
        <span className="flex size-11 shrink-0 items-center justify-center justify-self-end rounded-full border border-primary/40 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <ChevronRight className="size-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

function Rosters() {
  const { teams } = Route.useLoaderData();
  const games = new Set(teams.map((team) => team.game)).size;
  const players = teams.reduce((total, team) => total + team.players.length, 0);

  return (
    <>
      <header className="warm-band-plain relative isolate overflow-hidden border-b border-border">
        <div aria-hidden className="absolute inset-y-0 right-0 -z-10 hidden w-1/2 bg-primary/8 [clip-path:polygon(30%_0,100%_0,100%_100%,0_100%)] md:block" />
        <div className="container-site grid min-h-[27rem] items-end gap-10 py-12 md:min-h-[32rem] md:grid-cols-[minmax(0,1.1fr)_minmax(24rem,0.9fr)] md:items-center md:py-16">
          <div className="max-w-3xl">
            <p className="eyebrow">Breda Guardians Rosters</p>
            <h1 className="mt-4 text-5xl leading-none sm:text-6xl md:text-7xl lg:text-8xl">
              One badge.
              <span className="block text-primary">Every game.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/75 md:text-lg">
              Meet every Guardians line-up, discover the players behind the handles, and follow their next matches and latest results.
            </p>
          </div>

          <div className="grid grid-cols-3 border-y border-border/80 md:border md:bg-background/35">
            {[
              [String(teams.length), "Teams"],
              [String(games), "Games"],
              [String(players), "Players"],
            ].map(([value, label], index) => (
              <div key={label} className={`px-3 py-5 text-center md:py-7 ${index ? "border-l border-border/80" : ""}`}>
                <strong className="block font-display text-3xl text-primary md:text-5xl">{value}</strong>
                <span className="mt-1 block text-[0.68rem] font-semibold uppercase text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <section className="warm-band section-y-first">
        <div className="container-site">
          <div className="flex flex-col gap-5 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow">Active divisions</p>
              <h2 className="mt-3 text-3xl md:text-5xl">Choose Your Squad</h2>
            </div>
            <p className="max-w-lg text-sm leading-relaxed text-muted-foreground md:text-right">
              Open a team to explore its full line-up, player details, upcoming fixtures and recent form.
            </p>
          </div>

          <div className="mt-10 space-y-12 md:mt-14">
            {Array.from(
              teams.reduce((groups, team) => {
                const list = groups.get(team.game) ?? [];
                list.push(team);
                groups.set(team.game, list);
                return groups;
              }, new Map<string, Squad[]>()),
            ).map(([game, squads]) => (
              <div key={game} className="grid gap-4 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-8">
                <div className="lg:pt-6">
                  <p className="text-[0.68rem] font-semibold uppercase text-primary">Game</p>
                  <h3 className="mt-2 text-xl leading-tight text-foreground/90">{game}</h3>
                  <p className="mt-2 text-xs text-muted-foreground">{squads.length} squad{squads.length === 1 ? "" : "s"}</p>
                </div>
                <div className="space-y-4">
                  {squads.map((team) => (
                    <TeamCard key={team.id} team={team} />
                  ))}
                </div>
              </div>
            ))}
            {teams.length === 0 && (
              <p className="text-muted-foreground">Teams are published from the admin panel.</p>
            )}
          </div>


          {teams.length > 0 && (
            <a
              href={SITE.discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="division-cta-card group mt-14 flex flex-col gap-6 overflow-hidden p-6 md:flex-row md:items-center md:justify-between md:p-8 lg:ml-[13rem]"
            >
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Swords className="size-5" aria-hidden />
                </span>
                <div>
                <p className="text-[0.68rem] font-semibold uppercase text-primary">Tryouts</p>
                <h2 className="mt-2 text-2xl md:text-3xl">Your Name Could Be Next</h2>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  Every roster on this page started with someone dropping a message in our Discord. Tell us your game
                  and your rank and we will line up a tryout at The Hive.
                </p>
                </div>
              </div>
              <span className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-lg border border-primary/50 px-5 text-sm font-semibold uppercase text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground md:self-auto">
                <MessageCircle className="size-4" aria-hidden /> Join Discord <ArrowRight className="size-4" aria-hidden />
              </span>
            </a>
          )}
        </div>
      </section>

      <section className="section-y-sm border-t border-border/70">
        <div className="container-site">
          <div className="panel-gradient relative isolate flex flex-col items-start gap-8 overflow-hidden p-7 md:flex-row md:items-center md:justify-between md:p-10 lg:p-12">
            <Shield className="absolute -bottom-12 right-8 -z-10 size-56 text-primary opacity-[0.06]" aria-hidden />
            <div className="flex max-w-3xl items-start gap-5">
              <span className="hidden size-14 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary sm:flex">
                <Trophy className="size-6" aria-hidden />
              </span>
              <div>
              <p className="eyebrow">Hall of Fame</p>
              <h2 className="mt-3 text-3xl md:text-4xl">The Teams That Built The Badge</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Walk the timeline of everything the Guardians have achieved since {SITE.founded}, and meet the crews who
                built it.
              </p>
              </div>
            </div>
            <Link
              to="/rosters/hall-of-fame"
              className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-lg border border-primary/50 px-5 font-display text-sm uppercase text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Open the Hall of Fame
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
