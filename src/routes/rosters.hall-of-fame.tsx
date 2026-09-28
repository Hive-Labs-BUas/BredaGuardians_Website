import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileText, Sparkles, Trophy, Users } from "lucide-react";
import { useState } from "react";

import { PageHeader, SectionHeading, Tag } from "@/components/site/Bits";
import { RichText } from "@/components/site/RichText";
import { SafeImage } from "@/components/site/SafeImage";
import { Bio } from "@/components/site/Bio";
import { hasRichText } from "@/lib/sanitize-html";
import { formatDate, formatDateTime, splitPeople, type PersonRow } from "@/lib/queries";
import { SITE, SITE_URL } from "@/lib/site-data";
import { getPublicHallOfFame } from "@/lib/public-content.functions";

const TITLE = "Hall of Fame — Breda Guardians Achievements & Alumni";
const DESCRIPTION =
  "The Breda Guardians Hall of Fame: an interactive timeline of our achievements and the crews and alumni who built the community.";

export const Route = createFileRoute("/rosters/hall-of-fame")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: `${SITE_URL}/rosters/hall-of-fame` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/rosters/hall-of-fame` }],
  }),
  loader: () => getPublicHallOfFame(),
  component: HallOfFamePage,
});

type Honour = Awaited<ReturnType<typeof getPublicHallOfFame>>["honours"][number];

function TimelineEntry({ entry, open, onToggle }: { entry: Honour; open: boolean; onToggle: () => void }) {
  const body = (entry as { content?: string | null }).content;
  const doc = entry as { document_url?: string | null; document_name?: string | null };
  return (
    <li className="relative pl-10 md:pl-14">
      <span
        aria-hidden
        className="absolute left-[0.85rem] top-2 size-3 -translate-x-1/2 rounded-full bg-primary ring-4 ring-primary/20 md:left-[1.35rem]"
      />
      <div className="surface-card overflow-hidden bg-surface-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex w-full flex-col gap-2 p-5 text-left md:p-6"
        >
          <Tag>{formatDate(entry.achieved_on)}</Tag>
          <span className="font-display text-xl uppercase leading-tight md:text-2xl">{entry.title}</span>
          <span className="text-sm text-muted-foreground">{entry.description}</span>
        </button>
        {open && (
          <div className="border-t border-border/70 p-5 md:p-6">
            {entry.image_url && (
              <SafeImage
                src={entry.image_url}
                alt={entry.title}
                width={1024}
                height={576}
                className="mb-5 aspect-video w-full rounded-lg"
              />
            )}
            {hasRichText(body) ? (
              <RichText html={body} />
            ) : (
              <p className="text-sm text-muted-foreground">{entry.description}</p>
            )}
            {doc.document_url && (
              <a
                href={doc.document_url}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg border border-primary/50 px-4 text-sm font-semibold text-primary"
              >
                <FileText className="size-4" aria-hidden />
                {doc.document_name || "Open document"}
              </a>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

function PeopleGrid({ people, empty }: { people: PersonRow[]; empty: string }) {
  if (people.length === 0) return <p className="mt-6 text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {people.map((person) => (
        <article key={person.id} className="surface-card overflow-hidden bg-surface-2">
          <SafeImage
            src={person.photo_url}
            alt={`${person.name}, ${person.role} at Breda Guardians`}
            width={640}
            height={640}
            className="aspect-square w-full"
          />
          <div className="p-5">
            {person.role && <Tag>{person.role}</Tag>}
            <h3 className="mt-3 text-xl">{person.name}</h3>
            {(person.started_on || person.ended_on) && (
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {person.started_on ? formatDate(person.started_on) : "—"} –{" "}
                {person.ended_on ? formatDate(person.ended_on) : "present"}
              </p>
            )}
            <Bio text={person.blurb} />
          </div>
        </article>
      ))}
    </div>
  );
}

function HallOfFamePage() {
  const loaded = Route.useLoaderData();
  const [openId, setOpenId] = useState<string | null>(loaded.honours[0]?.id ?? null);
  const people = splitPeople(loaded.people as PersonRow[]);

  return (
    <>
      <PageHeader
        eyebrow="Hall of Fame"
        title="Our History"
        intro={`Everything the Guardians have achieved since ${SITE.founded}, plus the crews and alumni behind it.`}
      />

      <section className="section-y-first">
        <div className="container-site">
          <Link
            to="/rosters"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
          >
            <ArrowLeft className="size-4" aria-hidden /> Back to rosters
          </Link>

          <div className="mt-8">
            <SectionHeading
              eyebrow="Timeline"
              title="Milestone By Milestone"
              intro="Tap any moment to read the full story, see the pictures and open any attached document."
            />
          </div>

          {loaded.honours.length > 0 ? (
            <ol className="relative mt-12 space-y-6 before:absolute before:bottom-2 before:left-[0.85rem] before:top-2 before:w-px before:bg-border md:before:left-[1.35rem]">
              {loaded.honours.map((entry) => (
                <TimelineEntry
                  key={entry.id}
                  entry={entry}
                  open={openId === entry.id}
                  onToggle={() => setOpenId(openId === entry.id ? null : entry.id)}
                />
              ))}
            </ol>
          ) : (
            <p className="mt-10 text-muted-foreground">The first milestone is on its way.</p>
          )}
        </div>
      </section>

      {loaded.victories.length > 0 && (
        <section className="warm-band section-y">
          <div className="container-site">
            <SectionHeading
              eyebrow="Wins"
              title="Victories On The Board"
              intro="Match wins our teams have banked, newest first."
            />
            <ul className="mt-10 grid gap-4 md:grid-cols-2">
              {loaded.victories.map((match) => (
                <li key={match.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-5 py-4">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-display text-base uppercase">
                      <Trophy className="size-4 text-primary" aria-hidden /> vs {match.opponent}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {match.game} · {match.competition}
                      {match.stage ? ` · ${match.stage}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl text-primary">
                      {match.score_us ?? "–"}–{match.score_them ?? "–"}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      {formatDateTime(match.played_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="section-y">
        <div className="container-site">
          <SectionHeading
            eyebrow="Alumni"
            title="Crews Who Built This"
            intro="Former interns and team members who left their mark on the Guardians."
          />
          <PeopleGrid
            people={people.alumni}
            empty="Alumni profiles are added as crews hand over. Nothing published yet."
          />

          <div className="mt-16">
            <SectionHeading
              eyebrow="Right now"
              title="The Current Crew"
              intro="The people keeping the Guardians moving this semester."
            />
            <PeopleGrid
              people={[...people.core, ...people.interns]}
              empty="Crew profiles are published from the admin panel."
            />
          </div>

          <div className="panel-gradient mt-16 flex flex-col items-start gap-4 p-7 md:flex-row md:items-center md:justify-between md:p-9">
            <div className="max-w-2xl">
              <p className="eyebrow">Be part of it</p>
              <h2 className="mt-3 flex items-center gap-2 text-2xl md:text-3xl">
                <Sparkles className="size-6 text-primary" aria-hidden /> Add Your Chapter
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Every name on this page started as someone who showed up. Join the crew or try out for a roster.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/our-team"
                className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-primary/50 px-5 font-display text-sm uppercase tracking-wider text-primary"
              >
                <Users className="size-4" aria-hidden /> Our team
              </Link>
              <a
                href={SITE.discordUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-border px-5 font-display text-sm uppercase tracking-wider text-foreground"
              >
                Join Discord
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
