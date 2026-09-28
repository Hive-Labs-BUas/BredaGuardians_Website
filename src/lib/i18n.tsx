import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type Language = "en" | "nl";

const STORAGE_KEY = "bg-language";

/**
 * Dutch translations, keyed by the English source string. Anything without a
 * Dutch entry falls back to the English text, so the site never shows blanks.
 */
const NL: Record<string, string> = {
  // Navigation
  About: "Over ons",
  Shop: "Shop",
  Research: "Onderzoek",
  Interns: "Stages",
  "Opening Hours": "Openingstijden",
  FAQ: "Veelgestelde vragen",
  Contact: "Contact",
  News: "Nieuws",
  "Hall of Fame": "Hall of Fame",
  Teams: "Teams",
  "Our Rosters": "Onze teams",
  Menu: "Menu",
  Login: "Inloggen",
  Account: "Account",
  "My Account": "Mijn account",
  "Join Discord": "Kom op Discord",
  "View Open Positions": "Bekijk open plekken",


  // Footer
  Explore: "Ontdekken",
  "Get Involved": "Doe mee",
  "STAY IN THE LOOP": "BLIJF OP DE HOOGTE",
  Subscribe: "Aanmelden",
  "Email address": "E-mailadres",
  "The esports community of Breda. Based at The Hive @ BUas Frontier building. Open to anyone who lives, works, or studies in Breda.":
    "De esports community van Breda. Gevestigd in The Hive @ BUas Frontier. Open voor iedereen die in Breda woont, werkt of studeert.",
  "Match results, tryout windows and Hive news. One email, no spam.":
    "Wedstrijduitslagen, tryouts en Hive-nieuws. Eén mail, geen spam.",
  "Ready to join the Guardians?": "Klaar om je bij de Guardians te voegen?",
  "Join Our Discord": "Kom op onze Discord",
  "© 2026 Breda Guardians. All rights reserved.": "© 2026 Breda Guardians. Alle rechten voorbehouden.",
  "Privacy Policy": "Privacybeleid",
  "The Hive · Frontier Building · BUas Campus, Breda, NL":
    "The Hive · Frontier Building · BUas Campus, Breda, NL",

  // Common feedback
  "You're on the list. Welcome to the Hive.": "Je staat op de lijst. Welkom bij de Hive.",
  "That didn't go through. Please try again.": "Dat is niet gelukt. Probeer het opnieuw.",
  "Please enter a valid email address.": "Vul een geldig e-mailadres in.",

  // Shared interface
  "Back to the homepage": "Terug naar de homepage",
  "Back to the Hive": "Terug naar The Hive",
  "Back to research": "Terug naar onderzoek",
  "Research archive": "Onderzoeksarchief",
  "Read more": "Lees meer",
  "Show less": "Toon minder",
  "Read": "Lees",
  "Read story": "Lees het verhaal",
  "Read the study": "Lees het onderzoek",
  "Open document": "Open document",
  "Download PDF": "Download PDF",
  "Open published study": "Open gepubliceerd onderzoek",
  "More From The Hive": "Meer uit The Hive",
  "More Research": "Meer onderzoek",
  "Full archive": "Volledig archief",
  Share: "Delen",
  "Copy link": "Kopieer link",
  "Link copied": "Link gekopieerd",
  "Key takeaways": "Belangrijkste inzichten",
  "Story details": "Artikelgegevens",
  Published: "Gepubliceerd",
  "Reading time": "Leestijd",
  "min read": "min. leestijd",
  "Join 500+ members in our Discord": "Sluit je aan bij 500+ leden op onze Discord",
  "Find teammates, events and roster updates.": "Vind teamgenoten, evenementen en teamupdates.",
  "Dismiss Discord invitation": "Discord-uitnodiging sluiten",
  "Join the Breda Guardians Discord": "Word lid van de Breda Guardians Discord",
  Cookies: "Cookies",
  "We use functional cookies to keep you logged in and anonymous analytics to understand what people read. Nothing is sold or shared.":
    "We gebruiken functionele cookies om je ingelogd te houden en anonieme statistieken om te begrijpen wat mensen lezen. Er wordt niets verkocht of gedeeld.",
  Accept: "Accepteren",
  Reject: "Weigeren",

  // Research
  "What We've Learned": "Wat we hebben geleerd",
  "The Research pillar": "De onderzoekspijler",
  "Turning Esports Into Shared Knowledge": "Esports omzetten in gedeelde kennis",
  "We study our own community — student esports wellbeing, performance, venue design and growth — and publish the results with Breda University of Applied Sciences.":
    "We onderzoeken onze eigen community — welzijn binnen studentenesports, prestaties, locatieontwerp en groei — en publiceren de resultaten met Breda University of Applied Sciences.",
  "Breda Guardians contributes to PlaySmart research together with Breda University of Applied Sciences, connecting the questions inside esports with academic practice. The work helps players, students and partners understand performance, wellbeing and inclusive community design through findings they can use.":
    "Breda Guardians draagt samen met Breda University of Applied Sciences bij aan PlaySmart-onderzoek en verbindt vragen uit esports met de academische praktijk. Het werk helpt spelers, studenten en partners om prestaties, welzijn en inclusief communityontwerp te begrijpen via bruikbare inzichten.",
  Year: "Jaar",
  Game: "Game",
  Topic: "Onderwerp",
  "All years": "Alle jaren",
  "All games": "Alle games",
  "All topics": "Alle onderwerpen",
  "Clear filters": "Filters wissen",
  "Newest first": "Nieuwste eerst",
  "Oldest first": "Oudste eerst",
  "Latest study": "Nieuwste onderzoek",
  "Where it started": "Waar het begon",
  "Nothing published in this topic yet.": "Er is nog niets gepubliceerd binnen dit onderwerp.",
  "Research not found": "Onderzoek niet gevonden",
  "This entry may have moved or is no longer published.": "Dit onderzoek is mogelijk verplaatst of niet meer gepubliceerd.",
  "Research unavailable": "Onderzoek niet beschikbaar",
  "We couldn't load this entry right now. Please try again shortly.": "We kunnen dit onderzoek nu niet laden. Probeer het straks opnieuw.",

  // News
  "Story not found": "Artikel niet gevonden",
  "This story may have moved or is no longer published.": "Dit artikel is mogelijk verplaatst of niet meer gepubliceerd.",
  "Story unavailable": "Artikel niet beschikbaar",
  "We couldn't load this story right now. Please try again shortly.": "We kunnen dit artikel nu niet laden. Probeer het straks opnieuw.",

  // Common page headings and actions
  "What we do": "Wat we doen",
  "Four Things, Done Properly": "Vier dingen, goed geregeld",
  "What we offer": "Wat we bieden",
  "Our values": "Onze waarden",
  "Meet the team": "Ontmoet het team",
  "The People Behind It": "De mensen erachter",
  "Meet The Full Team": "Ontmoet het volledige team",
  "View open positions": "Bekijk openstaande functies",
  "Discover Our Story": "Ontdek ons verhaal",
  "How Guardians Operate": "Hoe Guardians werken",
  "Built For The Whole Scene": "Gebouwd voor de hele scene",
  "Competitive Teams": "Competitieve teams",
  "Community Events": "Community-evenementen",
  "Respect First": "Respect voorop",
  "Community Wins": "De community wint",
  "Show Up": "Kom opdagen",
  "Make It Visible": "Maak het zichtbaar",
  "All teams": "Alle teams",
  Roster: "Team",
  Captain: "Captain",
  Substitute: "Wisselspeler",
  Nationality: "Nationaliteit",
  Nationalities: "Nationaliteiten",
  Age: "Leeftijd",
  "Upcoming matches": "Aankomende wedstrijden",
  "Latest results": "Laatste resultaten",
  "No upcoming matches yet.": "Er zijn nog geen aankomende wedstrijden.",
  "No results published yet.": "Er zijn nog geen resultaten gepubliceerd.",
  "Contact us": "Neem contact op",
  "Send message": "Verstuur bericht",
  Name: "Naam",
  Message: "Bericht",
  "Opening hours": "Openingstijden",
  Closed: "Gesloten",
  Today: "Vandaag",
  "Frequently Asked Questions": "Veelgestelde vragen",
  "All questions": "Alle vragen",
  "No questions found.": "Geen vragen gevonden.",
  "Privacy policy": "Privacybeleid",
  "Add to request": "Toevoegen aan aanvraag",
  "Choose a size": "Kies een maat",
  "Size guide": "Maattabel",
  "Out of stock": "Niet op voorraad",
  "In stock": "Op voorraad",
  "View product": "Bekijk product",
  "Become a member": "Word lid",
  "Choose membership": "Kies een lidmaatschap",
  "Get started": "Aan de slag",
  Apply: "Solliciteer",
  "Apply now": "Solliciteer nu",
  "Why this role?": "Waarom deze rol?",
  "CV (optional)": "Cv (optioneel)",
  "Motivation letter (optional)": "Motivatiebrief (optioneel)",
  "PDF or Word, up to 6 MB per file.": "PDF of Word, maximaal 6 MB per bestand.",
  Password: "Wachtwoord",
  "Display name": "Weergavenaam",
  "At least 8 characters.": "Minimaal 8 tekens.",
  "or use email": "of gebruik e-mail",
  "Members & Staff": "Leden en team",
  "Your Account": "Jouw account",
  Subject: "Onderwerp",
  "Follow Breda Guardians": "Volg Breda Guardians",
  "Send Message": "Verstuur bericht",
  "Sending…": "Versturen…",
  "Add a short subject": "Voeg een kort onderwerp toe",
  "Give us a little more detail": "Vertel ons iets meer",
  "Please tell us your name": "Vul je naam in",
  "That email doesn't look right": "Dat e-mailadres lijkt niet te kloppen",
  "Message sent — we'll reply within two working days.": "Bericht verzonden — we antwoorden binnen twee werkdagen.",
  "We couldn't send that. Please try again.": "Verzenden is niet gelukt. Probeer het opnieuw.",
  "Say Hello": "Zeg hallo",
  "Right now": "Op dit moment",
  "This week": "Deze week",
  "No hours set for today.": "Voor vandaag zijn geen openingstijden ingesteld.",
  Open: "Open",
  "Hours not available": "Openingstijden niet beschikbaar",
  "Questions, Answered": "Vragen, beantwoord",
  "FAQ topics": "FAQ-onderwerpen",
  "The things people ask us most, grouped by topic.": "De vragen die we het vaakst krijgen, gegroepeerd per onderwerp.",
  "Who we are": "Wie we zijn",
  "What we collect": "Wat we verzamelen",
  "Why we use it": "Waarom we het gebruiken",
  "Legal basis": "Wettelijke grondslag",
  "How long we keep it": "Hoe lang we het bewaren",
  "Third parties": "Derde partijen",
  "Your rights": "Jouw rechten",
  "Our teams": "Onze teams",
  "Click a team name to open its roster, upcoming matches and latest results.": "Klik op een teamnaam om de spelers, aankomende wedstrijden en laatste resultaten te bekijken.",
  "Teams are published from the admin panel.": "Teams worden gepubliceerd vanuit het beheerpaneel.",
  "Are You Next?": "Ben jij de volgende?",
  "One Badge, Every Game": "Eén badge, elke game",
  "Roster not found": "Team niet gevonden",
  "All rosters": "Alle teams",
  "No results published for this roster yet.": "Voor dit team zijn nog geen resultaten gepubliceerd.",
  "Our History": "Onze geschiedenis",
  Timeline: "Tijdlijn",
  Wins: "Overwinningen",
  Alumni: "Alumni",
  "The Current Crew": "Het huidige team",
  "Crews Who Built This": "Teams die dit hebben opgebouwd",
  "The first milestone is on its way.": "De eerste mijlpaal komt eraan.",
  "Be part of it": "Maak er deel van uit",
  "Our team": "Ons team",
  "Core team": "Kernteam",
  "The interns": "De stagiairs",
  "Open positions": "Openstaande functies",
  "Join the team": "Kom bij het team",
  "Ready to apply?": "Klaar om te solliciteren?",
  "Pick a role and introduce yourself": "Kies een rol en stel jezelf voor",
  "What you'll do": "Wat je gaat doen",
  "Great if": "Ideaal als",
  "What you'll learn": "Wat je leert",
  "How it works": "Hoe het werkt",
  Interview: "Gesprek",
  Onboard: "Starten",
  "Questions?": "Vragen?",
  "Contact the team": "Neem contact op met het team",
  "Size chart": "Maattabel",
  Size: "Maat",
  Chest: "Borst",
  "Body length": "Lichaamslengte",
  Sleeve: "Mouw",
  "How to measure": "Zo meet je",
  "Sold out": "Uitverkocht",
  Subtotal: "Subtotaal",
  Discount: "Korting",
  "To pay at The Hive": "Te betalen bij The Hive",
  "Start Shopping": "Begin met winkelen",
  Compare: "Vergelijken",
  "Hide compare": "Vergelijking verbergen",
  "What you get": "Wat je krijgt",
  "What membership is for": "Voor wie het lidmaatschap is",
  "Choose size": "Kies een maat",
  Quantity: "Aantal",
  "Check your request": "Controleer je aanvraag",
  "Request item": "Artikel aanvragen",
  "Review request": "Aanvraag controleren",
  "Discount code": "Kortingscode",
  "Enter code": "Vul code in",
  "See all": "Bekijk alles",
  "Nothing in this category yet — check back soon.": "Er staat nog niets in deze categorie — kom binnenkort terug.",
  "View your membership": "Bekijk je lidmaatschap",
  "Join The Community": "Word lid van de community",
  "Join The Conversation": "Praat mee",
  "Join The Discord": "Kom op Discord",
  "Our Official Partners": "Onze officiële partners",
  "Get Membership": "Neem een lidmaatschap",
  "Play More, Pay Less": "Speel meer, betaal minder",
  "Back To Home": "Terug naar home",
  "Page not found": "Pagina niet gevonden",
  "This page didn't load": "Deze pagina kon niet worden geladen",
  "Go Home": "Ga naar home",
  "Try Again": "Probeer opnieuw",
  "Rosters & Hall of Fame": "Teams en Hall of Fame",
  "The Hive opening hours": "Openingstijden van The Hive",
  "Membership & shop": "Lidmaatschap en shop",

  // Homepage
  "We Are": "Wij zijn",
  "The competitive esports team and gaming community of Breda — built by BUas students, open to everyone in the Netherlands who takes the game seriously.":
    "Het competitieve esportsteam en de gamingcommunity van Breda — gebouwd door BUas-studenten en open voor iedereen in Nederland die de game serieus neemt.",
  "Everything the Guardians do falls into one of four lanes. Pick the one that sounds like you.": "Alles wat de Guardians doen valt binnen vier gebieden. Kies wat bij jou past.",
  Community: "Community",
  "Weekly play nights, LANs and open tournaments at the Hive — no rank requirement, ever.": "Wekelijkse speelavonden, LANs en open toernooien in The Hive — zonder rangeis.",
  "See membership": "Bekijk lidmaatschap",
  "Published studies on student esports, wellbeing and venue design, made with BUas.": "Gepubliceerd onderzoek naar studentenesports, welzijn en locatieontwerp, gemaakt met BUas.",
  "Browse the research archive": "Bekijk het onderzoeksarchief",
  Compete: "Strijd mee",
  "Four rosters representing BUas across Valorant, League of Legends, Rocket League and CS2.": "Vier teams vertegenwoordigen BUas in Valorant, League of Legends, Rocket League en CS2.",
  "View the Hall of Fame": "Bekijk de Hall of Fame",
  "Member-hosted hangouts straight from our Discord: Among Us lobbies, Jackbox rounds, board game nights and whatever else the community feels like running.": "Door leden georganiseerde avonden vanuit onze Discord: Among Us-lobby's, Jackbox-rondes, bordspelavonden en alles wat de community verder wil organiseren.",
  "Host or join one on Discord": "Organiseer of doe mee via Discord",
  Player: "Speler",
  "Try out for a roster or just show up to a play night and see where you land.": "Doe een tryout voor een team of kom langs op een speelavond en ontdek waar je past.",
  "Tryout Now": "Doe een tryout",
  Partner: "Partner",
  "Reach thousands of students in Breda through our teams, events and broadcasts.": "Bereik duizenden studenten in Breda via onze teams, evenementen en uitzendingen.",
  "Talk Partnerships": "Bespreek een samenwerking",
  Curious: "Nieuwsgierig",
  "Meet the interns behind the org and read how the Guardians came together.": "Ontmoet de stagiairs achter de organisatie en lees hoe de Guardians zijn ontstaan.",
  "Meet The Team": "Ontmoet het team",
  "Our divisions": "Onze divisies",
  "Five Games. Room For Everyone.": "Vijf games. Ruimte voor iedereen.",
  "View roster": "Bekijk het team",
  "Interested?": "Interesse?",
  "Latest from the Hive": "Het laatste uit The Hive",
  "News & Stories": "Nieuws en verhalen",
  "Watch us live": "Kijk live mee",
  "Catch our broadcasts and chat along with the rest of the community.": "Bekijk onze uitzendingen en praat mee met de rest van de community.",
  "Open the stream": "Open de stream",
  "Choose your path": "Kies je pad",
  "Where Do You Fit?": "Waar pas jij?",
  "Match reports, community nights and everything else happening around the Guardians.": "Wedstrijdverslagen, community-avonden en alles wat er rond de Guardians gebeurt.",
  "Match Days, Streamed From The Hive": "Wedstrijddagen, live vanuit The Hive",
  "A campus gaming space, four competitive rosters and a Discord that never sleeps.": "Een gamingruimte op de campus, vier competitieve teams en een Discord die nooit slaapt.",
  "Three ways into the Guardians — pick the one that sounds like you.": "Drie manieren om bij de Guardians te komen — kies wat bij jou past.",

  // About
  "About Breda Guardians": "Over Breda Guardians",
  "Who We": "Wie wij",
  Are: "zijn",
  "The student-run competitive esports organisation of Breda University of Applied Sciences.": "De door studenten gerunde competitieve esportsorganisatie van Breda University of Applied Sciences.",
  "Every player, volunteer and visitor deserves a space free from toxicity.": "Elke speler, vrijwilliger en bezoeker verdient een omgeving zonder toxiciteit.",
  "We build lasting teams by making room for newcomers and competitors alike.": "We bouwen sterke teams met ruimte voor zowel nieuwkomers als competitieve spelers.",
  "Consistent practice, honest feedback and shared effort move the whole org forward.": "Consistent oefenen, eerlijke feedback en gezamenlijke inzet brengen de hele organisatie vooruit.",
  "Broadcasts, events and research turn student esports into something people can see.": "Uitzendingen, evenementen en onderzoek maken studentenesports zichtbaar.",
  "A place to play, a team to represent and a community that shows up every week.": "Een plek om te spelen, een team om te vertegenwoordigen en een community die elke week samenkomt.",
  "Ready to queue?": "Klaar om te spelen?",
  "Find Your Place In The Hive": "Vind jouw plek in The Hive",

  // Live and account actions
  Live: "Live",
  "Watch Us Live": "Kijk live mee",
  "Loading the stream…": "Stream wordt geladen…",
  "Player not showing, or we are offline?": "Geen speler zichtbaar, of zijn we offline?",
  "Never miss a match": "Mis nooit een wedstrijd",
  "Follow The Channel": "Volg het kanaal",
  "Open on Twitch": "Open op Twitch",
  "Continue with Google": "Ga verder met Google",
  "Sign in": "Inloggen",
  "Create account": "Account aanmaken",
  "Sign In": "Inloggen",
  "Create Account": "Account aanmaken",
  "Signing in…": "Bezig met inloggen…",
  "Creating…": "Bezig met aanmaken…",
  Checkout: "Afrekenen",
  "View Account": "Bekijk account",
  "Back To Shop": "Terug naar de shop",
};

