"use client";
import { useEffect, useRef } from "react";
import { TicketCard } from "./TicketCard";
import type { TierCard } from "./types";

export function TicketRail({ tiers, slug, city, jaipurDates, onHold, onSwitch }: {
  tiers: TierCard[]; slug: string; city: string; jaipurDates: string; onHold: (t: TierCard) => void; onSwitch: () => void;
}) {
  const ref = useRef<HTMLUListElement>(null);
  useEffect(() => { if (ref.current) ref.current.scrollLeft = 0; }, [slug, tiers.length]);
  return (
    <ul ref={ref} key={slug} className="tk-rail" role="list" aria-label={`Ways in for ${city}, ${tiers.length} ticket tiers`} tabIndex={0}>
      {tiers.map((t) => (
        <TicketCard key={`${slug}-${t.id}`} tier={t} slug={slug} jaipurDates={jaipurDates}
          offCity={t.tierKey === "glow" && slug !== "jaipur"} onHold={onHold} onSwitch={onSwitch} />
      ))}
    </ul>
  );
}
