import Link from "next/link";
import { db } from "@/lib/db";
import { requirePage } from "@/lib/admin/page-guard";
import { can } from "@/lib/admin/roles";
import { Panel, inputCls, btnPrimary } from "@/components/admin/ui";
import { ParticipantsTable } from "@/components/admin/ParticipantsTable";

export default async function Page({ searchParams }: { searchParams: Promise<{ event?: string; q?: string }> }) {
  const a = await requirePage("participants.view");
  const sp = await searchParams;
  const events = await db.event.findMany({ orderBy: { startDate: "asc" }, select: { id: true, city: true } });
  const q = sp.q?.trim();
  const rows = await db.participant.findMany({
    where: {
      booking: { status: "CONFIRMED", ...(sp.event ? { eventId: Number(sp.event) } : {}) },
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {}),
    },
    select: { id: true, name: true, email: true, phone: true, booking: { select: { reference: true, day: true, event: { select: { city: true } } } } },
    orderBy: { id: "asc" }, take: 500,
  });
  const exportQs = new URLSearchParams({ export: "1", ...(sp.event ? { event: sp.event } : {}), ...(q ? { q } : {}) }).toString();
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-extrabold">Participants</h1>
      <Panel>
        <form className="flex flex-wrap gap-3" method="get">
          <select name="event" defaultValue={sp.event ?? ""} className={inputCls + " max-w-56"} aria-label="Event"><option value="">All events</option>{events.map((e) => <option key={e.id} value={e.id}>{e.city}</option>)}</select>
          <input name="q" defaultValue={sp.q} className={inputCls + " max-w-80"} placeholder="Name, email or phone" aria-label="Search" />
          <button className={btnPrimary}>Search</button>
          <a className="self-center font-bold underline" href={`/api/admin/participants?${exportQs}`}>Export CSV for check-in</a>
        </form>
      </Panel>
      <Panel>
        <ParticipantsTable canReveal={can(a.role, "participants.emergency")} rows={rows.map((p) => ({ id: p.id, name: p.name, email: p.email ?? "", phone: p.phone ?? "", reference: p.booking.reference, city: p.booking.event.city, day: p.booking.day }))} />
        <p className="mt-3 text-sm text-text-muted">Emergency contacts are hidden. Revealing one asks for a reason and is logged. <Link className="underline" href="/admin/bookings">Bookings</Link></p>
      </Panel>
    </div>
  );
}
