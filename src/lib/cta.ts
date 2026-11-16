export type CtaMode = "waitlist" | "book" | "none";
/** Statuses where a waitlist signup makes sense (events not yet selling). */
const WAITLISTABLE = new Set(["PROVISIONAL", "CONFIRMED", "WAITLIST_OPEN"]);
export function ctaMode(e: { status: string }): CtaMode {
  if (e.status === "SALES_OPEN") return "book";
  return WAITLISTABLE.has(e.status) ? "waitlist" : "none";
}
/** Page-level CTA: any event selling wins; otherwise waitlist while any event can take signups; "none" only when nothing can. */
export function ctaFor(events: { status: string }[]): CtaMode {
  if (events.some((e) => e.status === "SALES_OPEN")) return "book";
  if (events.some((e) => WAITLISTABLE.has(e.status))) return "waitlist";
  return "none";
}
