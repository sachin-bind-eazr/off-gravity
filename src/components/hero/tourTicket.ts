/**
 * Pure logic for the hero tour ticket strip (no React, no DOM), so it can be unit-tested.
 * Event days are stored as dates; a stop runs from 00:00 IST on its start date until 00:00 IST
 * the day after its end date (Asia/Kolkata, UTC+05:30, no DST).
 */
import { ctaMode } from "@/lib/cta";

export type StripEvent = { slug: string; city: string; season: number; start: string; end: string; status: string };

export type TicketCity = {
  slug: string;
  city: string;
  /** 1-based tour order */
  stop: number;
  season: number;
  /** epoch ms, 00:00 IST on the first day */
  startMs: number;
  /** epoch ms, 00:00 IST on the day after the last day (exclusive) */
  endMs: number;
  /** "Sat 30 – Sun 31 Jan 2027" */
  dates: string;
  /** "book" when sales are open, else "waitlist" (or "none" when the event takes neither) */
  mode: "book" | "waitlist" | "none";
};

const IST_OFFSET = "+05:30";
const DAY = 86_400_000;
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** 00:00 IST on a YYYY-MM-DD date, as epoch ms. */
export function istMidnight(date: string): number {
  return Date.parse(`${date.slice(0, 10)}T00:00:00${IST_OFFSET}`);
}

/** "Sat 30 – Sun 31 Jan 2027"; across months "Sat 31 Jan – Sun 1 Feb 2027". Date-only, so timezone-neutral. */
export function fullDates(start: string, end: string): string {
  const p = (d: string) => { const [y, m, dd] = d.slice(0, 10).split("-").map(Number); return { y, m: m - 1, d: dd, wd: new Date(Date.UTC(y, m - 1, dd)).getUTCDay() }; };
  const a = p(start), b = p(end);
  if (a.y === b.y && a.m === b.m && a.d === b.d) return `${WD[a.wd]} ${a.d} ${MON[a.m]} ${a.y}`;
  if (a.y === b.y && a.m === b.m) return `${WD[a.wd]} ${a.d} – ${WD[b.wd]} ${b.d} ${MON[b.m]} ${b.y}`;
  if (a.y === b.y) return `${WD[a.wd]} ${a.d} ${MON[a.m]} – ${WD[b.wd]} ${b.d} ${MON[b.m]} ${b.y}`;
  return `${WD[a.wd]} ${a.d} ${MON[a.m]} ${a.y} – ${WD[b.wd]} ${b.d} ${MON[b.m]} ${b.y}`;
}

/** Events in tour order (by start date) mapped to ticket cities. */
export function toTicketCities(events: StripEvent[]): TicketCity[] {
  return [...events]
    .sort((x, y) => x.start.localeCompare(y.start))
    .map((e, i) => ({
      slug: e.slug,
      city: e.city,
      stop: i + 1,
      season: e.season,
      startMs: istMidnight(e.start),
      endMs: istMidnight(e.end) + DAY,
      dates: fullDates(e.start, e.end),
      mode: ctaMode(e),
    }));
}

/** Index of the first city whose end is in the future (the "Next stop"), or -1 when the tour is over. */
export function nextStopIndex(cities: Pick<TicketCity, "endMs">[], nowMs: number): number {
  return cities.findIndex((c) => c.endMs > nowMs);
}

/** "73d 07h 41m" before the event, "Live now" during it, "Finished" after it. */
export function countdown(city: Pick<TicketCity, "startMs" | "endMs">, nowMs: number): string {
  if (nowMs >= city.endMs) return "Finished";
  if (nowMs >= city.startMs) return "Live now";
  const mins = Math.floor((city.startMs - nowMs) / 60_000);
  const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
  return `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
}

/** Row-1 label: "Next stop" for the next stop, otherwise "Stop 03 · Season 1". */
export function stopLabel(city: Pick<TicketCity, "stop" | "season">, index: number, nextIndex: number): string {
  return index === nextIndex ? "Next stop" : `Stop ${String(city.stop).padStart(2, "0")} · Season ${city.season}`;
}

/**
 * The marquee item "touching" the ticket: the one with the largest `left` that is <= `edge`.
 * Returns its city index, or null when no item has reached the edge yet.
 */
export function pickActive(items: { idx: number; left: number }[], edge: number): number | null {
  let best: { idx: number; left: number } | null = null;
  for (const it of items) if (it.left <= edge && (!best || it.left > best.left)) best = it;
  return best ? best.idx : null;
}

/** Where a ticket click goes: booking when that city is selling, otherwise the waitlist drawer. */
export function ticketHref(city: Pick<TicketCity, "slug" | "mode">): string | null {
  return city.mode === "book" ? `/book?city=${city.slug}` : null;
}
