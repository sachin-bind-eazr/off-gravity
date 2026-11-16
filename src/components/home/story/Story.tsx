"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motionValue, useMotionValueEvent, useReducedMotion, useScroll, type MotionValue } from "framer-motion";
import { HOME } from "@/content/home";
import { StoryPanel, type PanelData } from "./StoryPanel";
import { useMedia } from "./hooks";
import "./story.css";

const TOP = 104;   // sticky line (px) for the first panel
const PEEK = 12;   // each later panel sticks slightly lower so earlier ones peek out above it
const SHRINK = 0.06;

type Geo = { ph: number; gap: number; total: number; vh: number };

export function Story() {
  const panels = HOME.story.panels as unknown as PanelData[];
  const N = panels.length;
  const reduce = useReducedMotion();
  const desktop = useMedia("(min-width: 900px)");
  const pinned = desktop && !reduce;
  const stackRef = useRef<HTMLOListElement>(null);
  const geo = useRef<Geo>({ ph: 600, gap: 200, total: 4000, vh: 900 });
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({ target: stackRef, offset: ["start start", "end end"] });

  // panel height / gap come from layout (offset sizes are not affected by sticky)
  useEffect(() => {
    const measure = () => {
      const el = stackRef.current; if (!el) return;
      const first = el.querySelector<HTMLElement>(".st-card");
      const item = el.querySelector<HTMLElement>(".st-item");
      if (!first || !item) return;
      geo.current = { ph: first.offsetHeight, gap: parseFloat(getComputedStyle(item).marginBottom) || 0, total: el.offsetHeight, vh: window.innerHeight };
    };
    measure();
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    if (stackRef.current) ro.observe(stackRef.current);
    return () => { window.removeEventListener("resize", measure); ro.disconnect(); };
  }, [pinned]);

  /** How far panel i+1 has risen over panel i (0..1), from container scroll progress. */
  const riseOf = useCallback((i: number, progress: number) => {
    const { ph, gap, total, vh } = geo.current;
    const s = progress * Math.max(1, total - vh);
    const pitch = ph + gap;
    const start = (i + 1) * pitch - (TOP + i * PEEK) - ph;
    const end = (i + 1) * pitch - (TOP + (i + 1) * PEEK);
    return Math.min(1, Math.max(0, (s - start) / Math.max(1, end - start)));
  }, []);

  const scales = useMemo<MotionValue<number>[]>(() => panels.map(() => motionValue(1)), [panels]);
  const dims = useMemo<MotionValue<number>[]>(() => panels.map(() => motionValue(0)), [panels]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (!pinned) return;
    let a = 0;
    for (let i = 0; i < N; i++) {
      const t = i < N - 1 ? riseOf(i, v) : 0;
      scales[i].set(1 - SHRINK * t);
      dims[i].set(0.38 * t);
      if (t >= 0.5) a = i + 1;
    }
    setActive((prev) => (prev === a ? prev : a));
  });

  const onCarouselScroll = (e: React.UIEvent<HTMLOListElement>) => {
    if (desktop) return;
    const el = e.currentTarget;
    const items = el.querySelectorAll<HTMLElement>(".st-item");
    if (items.length < 2) return;
    const step = items[1].offsetLeft - items[0].offsetLeft;
    setActive(Math.min(N - 1, Math.max(0, Math.round(el.scrollLeft / step))));
  };

  const goTo = (i: number) => {
    const el = stackRef.current; if (!el) return;
    const items = el.querySelectorAll<HTMLElement>(".st-item");
    if (!items[i]) return;
    if (!desktop) {
      el.scrollTo({ left: items[i].offsetLeft - items[0].offsetLeft, behavior: reduce ? "auto" : "smooth" });
    } else if (pinned) {
      const { ph, gap } = geo.current;
      const top = el.getBoundingClientRect().top + window.scrollY;
      // land where panel i has just fully covered panel i-1
      window.scrollTo({ top: top + i * (ph + gap) - (TOP + i * PEEK) + 2, behavior: "smooth" });
    } else {
      window.scrollTo({ top: items[i].getBoundingClientRect().top + window.scrollY - TOP, behavior: reduce ? "auto" : "smooth" });
    }
    setActive(i);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (desktop) return;
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(Math.min(N - 1, active + 1)); }
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(Math.max(0, active - 1)); }
  };

  const mode = desktop ? (reduce ? "static" : "pinned") : "carousel";

  return (
    <section id="about" className="st-section section-y bg-cream" aria-labelledby="story-h2">
      <div className="container-og st-grid" data-mode={mode}>
        <div className="st-left">
          <p className="text-[15px] font-bold text-text-muted">{HOME.story.kicker}</p>
          <h2 id="story-h2" className="t-section mt-4">{HOME.story.h2}</h2>
          <div className="mt-6 space-y-4 text-[17px] leading-[1.6] text-text-muted">
            {HOME.story.body.map((t) => <p key={t}>{t}</p>)}
          </div>
          <div className="st-progress" role="group" aria-label="Story progress">
            <p className="st-count" aria-live="polite"><span>{String(active + 1).padStart(2, "0")}</span> / {String(N).padStart(2, "0")}<span className="sr-only"> {panels[active].title}</span></p>
            <ul className="st-dots">
              {panels.map((p, i) => (
                <li key={p.id}>
                  <button type="button" className="st-dot" data-on={i === active} aria-label={`Panel ${i + 1}: ${p.title}`} aria-current={i === active ? "true" : undefined} onClick={() => goTo(i)} />
                </li>
              ))}
            </ul>
          </div>
        </div>
        <ol ref={stackRef} className="st-stack" onScroll={onCarouselScroll} onKeyDown={onKey}
          {...(desktop ? {} : { tabIndex: 0, role: "region", "aria-label": "What is OFF GRAVITY. Swipe or use the arrow keys." })}
          style={{ ["--st-top" as string]: `${TOP}px`, ["--st-peek" as string]: `${PEEK}px` }}>
          {panels.map((p, i) => (
            <StoryPanel key={p.id} p={p} index={i} total={N} priority={i === 0} scale={scales[i]} dim={dims[i]} motionOn={pinned} />
          ))}
        </ol>
        {(
          <div className="st-nav">
            <button type="button" onClick={() => goTo(Math.max(0, active - 1))} disabled={active === 0} aria-label="Previous panel">&larr;</button>
            <span className="st-nav__dots" aria-hidden>{panels.map((p, i) => <i key={p.id} data-on={i === active} />)}</span>
            <button type="button" onClick={() => goTo(Math.min(N - 1, active + 1))} disabled={active === N - 1} aria-label="Next panel">&rarr;</button>
          </div>
        )}
      </div>
    </section>
  );
}
