"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { TEASER } from "@/content/video";

type Ctx = { open: (startAt?: number) => void; close: () => void };
const C = createContext<Ctx>({ open: () => {}, close: () => {} });
export const useVideoModal = () => useContext(C);

export function VideoModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [startAt, setStart] = useState(0);
  const trigger = useRef<HTMLElement | null>(null);
  const dlg = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);

  const open = useCallback((s = 0) => { trigger.current = document.activeElement as HTMLElement; setStart(s); setOpen(true); }, []);
  const close = useCallback(() => { setOpen(false); }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    const v = vid.current;
    if (v) { const go = () => { try { v.currentTime = startAt; } catch {} v.muted = false; v.play().catch(() => { v.muted = true; v.play().catch(() => {}); }); }; if (v.readyState >= 1) go(); else v.addEventListener("loadedmetadata", go, { once: true }); }
    const focusables = () => Array.from(dlg.current?.querySelectorAll<HTMLElement>("button, [href], video[controls], [tabindex]:not([tabindex='-1'])") ?? []);
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab") return;
      const f = focusables(); if (!f.length) return;
      const first = f[0], last = f[f.length - 1], a = document.activeElement;
      if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; vid.current?.pause(); trigger.current?.focus?.(); };
  }, [isOpen, startAt, close]);

  return (
    <C.Provider value={{ open, close }}>
      {children}
      {isOpen && (
        <div ref={dlg} role="dialog" aria-modal="true" aria-label="OFF GRAVITY obstacle teaser"
          onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(8,11,16,.92)", display: "grid", placeItems: "center", padding: "clamp(12px,3vw,40px)" }}>
          <div style={{ width: "min(1200px,100%)", position: "relative" }}>
            <button type="button" onClick={close} aria-label="Close video"
              style={{ position: "absolute", right: 0, top: -52, background: "#fff", color: "#1D2632", border: 0, borderRadius: 999, padding: "10px 20px", fontWeight: 800, cursor: "pointer" }}>Close ✕</button>
            <video ref={vid} controls playsInline poster={TEASER.poster} style={{ width: "100%", aspectRatio: "16/9", background: "#000", borderRadius: 20, display: "block" }}>
              <source src={TEASER.mp4Mobile} type="video/mp4" media="(max-width: 700px)" />
              <source src={TEASER.mp4} type="video/mp4" />
            </video>
          </div>
        </div>
      )}
    </C.Provider>
  );
}
