import { db } from "./db";
import { FAQ_SEED, fillCity } from "./faq-seed";
export async function getFaqs(slug: string, city: string) {
  try {
    const rows = await db.faq.findMany({ where: { event: { slug } }, orderBy: { order: "asc" } });
    if (rows.length) return rows.map(r => ({ q: r.question, a: r.answer }));
  } catch {}
  return FAQ_SEED.map(f => ({ q: fillCity(f.q, city), a: fillCity(f.a, city) }));
}
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WD = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
export function parts(iso: string) { const d = new Date(iso + "T00:00:00Z"); return { day: d.getUTCDate(), month: MONTHS[d.getUTCMonth()], weekday: WD[d.getUTCDay()], year: d.getUTCFullYear() }; }
export function fullDates(a: string, b: string) { const s = parts(a), e = parts(b); return s.month === e.month ? `${s.day}–${e.day} ${s.month} ${s.year}` : `${s.day} ${s.month} – ${e.day} ${e.month} ${e.year}`; }
export const tbc = (v: string | null | undefined, fallback = "[TBC]") => (v && v.trim() ? v : fallback);
export const COLOURS: Record<string, { bg: string; fg: string; panel: string }> = {
  mint: { bg: "#02D69C", fg: "#1D2632", panel: "rgba(255,255,255,.35)" },
  lilac: { bg: "#B8A6F4", fg: "#1D2632", panel: "rgba(255,255,255,.4)" },
  cobalt: { bg: "#104BD9", fg: "#FFFFFF", panel: "rgba(255,255,255,.14)" },
  white: { bg: "#FFFFFF", fg: "#1D2632", panel: "#F4EFE3" },
  night: { bg: "#1A1250", fg: "#FFFFFF", panel: "rgba(255,255,255,.12)" },
  ink: { bg: "#1D2632", fg: "#FFFFFF", panel: "rgba(255,255,255,.12)" },
};
