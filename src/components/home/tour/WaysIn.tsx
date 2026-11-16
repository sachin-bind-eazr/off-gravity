"use client";
import { useEffect, useState } from "react";
import { TicketRail } from "./tickets/TicketRail";
import { EarlyBirdStrip } from "./tickets/EarlyBirdStrip";
import { normalise, type TierCard } from "./tickets/types";
import { DISCLAIMER } from "@/lib/tour";
import "./tickets/tickets.css";

type Mode = "waitlist" | "book" | "none";
type State = { slug: string; tiers: TierCard[]; earlyBirdHours: number | null } | "loading";

const cache = new Map<string, { tiers: TierCard[]; earlyBirdHours: number | null }>();

const LINE: Record<Mode, string> = {
  waitlist: "Prices land soon. Join the waitlist to hear first and pick your tier before public sales.",
  book: "Pick your tier, choose your day and lock in your weekend.",
  none: "Tiers and prices will be announced soon.",
};

export function WaysIn({ slug, city, code, mode, onWaitlist }: { slug: string; city: string; code: string; mode: Mode; onWaitlist: (tierKey?: string) => void }) {
  const [state, setState] = useState<State>(() => { const c = cache.get(slug); return c ? { slug, ...c } : "loading"; });

  useEffect(() => {
    const c = cache.get(slug);
    if (c) { setState({ slug, ...c }); return; }
    setState("loading");
    let live = true;
    const ctl = new AbortController();
    fetch(`/api/home/tiers?event=${encodeURIComponent(slug)}`, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => { const n = normalise(j, slug); cache.set(slug, n); if (live) setState({ slug, ...n }); })
      .catch(() => { if (live && !ctl.signal.aborted) setState({ slug, tiers: [], earlyBirdHours: null }); });
    return () => { live = false; ctl.abort(); };
  }, [slug]);

  const ready = state !== "loading" && state.slug === slug ? state : null;

  return (
    <div className="tk-wrap" aria-labelledby="ways-in-h">
      <p className="tk-kicker">Ways in · <span key={city} className="tk-city">{city}</span></p>
      <h3 id="ways-in-h" className="t-section tk-h3">Pick how you bounce in.</h3>
      <p className="tk-line">{LINE[mode]}</p>

      <div aria-live="polite" aria-busy={!ready}>
        {!ready ? (
          <div className="tk-skels" aria-hidden="true">{[0, 1, 2, 3].map((i) => <div key={i} className="tk-skel" />)}</div>
        ) : ready.tiers.length === 0 ? (
          <p className="tk-empty">Tiers for {city} will be announced soon.</p>
        ) : (
          <TicketRail tiers={ready.tiers} slug={slug} city={city} cityCode={code} mode={mode} onHold={(t) => onWaitlist(t.tierKey)} />
        )}
      </div>

      <EarlyBirdStrip mode={mode} city={city} slug={slug} hours={ready?.earlyBirdHours ?? null} onJoin={() => onWaitlist()} />
      <p className="tk-disclaimer">{DISCLAIMER}</p>
    </div>
  );
}
