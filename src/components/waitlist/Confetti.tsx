"use client";
import { useEffect, useRef } from "react";
const COLOURS = ["#02D69C", "#FD6B14", "#B8A6F4", "#ffffff", "#104BD9"];
/** One-shot 900ms brand-colour burst. Canvas, no library. Parent skips rendering under reduced motion. */
export function Confetti({ originY = 0.42 }: { originY?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = c.clientWidth, h = c.clientHeight;
    c.width = w * dpr; c.height = h * dpr; ctx.scale(dpr, dpr);
    const P = Array.from({ length: 80 }, () => {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, v = 5 + Math.random() * 8;
      return { x: w / 2, y: h * originY, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 4 + Math.random() * 5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, col: COLOURS[(Math.random() * COLOURS.length) | 0] };
    });
    const t0 = performance.now(); let raf = 0;
    const tick = (now: number) => {
      const t = now - t0; if (t > 900) { ctx.clearRect(0, 0, w, h); return; }
      ctx.clearRect(0, 0, w, h); ctx.globalAlpha = Math.max(0, 1 - t / 900);
      for (const p of P) { p.x += p.vx; p.y += p.vy; p.vy += 0.38; p.vx *= 0.985; p.rot += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore(); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [originY]);
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 h-full w-full" />;
}
