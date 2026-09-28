import { createFileRoute, Link } from "@tanstack/react-router";
import { Blocks, CalendarDays, Check, Copy, Radio, ShieldCheck, UsersRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import minecraftArt from "@/assets/minecraft-steve.png.asset.json";
import aboutHero from "@/assets/about-hero-car.webp.asset.json";
import { EsportsPageHero } from "@/components/site/Bits";
import { CountUp, Reveal } from "@/components/site/Motion";
import { Button } from "@/components/ui/button";
import { SITE, SITE_STATS, SITE_URL } from "@/lib/site-data";
import {
  pickImage,
  pickSetting,
  splitPeople,
  useInterns,
  useSiteImages,
  useSiteSettings,
  type PersonRow,
} from "@/lib/queries";
import { SafeImage } from "@/components/site/SafeImage";

const TITLE = "About Breda Guardians — Mission, Values & The Hive";
const DESCRIPTION =
  "What Breda Guardians actually does: competitive rosters representing BUas, weekly community events, and the Hive — our on-campus gaming space in Breda.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: `${SITE_URL}/about` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/about` }],
  }),
  component: About,
});

const VALUES = [
  { icon: ShieldCheck, title: "Respect First", text: "Every player, volunteer and visitor deserves a space free from toxicity." },
  { icon: UsersRound, title: "Community Wins", text: "We build lasting teams by making room for newcomers and competitors alike." },
  { icon: CalendarDays, title: "Show Up", text: "Consistent practice, honest feedback and shared effort move the whole org forward." },
  { icon: Radio, title: "Make It Visible", text: "Broadcasts, events and research turn student esports into something people can see." },
];
const OFFERS = [
  {
    title: "The Hive",
    image: "/images/news-hive.jpg",
    text: "Our on-campus home at BUas: 16 competitive stations, a broadcast desk and the easiest place in Breda to meet your next teammates.",
    points: ["16 competitive stations", "Broadcast & streaming desk", "Open to students and locals"],
  },
  {
    title: "Competitive Teams",
    image: "/images/hof-valorant.jpg",
    text: "Structured rosters, coaching, scrims and national student competition across the games our community cares about.",
    points: ["Five active rosters", "Coaching and VOD review with your team", "Dutch/International student leagues"],
  },
  {
    title: "Community Events",
    image: "/images/hof-community.jpg",
    text: "Weekly play nights, seasonal LANs and open tournaments where rank never decides whether you belong.",
    points: ["Bi-weekly game nights", "Seasonal LAN days", "No rank requirement"],
  },
  {
    title: "Guardians Gatherings",
    image: "/images/hof-community.jpg",
    text: "Member-hosted Discord hangouts and game nights — the casual side of the community where everyone picks the game.",
    points: ["Among Us & Jackbox lobbies", "Board game nights", "Open to all Discord members"],
  },
];

const SCHEMA = {
  "@context": "https://schema.org",
  "@type": ["Organization", "SportsTeam"],
  name: "Breda Guardians",
  sport: "Esports",
  description: DESCRIPTION,
  foundingDate: "2015",
  parentOrganization: {
    "@type": "CollegeOrUniversity",
    name: "Breda University of Applied Sciences",
  },
  address: { "@type": "PostalAddress", addressLocality: "Breda", addressCountry: "NL" },
};

