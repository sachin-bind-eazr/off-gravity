"use client";
import { useEffect, useState } from "react";
import { TicketRail } from "./tickets/TicketRail";
import { WaitlistBanner } from "./tickets/Banner";
import { normalise, STATIC_CARDS, type Loaded, type TierCard } from "./tickets/types";
import { useWaitlist } from "@/components/waitlist";
import { DISCLAIMER, TOUR } from "@/lib/tour";
import { fmtRange } from "../format";
import "./tickets/tickets.css";

const cache = new Map<string, Loaded>();
const JAI = TOUR.find((t) => t.slug === "jaipur")!;
const JAI_DATES = fmtRange(JAI.start, JAI.end, true);

export type WaysInProps = {
  /** New names */
  citySlug?: string; cityName?: string; cityCode?: string;
  /** Called when the Glow Night card asks to move to Jaipur. Also dispatches an `og:select-city` event on window. */
  onSelectCity?: (slug: string) => void;
  /** Legacy names (kept so the current Tour.tsx keeps working) */
  slug?: string; city?: string; code?: string; mode?: string; onWaitlist?: (tierKey?: string) => void;
};

function Lock() {
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true">
      <rect x="1" y="7" width="12" height="8" rx="2.2" fill="currentColor" />
      <path d="M3.8 7V5a3.2 3.2 0 0 1 6.4 0v2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function WaysIn(p: WaysInProps) {
  const slug = p.citySlug ?? p.slug ?? "mumbai";
  const city = p.cityName ?? p.city ?? "Mumbai";
  const wl = useWaitlist();
  const [state, setState] = useState<{ slug: string; data: Loaded } | "loading">(() => {
    const c = cache.get(slug);
    return c ? { slug, data: c } : "loading";
  });

  useEffect(() => {
    const c = cache.get(slug);
    if (c) { setState({ slug, data: c }); return; }
    setState("loading");
    let live = true;
    const ctl = new AbortController();
    fetch(`/api/home/tiers?event=${encodeURIComponent(slug)}`, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => { const n = normalise(j); cache.set(slug, n); if (live) setState({ slug, data: n }); })
      .catch(() => { if (live && !ctl.signal.aborted) setState({ slug, data: { tiers: STATIC_CARDS, hidden: false, earlyBirdHours: null } }); });
    return () => { live = false; ctl.abort(); };
  }, [slug]);

  const ready = state !== "loading" && state.slug === slug ? state.data : null;
  const hold = (t?: TierCard) => {
    if (p.onWaitlist) { p.onWaitlist(t?.tierKey); return; }
    wl.open(t ? { city: slug, tier: t.tierKey } : { city: slug });
  };
  const toJaipur = () => {
    p.onSelectCity?.("jaipur");
    window.dispatchEvent(new CustomEvent("og:select-city", { detail: "jaipur" }));
    document.getElementById("tour")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  };
  const hours = ready?.earlyBirdHours ?? null;

  return (
    <div className="tk-wrap" aria-labelledby="ways-in-h">
      <div className="tk-head">
        <p className="tk-pill"><Lock /><span>Tickets go on sale soon · <span key={city} className="tk-city">{city}</span></span></p>
        <h3 id="ways-in-h" className="t-section tk-h3">Four ways to <span className="tk-hl">bounce in.</span></h3>
        <p className="tk-line">
          Pricing for each tier is being finalised with our city partners. Here&apos;s a preview of what&apos;s coming. Waitlist members get early access
          {hours ? <>, <strong>a {hours}-hour early-bird window</strong> and the lowest ticket prices.</> : <> and the lowest ticket prices.</>}
        </p>
      </div>

      <div aria-live="polite" aria-busy={!ready}>
        {!ready ? (
          <div className="tk-skels" aria-hidden="true">{[0, 1, 2, 3].map((i) => <div key={i} className="tk-skel" />)}</div>
        ) : ready.hidden ? (
          <p className="tk-empty">Tiers for {city} will be announced soon.</p>
        ) : (
          <TicketRail tiers={ready.tiers} slug={slug} city={city} jaipurDates={JAI_DATES} onHold={(t) => hold(t)} onSwitch={toJaipur} />
        )}
      </div>

      <WaitlistBanner onJoin={() => hold()} />
      <p className="tk-disclaimer">{DISCLAIMER}</p>
    </div>
  );
}
