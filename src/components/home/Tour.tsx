"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { EventView } from "@/lib/events";
import { DISCLAIMER } from "@/lib/tour";
import { fmtDay, fmtFull, fmtRange } from "./format";
import { IndiaMap } from "./tour/map/IndiaMap";
import { ArrowIcon } from "@/components/site/BookButton";
import { HOME } from "@/content/home";
import { ctaMode } from "@/lib/cta";
import { useWaitlist } from "@/components/waitlist";
import { WaysIn } from "./tour/WaysIn";
import { tagLabel, editionLabel } from "./tour/labels";

const THEME: Record<string, { bg: string; fg: string; card: string; dark: boolean }> = {
  mint: { bg: "#02D69C", fg: "#1D2632", card: "rgba(255,255,255,.42)", dark: false },
  lilac: { bg: "#B8A6F4", fg: "#1D2632", card: "rgba(255,255,255,.42)", dark: false },
  cobalt: { bg: "#104BD9", fg: "#fff", card: "rgba(255,255,255,.16)", dark: true },
  white: { bg: "#FFFFFF", fg: "#1D2632", card: "#F4EFE3", dark: false },
  night: { bg: "#1A1250", fg: "#fff", card: "rgba(255,255,255,.14)", dark: true },
  ink: { bg: "#1D2632", fg: "#fff", card: "rgba(255,255,255,.14)", dark: true },
};

