"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import type { EventView } from "@/lib/events";
import { DISCLAIMER } from "@/lib/tour";
import { fmtDay, fmtFull, fmtRange } from "./format";
import { RouteMap } from "./RouteMap";
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
  const seasons = [1, 2];
  return (
    <section id="tour" className="section-y scroll-mt-16 bg-cream">
      <div className="container-og">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div><p className="text-[15px] font-bold text-cobalt">{HOME.tour.kicker}</p><h2 className="t-section-lg mt-4">{HOME.tour.h2}</h2></div>
          <p className="max-w-[260px] text-[15px] text-text-muted">{DISCLAIMER}</p>
        </div>

        <div className="mt-12 grid items-start gap-6 min-[1000px]:grid-cols-[340px_minmax(0,1fr)] min-[1000px]:gap-8">
          <div role="radiogroup" aria-label="Choose a city" onKeyDown={onKey} className="grid gap-5">
            {seasons.map((s) => (
              <div key={s}>
                <p className="mb-2 px-1 text-[14px] font-bold text-text-muted">Season {s}</p>
                <div className="grid grid-cols-1 gap-2.5 min-[480px]:grid-cols-2 min-[1000px]:grid-cols-1 min-[1000px]:gap-1">
                  {events.filter((x) => x.season === s).map((x) => {
                    const on = x.slug === sel;
                    const n = events.indexOf(x) + 1;
                    return (
                      <button key={x.slug} ref={(el) => { refs.current[x.slug] = el; }} type="button" role="radio" aria-checked={on} tabIndex={on ? 0 : -1} onClick={() => setSel(x.slug)}
                        className={`og-city group flex min-h-[72px] items-center gap-3 rounded-[20px] px-4 py-3 text-left transition-[background-color,color,transform] duration-300 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-cobalt min-[1000px]:rounded-full min-[1000px]:px-4 min-[1000px]:py-3 ${on ? "bg-ink text-white" : "bg-white text-ink hover:-translate-y-0.5 hover:bg-white min-[1000px]:bg-transparent min-[1000px]:hover:translate-y-0 min-[1000px]:hover:bg-ink/[.06]"}`}>
                        <span aria-hidden="true" className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[14px] font-extrabold transition-colors ${on ? "bg-orange text-ink" : "bg-ink/10 text-ink group-hover:bg-ink/15"}`}>{n}</span>
                        <span className="min-w-0 flex-1 min-[1000px]:flex min-[1000px]:items-center min-[1000px]:justify-between min-[1000px]:gap-3">
                          <span className="block min-w-0">
                            <span className="block text-[18px] font-extrabold leading-tight">{x.city}</span>
                            {tagLabel(x.slug, x.tag) && <span className={`mt-0.5 block text-[14px] font-semibold ${on ? "text-lilac" : "text-cobalt"}`}>{tagLabel(x.slug, x.tag)}</span>}
                          </span>
                          <span className={`mt-0.5 block whitespace-nowrap text-[16px] font-bold min-[1000px]:mt-0 ${on ? "text-white" : "text-ink"}`}>{fmtRange(x.start, x.end, true)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="og-tour-panel overflow-hidden rounded-[28px] p-[clamp(22px,3.4vw,48px)]" style={{ background: th.bg, color: th.fg }}>
            <p className="sr-only" aria-live="polite">{e.city} selected, {fmtFull(e.start, e.end)}</p>
            <div className="grid gap-8 min-[1500px]:grid-cols-[minmax(0,1fr)_280px] min-[1500px]:gap-10">
              <div key={e.slug} className="og-tour-in min-w-0">
                <p className="text-[15px] font-bold opacity-80">Season {e.season} &middot; Stop {idx + 1} of {events.length}</p>
                <h3 className="mt-3 font-extrabold leading-[.95] tracking-[-0.04em]" style={{ fontSize: "clamp(42px,4.6vw,64px)", fontStretch: "102%", overflowWrap: "break-word" }}>{e.city}</h3>
                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <p className="text-[clamp(22px,2.4vw,30px)] font-extrabold tracking-[-0.01em]">{fmtFull(e.start, e.end)}</p>
                  {tag && <span className="rounded-full px-3.5 py-1 text-[14px] font-bold" style={{ background: th.dark ? "#B8A6F4" : "#1D2632", color: th.dark ? "#1D2632" : "#fff" }}>{tag}</span>}
                  <span className="rounded-full px-3.5 py-1 text-[14px] font-bold ring-[1.5px] ring-current/40">{editionLabel(e.slug)}</span>
                </div>
                <div className="mt-6 grid gap-3 min-[700px]:grid-cols-2">
                  {[{ d: fmtDay(e.start), t: jaipur ? "Evening edition, day one" : "Festival day one + Glow Night" }, { d: fmtDay(e.end), t: "Festival day two" }].map((c) => (
                    <div key={c.d} className="rounded-[18px] p-4" style={{ background: th.card }}><p className="text-[14px] font-semibold opacity-80">{c.d}</p><p className="mt-1 text-[17px] font-extrabold leading-tight">{c.t}</p></div>
                  ))}
                </div>
                <p className="mt-5 text-[16px]">Venue and timings to be announced.</p>
                <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-4">
                  {mode === "waitlist" && <button type="button" onClick={() => openWaitlist(e.slug)} className="btn-primary">Join the {e.city} waitlist<ArrowIcon /></button>}
                  {mode === "book" && <Link href={`/book?city=${e.slug}`} className="btn-primary">Book {e.city}<ArrowIcon /></Link>}
                  <Link href={`/events/${e.slug}`} className="link-secondary">Event details</Link>
                </div>
                {mode === "waitlist" && inLine != null && <p className="mt-4 text-[15px] font-bold">{inLine.toLocaleString("en-IN")} people in line for {e.city}</p>}
              </div>
              <div className="flex flex-col rounded-[22px] p-4 min-[700px]:p-5" style={{ background: th.card }}>
                <p className="mb-2 text-[14px] font-bold opacity-80">Tour route, in order</p>
                <div className="mx-auto my-auto w-full max-w-[360px]"><RouteMap selected={e.slug} dark={th.dark} onSelect={setSel} /></div>
              </div>
            </div>
          </div>
        </div>

        <WaysIn slug={e.slug} city={e.city} code={e.code} mode={mode} onWaitlist={(tier) => (openWaitlist as (a: string | { city?: string; tier?: string }) => void)(tier ? { city: e.slug, tier } : { city: e.slug })} />
      </div>
    </section>
  );
}
