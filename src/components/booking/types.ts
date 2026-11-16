export type Day = "SAT" | "SUN";
export type TicketDTO = { id: number; name: string; description: string; pricePaise: number; gstMode: string; minPerBooking: number; maxPerBooking: number; eligibility: string; requiresDob: boolean; days: Day[]; remaining: { SAT: number | null; SUN: number | null } };
export type EventDTO = { slug: string; city: string; code: string; season: number; start: string; end: string; tag: string | null; status: string; salesOpen?: boolean; tickets: TicketDTO[] };
export type Quote = { subtotalPaise: number; taxPaise: number; feesPaise: number; totalPaise: number; remaining?: number | null };
export const inr = (paise: number) => "₹" + (paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const shortDates = (s: string, e: string) => { const a = new Date(s + "T00:00:00Z"), b = new Date(e + "T00:00:00Z"); return `${a.getUTCDate()}–${b.getUTCDate()} ${M[b.getUTCMonth()]}`; };
export const dayDate = (s: string, day: Day) => { const d = new Date(s + "T00:00:00Z"); if (day === "SUN") d.setUTCDate(d.getUTCDate() + 1); return `${day === "SAT" ? "Saturday" : "Sunday"} ${d.getUTCDate()} ${M[d.getUTCMonth()]}`; };
export const STEPS = ["City", "Day", "Entry", "Participants", "Review", "Payment", "Confirmed"] as const;