/** Live intern crew, pulled from the admin panel. Core team stays on Our Team. */
/** Minecraft community server, with the address editable from the admin panel. */
function MinecraftSection() {
  const { data } = useSiteSettings();
  const address = pickSetting(data, "minecraft_server", "Bredaguardians.server.nl");
  const { data: images } = useSiteImages();
  const art = pickImage(images, "minecraft", minecraftArt.url);
  const [copied, setCopied] = useState(false);

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Server address copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copying failed — you can select the address by hand.");
    }
  }

  return (
    <section className="section-y-sm border-t border-border bg-surface">
      <div className="container-site">
        <div className="surface-card panel-gradient relative overflow-hidden p-7 md:p-12">
          <Blocks aria-hidden className="pointer-events-none absolute -right-6 -top-6 size-40 text-primary/10" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow inline-flex items-center gap-2">
                <Blocks className="size-4" /> Minecraft
              </p>
              <h2 className="mt-3 text-3xl md:text-4xl">Build With Us On Our Server</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                Our community Minecraft server is open to everyone in the Guardians community. Add the address below in
                your Minecraft client, hit join and start building with the rest of the crew.
              </p>
            </div>
            <img
              src={art}
              alt="Minecraft character riding a horse"
              loading="lazy"
              className="mx-auto w-48 shrink-0 object-contain drop-shadow-[0_12px_30px_rgba(0,0,0,0.5)] md:w-60 lg:order-none"
            />
            <div className="w-full max-w-md space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Server address</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <code className="flex-1 rounded-md border border-border bg-background px-4 py-3 font-display text-lg tracking-wide">
                  {address}
                </code>
                <Button type="button" size="lg" onClick={() => void copy()}>
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? "Copied" : "Copy IP"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TeamTeaser() {
  const { data } = useInterns();
  const people = splitPeople((data?.team ?? []) as PersonRow[]).interns;

  return (
    <section className="section-y">
      <div className="container-site">
        <div className="grid items-end gap-6 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="eyebrow">Meet the team</p>
            <h2 className="mt-3 text-3xl md:text-4xl">The People Behind It</h2>
          </div>
          <Button asChild variant="secondary">
            <Link to="/our-team">Meet The Full Team</Link>
          </Button>
        </div>
        {people.length > 0 ? (
          <div className="mt-12 grid grid-cols-2 gap-4 md:mt-14 lg:grid-cols-4">
            {people.slice(0, 4).map((person) => (
              <article key={person.id} className="overflow-hidden rounded-lg border border-border bg-surface">
                <SafeImage
                  src={person.photo_url}
                  alt={`${person.name}, ${person.role}`}
                  width={480}
                  height={480}
                  className="aspect-square w-full"
                />
                <div className="p-4">
                  <h3 className="text-xl">{person.name}</h3>
                  <p className="text-sm text-primary">{person.role}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="surface-card mt-10 bg-surface-2 p-8 text-center md:p-12">
            <p className="text-muted-foreground">
              Team photos and bios are updated each semester. Head to Our Team to see the current open roles and meet
              the people running Breda Guardians.
            </p>
            <Button asChild variant="secondary" className="mt-5">
              <Link to="/our-team">View open positions</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function About() {
  const { data: siteImages } = useSiteImages();
  const heroImage = pickImage(siteImages, "about_hero", aboutHero.url);
  const offers = OFFERS.map((offer, index) => ({
    ...offer,
    image: pickImage(siteImages, `about_offer_${index + 1}`, offer.image),
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }}
      />
      <EsportsPageHero
        eyebrow="About Breda Guardians"
        title="Who We"
        accent="Are"
        intro="The student-run competitive esports organisation of Breda University of Applied Sciences."
        image={heroImage}
        imageAlt="Rocket League car racing for Breda Guardians"
        imageWidth={1500}
        imageHeight={830}
        imageClassName="-right-[11rem] bottom-[22%] w-[42rem] h-auto sm:-right-[7rem] sm:w-[48rem] md:right-[-4rem] md:bottom-[16%] md:w-[46rem] lg:right-[20rem] lg:bottom-[14%] lg:w-[52rem]"

      >
        <Button asChild size="lg">
          <a href="#our-story">Discover Our Story</a>
        </Button>
      </EsportsPageHero>

      <section id="our-story" className="section-y-sm -mt-6 scroll-mt-20 warm-band">
        <div className="container-site grid grid-cols-2 gap-6 md:grid-cols-4">
          {SITE_STATS.map(({ value, label }) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-surface-2 p-5 text-center md:text-left"
            >
              <strong className="gradient-text block font-display text-3xl leading-none md:text-4xl">
                <CountUp value={value} />
              </strong>
              <span className="mt-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground md:text-sm">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>


      <section className="section-y-sm warm-band"><div className="container-site"><p className="mx-auto max-w-4xl text-center font-display text-2xl leading-tight md:text-3xl">WE GIVE STUDENTS A SERIOUS PLACE TO COMPETE, CREATE AND BELONG. WITH COACHING, REAL FIXTURES AND A HOME IN THE HIVE, SHOWING UP MATTERS MORE THAN YOUR RANK.</p></div></section>


      <section className="section-y"><div className="container-site"><p className="eyebrow">Our values</p><h2 className="mt-3 text-3xl md:text-4xl">How Guardians Operate</h2><div className="mt-12 md:mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{VALUES.map((value, i) => <Reveal key={value.title} as="article" delay={i * 70} className="surface-card border-t-2 border-t-primary bg-surface-2 p-6"><value.icon className="size-7 text-primary"/><h3 className="mt-7 text-2xl">{value.title}</h3><p className="mt-3 text-sm text-muted-foreground">{value.text}</p></Reveal>)}</div></div></section>

      <section className="warm-band section-y">
        <div className="container-site">
          <p className="eyebrow">What we offer</p>
          <h2 className="mt-3 text-3xl md:text-4xl">Built For The Whole Scene</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            A place to play, a team to represent and a community that shows up every week.
          </p>

          <div className="mt-12 md:mt-14 grid gap-6 lg:grid-cols-3">
            {offers.map((offer, index) => (
              <Reveal
                key={offer.title}
                as="article"
                delay={index * 90}
                className={`offer-card flex flex-col ${index === 0 ? "lg:col-span-3 lg:flex-row" : ""}`}
              >
                <div
                  className={`relative overflow-hidden ${index === 0 ? "h-56 lg:h-auto lg:w-1/2" : "h-48"}`}
                >
                  <img
                    src={offer.image}
                    alt={`${offer.title} at Breda Guardians`}
                    loading="lazy"
                    width={1024}
                    height={640}
                    className="size-full object-cover transition-transform duration-700 hover:scale-[1.04]"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent"
                  />
                  <span className="gradient-text absolute bottom-4 left-5 font-display text-4xl leading-none md:text-5xl">
                    0{index + 1}
                  </span>
                </div>

                <div className={`flex flex-1 flex-col p-7 ${index === 0 ? "lg:justify-center lg:p-12" : ""}`}>
                  <h3 className={index === 0 ? "text-2xl md:text-3xl" : "text-2xl"}>{offer.title}</h3>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                    {offer.text}
                  </p>
                  <ul className="mt-6 space-y-2.5">
                    {offer.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm text-foreground/85">
                        <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <TeamTeaser />

      <MinecraftSection />

      <section className="section-y-sm border-y border-primary/30 bg-primary/10"><div className="container-site flex flex-col items-start justify-between gap-7 md:flex-row md:items-center"><div><p className="eyebrow">Ready to queue?</p><h2 className="mt-2 text-3xl md:text-4xl">Find Your Place In The Hive</h2></div><Button asChild size="xl"><a href={SITE.discordUrl} target="_blank" rel="noopener noreferrer">Join Our Discord</a></Button></div></section>
    </>
  );
}
