import { ArticleImage } from "@/components/site/ArticleImage";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, Check, Gamepad2, Handshake, MessageCircle, Radio, Search } from "lucide-react";

import heroVideo from "@/assets/hive-hero.mp4.asset.json";
import { Button } from "@/components/ui/button";
import { CardRail, Marquee, RailItem, SectionHeading, Tag } from "@/components/site/Bits";
import { Reveal } from "@/components/site/Motion";
import { DIVISIONS, INTERNS, PARTNERS, SITE, TICKER_FACTS, SITE_URL } from "@/lib/site-data";
import { NewsCarousel } from "@/components/site/NewsCarousel";
import { SafeImage } from "@/components/site/SafeImage";
import { Bio } from "@/components/site/Bio";
import { splitPeople, type PersonRow, type PublicNews } from "@/lib/queries";
import { useInterns } from "@/lib/queries";
import { useTeams } from "@/lib/teams";
import { getPublicHome } from "@/lib/public-content.functions";

const TITLE = "Breda Guardians Esports — Gaming Community in Breda (BUas)";
const DESCRIPTION =
  "Breda Guardians is the competitive esports community of Breda University of Applied Sciences. Four rosters, weekly community nights and the Hive — the gaming space in Breda for students.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: `${SITE_URL}/` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
  }),
  loader: () => getPublicHome(),
  component: Home,
});

const WHAT_WE_DO = [
  {
    num: "01",
    title: "Community",
    text: "Weekly play nights, LANs and open tournaments at the Hive, no rank requirement and all people interested in gaming are welcome.",
    linkLabel: "See membership",
    to: "/shop",
  },
  {
    num: "02",
    title: "Research",
    text: "Published studies on student esports, wellbeing and venue design, made within BUas and with students from all over the world.",
    linkLabel: "Browse the research archive",
    to: "/research",
  },
  {
    num: "03",
    title: "Compete",
    text: "We encourage and enable teams across multiple titles, check our rosters or join the Discord for finding your game to compete in a team with.",
    linkLabel: "View the Hall of Fame",
    to: "/hall-of-fame",
  },
  {
    num: "04",
    title: "EDUCATION",
    text: "Besides playing videogames we also host the Sports & Esports Specialisation, Minor Esports Events & Media Management, Applied Data Science Specialisation and Minor. ",
    linkLabel: "Host or join one on Discord",
    to: SITE.discordUrl,
  },
] as const;

const PATHS = [
  {
    label: "Player",
    text: "Try out for a roster or just show up to a play night and see where you land.",
    cta: "Tryout Now",
    to: SITE.discordUrl,
    icon: Gamepad2,
  },
  {
    label: "Partner",
    text: "Reach thousands of students in Breda through our teams, events and broadcasts.",
    cta: "Talk Partnerships",
    to: "/contact",
    icon: Handshake,
  },
  {
    label: "Curious",
    text: "Meet the interns behind the org and read how the Guardians came together.",
    cta: "Meet The Team",
    to: "/our-team",
    icon: Search,
  },
] as const;

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": ["Organization", "SportsTeam"],
  name: "Breda Guardians",
  sport: "Esports",
  foundingDate: "2015",
  description: DESCRIPTION,
  url: "https://bredaguardians.com",
  parentOrganization: {
    "@type": "CollegeOrUniversity",
    name: "Breda University of Applied Sciences",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Breda",
    addressCountry: "NL",
  },
  sameAs: [SITE.discordUrl, SITE.instagramUrl, SITE.tiktokUrl, SITE.twitchUrl, SITE.linkedinUrl, SITE.youtubeUrl],
};

