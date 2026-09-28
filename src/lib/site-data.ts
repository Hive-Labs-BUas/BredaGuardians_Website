export const SITE_URL = "https://breda-guardians-hub.lovable.app";

export const SITE = {
  name: "Breda Guardians",
  tagline: "Breda's competitive esports community.",
  city: "Breda, Netherlands",
  founded: "2015",
  discordUrl: "https://discord.gg/eFtnfWrdHJ",
  instagramUrl: "https://www.instagram.com/bredaguardians/",
  tiktokUrl: "https://www.tiktok.com/@bredaguardians",
  twitchUrl: "https://www.twitch.tv/bredaguardians",
  linkedinUrl: "https://www.linkedin.com/company/breda-guardians/",
  youtubeUrl: "https://www.youtube.com/channel/UCDh1CbUBqCzsYgEmoZrj-qQ",
  email: "Bredaguardians@gmail.com",
};

/** Canonical social list. Any empty URL falls back to the Discord invite. */
export const SOCIAL_LINKS = [
  { platform: "discord", label: "Discord", url: SITE.discordUrl },
  { platform: "instagram", label: "Instagram", url: SITE.instagramUrl },
  { platform: "tiktok", label: "TikTok", url: SITE.tiktokUrl },
  { platform: "twitch", label: "Twitch", url: SITE.twitchUrl },
  { platform: "youtube", label: "YouTube", url: SITE.youtubeUrl },
  { platform: "linkedin", label: "LinkedIn", url: SITE.linkedinUrl },
].map((social) => ({
  ...social,
  url: social.url.trim().length > 0 ? social.url : SITE.discordUrl,
}));


export const NAV_LINKS = [
  { label: "About", to: "/about" },
  { label: "Rosters", to: "/rosters" },
  { label: "Research", to: "/research" },
  { label: "Our Team", to: "/our-team" },
  { label: "Shop", to: "/shop" },
  { label: "Live", to: "/live" },
  { label: "Opening Hours", to: "/opening-hours" },
  { label: "FAQ", to: "/faq" },
  { label: "Contact", to: "/contact" },
] as const;

export const TICKER_FACTS = [
  "Est. 2015",
  "Breda, Netherlands",
  "Actively researching and developing esports.",
  "Breda University Gaming & Esports Community",
  "10 gaming PCs, 2 Racing Rigs, 1 PlayStation 5 and two Nintendo Switches.",
  "500+ Community Members",
];


import partnerRedBull from "@/assets/partner-redbull.png.asset.json";
import partnerTalentHub from "@/assets/partner-talenthub.png.asset.json";
import partnerLevelUp from "@/assets/partner-levelup.png.asset.json";
import partnerRooiPannen from "@/assets/partner-rooipannen.png.asset.json";
import partnerGemeenteBreda from "@/assets/partner-gemeente-breda.png.asset.json";

export const PARTNERS = [
  { name: "Red Bull", logo: partnerRedBull.url },
  { name: "Esports Talent Hub", logo: partnerTalentHub.url },
  { name: "Level Up 040", logo: partnerLevelUp.url },
  { name: "De Rooi Pannen", logo: partnerRooiPannen.url },
  { name: "Gemeente Breda", logo: partnerGemeenteBreda.url },
];

/** Competitive divisions shown on the homepage. Copy can be refined per roster. */
export const DIVISIONS = [
  {
    game: "Valorant",
    team: "Guardians Valorant",
    text: "Our flagship tactical FPS squad — Dutch Valorant champions and Dutch Student League regulars.",
  },
  {
    game: "Counter-Strike 2",
    team: "Guardians CS2",
    text: "The classic FPS division, competing in Dutch and BeNeLux CS2 circuits.",
  },
  {
    game: "Rocket League",
    team: "Guardians Rocket League",
    text: "High-octane 3v3 car soccer squad grinding RLCS-adjacent brackets.",
  },
  {
    game: "League of Legends",
    team: "Guardians League of Legends",
    text: "Summoner's Rift roster representing Breda in the Dutch student scene.",
  },
  {
    game: "Super Smash Bros. Ultimate",
    team: "Guardians Smash",
    text: "Local fighting-game community reppin' Breda at Dutch Smash weeklies.",
  },
] as const;