function translateDynamic(text: string): string | null {
  const read = text.match(/^(\d+) min read$/);
  if (read) return `${read[1]} min. leestijd`;
  const studies = text.match(/^(\d+) studies? published · (\d+) topics?$/);
  if (studies) return `${studies[1]} ${studies[1] === "1" ? "onderzoek" : "onderzoeken"} gepubliceerd · ${studies[2]} ${studies[2] === "1" ? "onderwerp" : "onderwerpen"}`;
  return null;
}

function dutch(text: string): string {
  return NL[text] ?? translateDynamic(text) ?? text;
}

type Ctx = { lang: Language; setLang: (next: Language) => void; t: (text: string) => string };

const LanguageContext = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (text) => text });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");
  const textOriginals = useRef(new WeakMap<Text, string>());
  const attributeOriginals = useRef(new WeakMap<Element, Map<string, string>>());

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "nl" || stored === "en") setLangState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  useEffect(() => {
    const originals = textOriginals.current;
    const attributes = attributeOriginals.current;
    let changing = false;

    const translateNode = (node: Node) => {
      if (node instanceof Text) {
        const parent = node.parentElement;
        if (!parent || parent.closest("script, style, [data-no-translate]")) return;
        const original = originals.get(node) ?? node.data;
        originals.set(node, original);
        const trimmed = original.trim();
        if (!trimmed) return;
        const translated = lang === "nl" ? dutch(trimmed) : trimmed;
        const next = original.replace(trimmed, translated);
        if (node.data !== next) node.data = next;
        return;
      }
      if (!(node instanceof Element)) return;
      for (const attribute of ["aria-label", "title", "placeholder"]) {
        const current = node.getAttribute(attribute);
        if (!current) continue;
        let stored = attributes.get(node);
        if (!stored) {
          stored = new Map();
          attributes.set(node, stored);
        }
        const original = stored.get(attribute) ?? current;
        stored.set(attribute, original);
        node.setAttribute(attribute, lang === "nl" ? dutch(original) : original);
      }
      for (const child of node.childNodes) translateNode(child);
    };

    const apply = (root: Node) => {
      if (changing) return;
      changing = true;
      translateNode(root);
      changing = false;
    };
    apply(document.body);
    const observer = new MutationObserver((records) => {
      if (changing) return;
      for (const record of records) {
        for (const node of record.addedNodes) apply(node);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [lang]);

  const t = useCallback((text: string) => (lang === "nl" ? dutch(text) : text), [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): Ctx {
  return useContext(LanguageContext);
}

/** Shorthand: const t = useT(); t("About") */
export function useT(): (text: string) => string {
  return useContext(LanguageContext).t;
}
