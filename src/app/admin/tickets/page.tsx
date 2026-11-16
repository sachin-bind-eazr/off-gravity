import Link from "next/link";
import { db } from "@/lib/db";
import { requirePage } from "@/lib/admin/page-guard";
import { TicketEditor, NewTicketButton } from "@/components/admin/TicketEditor";

const local = (d: Date | null) => (d ? d.toISOString().slice(0, 16) : "");

export default async function Page({ searchParams }: { searchParams: Promise<{ event?: string }> }) {
  await requirePage("tickets");
  const sp = await searchParams;
  const events = await db.event.findMany({ orderBy: { startDate: "asc" }, select: { id: true, city: true } });
  const eventId = Number(sp.event ?? events[0]?.id);
  const tickets = eventId ? await db.ticketType.findMany({ where: { eventId }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }) : [];
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-extrabold">Tickets</h1>
      <nav aria-label="Event" className="flex flex-wrap gap-2">
        {events.map((e) => <Link key={e.id} href={`/admin/tickets?event=${e.id}`} className={`rounded-full px-4 py-2 font-bold ${e.id === eventId ? "bg-ink text-white" : "bg-white"}`}>{e.city}</Link>)}
      </nav>
      {eventId ? <NewTicketButton eventId={eventId} /> : null}
      {tickets.length === 0 && <p className="text-text-muted">No tickets for this event yet.</p>}
      {tickets.map((t) => (
        <TicketEditor key={t.id} ticket={{
          id: t.id, name: t.name, description: t.description, priceRupees: t.pricePaise == null ? "" : String(t.pricePaise / 100),
          gstMode: t.gstMode, capacity: t.capacity == null ? "" : String(t.capacity), minPerBooking: t.minPerBooking, maxPerBooking: t.maxPerBooking,
          days: t.days, salesOpen: local(t.salesOpen), salesClose: local(t.salesClose), eligibility: t.eligibility, requiresDob: t.requiresDob, active: t.active,
          tierKey: t.tierKey ?? "", hook: t.hook ?? "", perks: t.perks, stubColour: t.stubColour ?? "", showOnHomepage: t.visibility === "PREVIEW", mostPicked: t.mostPicked, limited: t.limited, sortOrder: t.sortOrder,
        }} />
      ))}
    </div>
  );
}
