import { db } from "@/lib/db";
import { handle, requireRole, audit, HttpError } from "@/lib/admin/auth";
import { ticketSchema, ticketReady, SALE_BLOCK_MESSAGE } from "@/lib/schemas/admin";

export const PUT = handle(async (req, ctx) => {
  const a = await requireRole(req, "tickets");
  const id = Number((await ctx.params).id);
  const before = await db.ticketType.findUnique({ where: { id } });
  if (!before) throw new HttpError(404, "Ticket not found.");
  const d = ticketSchema.parse(await req.json());
  // Server-side rule: cannot go on sale without price, capacity and sales window.
  if (d.active && !ticketReady({ pricePaise: d.pricePaise, capacity: d.capacity, salesOpen: d.salesOpen, salesClose: d.salesClose })) {
    throw new HttpError(400, SALE_BLOCK_MESSAGE);
  }
  if (d.salesOpen && d.salesClose && new Date(d.salesClose) <= new Date(d.salesOpen)) throw new HttpError(400, "Sales close must be after sales open.");
  const after = await db.ticketType.update({
    where: { id },
    data: {
      name: d.name, description: d.description, pricePaise: d.pricePaise, gstMode: d.gstMode, capacity: d.capacity,
      minPerBooking: d.minPerBooking, maxPerBooking: d.maxPerBooking, days: d.days,
      salesOpen: d.salesOpen ? new Date(d.salesOpen) : null, salesClose: d.salesClose ? new Date(d.salesClose) : null,
      eligibility: d.eligibility, requiresDob: d.requiresDob, active: d.active,
      ...(d.tierKey !== undefined && { tierKey: d.tierKey }),
      ...(d.hook !== undefined && { hook: d.hook?.trim() ? d.hook.trim() : null }),
      ...(d.perks !== undefined && { perks: d.perks.filter((x) => x.trim()) }),
      ...(d.stubColour !== undefined && { stubColour: d.stubColour }),
      ...(d.showOnHomepage !== undefined && { visibility: d.showOnHomepage ? "PREVIEW" as const : "HIDDEN" as const }),
      ...(d.limited !== undefined && { limited: d.limited }),
      ...(d.mostPicked !== undefined && { mostPicked: d.mostPicked }),
      ...(d.sortOrder !== undefined && { sortOrder: d.sortOrder }),
    },
  });
  await audit(a.id, "update", "TicketType", id, before, after);
  return Response.json({ ok: true });
});
