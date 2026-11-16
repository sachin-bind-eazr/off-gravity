import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePage } from "@/lib/admin/page-guard";
import { can } from "@/lib/admin/roles";
import { Panel, Table } from "@/components/admin/ui";
import { money } from "@/components/admin/format";
import { BookingActions } from "@/components/admin/BookingActions";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const a = await requirePage("bookings.view");
  const id = Number((await params).id);
  if (!id) notFound();
  const b = await db.booking.findUnique({
    where: { id },
    include: {
      event: true, ticketType: true, emails: true,
      participants: { select: { id: true, name: true, email: true, phone: true, dob: true, checkedInAt: true } }, // no emergencyPhone
      payments: { include: { refunds: true } },
    },
  });
  if (!b) notFound();
  const audits = await db.auditLog.findMany({ where: { entity: "Booking", entityId: String(id) }, orderBy: { at: "desc" }, take: 50 });
  const remaining = b.payments.reduce((s, p) => s + (p.status === "CAPTURED" || p.status === "PARTIALLY_REFUNDED" ? p.amountPaise - p.refunds.reduce((x, r) => x + r.amountPaise, 0) : 0), 0);
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-extrabold">{b.reference} <span className="text-lg font-semibold text-text-muted">{b.status}</span></h1>
      <Panel title="Summary">
        <p>{b.event.city}, {b.day === "SAT" ? "Saturday" : "Sunday"} · {b.ticketType.name} · {b.quantity} participant(s) · {money(b.amountPaise)}</p>
        <p className="text-text-muted">{b.leadName} · {b.leadEmail} · created {b.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC</p>
      </Panel>
      <BookingActions id={b.id} status={b.status} refundable={remaining} canMoney={can(a.role, "bookings.money")} canEmail={can(a.role, "bookings.email")} />
      <Panel title="Participants">
        <Table><thead><tr className="border-b border-ink/10"><th className="py-2">Name</th><th>Email</th><th>Phone</th><th>DOB</th><th>Checked in</th></tr></thead>
          <tbody>{b.participants.map((p) => <tr key={p.id} className="border-b border-ink/5"><td className="py-2">{p.name}</td><td>{p.email}</td><td>{p.phone}</td><td>{p.dob?.toISOString().slice(0, 10)}</td><td>{p.checkedInAt ? "Yes" : ""}</td></tr>)}</tbody></Table>
      </Panel>
      <Panel title="Payments and refunds">
        {b.payments.length === 0 ? <p className="text-text-muted">No payment attempts.</p> : (
          <Table><thead><tr className="border-b border-ink/10"><th className="py-2">Order</th><th>Payment</th><th>Status</th><th>Amount</th><th>Refunds</th></tr></thead>
            <tbody>{b.payments.map((p) => <tr key={p.id} className="border-b border-ink/5"><td className="py-2">{p.razorpayOrderId}</td><td>{p.razorpayPaymentId ?? "n/a"}</td><td>{p.status}</td><td>{money(p.amountPaise)}</td>
              <td>{p.refunds.map((r) => `${money(r.amountPaise)} ${r.status} (${r.reason})`).join("; ") || "None"}</td></tr>)}</tbody></Table>
        )}
      </Panel>
      <Panel title="Emails sent">
        {b.emails.length === 0 ? <p className="text-text-muted">None yet.</p> : <ul>{b.emails.map((e) => <li key={e.id}>{e.type}: {e.status} ({e.attempts} attempt{e.attempts === 1 ? "" : "s"})</li>)}</ul>}
      </Panel>
      <Panel title="Audit trail">
        {audits.length === 0 ? <p className="text-text-muted">No admin actions yet.</p> : <ul>{audits.map((l) => <li key={l.id}>{l.at.toISOString().slice(0, 16).replace("T", " ")} · {l.action} · admin #{l.actorId ?? "system"}</li>)}</ul>}
      </Panel>
    </div>
  );
}
