import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/site/Bits";
import { SITE, SITE_URL } from "@/lib/site-data";

const TITLE = "Privacy Policy — Breda Guardians";
const DESCRIPTION =
  "How Breda Guardians collects and uses account data, membership payments, newsletter emails and contact form submissions under the GDPR.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "index, follow" },
      { property: "og:url", content: `${SITE_URL}/privacy` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/privacy` }],
  }),
  component: Privacy,
});

const SECTIONS = [
  {
    heading: "Who we are",
    body: "Breda Guardians is a student-run esports community based at Breda University of Applied Sciences in Breda, the Netherlands. We are the controller of the personal data described on this page. You can reach us at " +
      SITE.email + ".",
  },
  {
    heading: "What we collect",
    body: "Account data (your email address, display name and avatar) when you create an account. Membership and payment details (tier, status, order date and amount) when you buy a membership. Your email address when you subscribe to the newsletter. Your name, email address and message when you use the contact form. Functional cookies to keep you signed in, and anonymous usage statistics if you accept cookies.",
  },
  {
    heading: "Why we use it",
    body: "To give you access to your account and membership benefits, to keep a record of your orders, to answer your questions, and to send you the updates you asked for. We do not sell your data and we do not share it with advertisers.",
  },
  {
    heading: "Legal basis",
    body: "We rely on the performance of a contract for accounts and memberships, your consent for the newsletter and non-essential cookies, and our legitimate interest in running a safe community for moderation records.",
  },
  {
    heading: "How long we keep it",
    body: "Account and membership records are kept for as long as your account exists, and for up to seven years afterwards where Dutch tax law requires us to retain payment records. Newsletter subscriptions are kept until you unsubscribe. Contact messages are deleted within 24 months.",
  },
  {
    heading: "Your rights",
    body: "Under the GDPR you can request access to your data, correct it, have it deleted, restrict or object to its use, and receive a copy in a portable format. Email us and we will respond within one month. You may also lodge a complaint with the Dutch Data Protection Authority (Autoriteit Persoonsgegevens).",
  },
  {
    heading: "Cookies",
    body: "We set a functional cookie to remember your sign-in and your cookie choice. Analytics cookies are only set if you press Accept in the cookie banner, and you can clear them at any time in your browser settings.",
  },
  {
    heading: "Third parties",
    body: "We use hosting and database providers inside the EU to run this website, and Discord to run our community server. Discord's own privacy policy applies to anything you do inside their platform.",
  },
];

function Privacy() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        intro="Last updated 4 September 2026. Written for people, not for lawyers."
      />
      <section className="section-y-first">
        <div className="container-text">
          <div className="space-y-6">
            {SECTIONS.map((section) => (
              <article key={section.heading} className="surface-card bg-surface-2 p-6 md:p-8">
                <h2 className="text-2xl text-primary">{section.heading}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
