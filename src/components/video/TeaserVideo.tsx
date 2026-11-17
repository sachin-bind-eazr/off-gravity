"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
      if (e.isIntersecting && v.dataset.userPaused === "1") return;
      if (e.isIntersecting) v.play().catch(() => {}); else v.pause();
    }, { threshold: 0.1 });
    loadIO.observe(v); playIO.observe(v);
    return () => { loadIO.disconnect(); playIO.disconnect(); };
  }, [reduced, manual, near]);

  // external "play now" request (user clicked Watch with sound)
  useEffect(() => { const v = vid.current; if (!v) return; const f = () => { setManual(true); setNear(true); }; v.addEventListener("og-activate", f); return () => v.removeEventListener("og-activate", f); }, []);

  // once sources are mounted, trigger load
  useEffect(() => { if (near) vid.current?.load(); }, [near]);

  const showPlay = reduced && !manual;
  return (
    <div className={className} style={{ position: "relative", overflow: "hidden" }}>
      <video ref={vid} muted loop playsInline preload="none" poster={near ? poster : undefined} aria-label={label}
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
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
          <Button variant="primary" size="md" leadingIcon={Play} onClick={() => { setManual(true); setNear(true); setTimeout(() => vid.current?.play().catch(() => {}), 50); }}>Play video</Button>
        </div>
      )}
    </div>
  );
});
export default TeaserVideo;
