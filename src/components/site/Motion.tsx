import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

import { cn } from "@/lib/utils";

function useInView<T extends HTMLElement>(once = true) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    observer.observe(node);

    // Safety net: if the observer never reports (late layout, restored scroll,
    // instant jumps), reveal anything within the viewport.
    const check = () => {
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight * 1.15 && rect.bottom > 0) setInView(true);
    };
    const raf = requestAnimationFrame(check);
    const timer = window.setTimeout(check, 600);
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [once]);

  return { ref, inView };
}

/** Fades and lifts its children into view once, respecting reduced-motion. */
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className,
}: {
  children: ReactNode;
  as?: ElementType | undefined;
  delay?: number | undefined;
  className?: string | undefined;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <Tag
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn("reveal", inView && "reveal-in", className)}
    >
      {children}
    </Tag>
  );
}

/** Counts up to a numeric value the first time it scrolls into view. */
export function CountUp({
  value,
  className,
  duration = 1100,
}: {
  value: string;
  className?: string | undefined;
  duration?: number | undefined;
}) {
  const match = /^(\D*)(\d[\d.,]*)(.*)$/.exec(value.trim());
  const { ref, inView } = useInView<HTMLSpanElement>();
  const target = match ? Number(match[2]!.replace(/[.,]/g, "")) : 0;
  const hasNumber = match !== null;
  const [current, setCurrent] = useState(target);


  useEffect(() => {
    if (!hasNumber) return;
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCurrent(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setCurrent(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, target, duration, hasNumber]);


  if (!match) return <span className={className}>{value}</span>;

  return (
    <span ref={ref} className={className}>
      {match[1]}
      {current.toLocaleString("nl-NL")}
      {match[3]}
    </span>
  );
}

/** Thin gold reading-progress line pinned under the header. */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent">
      <div
        className="h-full origin-left bg-gradient-to-r from-primary to-gold-bright"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}

/** Slow vertical drift tied to scroll — used behind hero characters. */
export function useParallax(strength = 0.08) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const update = () => setOffset(window.scrollY * strength);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [strength]);

  return offset;
}
