import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOnSale, eventAllowsSales } from "@/lib/booking/tickets-on-sale";
import { remaining } from "@/lib/booking/inventory";
import { sweepExpiredHolds } from "@/lib/booking/service";
import { TOUR } from "@/lib/tour";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await sweepExpiredHolds().catch(() => {});
    const events = await db.event.findMany({ include: { season: true, tickets: true }, orderBy: { startDate: "asc" } });
    const out = await Promise.all(events.map(async (e) => {
      const salesOpen = eventAllowsSales(e.status);
      const tickets = salesOpen
        ? await Promise.all(e.tickets.filter((t) => isOnSale(t)).map(async (t) => ({
            id: t.id, name: t.name, description: t.description, pricePaise: t.pricePaise, gstMode: t.gstMode,
            minPerBooking: t.minPerBooking, maxPerBooking: t.maxPerBooking, eligibility: t.eligibility,
            requiresDob: t.requiresDob, days: t.days, remaining: await remaining(t.id, t.capacity!),
          })))
        : [];
      return {
        slug: e.slug, city: e.city, code: e.cityCode, season: e.season.order,
        start: e.startDate.toISOString().slice(0, 10), end: e.endDate.toISOString().slice(0, 10),
        tag: e.tag, status: e.status, salesOpen, tickets,
      };
    }));
    return NextResponse.json({ events: out });
  } catch {
    // Database unreachable: still answer 200 with the static tour and no tickets, flagged so the UI can say so.
    const events = TOUR.map((t) => ({ slug: t.slug, city: t.city, code: t.code, season: t.season, start: t.start, end: t.end, tag: t.tag, status: "PROVISIONAL", salesOpen: false, tickets: [] }));
    return NextResponse.json({ events, degraded: true });
  }
}
