import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totp: z.string().regex(/^\d{6}$/).optional(),
});
const nullableStr = z.string().nullable();
export const eventSchema = z.object({
  city: z.string().min(1), tag: nullableStr, blurb: nullableStr, colour: z.string().min(1),
  status: z.enum(["PROVISIONAL", "CONFIRMED", "WAITLIST_OPEN", "SALES_OPEN", "SALES_CLOSED", "CANCELLED"]),
  startDate: z.string().min(1), endDate: z.string().min(1),
  venue: nullableStr, gatesOpen: nullableStr, registrationCloses: nullableStr,
  distance: nullableStr, obstacles: nullableStr, waveTimes: nullableStr,
  experiences: z.array(z.string()),
});
export const TICKET_TIER_KEYS = ["solo", "squad", "glow", "family"] as const;
export const STUB_COLOURS = ["mint", "orange", "night", "lilac", "ink", "cream"] as const;
export const ticketSchema = z.object({
  name: z.string().min(1), description: z.string(),
  pricePaise: z.number().int().min(0).nullable(), gstMode: z.enum(["INCLUSIVE", "EXCLUSIVE"]),
  capacity: z.number().int().min(0).nullable(),
  minPerBooking: z.number().int().min(1), maxPerBooking: z.number().int().min(1),
  days: z.array(z.enum(["SAT", "SUN"])), salesOpen: nullableStr, salesClose: nullableStr,
  eligibility: z.string(), requiresDob: z.boolean(), active: z.boolean(),
  // Homepage "Ways in" presentation (optional: omitted fields are left unchanged)
  tierKey: z.enum(TICKET_TIER_KEYS).nullable().optional(),
  hook: z.string().trim().max(120).nullable().optional(),
  perks: z.array(z.string().trim().min(1).max(80)).max(4, "Up to 4 perk lines.").optional(),
  stubColour: z.enum(STUB_COLOURS).nullable().optional(),
  showOnHomepage: z.boolean().optional(), mostPicked: z.boolean().optional(), limited: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
}).refine((t) => t.maxPerBooking >= t.minPerBooking, { message: "Max per booking must be at least the minimum.", path: ["maxPerBooking"] });

export const SALE_BLOCK_MESSAGE = "Set a price and capacity before putting this ticket on sale.";
type Sellable = { pricePaise: number | null; capacity: number | null; salesOpen: unknown; salesClose: unknown; active: boolean };
export const ticketReady = (t: Omit<Sellable, "active">) => t.pricePaise != null && t.capacity != null && !!t.salesOpen && !!t.salesClose;
export function ticketStatus(t: Sellable): "Draft" | "Ready" | "On sale" {
  return !ticketReady(t) ? "Draft" : t.active ? "On sale" : "Ready";
}
export const faqSchema = z.object({ eventId: z.number().int().nullable(), question: z.string().min(1), answer: z.string().min(1), order: z.number().int() });
export const contentSchema = z.object({ key: z.string().min(1), body: z.string() });
export const refundSchema = z.object({ amountPaise: z.number().int().positive().optional(), reason: z.string().min(3) });
export const revealSchema = z.object({ reason: z.string().min(5) });
export const userSchema = z.object({ email: z.string().email(), password: z.string().min(10), role: z.enum(["OWNER", "MANAGER", "SUPPORT"]) });
