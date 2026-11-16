"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { HOME } from "@/content/home";
import { CHAPTER_RANGES, CHAPTER_STARTS, TEASER } from "@/content/video";
import { TeaserVideo, useVideoModal } from "@/components/video";
import "./obstacles.css";

const O = HOME.obstacles;
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
/** Unconfirmed caption fragment; flagged via HOME.obstacles.captionConfirm */
const POSTER_VAR = { "--ob-poster": `url(${TEASER.poster})` } as React.CSSProperties;
const PROTOTYPE_NOTE = "Filmed at the prototype course";

function useMode() {
  const [m, setM] = useState({ pinned: false, reduced: false });
  useEffect(() => {
    const w = window.matchMedia("(min-width:900px)"), r = window.matchMedia("(prefers-reduced-motion: reduce)");
    const f = () => setM({ pinned: w.matches && !r.matches, reduced: r.matches });
    f(); w.addEventListener("change", f); r.addEventListener("change", f);
    return () => { w.removeEventListener("change", f); r.removeEventListener("change", f); };
  }, []);
  return m;
}

type Range = [number, number];
/** Chapter [start,end] seconds per chip (chips are NOT in video order). Source: CHAPTER_RANGES, else CHAPTER_STARTS, else even split. */
function useRanges(): Range[] {
  return useMemo(() => {
    const n = O.chapters.length, seg = TEASER.duration / n;
    return O.chapters.map((c, i) => {
      const id = c.id as keyof typeof CHAPTER_STARTS;
      const r = (CHAPTER_RANGES as Record<string, Range | undefined>)[id];
      if (r) return r;
      const st = CHAPTER_STARTS[id] || c.start || i * seg;
      return [st, st + seg] as Range;
    });
  }, []);
}

type BarRefs = React.MutableRefObject<(HTMLSpanElement | null)[]>;

function Chips({ active, onGo, barRefs, scroll }: { active: number; onGo: (i: number) => void; barRefs: BarRefs; scroll?: boolean }) {
  return (
    <div className={scroll ? "ob-scroll" : "ob-chips"} role="group" aria-label="Obstacle chapters">
      {O.chapters.map((c, i) => (
        <button key={c.id} type="button" className="ob-chip" aria-pressed={active === i} onClick={() => onGo(i)}>
          <b>{c.label}</b><small>{c.line}</small>
          <span className="ob-bar" aria-hidden="true"><span ref={(el) => { barRefs.current[i] = el; }} /></span>
        </button>
      ))}
    </div>
  );
}

function Stats() {
  return <ul className="ob-stats">{O.stats.map((s) => <li key={s}>{s}</li>)}</ul>;
}
function Caption() {
  return <p className="ob-caption">{O.caption} · {TEASER.durationLabel} · <span data-confirm="true" title={O.captionConfirm.note}>{PROTOTYPE_NOTE}</span></p>;
}


type PinnedProps = { secRef: React.RefObject<HTMLElement | null>; videoRef: React.RefObject<HTMLVideoElement | null>; barRefs: BarRefs; active: number; go: (i: number) => void; pill: React.ReactNode };
/** Mounted only when pinning is active, so useScroll attaches to a real track element. */
function Pinned({ secRef, videoRef, barRefs, active, go, pill }: PinnedProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const { scrollYProgress: p } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  const clip = useTransform(p, (v) => {
    const k = 1 - ease(clamp(v / 0.7));
    return `inset(${(19.5 * k).toFixed(2)}% ${(19 * k).toFixed(2)}% ${(19.5 * k).toFixed(2)}% ${(19 * k).toFixed(2)}% round ${(28 * k).toFixed(1)}px)`;
  });
  const overOpacity = useTransform(p, [0.6, 0.85], [0, 1]);
  const overY = useTransform(p, [0.6, 0.85], [24, 0]);
  const preOpacity = useTransform(p, [0, 0.3], [1, 0]);
  useMotionValueEvent(p, "change", (v) => { const r = v > 0.62; setRevealed((x) => (x === r ? x : r)); });

  return (
    <section id="obstacles" ref={secRef} className="ob" aria-labelledby="ob-h2" style={POSTER_VAR}>
      <div ref={trackRef} className="ob-track" style={{ height: "calc((100svh - 72px) + 150vh)" }}>
        <div className="ob-stage">
          <motion.div className="ob-clip" style={{ clipPath: clip }}>
            <TeaserVideo ref={videoRef} className="ob-video" />
            <motion.div className="ob-grad" style={{ opacity: overOpacity }} />
          </motion.div>
          <motion.div className="ob-pre" style={{ opacity: preOpacity }} aria-hidden={revealed}>
            <p className="ob-kicker">{O.kicker}</p>
            <span className="ob-hint"><i aria-hidden="true" />Scroll to open the course</span>
          </motion.div>
          <div className="ob-top">{pill}</div>
          <motion.div className="ob-over" style={{ opacity: overOpacity, y: overY, visibility: revealed ? "visible" : "hidden" }}>
            <div className="ob-over-in">
              <p className="ob-kicker">{O.kicker}</p>
              <h2 id="ob-h2" className="ob-h2" style={{ maxWidth: "18ch" }}>{O.h2}</h2>
              <p className="ob-line">{O.line}</p>
              <Chips active={active} onGo={go} barRefs={barRefs} />
            </div>
          </motion.div>
        </div>
      </div>
      <div className="ob-after"><div className="ob-after-in"><Caption /><Stats /></div></div>
    </section>
  );
}

