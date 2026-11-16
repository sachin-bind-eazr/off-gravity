"use client";
import { useEffect, useRef, useState } from "react";
import { TicketCard } from "./TicketCard";
import type { TierCard } from "./types";

export function TicketRail({ tiers, slug, city, jaipurDates, onHold, onSwitch }: {
  tiers: TierCard[]; slug: string; city: string; jaipurDates: string; onHold: (t: TierCard) => void; onSwitch: () => void;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const first = el.children[0] as HTMLElement | undefined; if (!first) return;
        setActive(Math.max(0, Math.min(tiers.length - 1, Math.round(el.scrollLeft / (first.offsetWidth + 16)))));
      });
    };
    el.scrollLeft = 0; setActive(0);
    el.addEventListener("scroll", on, { passive: true });
    return () => { el.removeEventListener("scroll", on); cancelAnimationFrame(raf); };
  }, [slug, tiers.length]);
  const go = (i: number) => {
    const el = ref.current; const c = el?.children[i] as HTMLElement | undefined; if (!el || !c) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: c.offsetLeft - el.offsetLeft, behavior: reduce ? "auto" : "smooth" });
  };
  return (
    <div>
      <ul ref={ref} key={slug} className="tk-rail" role="region" aria-label={`Ways in for ${city}, ${tiers.length} ticket tiers`} tabIndex={0}>
        {tiers.map((t, i) => (
          <TicketCard key={`${slug}-${t.id}`} tier={t} index={i} slug={slug} jaipurDates={jaipurDates}
            dim={t.tierKey === "glow" && slug !== "jaipur"} onHold={onHold} onSwitch={onSwitch} />
        ))}
      </ul>
      {tiers.length > 1 && (
        <div className="tk-dots" role="group" aria-label="Choose a tier">
          {tiers.map((t, i) => <button key={t.id} type="button" className="tk-dotbtn" aria-label={`Show ${t.name}`} aria-current={i === active ? "true" : undefined} onClick={() => go(i)} />)}
        </div>
      )}
    </div>
  );
}
