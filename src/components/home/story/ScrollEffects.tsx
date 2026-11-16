"use client";
import { useEffect, useRef } from "react";

/**
 * Page-level polish, mounted once (inside Story):
 *  - scroll-progress hairline under the nav (transform only)
 *  - fade-up reveal for `[data-reveal]` and section h2s (transform + opacity only)
 * Reveal is armed only when JS runs and the user has no reduced-motion preference, so content is never hidden otherwise.
 * Pinned/scroll-linked areas (#obstacles) are excluded because they drive their own opacity/transform.
 */
export function ScrollEffects() {
  const bar = useRef<HTMLElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = bar.current; if (!el) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      el.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0})`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const targets = Array.from(document.querySelectorAll<HTMLElement>("main h2, main [data-reveal]"))
      .filter((el) => !el.closest("#obstacles"));
    // stagger siblings flagged with data-reveal inside the same parent
    const counts = new Map<Element, number>();
    targets.forEach((el) => {
      el.setAttribute("data-reveal", el.getAttribute("data-reveal") || "");
      const n = counts.get(el.parentElement as Element) ?? 0;
      counts.set(el.parentElement as Element, n + 1);
      el.style.setProperty("--reveal-delay", `${Math.min(n, 4) * 70}ms`);
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { (e.target as HTMLElement).setAttribute("data-in", ""); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    // only hide what is still below the fold; anything already visible stays put (no flash)
    const vh = window.innerHeight;
    targets.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) el.setAttribute("data-in", ""); else io.observe(el);
    });
    document.documentElement.setAttribute("data-reveal", "on");
    return () => { io.disconnect(); document.documentElement.removeAttribute("data-reveal"); targets.forEach((el) => el.setAttribute("data-in", "")); };
  }, []);

  return <div className="og-progress" aria-hidden><i ref={bar} /></div>;
}
