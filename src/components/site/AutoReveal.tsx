import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

/**
 * Gives every page a calm entrance: each main section fades and lifts into
 * place the first time it scrolls into view. Sections that already animate
 * their own children are left alone, and reduced-motion users get nothing.
 */
export function AutoReveal() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let observer: IntersectionObserver | null = null;

    const run = () => {
      const sections = Array.from(document.querySelectorAll<HTMLElement>("main section"));
      const targets = sections.filter(
        (el) =>
          !el.classList.contains("reveal") &&
          !el.dataset["revealed"] &&
          !el.querySelector(".reveal") &&
          el.offsetHeight > 40,
      );
      if (targets.length === 0) return;

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target as HTMLElement;
            el.classList.add("reveal-in");
            el.dataset["revealed"] = "1";
            observer?.unobserve(el);
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
      );

      for (const el of targets) {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.9) {
          // Already on screen when the page loads — show it without a delay.
          el.dataset["revealed"] = "1";
          continue;
        }
        el.classList.add("reveal");
        observer.observe(el);
      }
    };

    // Wait until nested route hydration has settled before touching class names.
    // Mutating lazy route markup during hydration causes React mismatch warnings.
    const timer = window.setTimeout(run, 1000);

    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, [pathname]);

  return null;
}
