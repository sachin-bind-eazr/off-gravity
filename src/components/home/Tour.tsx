"use client";
import { useEffect, useRef, useState } from "react";
import type { EventView } from "@/lib/events";
import { fmtFull, fmtRange } from "./format";
import { LazyIndiaMap as IndiaMap } from "./tour/map/LazyIndiaMap";
import { HOME } from "@/content/home";
import { ctaMode } from "@/lib/cta";
import { useWaitlist } from "@/components/waitlist";
import { Section } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { WaysIn } from "./tour/WaysIn";
import { CityTicket } from "./tour/CityTicket";
import { tagLabel } from "./tour/labels";
import "./tour/tour.css";

type OpenWaitlist = (a: string | { city?: string; tier?: string }) => void;

export function Tour({ events }: { events: EventView[] }) {
  const [sel, setSel] = useState(events[0].slug);
  const listRef = useRef<HTMLDivElement>(null);
  const cityEl = (slug: string) => listRef.current?.querySelector<HTMLElement>(`[data-slug="${slug}"]`) ?? null;
  const e = events.find((x) => x.slug === sel)!;
  const idx = events.indexOf(e);
  const mode = ctaMode(e);
  const { open: openWaitlist } = useWaitlist();
  const inLine = (e as EventView & { waitlistCount?: number | null }).waitlistCount;
  const onKey = (ev: React.KeyboardEvent) => {
    const k = ev.key; let n = idx;
    if (k === "ArrowDown" || k === "ArrowRight") n = (idx + 1) % events.length;
    else if (k === "ArrowUp" || k === "ArrowLeft") n = (idx - 1 + events.length) % events.length;
    else if (k === "Home") n = 0; else if (k === "End") n = events.length - 1; else return;
    ev.preventDefault(); setSel(events[n].slug); cityEl(events[n].slug)?.focus();
  };
  useEffect(() => {
    if (!window.matchMedia("(max-width: 859px)").matches) return;
    const el = cityEl(sel); let box = el?.parentElement ?? null;
    while (box && box.scrollWidth <= box.clientWidth) box = box.parentElement;
    if (el && box && box !== document.body && box !== document.documentElement) box.scrollTo({ left: el.offsetLeft - (box.clientWidth - el.clientWidth) / 2, behavior: "smooth" });
  }, [sel]);
  const seasons = [1, 2];
  const join = (a: { city?: string; tier?: string }) => (openWaitlist as OpenWaitlist)(a);
  return (
    <Section id="tour" tone="light" className="scroll-mt-16">
      <p className="t-kicker on-light">{HOME.tour.kicker}</p>
      <h2 className="t-h2">{HOME.tour.h2}</h2>

      <div className="tr-layout grid-12">
        <div ref={listRef} role="radiogroup" aria-label="Choose a city" onKeyDown={onKey} className="tr-list">
          <div className="tr-seasons">
            {seasons.map((s) => (
              <div key={s} className="tr-season">
                <p className="tr-season__label t-label">Season {s}</p>
                <div className="tr-season__items">
                  {events.filter((x) => x.season === s).map((x) => {
                    const on = x.slug === sel;
                    const n = events.indexOf(x) + 1;
                    const tag = tagLabel(x.slug, x.tag);
                    return (
                      <Button key={x.slug} data-slug={x.slug} variant={on ? "secondary" : "outline"} className="tr-city"
                        role="radio" aria-checked={on} tabIndex={on ? 0 : -1} onClick={() => setSel(x.slug)}>
                        <span className="tr-city__in">
                          <span className="tr-city__n">{n}</span>
                          <span className="tr-city__txt">
                            <span className="tr-city__name">{x.city}</span>
                            {tag && <span className="tr-city__meta t-label">{tag}</span>}
                          </span>
                        </span>
                        <span className="tr-city__dates">{fmtRange(x.start, x.end, true)}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="tr-panel">
          <p className="sr-only" aria-live="polite">{e.city} selected, {fmtFull(e.start, e.end)}</p>
          <div className="tr-map">
            <IndiaMap events={events} selected={sel} onSelect={setSel} />
          </div>
          <div key={e.slug} className="og-tour-in tr-card">
            <CityTicket slug={e.slug} city={e.city} code={e.code} stop={idx + 1} total={events.length} start={e.start} end={e.end} mode={mode} inLine={inLine} onJoin={() => join({ city: e.slug })} />
          </div>
        </div>
      </div>

      <WaysIn onSelectCity={(slug: string) => setSel(slug)} slug={e.slug} city={e.city} code={e.code} mode={mode} onWaitlist={(tier) => join(tier ? { city: e.slug, tier } : { city: e.slug })} />
    </Section>
  );
}
