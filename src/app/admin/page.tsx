import { db } from "@/lib/db";
import { requirePage } from "@/lib/admin/page-guard";
import { can } from "@/lib/admin/roles";
import { Panel } from "@/components/admin/ui";
import { money } from "@/components/admin/format";

export default async function Overview({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const a = await requirePage("bookings.view");
  const sp = await searchParams;
  if (!can(a.role, "overview")) {
    return <Panel title="Welcome"><p>{sp.denied ? "You don't have access to that page. " : ""}Use Bookings to search and help customers.</p></Panel>;
  }
  // Every figure comes from verified (captured) payments only.
  const [confirmed, pending, participants, captured, refunds, byCityRaw, byTicketRaw, openTickets, cities, tickets] = await Promise.all([
    db.booking.count({ where: { status: "CONFIRMED" } }),
    db.booking.count({ where: { status: "PENDING", holdExpiresAt: { gt: new Date() } } }),
    db.participant.count({ where: { booking: { status: "CONFIRMED" } } }),
    db.payment.aggregate({ _sum: { amountPaise: true }, where: { status: { in: ["CAPTURED", "PARTIALLY_REFUNDED", "REFUNDED"] } } }),
    db.refund.aggregate({ _sum: { amountPaise: true } }),
    db.booking.groupBy({ by: ["eventId"], where: { status: "CONFIRMED" }, _count: true, _sum: { quantity: true } }),
    db.booking.groupBy({ by: ["ticketTypeId"], where: { status: "CONFIRMED" }, _count: true, _sum: { quantity: true } }),
    db.ticketType.count({ where: { active: true } }),
    db.event.findMany({ select: { id: true, city: true } }),
    db.ticketType.findMany({ select: { id: true, name: true, event: { select: { city: true } } } }),
  ]);
  const cityName = new Map(cities.map((c) => [c.id, c.city]));
  const ticketName = new Map(tickets.map((t) => [t.id, `${t.name} (${t.event.city})`]));
  const stats = [
    ["Confirmed bookings", String(confirmed)], ["Pending payments", String(pending)], ["Participants", String(participants)],
    ["Revenue collected", money(captured._sum.amountPaise ?? 0)], ["Refunds", money(refunds._sum.amountPaise ?? 0)],
  ];
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-extrabold">Overview</h1>
      {openTickets === 0 && <p className="rounded-xl bg-lilac-tint px-4 py-3 font-bold">Sales haven&apos;t opened. No ticket is on sale yet, so every figure below is honestly zero.</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map(([k, v]) => <Panel key={k}><p className="text-sm text-text-muted">{k}</p><p className="text-3xl font-extrabold">{v}</p></Panel>)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Bookings by city">
          {byCityRaw.length === 0 ? <p className="text-text-muted">No confirmed bookings yet.</p> :
            <ul className="grid gap-2">{byCityRaw.map((r) => <li key={r.eventId} className="flex justify-between"><span>{cityName.get(r.eventId)}</span><strong>{r._count} bookings · {r._sum.quantity} people</strong></li>)}</ul>}
        </Panel>
        <Panel title="Sales per ticket type">
          {byTicketRaw.length === 0 ? <p className="text-text-muted">No confirmed bookings yet.</p> :
            <ul className="grid gap-2">{byTicketRaw.map((r) => <li key={r.ticketTypeId} className="flex justify-between gap-3"><span>{ticketName.get(r.ticketTypeId)}</span><strong>{r._sum.quantity}</strong></li>)}</ul>}
        </Panel>
      </div>
    </div>
  );
}
