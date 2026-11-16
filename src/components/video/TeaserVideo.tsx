"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { TEASER } from "@/content/video";

type Props = { className?: string; poster?: string; fit?: "cover" | "contain"; label?: string };

/** Muted looping teaser. Sources load only near the viewport; pauses off-screen; static poster under reduced motion. */
export const TeaserVideo = forwardRef<HTMLVideoElement, Props>(function TeaserVideo({ className, poster = TEASER.poster, fit = "cover", label = "OFF GRAVITY obstacle teaser, muted loop" }, ref) {
  const vid = useRef<HTMLVideoElement>(null);
  useImperativeHandle(ref, () => vid.current as HTMLVideoElement);
  const [near, setNear] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [manual, setManual] = useState(false);

  useEffect(() => { const m = window.matchMedia("(prefers-reduced-motion: reduce)"); setReduced(m.matches); const f = () => setReduced(m.matches); m.addEventListener("change", f); return () => m.removeEventListener("change", f); }, []);

  useEffect(() => {
    const v = vid.current; if (!v) return;
    const loadIO = new IntersectionObserver(([e]) => { if (e.isIntersecting) setNear(true); }, { rootMargin: "100% 0px" });
    const playIO = new IntersectionObserver(([e]) => {
      if (reduced && !manual) return;
      if (e.isIntersecting) v.play().catch(() => {}); else v.pause();
    }, { threshold: 0.1 });
    loadIO.observe(v); playIO.observe(v);
    return () => { loadIO.disconnect(); playIO.disconnect(); };
  }, [reduced, manual, near]);

  // once sources are mounted, trigger load
  useEffect(() => { if (near) vid.current?.load(); }, [near]);

  const showPlay = reduced && !manual;
  return (
    <div className={className} style={{ position: "relative", overflow: "hidden" }}>
      <video ref={vid} muted loop playsInline preload="none" poster={poster} aria-label={label}
        autoPlay={!reduced} style={{ width: "100%", height: "100%", objectFit: fit, display: "block" }}>
        {near && !showPlay && <>
          <source src={TEASER.mp4Mobile} type="video/mp4" media="(max-width: 700px)" />
          <source src={TEASER.webm} type="video/webm" />
          <source src={TEASER.mp4} type="video/mp4" />
        </>}
        {near && manual && <>
          <source src={TEASER.mp4Mobile} type="video/mp4" media="(max-width: 700px)" />
          <source src={TEASER.mp4} type="video/mp4" />
        </>}
      </video>
      {showPlay && (
        <button type="button" aria-label="Play teaser video" onClick={() => { setManual(true); setNear(true); setTimeout(() => vid.current?.play().catch(() => {}), 50); }}
          style={{ position: "absolute", inset: 0, margin: "auto", width: 84, height: 84, borderRadius: 999, background: "#FD6B14", color: "#1D2632", border: 0, cursor: "pointer", fontSize: 30 }}>▶</button>
      )}
    </div>
  );
});
export default TeaserVideo;
