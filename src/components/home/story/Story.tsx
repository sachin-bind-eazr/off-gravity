"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motionValue, useMotionValueEvent, useScroll, type MotionValue } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { HOME } from "@/content/home";
import { StoryPanel, type PanelData } from "./StoryPanel";
import { useMedia } from "./hooks";
import { ScrollEffects } from "./ScrollEffects";
import "./story.css";

const TOP = 32;    // sticky line (px) for the first panel; header is static, so pin near the viewport top
const PEEK = 0;    // panels stack flush: no peeking slivers
const SHRINK = 0.06;

type Geo = { ph: number; gap: number; total: number; vh: number };

export function Story() {
  const panels = HOME.story.panels as unknown as PanelData[];
  const N = panels.length;
  // false on the server and until mounted, so SSR and first client render match (static stack)
  const pinned = useMedia("(prefers-reduced-motion: no-preference)");
  const stackRef = useRef<HTMLOListElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  /** Current sticky line (px): TOP on phones, the vertically centred line from 900px up. */
  const topRef = useRef(TOP);
  const geo = useRef<Geo>({ ph: 600, gap: 200, total: 4000, vh: 900 });

  // two-column layout: the cards are exactly as tall as the left column's content (kicker top → progress bars),
  // so text and card start and end on the same lines
  useEffect(() => {
    const grid = gridRef.current, left = leftRef.current;
    if (!grid || !left) return;
    const mq = window.matchMedia("(min-width: 900px)");
    const sync = () => {
      const top = left.getBoundingClientRect().top;
      // the dots have a 40px hit area with the visible 4px bar at 18–22px; end the card at the bar, not the hit area
      const dots = left.querySelector<HTMLElement>(".st-dots");
      const bottom = dots ? dots.getBoundingClientRect().top + 22 : left.getBoundingClientRect().bottom;
      const h = Math.max(420, Math.round(bottom - top));
      // pin text + card in the vertical middle of the screen, not at the top
      const st = Math.max(TOP, Math.round((window.innerHeight - h) / 2));
      grid.style.setProperty("--st-card-h", `${h}px`);
      grid.style.setProperty("--st-top", `${st}px`);
      topRef.current = st;
    };
    const reset = () => {
      if (mq.matches) return sync();
      grid.style.removeProperty("--st-card-h"); grid.style.removeProperty("--st-top"); topRef.current = TOP;
    };
    reset();
    const ro = new ResizeObserver(reset);
    ro.observe(left);
    mq.addEventListener("change", reset);
    window.addEventListener("resize", reset);
    return () => { ro.disconnect(); mq.removeEventListener("change", reset); window.removeEventListener("resize", reset); };
  }, []);
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
    const pitch = ph + gap, T = topRef.current;
    const start = (i + 1) * pitch - (T + i * PEEK) - ph;
    const end = (i + 1) * pitch - (T + (i + 1) * PEEK);
    return Math.min(1, Math.max(0, (s - start) / Math.max(1, end - start)));
  }, []);

  const scales = useMemo<MotionValue<number>[]>(() => panels.map(() => motionValue(1)), [panels]);
  const dims = useMemo<MotionValue<number>[]>(() => panels.map(() => motionValue(0)), [panels]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    let a = 0;
    if (pinned) {
      for (let i = 0; i < N; i++) {
        const t = i < N - 1 ? riseOf(i, v) : 0;
        scales[i].set(1 - SHRINK * t);
        dims[i].set(0.38 * t);
        if (t >= 0.5) a = i + 1;
      }
    } else {
      // static stack: the panel nearest the sticky line is the active one
      const items = stackRef.current?.querySelectorAll<HTMLElement>(".st-item") ?? [];
      items.forEach((it, i) => { if (it.getBoundingClientRect().top <= topRef.current + 40) a = i; });
    }
    setActive((prev) => (prev === a ? prev : a));
  });

  const goTo = (i: number) => {
    const el = stackRef.current; if (!el) return;
    const items = el.querySelectorAll<HTMLElement>(".st-item");
    if (!items[i]) return;
    if (pinned) {
      const { ph, gap } = geo.current;
      const top = el.getBoundingClientRect().top + window.scrollY;
      // land where panel i has just fully covered panel i-1
      window.scrollTo({ top: top + i * (ph + gap) - (topRef.current + i * PEEK) + 2, behavior: "smooth" });
    } else {
      window.scrollTo({ top: items[i].getBoundingClientRect().top + window.scrollY - topRef.current, behavior: "auto" });
    }
    setActive(i);
  };

  const mode = pinned ? "pinned" : "static";

  return (
    <section id="about" className="og-section og-section--light st-section" aria-labelledby="story-h2">
      <ScrollEffects />
      <Container>
        <div ref={gridRef} className="st-grid" data-mode={mode}>
          <div ref={leftRef} className="st-left">
            <p className="t-kicker on-light">{HOME.story.kicker}</p>
            <h2 id="story-h2" className="t-h2 st-h2">{HOME.story.h2}</h2>
            <div className="st-body t-body-lg mt-6 space-y-4 text-text-muted">
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
          <ol ref={stackRef} className="st-stack"
            style={{ ["--st-peek" as string]: `${PEEK}px` }}>
            {panels.map((p, i) => (
              <StoryPanel key={p.id} p={p} index={i} total={N} scale={scales[i]} dim={dims[i]} motionOn={pinned} />
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
