import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";

const LABELS: Record<string, string> = {
  about: "About",
  membership: "Membership",
  research: "Research",
  interns: "Interns",
  "our-team": "Our Team",
  rosters: "Rosters",
  live: "Live",
  faq: "FAQ",
  contact: "Contact",
  news: "News",
  "hall-of-fame": "Hall of Fame",
  teams: "Teams",
  "opening-hours": "Opening Hours",
  privacy: "Privacy Policy",
  auth: "Login",
  account: "My Account",
  admin: "Admin",
  checkout: "Checkout",
  return: "Payment Result",
};

function toLabel(segment: string) {
  return (
    LABELS[segment] ??
    decodeURIComponent(segment)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/** Detail routes (news/$slug, research/$id) expose a title we prefer over the raw slug. */
function useDetailTitle() {
  return useRouterState({
    select: (s) => {
      const data = s.matches.at(-1)?.loaderData as
        | { title?: string; entry?: { title?: string } }
        | undefined;
      return data?.entry?.title ?? data?.title;
    },
  });
}

export function Breadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const detailTitle = useDetailTitle();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, i) => ({
    label: i === segments.length - 1 && detailTitle ? detailTitle : toLabel(segment),
    href: "/" + segments.slice(0, i + 1).join("/"),
    last: i === segments.length - 1,
  }));

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "/" },
      ...crumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: c.label,
        item: c.href,
      })),
    ],
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className="hidden border-b border-border/70 bg-surface/40 md:block"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <ol className="container-site flex items-center gap-1.5 overflow-x-auto whitespace-nowrap py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-[0.75rem]">
        <li className="flex items-center">
          <Link
            to="/"
            className="flex items-center gap-1.5 py-1 transition-colors hover:text-primary"
          >
            <Home className="size-3.5" />
            Home
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            <ChevronRight aria-hidden className="size-3.5 text-border" />
            {crumb.last ? (
              <span aria-current="page" className="py-1 text-foreground">
                {crumb.label}
              </span>
            ) : (
              <Link to={crumb.href} className="py-1 transition-colors hover:text-primary">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
