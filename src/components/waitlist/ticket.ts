import { TOUR } from "@/lib/tour";

export type WaitlistTier = "solo" | "squad" | "glow" | "family" | "undecided";

export const TIERS: Record<WaitlistTier, { name: string; num: string; bg: string; fg: string; party?: number }> = {
  solo: { name: "Solo runner", num: "01", bg: "var(--color-mint)", fg: "var(--color-ink)", party: 1 },
  squad: { name: "Squad pack", num: "02", bg: "var(--color-orange)", fg: "var(--color-ink)", party: 4 },
  glow: { name: "Glow Night pass", num: "03", bg: "var(--color-night)", fg: "#fff" },
  family: { name: "Parent-child duo", num: "04", bg: "var(--color-lilac)", fg: "var(--color-ink)", party: 2 },
  undecided: { name: "Tier open", num: "—", bg: "var(--color-ink)", fg: "#fff" },
};
export const TIER_ORDER: WaitlistTier[] = ["solo", "squad", "glow", "family"];

export type ModalCity = { slug: string; city: string; code: string; start: string; end: string; enabled: boolean; glow: boolean; count: number | null };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const parts = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split("-").map(Number); return { y, m, d }; };
export function fmtRange(start: string, end: string) {
  const a = parts(start), b = parts(end);
  if (a.m === b.m && a.y === b.y) return a.d === b.d ? `${a.d} ${MONTHS[a.m - 1]}` : `${a.d}–${b.d} ${MONTHS[a.m - 1]}`;
  return `${a.d} ${MONTHS[a.m - 1]} – ${b.d} ${MONTHS[b.m - 1]}`;
}

export function tourCities(list: { slug: string; start?: string; end?: string; waitlistCount?: number | null; glow?: boolean }[]): ModalCity[] {
  return TOUR.map((t) => {
    const l = list.find((x) => x.slug === t.slug);
    return { slug: t.slug, city: t.city, code: t.code, start: l?.start ?? t.start, end: l?.end ?? t.end, enabled: list.length === 0 || !!l, glow: l?.glow ?? t.slug === "jaipur", count: l?.waitlistCount ?? null };
  });
}

/** "Apr 3 – 4, 2027" / "Mar 30 – Apr 2, 2027" */
export function fmtLong(start: string, end: string) {
  const a = parts(start), b = parts(end);
  if (a.m === b.m && a.y === b.y) return a.d === b.d ? `${MONTHS[a.m - 1]} ${a.d}, ${a.y}` : `${MONTHS[a.m - 1]} ${a.d} – ${b.d}, ${a.y}`;
  return `${MONTHS[a.m - 1]} ${a.d} – ${MONTHS[b.m - 1]} ${b.d}, ${b.y}`;
}

const compact = (iso: string) => iso.slice(0, 10).replaceAll("-", "");
function nextDay(iso: string) {
  const { y, m, d } = parts(iso);
  const t = new Date(Date.UTC(y, m - 1, d + 1));
  return `${t.getUTCFullYear()}${String(t.getUTCMonth() + 1).padStart(2, "0")}${String(t.getUTCDate()).padStart(2, "0")}`;
}
/** All-day VEVENT spanning start..end inclusive. */
export function buildIcs(city: string, start: string, end: string) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//OFF GRAVITY//Waitlist//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:og-${city.toLowerCase().replace(/\W+/g, "")}-${compact(start)}@offgravity`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compact(start)}`,
    `DTEND;VALUE=DATE:${nextDay(end)}`,
    `SUMMARY:OFF GRAVITY ${city} (provisional dates)`,
    "DESCRIPTION:Dates are provisional\, subject to venue and permission confirmations. We will message you before tickets open.",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}
export function downloadIcs(city: string, start: string, end: string) {
  const blob = new Blob([buildIcs(city, start, end)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `off-gravity-${city.toLowerCase().replace(/\W+/g, "-")}.ics`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
