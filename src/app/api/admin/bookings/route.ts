import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { handle, requireRole } from "@/lib/admin/auth";
import { toCsv, csvResponse } from "@/lib/admin/csv";

function bookingWhere(sp: URLSearchParams): Prisma.BookingWhereInput {
  const q = sp.get("q")?.trim();
  const w: Prisma.BookingWhereInput = {};
  if (q) w.OR = [
    { reference: { contains: q, mode: "insensitive" } }, { leadEmail: { contains: q, mode: "insensitive" } }, { leadName: { contains: q, mode: "insensitive" } },
    { participants: { some: { phone: { contains: q } } } },
  ];
  if (sp.get("city")) w.event = { slug: sp.get("city")! };
  if (sp.get("day") === "SAT" || sp.get("day") === "SUN") w.day = sp.get("day") as "SAT" | "SUN";
  if (sp.get("ticket")) w.ticketTypeId = Number(sp.get("ticket"));
  if (sp.get("status")) w.status = sp.get("status") as never;
  return w;
}

export const GET = handle(async (req) => {
  await requireRole(req, "bookings.view");
  const sp = new URL(req.url).searchParams;
  const rows = await db.booking.findMany({ where: bookingWhere(sp), orderBy: { createdAt: "desc" }, take: sp.get("export") ? 10000 : 200, include: { event: true, ticketType: true } });
  if (sp.get("export")) {
    await requireRole(req, "bookings.view");
    return csvResponse("bookings.csv", toCsv(rows.map((b) => ({
      reference: b.reference, status: b.status, city: b.event.city, day: b.day, ticket: b.ticketType.name, quantity: b.quantity,
      amountRupees: b.amountPaise / 100, leadName: b.leadName, leadEmail: b.leadEmail, createdAt: b.createdAt.toISOString(),
    }))));
  }
  return Response.json(rows.map((b) => ({ id: b.id, reference: b.reference, status: b.status, city: b.event.city, day: b.day, ticket: b.ticketType.name, quantity: b.quantity, amountPaise: b.amountPaise, leadName: b.leadName, leadEmail: b.leadEmail })));
});
