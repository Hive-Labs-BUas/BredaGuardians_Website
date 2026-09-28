import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  ClipboardList,
  Clapperboard,
  Crown,
  FlaskConical,
  Linkedin,
  MessageSquare,
  Rocket,
  Star,
  UsersRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ApplyDialog } from "@/components/site/ApplyDialog";
import { PageHeader, SectionHeading, Tag } from "@/components/site/Bits";
import { SafeImage } from "@/components/site/SafeImage";
import { Bio } from "@/components/site/Bio";
import { SITE_URL } from "@/lib/site-data";
import { splitPeople, useInterns, type PersonRow } from "@/lib/queries";
import { getPublicHome } from "@/lib/public-content.functions";

const TITLE = "Our Team — Breda Guardians Crew & Esports Internships";
const DESCRIPTION =
  "Meet the Breda Guardians core team and interns, and apply for open roles in events, content, management and research.";

export const Route = createFileRoute("/our-team")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: `${SITE_URL}/our-team` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/our-team` }],
  }),
  loader: async () => (await getPublicHome()).interns,
  component: OurTeam,
});

const ROLES = [
  {
    title: "Event Manager",
    icon: CalendarDays,
    summary: "Plan and run our play nights, LAN days and tournaments from first idea to final scoreboard.",
    responsibilities: [
      "Build the semester event calendar together with the manager and the BUas supervisor",
      "Own weekly community nights end to end: concept, sign-ups, format, prizes and hosting",
      "Produce LAN days and open tournaments — floor plan, PC setup, schedule and run-of-show",
      "Draw up brackets, brief casters and referees, and keep matches running on time",
      "Coordinate the broadcast desk: stream layout, overlays, camera and sound checks",
      "Arrange gear, room bookings, catering and volunteer shifts for every event",
      "Welcome newcomers on the door and make sure nobody stands around alone",
      "Debrief after each event with attendance numbers, costs and lessons for the next one",
    ],
    learn: "You leave with real live-event production experience and a portfolio of events you ran yourself.",
    fits: "You love logistics, loud crowds and making sure the show starts on time.",
  },
  {
    title: "Content Marketing Manager",
    icon: Clapperboard,
    summary: "Turn matches and community moments into social posts, clips and campaigns that grow the Hive.",
    responsibilities: [
      "Own the content calendar across Instagram, TikTok, YouTube, Twitch and Discord",
      "Shoot and edit short-form clips: match highlights, Hive atmosphere, player features",
      "Write match-day graphics, results posts, roster announcements and event promos",
      "Run campaigns around tryouts, membership drives and partner activations",
      "Guard the Guardians voice and visual style so everything looks like one brand",
      "Photograph events and build a reusable media library for the whole team",
      "Track reach, saves and sign-ups per post and report what actually works",
      "Work with players and coaches to turn their stories into content they are proud of",
    ],
    learn: "You leave with a published body of work, real audience numbers and campaign results you can show.",
    fits: "You are always filming, editing or writing the next story.",
  },
  {
    title: "Overall Manager",
    icon: Crown,
    summary: "Keep the whole operation moving: planning, partners, the intern team and day-to-day decisions.",
    responsibilities: [
      "Set the semester roadmap with clear goals for community, teams and content",
      "Lead the intern crew: weekly stand-ups, task ownership and one-to-ones",
      "Be the contact point for BUas staff, partners and external tournament organisers",
      "Prepare partner proposals, keep agreements on track and deliver what we promised",
      "Watch the budget: event spend, merchandise, memberships and reporting",
      "Keep membership and shop requests moving so members are never left waiting",
      "Unblock projects, make the call when priorities clash and keep deadlines honest",
      "Hand over cleanly: documentation, contacts and playbooks for the next crew",
    ],
    learn: "You leave with genuine management experience: a team, a budget and stakeholders who count on you.",
    fits: "You are the person who keeps the group chat organised and the calendar full.",
  },
  {
    title: "Research Intern",
    icon: FlaskConical,
    summary: "Work with BUas staff on esports research projects and publish findings the community can use.",
    responsibilities: [
      "Scope research questions around student esports, wellbeing and venue design",
      "Design surveys and interview guides, and recruit participants from the community",
      "Run interviews and observation sessions inside the Hive during live activity",
      "Clean and analyse the data, and turn the numbers into clear visuals",
      "Write up findings as readable articles for the research section of the site",
      "Present results to the intern team, BUas staff and partners",
      "Translate conclusions into practical changes to events, coaching or the venue",
      "Keep data handling ethical: consent, anonymity and careful storage",
    ],
    learn: "You leave with published research, presentation experience and a method you can reuse in your thesis.",
    fits: "You are curious about the why behind competitive gaming and love backing ideas with data.",
  },
] as const;

const PROCESS = [
  { icon: ClipboardList, num: "01", title: "Apply", text: "Choose the role that fits and tell us what you want to build." },
  { icon: MessageSquare, num: "02", title: "Interview", text: "Meet the current interns and our BUas supervisor in the Hive." },
  { icon: Rocket, num: "03", title: "Onboard", text: "Get a lane, a mentor and meaningful work from your first week." },
] as const;

function PersonCard({ person, highlight = false }: { person: PersonRow; highlight?: boolean }) {
  return (
    <article
      className={`surface-card overflow-hidden bg-surface-2 ${
        highlight ? "border-primary/35 shadow-[0_24px_60px_-40px_color-mix(in_oklab,var(--primary)_60%,transparent)]" : ""
      }`}
    >
      <SafeImage
        src={person.photo_url}
        alt={`${person.name}, ${person.role} at Breda Guardians`}
        width={640}
        height={640}
        className="aspect-square w-full"
      />
      <div className="p-5">
        {person.role ? <Tag>{person.role}</Tag> : highlight ? <Tag>Core team</Tag> : null}
        <h3 className="mt-3 text-xl">{person.name}</h3>
        <Bio text={person.blurb} />
        {person.linkedin_url && (
          <a
            href={person.linkedin_url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-gold-bright"
          >
            <Linkedin className="size-4" aria-hidden />
            LinkedIn
            <span className="sr-only">profile of {person.name}</span>
          </a>
        )}
      </div>
    </article>
  );
}

function OurTeam() {
  const loaded = Route.useLoaderData();
  const { data } = useInterns(loaded);
  const people = splitPeople((data?.team ?? []) as PersonRow[]);

  return (
    <>
      <PageHeader
        eyebrow="Our team"
        title="The People Behind It"
        intro="Join the students who run Breda Guardians. Real projects, real responsibility, and a front-row seat to Dutch student esports."
      />

      {/* Core team — only shown on this page */}
      {people.core.length > 0 && (
        <section className="warm-band section-y-first">
          <div className="container-site">
            <SectionHeading
              eyebrow="Core team"
              title="Closest To The Badge"
              intro="The people involved in the Guardians family day in, day out."
            />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 md:mt-14">
              {people.core.map((person) => (
                <PersonCard key={person.id} person={person} highlight />
              ))}
            </div>
            <p className="mt-6 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <Star className="size-3.5 text-primary" aria-hidden /> Core crew
            </p>
          </div>
        </section>
      )}

      {/* Interns */}
      <section className={people.core.length > 0 ? "section-y" : "warm-band section-y-first"}>
        <div className="container-site">
          <SectionHeading
            eyebrow="The interns"
            title="Meet This Semester's Crew"
            intro="A rotating crew of interns keeps the Guardians moving. This is who you’ll work with."
          />
          {people.interns.length > 0 ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 md:mt-14">
              {people.interns.map((person) => (
                <PersonCard key={person.id} person={person} />
              ))}
            </div>
          ) : (
            <div className="surface-card mt-10 flex flex-col items-center justify-center gap-5 bg-surface-2 p-8 text-center md:p-12">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                <UsersRound className="size-8 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl">Join the team</h3>
                <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                  Our intern photos and bios are updated each semester. If you want to see your name here next term,
                  apply for one of the open roles below.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Why intern */}
      <section className="warm-band section-y">
        <div className="container-site">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <SectionHeading
                eyebrow="Why intern"
                title="Build Something You Actually Play"
                intro="Interning at Breda Guardians means running live events, growing a community, managing partnerships and publishing research."
              />
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Hands-on", text: "Run events and campaigns from week one." },
                  { label: "Team", text: "Work with a tight, motivated intern crew." },
                  { label: "Network", text: "Meet partners, players and BUas staff." },
                  { label: "Growth", text: "Leave with portfolio work and references." },
                ].map((item) => (
                  <div key={item.label} className="panel-gradient p-5">
                    <p className="font-display text-lg text-primary">{item.label}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel-gradient p-7 md:p-10">
              <p className="eyebrow">Ready to apply?</p>
              <h3 className="mt-4 text-2xl md:text-3xl">Pick a role and introduce yourself</h3>
              <p className="mt-4 text-sm text-muted-foreground">
                Applications are open to students and anyone studying. We read every application and reply within two
                working days.
              </p>
              <Button asChild size="lg" className="mt-7 w-full">
                <a href="#open-positions">View open positions</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* The process */}
      <section className="section-y">
        <div className="container-site">
          <SectionHeading
            eyebrow="How it works"
            title="Three Steps Into The Team"
            intro="From application to your first project in under two weeks."
          />
          <ol className="mt-12 grid gap-5 md:mt-14 md:grid-cols-3">
            {PROCESS.map((step) => (
              <li key={step.num} className="surface-card relative overflow-hidden p-7">
                <span className="absolute right-4 top-0 font-display text-6xl text-primary/10">{step.num}</span>
                <step.icon className="size-7 text-primary" />
                <h3 className="mt-8 text-2xl">{step.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Open positions */}
      <section id="open-positions" className="warm-band section-y">
        <div className="container-site">
          <SectionHeading
            eyebrow="Open positions"
            title="Roles You Can Apply For"
            intro="Each role owns a real piece of the Guardians. Choose the one that matches your skills and ambition."
          />
          <div className="mt-12 grid gap-6 md:mt-14 md:grid-cols-2">
            {ROLES.map((position) => (
              <article key={position.title} className="division-card flex flex-col p-7">
                <div className="flex items-start justify-between gap-4">
                  <span className="icon-tile size-12">
                    <position.icon className="size-5" />
                  </span>
                  <span className="gradient-pill">{position.title}</span>
                </div>
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{position.summary}</p>
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">What you&apos;ll do</p>
                  <ul className="mt-3 space-y-2">
                    {position.responsibilities.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-5 space-y-4 rounded-lg bg-surface/40 p-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">Great if</p>
                    <p className="mt-1 text-sm text-muted-foreground">{position.fits}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">What you&apos;ll learn</p>
                    <p className="mt-1 text-sm text-muted-foreground">{position.learn}</p>
                  </div>
                </div>
                <ApplyDialog position={position.title} />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-y">
        <div className="container-site">
          <div className="panel-gradient flex flex-col items-center gap-6 p-8 text-center md:p-12">
            <p className="eyebrow">Questions?</p>
            <h2 className="max-w-2xl text-2xl md:text-3xl">
              Not sure which role fits? Reach out and we&apos;ll help you decide.
            </h2>
            <Button asChild size="lg" variant="outline">
              <a href="/contact">Contact the team</a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
