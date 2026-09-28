import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/lib/i18n";
import { Nav } from "@/components/site/Nav";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

import { Footer } from "@/components/site/Footer";
import { CookieBanner } from "@/components/site/CookieBanner";
import { PageViewTracker } from "@/components/site/PageViewTracker";
import { DiscordCTA } from "@/components/site/DiscordCTA";
import { BackToTop } from "@/components/site/BackToTop";
import { AutoReveal } from "@/components/site/AutoReveal";

import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-8xl text-primary">404</h1>
        <h2 className="mt-4 text-2xl">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page has been substituted out. Let&apos;s get you back to the action.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/">Back To Home</Link>
        </Button>
        <nav aria-label="Popular pages" className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-semibold">
          <Link to="/rosters" className="text-primary hover:underline">
            Rosters &amp; Hall of Fame
          </Link>
          <Link to="/research" className="text-primary hover:underline">
            Research
          </Link>
          <Link to="/opening-hours" className="text-primary hover:underline">
            The Hive opening hours
          </Link>
          <Link to="/shop" className="text-primary hover:underline">
            Membership &amp; shop
          </Link>
          <Link to="/faq" className="text-primary hover:underline">
            FAQ
          </Link>
        </nav>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. Try again or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try Again
          </Button>
          <Button variant="secondary" asChild>
            <a href="/">Go Home</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Breda Guardians — Competitive Esports at BUas" },
      {
        name: "description",
        content:
          "Breda Guardians is the competitive esports community at Breda University of Applied Sciences: four rosters, weekly community nights and the Hive.",
      },
      { name: "author", content: "Breda Guardians" },
      {
        name: "keywords",
        content:
          "Breda Guardians, Breda Guardians esports, BUas esports, esports Breda, gaming community Breda, Breda gamingcommunity, esports vereniging Breda, student esports Netherlands, The Hive BUas, esports tryouts Breda, Dutch esports community",
      },
      { property: "og:site_name", content: "Breda Guardians" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_US" },
      { property: "og:locale:alternate", content: "nl_NL" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#080808" },

    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdminWorkspace = pathname === "/admin";

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <div className="flex min-h-screen flex-col">
             {!isAdminWorkspace && <Nav />}
             {!isAdminWorkspace && <Breadcrumbs />}

            <main key={pathname} className="page-enter flex-1">
              {/* Required: nested routes render here. */}
              <Outlet />
            </main>
             {!isAdminWorkspace && <Footer />}
             {!isAdminWorkspace && <CookieBanner />}
             {!isAdminWorkspace && <DiscordCTA pathname={pathname} />}
             {!isAdminWorkspace && <BackToTop />}
             {!isAdminWorkspace && <AutoReveal />}
            <Toaster position="top-center" />
            <PageViewTracker />
          </div>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