/** PLACEHOLDER FIGURES — swap for real numbers when available. Rendered on /about. */
export const SITE_STATS = [
  { value: "5+", label: "Years Active" },
  { value: "10+", label: "Teams" },
  { value: "500+", label: "Members" },
  { value: "15", label: "Tournaments Played" },
] as const;

/**
 * PLACEHOLDER PROFILES — believable stand-ins until the team provides real
 * names/photos/blurbs. Swap these entries, the rendering stays the same.
 */
import internEvent from "@/assets/intern-event.jpg";
import internContent from "@/assets/intern-content.jpg";
import internManager from "@/assets/intern-manager.jpg";
import internResearch from "@/assets/intern-research.jpg";

export const INTERNS: { name: string; role: string; photo: string; blurb: string }[] = [
  {
    name: "Daan Verhoeven",
    role: "Event Manager",
    photo: internEvent,
    blurb: "Runs our play nights, LAN days and tournaments — from first idea to final scoreboard.",
  },
  {
    name: "Sanne van den Berg",
    role: "Content Marketing Manager",
    photo: internContent,
    blurb: "Turns matches and community moments into posts, clips and campaigns that grow the Hive.",
  },
  {
    name: "Milan de Jong",
    role: "Overall Manager",
    photo: internManager,
    blurb: "Keeps the whole operation moving: planning, partners, the intern team and daily decisions.",
  },
  {
    name: "Lieke Janssen",
    role: "Research Intern",
    photo: internResearch,
    blurb: "Works with BUas staff on esports research and publishes findings the community can use.",
  },
];


export type MembershipTier = {
  id: string;
  name: string;
  priceCents: number;
  priceLabel: string;
  period: string;
  /** Length of access in months, used when staff confirm a payment. */
  months: number;
  blurb: string;
  perks: string[];
  popular?: boolean;
  priceId: string;
};

export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: "rookie",
    name: "Supporter",
    priceCents: 1500,
    priceLabel: "€15",
    period: "for 3 months",
    months: 3,
    blurb: "Get inside the community and start showing up.",
    perks: [
      "Member role in our Discord",
      "Entry to all community play nights",
      "Hive drop-in access during open hours",
      "Members-only newsletter",
    ],
    priceId: "rookie_yearly",
  },
  {
    id: "legend",
    name: "Legendary",
    priceCents: 5000,
    priceLabel: "€50",
    period: "for a full year",
    months: 12,
    blurb: "Back the org for the whole season and get everything we have to give.",
    perks: [
      "Everything in Champion",
      "Reserved seat at every home match",
      "Guardians jersey included",
      "Name on the supporters wall in the Hive",
      "Invite to the annual season dinner",
    ],
    popular: true,
    priceId: "legend_yearly",
  },
  {
    id: "guardian",
    name: "Champion",
    priceCents: 3000,
    priceLabel: "€30",
    period: "for 6 months",
    months: 6,
    blurb: "For players who want the stations, the coaching and the stage time.",
    perks: [
      "Everything in Supporter",
      "Priority booking on Hive stations",
      "Monthly coaching and VOD review blocks",
      "Guaranteed tryout slot each season",
      "20% off Guardians merch",
    ],
    priceId: "guardian_yearly",
  },
];


export const SITE_ROUTES = [
  "/",
  "/about",
  "/our-team",
  "/rosters",
  "/rosters/hall-of-fame",
  "/research",
  "/live",
  "/opening-hours",
  "/faq",
  "/contact",
  "/shop",
  "/privacy",
  "/auth",
];


export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