export default function Obstacles() {
  const { pinned, reduced } = useMode();
  const ranges = useRanges();
  const starts = useMemo(() => ranges.map((r) => r[0]), [ranges]);
  // playable window: skip the branded intro and outro of the teaser
  const windowStart = TEASER.contentStart ?? 0;
  const windowEnd = Math.max(...ranges.map((r) => r[1])) + 2;
  const modal = useVideoModal();
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRefs: BarRefs = useRef([]);
  const secRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(-1);

  // reveal the <video> only once it is actually playing; until then the poster shows (no black flash)
  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    const host = v.parentElement as HTMLElement | null; if (!host) return;
    const on = () => host.setAttribute("data-ready", "1");
    if (v.readyState >= 3 && !v.paused && v.currentTime > 0) on();
    v.addEventListener("playing", on);
    return () => v.removeEventListener("playing", on);
  }, [pinned]);

  // chapter tracking: rAF (~15fps), only while the section is on screen; bars update without re-rendering
  useEffect(() => {
    const sec = secRef.current; if (!sec || reduced) return;
    let raf = 0, visible = false, act = -1, last = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < 66) return; last = now;
      const v = videoRef.current; if (!v || v.readyState < 2) return;
      const t = v.currentTime;
      if (t < windowStart - 0.25 || t > windowEnd) { try { v.currentTime = windowStart; } catch {} return; }
      // active chapter = the one with the latest start <= t (chips are not in video order)
      let i = -1, best = -1; ranges.forEach(([st], k) => { if (t >= st && st > best) { best = st; i = k; } });
      const p = i < 0 ? 0 : clamp((t - ranges[i][0]) / ((ranges[i][1] - ranges[i][0]) || 1));
      if (i !== act) { act = i; setActive(i); }
      barRefs.current.forEach((el, k) => { if (el) el.style.transform = `scaleX(${k === i ? p : 0})`; });
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !visible) { visible = true; raf = requestAnimationFrame(tick); }
      else if (!e.isIntersecting && visible) { visible = false; cancelAnimationFrame(raf); }
    });
    io.observe(sec);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [ranges, windowStart, windowEnd, reduced, pinned]);

  const go = useCallback((i: number) => {
    setActive(i);
    if (reduced) { modal.open(starts[i]); return; }
    const v = videoRef.current;
    if (v) { try { v.currentTime = starts[i] + 0.01; } catch {} v.play().catch(() => {}); }
  }, [reduced, modal, starts]);

  const openModal = () => modal.open(videoRef.current?.currentTime ?? 0);
  const pill = <button type="button" className="ob-pill" onClick={openModal}><span aria-hidden="true">▶</span> Watch with sound</button>;

  if (!pinned) {
    return (
      <section id="obstacles" ref={secRef} className="ob ob-static" aria-labelledby="ob-h2" style={POSTER_VAR}>
        <div className="ob-static-in">
          <p className="ob-kicker">{O.kicker}</p>
          <h2 id="ob-h2" className="ob-h2">{O.h2}</h2>
          <p className="ob-line">{O.line}</p>
          <div className="ob-frame">
            <TeaserVideo ref={videoRef} className="ob-video" />
            <div className="ob-top">{pill}</div>
          </div>
          <Chips active={active} onGo={go} barRefs={barRefs} scroll />
          <Caption />
          <Stats />
        </div>
      </section>
    );
  }

  return <Pinned secRef={secRef} videoRef={videoRef} barRefs={barRefs} active={active} go={go} pill={pill} />;
}
