"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Section } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { HOME } from "@/content/home";
import { TEASER } from "@/content/video";
import { TeaserVideo } from "@/components/video";
import { WATCH_EVENT } from "./watch";
import "./obstacles.css";

const O = HOME.obstacles;
const POSTER_VAR = { "--ob-poster": `url(${TEASER.poster})` } as React.CSSProperties;
type Mode = "idle" | "playing" | "paused";

export default function Obstacles() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [muted, setMuted] = useState(true);
  const [full, setFull] = useState(false);

  // reveal the <video> only once playing; poster shows until then
  useEffect(() => {
    const v = videoRef.current, host = v?.parentElement; if (!v || !host) return;
    const on = () => host.setAttribute("data-ready", "1");
    if (!v.paused && v.currentTime > 0) on();
    v.addEventListener("playing", on);
    return () => v.removeEventListener("playing", on);
  }, []);

  // speaker is shown only while the whole video frame is in view (below the sticky 72px nav)
  useEffect(() => {
    const el = frameRef.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setFull(e.intersectionRatio >= 0.95), { threshold: [0, 0.5, 0.9, 0.95, 1], rootMargin: "-72px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const start = useCallback(() => {
    const v = videoRef.current, f = frameRef.current; if (!v) return;
    v.dataset.userPaused = "0";
    v.dispatchEvent(new Event("og-activate"));
    v.muted = false; setMuted(false);
    try { v.currentTime = 0; } catch {}
    v.play().catch(() => { v.muted = true; setMuted(true); v.play().catch(() => {}); });
    setMode("playing");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    f?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  }, []);

  const toggle = () => {
    const v = videoRef.current; if (!v) return;
    if (mode === "idle") return start();
    if (mode === "playing") { v.dataset.userPaused = "1"; v.pause(); setMode("paused"); }
    else { v.dataset.userPaused = "0"; v.play().catch(() => {}); setMode("playing"); }
  };

  useEffect(() => {
    window.addEventListener(WATCH_EVENT, start);
    return () => window.removeEventListener(WATCH_EVENT, start);
  }, [start]);

  const toggleMute = () => { const v = videoRef.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted); };

  const label = mode === "idle" ? "Watch with sound" : mode === "playing" ? "Pause" : "Resume";
  const Icon = mode === "playing" ? Pause : Play;

  return (
    <Section id="obstacles" tone="dark" className="ob">
      <h2 className="sr-only">{O.kicker}</h2>
      <div className="ob-head">
        <p className="t-kicker on-dark">{O.kicker}</p>
        <Button variant="ghost-on-dark" size="md" leadingIcon={Icon} onClick={toggle}>{label}</Button>
      </div>
      <div ref={frameRef} className="ob-frame" style={POSTER_VAR}>
        <TeaserVideo ref={videoRef} className="ob-video" />
        <button type="button" className="ob-speaker" data-show={full} tabIndex={full ? 0 : -1} aria-hidden={!full}
          aria-label={muted ? "Unmute video" : "Mute video"} aria-pressed={muted} onClick={toggleMute}>
          {muted ? <VolumeX size={22} strokeWidth={1.75} aria-hidden="true" /> : <Volume2 size={22} strokeWidth={1.75} aria-hidden="true" />}
        </button>
      </div>
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
    </Section>
  );
}
