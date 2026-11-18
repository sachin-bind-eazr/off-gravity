"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Container } from "@/components/ui/Container";
import { HOME } from "@/content/home";
import { TEASER } from "@/content/video";
import { TeaserVideo } from "@/components/video";
import { WATCH_EVENT } from "./watch";
import "./obstacles.css";

const O = HOME.obstacles;
const POSTER_VAR = { "--ob-poster": `url(${TEASER.poster})` } as React.CSSProperties;
const NO_POSTER = {} as React.CSSProperties;
const NAV = 0; // header is static (not sticky), so the stage pins at the viewport top
/** Share of the pinned scroll spent growing the video; the rest holds it full-frame. */
const GROW_END = 0.7;
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => t * (2 - t);
type Metrics = { sx: number; sy: number; r: number; top: number; range: number; reduced: boolean };

export default function Obstacles() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const m = useRef<Metrics>({ sx: 0, sy: 0, r: 20, top: NAV, range: 0, reduced: false });
  const [near, setNear] = useState(false);

  // reveal the <video> only once playing; poster shows until then
  useEffect(() => {
    const v = videoRef.current, host = v?.parentElement; if (!v || !host) return;
    const on = () => host.setAttribute("data-ready", "1");
    if (!v.paused && v.currentTime > 0) on();
    v.addEventListener("playing", on);
    return () => v.removeEventListener("playing", on);
  }, []);

  // load the poster only when the video is within one viewport (it is far below the fold)
  useEffect(() => {
    const el = trackRef.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: "100% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // scroll-linked reveal: the stage pins under the nav and the video's clip-path opens from a card to full-frame.
  // Runs in rAF, writes only clip-path, and listens only while the section is near the viewport.
  useEffect(() => {
    const track = trackRef.current, stage = stageRef.current, frame = frameRef.current;
    if (!track || !stage || !frame) return;
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0, last = -1, listening = false;

    const update = () => {
      raf = 0;
      const s = m.current;
      const p = s.range ? clamp((s.top - track.getBoundingClientRect().top) / s.range) : 1;
      const e = s.reduced ? 1 : ease(clamp(p / GROW_END));
      if (e !== last) {
        last = e;
        const k = 1 - e;
        frame.style.clipPath = k < 0.0005 ? "none" : `inset(${(s.sy * k).toFixed(1)}px ${(s.sx * k).toFixed(1)}px round ${(s.r * k).toFixed(1)}px)`;
        // growth progress for CSS: the caption/stats overlay fades in over the last part of the growth
        frame.style.setProperty("--ob-e", e.toFixed(3));
      }
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };

    const measure = () => {
      const W = stage.clientWidth, H = stage.clientHeight;
      // start frame = the site content column: the resolved gutter of a full-width container (it grows on laptops
      // and centres on large screens, so it can't be read from a CSS variable as a plain number)
      const col = stage.closest("section")?.querySelector<HTMLElement>(".og-container") ?? document.querySelector<HTMLElement>(".og-container");
      const gutter = (col && parseFloat(getComputedStyle(col).paddingLeft)) || 24;
      const aspect = W < 640 ? 3 / 4 : 9 / 16;
      // start small and grow on scroll: 60% of the content width on desktop, 75% on tablet, full column on phones
      // (already narrow); never taller than 60% of the stage so the growth is visible on short screens too
      const startScale = W >= 1024 ? 0.6 : W >= 640 ? 0.75 : 1;
      const maxH = W >= 640 ? H * 0.6 : H - 48;
      let sw = (W - gutter * 2) * startScale, sh = sw * aspect;
      if (sh > maxH) { sh = maxH; sw = sh / aspect; }
      const s = m.current;
      s.sx = Math.max(0, (W - sw) / 2);
      s.sy = Math.max(0, (H - sh) / 2);
      s.r = W < 640 ? 12 : 20;
      s.top = parseFloat(getComputedStyle(stage).top) || NAV;
      s.range = Math.max(0, track.offsetHeight - H);
      s.reduced = rm.matches;
      last = -1;
      schedule();
    };

    const listen = (on: boolean) => {
      if (on === listening) return;
      listening = on;
      if (on) { window.addEventListener("scroll", schedule, { passive: true }); schedule(); }
      else window.removeEventListener("scroll", schedule);
    };
    const io = new IntersectionObserver(([e]) => listen(e.isIntersecting), { rootMargin: "50% 0px" });
    const ro = new ResizeObserver(measure);
    io.observe(track); ro.observe(stage); ro.observe(track);
    rm.addEventListener("change", measure);
    measure();
    return () => {
      io.disconnect(); ro.disconnect(); rm.removeEventListener("change", measure);
      listen(false); cancelAnimationFrame(raf);
    };
  }, []);

  const start = useCallback(() => {
    const v = videoRef.current, track = trackRef.current; if (!v) return;
    v.dataset.userPaused = "0";
    v.dispatchEvent(new Event("og-activate"));
    v.muted = false;
    try { v.currentTime = 0; } catch {}
    // only fall back to muted if the browser blocks sound; an AbortError just means the off-screen observer paused it
    v.play().catch((err: unknown) => {
      if ((err as DOMException)?.name !== "NotAllowedError") return;
      v.muted = true; v.play().catch(() => {});
    });
    if (!track) return;
    // scroll to where the video has finished growing (inside the full-frame hold)
    const s = m.current;
    const top = track.getBoundingClientRect().top + window.scrollY - s.top + (s.reduced ? 0 : s.range * Math.min(1, GROW_END + 0.1));
    window.scrollTo({ top: Math.max(0, top), behavior: s.reduced ? "auto" : "smooth" });
  }, []);

  // "watch with sound" from elsewhere on the page (e.g. the hero's teaser link) still plays it with sound
  useEffect(() => {
    window.addEventListener(WATCH_EVENT, start);
    return () => window.removeEventListener(WATCH_EVENT, start);
  }, [start]);

  return (
    <section id="obstacles" className="og-section--dark ob">
      <h2 className="sr-only">{O.kicker}</h2>
      {/* one screen: the stage is 100svh and pins while the video grows; the heading row sits on top of it and the
          caption + stats sit on the video's bottom edge over a blurred shade */}
      <div ref={trackRef} className="ob-track">
        <div ref={stageRef} className="ob-stage">
          <div ref={frameRef} className="ob-frame" style={near ? POSTER_VAR : NO_POSTER}>
            <TeaserVideo ref={videoRef} className="ob-video" />
            <div className="ob-overlay">
              <Container className="ob-after">
                <p className="ob-caption t-label">{O.caption} · {TEASER.durationLabel}</p>
                <ul className="ob-stats">
                  {O.stats.map((s, i) => (
                    <li key={s.title} className="ob-stat">
                      <span className="t-label">{String(i + 1).padStart(2, "0")}</span>
                      <h3 className="t-h3">{s.title}</h3>
                      <p className="t-body">{s.line}</p>
                    </li>
                  ))}
                </ul>
              </Container>
            </div>
          </div>
          <Container className="ob-head">
            <p className="t-kicker on-dark">{O.kicker}</p>
          </Container>
        </div>
      </div>
    </section>
  );
}
