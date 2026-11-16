export type CtaMode = "waitlist" | "book" | "none";
export function ctaMode(e: { status: string }): CtaMode {
  return e.status === "WAITLIST_OPEN" ? "waitlist" : e.status === "SALES_OPEN" ? "book" : "none";
}
/** Page-level CTA: any event selling wins; otherwise any waitlist; otherwise neutral. */
export function ctaFor(events: { status: string }[]): CtaMode {
  if (events.some((e) => e.status === "SALES_OPEN")) return "book";
  if (events.some((e) => e.status === "WAITLIST_OPEN")) return "waitlist";
  return "none";
}
