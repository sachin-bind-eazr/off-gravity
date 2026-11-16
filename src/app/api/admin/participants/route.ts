import { db } from "@/lib/db";
import { handle, requireRole } from "@/lib/admin/auth";
import { toCsv, csvResponse } from "@/lib/admin/csv";

// Emergency contacts are NEVER selected here; see /[id]/reveal.
export const GET = handle(async (req) => {
  await requireRole(req, "participants.view");
  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.trim();
  const rows = await db.participant.findMany({
    where: {
      booking: { status: "CONFIRMED", ...(sp.get("event") ? { eventId: Number(sp.get("event")) } : {}) },
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {}),
    },
    select: { id: true, name: true, email: true, phone: true, dob: true, checkedInAt: true, booking: { select: { reference: true, day: true, event: { select: { city: true } }, ticketType: { select: { name: true } } } } },
    orderBy: { id: "asc" }, take: 5000,
  });
  const flat = rows.map((p) => ({ id: p.id, name: p.name, email: p.email ?? "", phone: p.phone ?? "", dob: p.dob?.toISOString().slice(0, 10) ?? "", reference: p.booking.reference, city: p.booking.event.city, day: p.booking.day, ticket: p.booking.ticketType.name, checkedIn: p.checkedInAt ? "yes" : "" }));
  if (sp.get("export")) return csvResponse("participants.csv", toCsv(flat));
  return Response.json(flat);
});
