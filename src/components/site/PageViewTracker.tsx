import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { recordPageView } from "@/lib/analytics.functions";

/** Counts anonymous page views so the admin dashboard can show visitor numbers. */
export function PageViewTracker() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/account")) return;
    if (lastSent.current === pathname) return;
    lastSent.current = pathname;
    void recordPageView({
      data: { path: pathname, referrer: document.referrer || null },
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
