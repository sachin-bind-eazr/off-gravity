import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePage } from "@/lib/admin/page-guard";
import { Panel, Table, inputCls, btnPrimary } from "@/components/admin/ui";
import { money } from "@/components/admin/format";

type SP = { q?: string; city?: string; day?: string; ticket?: string; status?: string };
const STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "REFUNDED", "EXPIRED"];

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  await requirePage("bookings.view");
  const sp = await searchParams;
  const where: Prisma.BookingWhereInput = {};
  const q = sp.q?.trim();
  if (q) where.OR = [
    { reference: { contains: q, mode: "insensitive" } }, { leadEmail: { contains: q, mode: "insensitive" } },
    { leadName: { contains: q, mode: "insensitive" } }, { participants: { some: { phone: { contains: q } } } },
  ];
  if (sp.city) where.event = { slug: sp.city };
  if (sp.day === "SAT" || sp.day === "SUN") where.day = sp.day;
  if (sp.ticket) where.ticketTypeId = Number(sp.ticket);
  if (sp.status) where.status = sp.status as never;
  const [rows, events, tickets] = await Promise.all([
    db.booking.findMany({ where, orderBy: { createdAt: "desc" }, take: 100, include: { event: true, ticketType: true } }),
    db.event.findMany({ select: { slug: true, city: true }, orderBy: { startDate: "asc" } }),
    db.ticketType.findMany({ select: { id: true, name: true, event: { select: { city: true } } } }),
  ]);
  const exportQs = new URLSearchParams({ ...(sp as Record<string, string>), export: "1" }).toString();
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-extrabold">Bookings</h1>
      <Panel>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6" method="get">
          <input name="q" defaultValue={sp.q} className={inputCls + " lg:col-span-2"} placeholder="Reference, email, phone or name" aria-label="Search" />
          <select name="city" defaultValue={sp.city ?? ""} className={inputCls} aria-label="City"><option value="">All cities</option>{events.map((e) => <option key={e.slug} value={e.slug}>{e.city}</option>)}</select>
          <select name="day" defaultValue={sp.day ?? ""} className={inputCls} aria-label="Day"><option value="">Both days</option><option value="SAT">Saturday</option><option value="SUN">Sunday</option></select>
          <select name="ticket" defaultValue={sp.ticket ?? ""} className={inputCls} aria-label="Ticket"><option value="">All tickets</option>{tickets.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.event.city})</option>)}</select>
          <select name="status" defaultValue={sp.status ?? ""} className={inputCls} aria-label="Status"><option value="">Any status</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
          <div className="flex gap-3 sm:col-span-2 lg:col-span-6"><button className={btnPrimary}>Search</button><a className="self-center font-bold underline" href={`/api/admin/bookings?${exportQs}`}>Export CSV</a></div>
        </form>
      </Panel>
      <Panel>
        {rows.length === 0 ? <p className="text-text-muted">No bookings match.</p> : (
          <Table>
            <thead><tr className="border-b border-ink/10"><th className="py-2">Reference</th><th>Name</th><th>City</th><th>Day</th><th>Ticket</th><th>Qty</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>{rows.map((b) => (
              <tr key={b.id} className="border-b border-ink/5">
                <td className="py-2"><Link className="font-bold underline" href={`/admin/bookings/${b.id}`}>{b.reference}</Link></td>
                <td>{b.leadName}<br /><span className="text-sm text-text-muted">{b.leadEmail}</span></td>
                <td>{b.event.city}</td><td>{b.day}</td><td>{b.ticketType.name}</td><td>{b.quantity}</td><td>{money(b.amountPaise)}</td><td>{b.status}</td>
              </tr>))}</tbody>
          </Table>
        )}
      </Panel>
    </div>
  );
}