export function Tour({ events }: { events: EventView[] }) {
  const [sel, setSel] = useState(events[0].slug);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const e = events.find((x) => x.slug === sel)!;
  const idx = events.indexOf(e);
  const th = THEME[e.colour] ?? THEME.ink;
  const jaipur = e.slug === "jaipur";
  const mode = ctaMode(e);
  const { open: openWaitlist } = useWaitlist();
  const tag = tagLabel(e.slug, e.tag);
  const inLine = (e as EventView & { waitlistCount?: number | null }).waitlistCount;
  const onKey = (ev: React.KeyboardEvent) => {
    const k = ev.key; let n = idx;
    if (k === "ArrowDown" || k === "ArrowRight") n = (idx + 1) % events.length;
    else if (k === "ArrowUp" || k === "ArrowLeft") n = (idx - 1 + events.length) % events.length;
    else if (k === "Home") n = 0; else if (k === "End") n = events.length - 1; else return;
    ev.preventDefault(); setSel(events[n].slug); refs.current[events[n].slug]?.focus();
  };
  useEffect(() => {
    if (window.matchMedia("(max-width: 899px)").matches) refs.current[sel]?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [sel]);
  const seasons = [1, 2];
  return (
    <section id="tour" className="section-y scroll-mt-16 bg-cream">
      <div className="container-og">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div><p className="text-[15px] font-bold text-cobalt">{HOME.tour.kicker}</p><h2 className="t-section-lg mt-4">{HOME.tour.h2}</h2></div>
          <p className="max-w-[260px] text-[15px] text-text-muted">{DISCLAIMER}</p>
        </div>

        <div className="mt-12 grid items-start gap-5 min-[900px]:grid-cols-[320px_minmax(0,1fr)] min-[900px]:gap-8">
          <div role="radiogroup" aria-label="Choose a city" onKeyDown={onKey} className="-mx-[var(--pad)] flex snap-x gap-2 overflow-x-auto px-[var(--pad)] pb-1 [scrollbar-width:none] min-[900px]:mx-0 min-[900px]:grid min-[900px]:gap-5 min-[900px]:overflow-visible min-[900px]:px-0 min-[900px]:pb-0">
            {seasons.map((s) => (
              <div key={s} className="max-[899px]:contents">
                <p className="mb-2 px-1 text-[14px] font-bold text-text-muted max-[899px]:hidden">Season {s}</p>
                <div className="max-[899px]:contents min-[900px]:grid min-[900px]:grid-cols-1 min-[900px]:gap-1">
                  {events.filter((x) => x.season === s).map((x) => {
                    const on = x.slug === sel;
                    const n = events.indexOf(x) + 1;
                    return (
                      <button key={x.slug} ref={(el) => { refs.current[x.slug] = el; }} type="button" role="radio" aria-checked={on} tabIndex={on ? 0 : -1} onClick={() => setSel(x.slug)}
                        className={`og-city group flex shrink-0 snap-start items-center gap-3 rounded-full px-4 py-3 text-left transition-[background-color,color,transform] duration-300 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-cobalt min-[900px]:min-h-[72px] min-[900px]:shrink min-[900px]:rounded-full ${on ? "bg-ink text-white" : "bg-white text-ink hover:-translate-y-0.5 min-[900px]:bg-transparent min-[900px]:hover:translate-y-0 min-[900px]:hover:bg-ink/[.06]"}`}>
                        <span aria-hidden="true" className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[14px] font-extrabold transition-colors ${on ? "bg-orange text-ink" : "bg-ink/10 text-ink group-hover:bg-ink/15"}`}>{n}</span>
                        <span className="min-w-0 flex-1 min-[900px]:flex min-[900px]:items-center min-[900px]:justify-between min-[900px]:gap-3">
                          <span className="block min-w-0">
                            <span className="block whitespace-nowrap text-[18px] font-extrabold leading-tight">{x.city}</span>
                            {tagLabel(x.slug, x.tag) && <span className={`mt-0.5 block whitespace-nowrap text-[14px] font-semibold max-[899px]:hidden ${on ? "text-lilac" : "text-cobalt"}`}>{tagLabel(x.slug, x.tag)}</span>}
                          </span>
                          <span className={`mt-0.5 block whitespace-nowrap text-[16px] font-bold min-[900px]:mt-0 ${on ? "text-white" : "text-ink"}`}>{fmtRange(x.start, x.end, true)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="relative overflow-hidden rounded-[28px] bg-[#141A21] min-[1100px]:h-[600px]">
            <p className="sr-only" aria-live="polite">{e.city} selected, {fmtFull(e.start, e.end)}</p>
            <div className="h-[360px] min-[900px]:h-[460px] min-[1100px]:absolute min-[1100px]:inset-0 min-[1100px]:h-full">
              <IndiaMap events={events} selected={sel} onSelect={setSel} />
            </div>
            <div key={e.slug} className="og-tour-in relative z-10 m-3 overflow-hidden rounded-[20px] bg-white/[.92] p-5 text-ink shadow-[0_12px_40px_rgba(0,0,0,.28)] min-[700px]:m-4 min-[1100px]:absolute min-[1100px]:bottom-4 min-[1100px]:left-4 min-[1100px]:m-0 min-[1100px]:w-[372px] min-[1100px]:p-6">
              <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5" style={{ background: th.bg }} />
              <p className="text-[14px] font-bold text-text-muted">Season {e.season} &middot; Stop {idx + 1} of {events.length}</p>
              <h3 className="mt-1 font-extrabold leading-[.95] tracking-[-0.04em]" style={{ fontSize: "clamp(36px,3.6vw,48px)", fontStretch: "102%", overflowWrap: "break-word" }}>{e.city}</h3>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="text-[clamp(18px,1.8vw,22px)] font-extrabold tracking-[-0.01em]">{fmtFull(e.start, e.end)}</p>
                {tag && <span className="rounded-full bg-ink px-3 py-0.5 text-[14px] font-bold text-white">{tag}</span>}
                <span className="rounded-full px-3 py-0.5 text-[14px] font-bold ring-[1.5px] ring-ink/30">{editionLabel(e.slug)}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {[{ d: fmtDay(e.start), t: jaipur ? "Evening edition, day one" : "Festival day one + Glow Night" }, { d: fmtDay(e.end), t: "Festival day two" }].map((c) => (
                  <div key={c.d} className="rounded-[14px] bg-cream p-3"><p className="text-[14px] font-semibold text-text-muted">{c.d}</p><p className="mt-0.5 text-[15px] font-extrabold leading-tight">{c.t}</p></div>
                ))}
              </div>
              <p className="mt-3 text-[15px] text-text-muted">Venue and timings to be announced.</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                {mode === "waitlist" && <button type="button" onClick={() => openWaitlist(e.slug)} className="btn-primary !px-6 !py-3.5 !text-[17px]">Join the {e.city} waitlist<ArrowIcon /></button>}
                {mode === "book" && <Link href={`/book?city=${e.slug}`} className="btn-primary !px-6 !py-3.5 !text-[17px]">Book {e.city}<ArrowIcon /></Link>}
                <Link href={`/events/${e.slug}`} className="link-secondary">Event details</Link>
              </div>
              {mode === "waitlist" && inLine != null && <p className="mt-3 text-[15px] font-bold">{inLine.toLocaleString("en-IN")} people in line for {e.city}</p>}
            </div>
          </div>
        </div>

        <WaysIn {...({ onSelectCity: (slug: string) => setSel(slug) } as object)} slug={e.slug} city={e.city} code={e.code} mode={mode} onWaitlist={(tier) => (openWaitlist as (a: string | { city?: string; tier?: string }) => void)(tier ? { city: e.slug, tier } : { city: e.slug })} />
      </div>
    </section>
  );
}