function Home() {
  const loaded = Route.useLoaderData();
  const { data: teams } = useTeams(loaded.teams);
  const { data: internData } = useInterns(loaded.interns);

  // Only interns show here — the core team lives on the Our Team page.
  const livePeople = splitPeople((internData?.team ?? []) as PersonRow[]).interns;
  const team =
    livePeople.length > 0
      ? livePeople.map((row) => ({
          name: row.name,
          role: row.role,
          blurb: row.blurb,
          photo: row.photo_url ?? "",
        }))
      : INTERNS;
  const news = (loaded.news ?? []) as PublicNews[];

  const divisions =
    teams && teams.length > 0
      ? teams.map((entry) => ({
          game: entry.game,
          team: entry.name,
          text: entry.blurb || entry.tagline,
          slug: entry.slug,
          art: entry.logo_url ?? entry.image_url ?? null,
        }))
      : DIVISIONS.map((entry) => ({ ...entry, slug: null as string | null, art: null as string | null }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }}
      />

      {/* ---------- HERO ---------- */}
      <section className="warm-band-plain clip-diagonal-bottom relative min-h-[calc(100svh-8rem)] overflow-hidden pb-24 lg:min-h-[88vh]">
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <span aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[70%] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 z-[2] h-2/3 bg-gradient-to-t from-background via-background/35 to-transparent lg:hidden" />

        <video
          src={heroVideo.url}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
          className="hero-video-drift motion-reduce:hidden pointer-events-none absolute inset-0 z-[1] size-full object-cover opacity-100 brightness-[0.95] saturate-100"
        />
        <div aria-hidden className="absolute inset-0 z-[2] bg-background/5" />
        <div aria-hidden className="absolute inset-0 z-[2] bg-gradient-to-r from-background via-background/40 to-background/5" />


        <div className="container-site relative z-10 flex min-h-[calc(100svh-8rem)] items-end pb-20 pt-10 sm:pt-14 lg:min-h-[80vh] lg:items-center lg:pb-20 lg:pt-16">

          <div className="relative z-10 max-w-2xl">
            <p className="eyebrow">BREDA ESPORTS · EST. {SITE.founded}</p>
            <h1 className="mt-4 text-4xl leading-[0.95] drop-shadow-[0_3px_18px_var(--background)] sm:text-6xl lg:text-7xl">
              We Are
              <br />
              <span className="text-primary">BREDA GUARDIANS</span>
            </h1>
            <p className="mt-5 max-w-md text-base text-foreground/80 drop-shadow-[0_2px_10px_var(--background)] md:text-lg">
              The competitive esports team and gaming community of Breda — built by BUas students,
              open to everyone in the Netherlands who takes the game seriously.
            </p>
            <div className="mt-8">
              <Button asChild size="xl">
                <a href={SITE.discordUrl} target="_blank" rel="noopener noreferrer">Join The Community</a>
              </Button>
            </div>
          </div>
        </div>

        <a
          href="#what-we-do"
          className="absolute bottom-16 left-1/2 md:bottom-20 z-10 flex min-h-11 min-w-11 -translate-x-1/2 flex-col items-center justify-center gap-1 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-foreground/70 transition-colors hover:text-primary"
        >
          Scroll
          <ArrowDown className="size-4 animate-bounce-soft text-primary" />
        </a>
      </section>

      {/* ---------- FACT TICKER ---------- */}
      <div className="ticker-bridge relative py-3">
        <Marquee items={TICKER_FACTS} repeat={6} />
      </div>

      {/* ---------- WHAT WE DO ---------- */}
      <section id="what-we-do" className="section-y scroll-mt-20">
        <div className="container-site">
          <SectionHeading
            eyebrow="What we do"
            title="Four Things, Done Properly"
            intro="Everything the Guardians do falls into one of four lanes. Pick the one that sounds like you."
          />
          <div className="mt-10 grid gap-10 sm:grid-cols-2 md:mt-12 lg:grid-cols-4 lg:gap-8">
            {WHAT_WE_DO.map((item, index) => {
              const external = item.to.startsWith("http");
              return (
              <Reveal key={item.num} delay={index * 90} className="border-t-2 border-primary/60 pt-6">
                <span className="font-display text-4xl text-primary md:text-5xl">{item.num}</span>
                <h3 className="mt-3 text-2xl">{item.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{item.text}</p>
                {external ? (
                  <a
                    href={item.to}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-gold-bright"
                  >
                    {item.linkLabel}
                    <ArrowRight className="size-4" />
                  </a>
                ) : (
                  <Link
                    to={item.to}
                    className="mt-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-gold-bright"
                  >
                    {item.linkLabel}
                    <ArrowRight className="size-4" />
                  </Link>
                )}
              </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- DIVISIONS ---------- */}
      <section className="section-y">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Our divisions"
              title="Five Games. Room For Everyone."
              intro="From tactical FPS to fighting-game weeklies — pick your battleground or find your lane on Discord."
            />
            <Link
              to="/hall-of-fame"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-primary/35 px-5 text-sm font-semibold uppercase tracking-wider text-primary transition-colors hover:border-primary hover:text-gold-bright"
            >
              All teams <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-10 md:mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {divisions.map((division, index) => {
              const inner = (
                <>
                  <div className="flex items-start justify-between gap-4">
                    {division.art ? (
                      <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-primary/25 bg-surface-2 p-2.5">
                        <img
                          src={division.art}
                          alt={`${division.game} logo`}
                          loading="lazy"
                          width={160}
                          height={160}
                          className="max-h-full max-w-full object-contain"
                        />
                      </span>
                    ) : (
                      <span className="icon-tile size-14 font-display text-2xl">
                        {division.game.charAt(0)}
                      </span>
                    )}
                    <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {division.game}
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl">{division.team}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{division.text}</p>
                  <div className="mt-6 flex items-center gap-2 border-t border-border/60 pt-5 text-sm font-semibold uppercase tracking-wider text-primary">
                    View roster
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </>
              );

              const cardClass = `division-card group flex h-full flex-col p-6 animate-fade-up${index >= 3 ? " hidden md:flex" : ""}`;
              const style = { animationDelay: `${index * 70}ms` };

              return division.slug ? (
                <Link key={division.slug ?? division.game} to="/teams/$slug" params={{ slug: division.slug }} className={cardClass} style={style}>
                  {inner}
                </Link>
              ) : (
                <article key={`${division.game}-${index}`} className={cardClass} style={style}>
                  {inner}
                </article>
              );
            })}

            <a
              href={SITE.discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="division-cta-card flex h-full flex-col p-6 animate-fade-up"
              style={{ animationDelay: `${divisions.length * 70}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="grid size-14 shrink-0 place-items-center rounded-xl border border-primary/40 bg-primary/15 text-primary">
                  <MessageCircle className="size-6" />
                </span>
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary">
                  Interested?
                </span>
              </div>
              <h3 className="mt-6 text-xl text-foreground">Join The Conversation</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                Not sure which game is yours yet? Jump into our Discord, meet the community and find your lane.
              </p>
              <div className="mt-5 flex items-center gap-2 border-t border-primary/25 pt-5 text-sm font-semibold uppercase tracking-wider text-primary">
                Join Discord
                <ArrowRight className="size-4" />
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ---------- MEET THE TEAM ---------- */}
      <section className="section-y">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <SectionHeading
              eyebrow="Meet the team"
              title="The People Behind It"
              intro="A crew of BUas interns runs the Guardians day to day — events, content, partnerships and research."
            />
            <Link
              to="/our-team"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-primary/35 px-5 text-sm font-semibold uppercase tracking-wider text-primary transition-colors hover:border-primary hover:text-gold-bright"
            >
              Meet the full team <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-10 md:mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {team.slice(0, 4).map((intern, index) => (
              <Reveal
                key={`${intern.role}-${index}`}
                as="article"
                delay={index * 70}
                className="surface-card hover-glow overflow-hidden bg-surface-2"
              >
                <SafeImage
                  src={intern.photo}
                  alt={`${intern.name}, ${intern.role} at Breda Guardians`}
                  width={640}
                  height={640}
                  className="aspect-square w-full"
                />
                <div className="p-5">
                  <Tag>{intern.role}</Tag>
                  <h3 className="mt-3 text-xl">{intern.name}</h3>
                  <Bio text={intern.blurb} />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- LATEST NEWS ---------- */}
      {news.length > 0 && (
        <section className="warm-band section-y">
          <div className="container-site">
            <SectionHeading
              eyebrow="Latest from the Hive"
              title="News & Stories"
              intro="Match reports, community nights and everything else happening around the Guardians."
            />
            <div className="mt-10 md:mt-12">
              <NewsCarousel items={news} />
            </div>
          </div>
        </section>
      )}

      {/* ---------- WATCH LIVE ---------- */}
      <section className="section-y-sm">
        <div className="container-site">
          <div className="panel-gradient flex flex-col items-start gap-5 p-7 md:flex-row md:items-center md:justify-between md:p-9">
            <div className="max-w-2xl">
              <p className="eyebrow inline-flex items-center gap-2">
                <Radio className="size-4 text-primary" aria-hidden /> Watch us live
              </p>
              <h2 className="mt-3 text-2xl md:text-3xl">Match Days, Streamed From The Hive</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Catch our broadcasts and chat along with the rest of the community.
              </p>
            </div>
            <Link
              to="/live"
              className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-primary/50 px-5 font-display text-sm uppercase tracking-wider text-primary transition-colors hover:bg-primary/10"
            >
              Open the stream <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>


      {/* ---------- BANNER STRIP ---------- */}
      <section className="warm-band relative overflow-hidden">
        <span
          aria-hidden
          className="absolute -left-24 top-1/2 size-72 -translate-y-1/2 rounded-full bg-primary/10 blur-[110px]"
        />
        <div aria-hidden className="hairline-gold absolute inset-x-0 top-0" />
        <div className="container-site relative flex flex-col items-start gap-6 py-12 md:flex-row md:items-center md:justify-between md:py-14">
          <Reveal>
            <p className="eyebrow">The Hive · Breda</p>
            <p className="mt-3 max-w-2xl font-display text-2xl leading-tight md:text-3xl">
              A campus gaming space, four competitive rosters and a Discord that never sleeps.
            </p>
          </Reveal>
          <Button asChild size="lg" className="shrink-0">
            <a href={SITE.discordUrl} target="_blank" rel="noopener noreferrer">Join The Discord</a>
          </Button>
        </div>
      </section>

      {/* ---------- PARTNERS MARQUEE ---------- */}
      <section className="section-y-sm relative">
        <div aria-hidden className="hairline-gold absolute inset-x-0 top-0" />
        <div className="container-site">
          <p className="eyebrow text-center">Our Official Partners</p>
        </div>
        <Marquee
          slow
          fade
          repeat={6}
          className="mt-8"
          items={PARTNERS}
          renderItem={(partner) => (
            <span className="surface-card mx-3 flex min-h-24 min-w-60 items-center gap-4 px-5 transition-colors hover:border-primary/45">
              <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-white p-2">
                <img
                  src={partner.logo}
                  alt={`${partner.name} logo`}
                  loading="lazy"
                  width={816}
                  height={816}
                  className="max-h-full w-full object-contain"
                />
              </span>
              <span className="font-display text-lg leading-tight tracking-wide text-foreground/80">
                {partner.name}
              </span>
            </span>
          )}
        />
        <div aria-hidden className="hairline-gold absolute inset-x-0 bottom-0" />
      </section>

      {/* ---------- CHOOSE YOUR PATH ---------- */}
      <section className="warm-band glow-top section-y">
        <div className="container-site">
          <SectionHeading
            eyebrow="Choose your path"
            title="Where Do You Fit?"
            intro="Three ways into the Guardians — pick the one that sounds like you."
          />
          <div className="mt-10 md:mt-12 grid gap-6 lg:grid-cols-3 lg:gap-7">
            {PATHS.map((path, index) => {
              const external = path.to.startsWith("http");
              const Wrapper = (external ? "a" : Link) as typeof Link;
              const wrapperProps = external
                ? { href: path.to, target: "_blank", rel: "noreferrer" }
                : { to: path.to };
              return (
              <Wrapper
                key={path.label}
                {...wrapperProps}
                className="glass-card group relative flex flex-col gap-7 overflow-hidden rounded-2xl p-7 md:p-8 transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-gold"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                />

                <div className="flex items-center justify-between gap-4">
                  <span className="grid size-14 shrink-0 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-primary transition-all duration-500 group-hover:scale-105 group-hover:border-primary/50">
                    <path.icon className="size-6" />
                  </span>
                  <span
                    aria-hidden
                    className="font-display text-4xl leading-none text-foreground/8 transition-colors duration-500 group-hover:text-primary/25"
                  >
                    0{index + 1}
                  </span>
                </div>

                <div className="flex flex-1 flex-col items-start gap-3">
                  <Tag>{path.label}</Tag>
                  <p className="text-sm leading-relaxed text-muted-foreground">{path.text}</p>
                </div>

                <div className="flex items-center gap-2 border-t border-border/70 pt-5 text-sm font-semibold uppercase tracking-wider text-primary transition-colors duration-300 group-hover:text-primary">
                  {path.cta}
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </Wrapper>
              );
            })}
          </div>
        </div>
      </section>


      {/* ---------- MEMBERSHIP TEASER ---------- */}
      <section className="section-y">
        <div className="container-site">
          <div className="panel-gradient hover-glow grid items-center gap-9 p-7 md:grid-cols-[1.4fr_1fr] md:gap-12 md:p-14">
            <div>
              <p className="eyebrow">Membership</p>
              <h2 className="mt-3 text-3xl md:text-4xl">Play More, Pay Less</h2>
              <ul className="mt-6 space-y-2.5 text-sm text-muted-foreground">
                {[
                  "Priority booking on Hive stations",
                  "Monthly coaching and VOD review",
                  "Guaranteed tryout slot each season",
                  "Discount on all Guardians merch",
                ].map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-end">
              <Button asChild size="xl" className="w-full">
                <Link to="/shop">Get Membership</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
