import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

/** Floating back-to-top button, appears after scrolling past the first screen. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-4 right-4 z-40 grid size-11 place-items-center rounded-full border border-primary/45 bg-surface/90 text-primary shadow-lg backdrop-blur transition-all duration-300 hover:border-primary hover:bg-primary/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:bottom-6 md:right-6 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <ArrowUp className="size-5" aria-hidden />
    </button>
  );
}
