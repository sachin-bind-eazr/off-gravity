"use client";
import { useEffect, useState } from "react";
import { TicketRail } from "./tickets/TicketRail";
import { WaitlistBanner } from "./tickets/Banner";
import { normalise, STATIC_CARDS, type Loaded, type TierCard } from "./tickets/types";
import { useWaitlist } from "@/components/waitlist";
import { TOUR } from "@/lib/tour";
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
        <p className="t-kicker on-light">Tickets · {city}</p>
        <h2 id="ways-in-h" className="t-h2">Four ways to bounce in.</h2>
        <p className="t-body-lg measure">
          Pricing for each tier is being finalised with our city partners. Here&apos;s a preview of what&apos;s coming. Waitlist members get early access
          {hours ? <>, <strong>a {hours}-hour early-bird window</strong> and the lowest ticket prices.</> : <> and the lowest ticket prices.</>}
        </p>
        <p className="tk-note t-label">Tickets go on sale soon. Dates are provisional.</p>
      </div>

      <div className="tk-content" aria-live="polite" aria-busy={!ready}>
        {!ready ? (
          <div className="tk-rail tk-skels" aria-hidden="true">{[0, 1, 2, 3].map((i) => <div key={i} className="tk-skel" />)}</div>
        ) : ready.hidden ? (
          <p className="tk-empty t-body">Tiers for {city} will be announced soon.</p>
        ) : (
          <TicketRail tiers={ready.tiers} slug={slug} city={city} jaipurDates={JAI_DATES} onHold={(t) => hold(t)} onSwitch={toJaipur} />
        )}
      </div>

      <WaitlistBanner onJoin={() => hold()} />
    </div>
  );
}
