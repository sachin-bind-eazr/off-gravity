import { db } from "@/lib/db";
import { handle, requireRole, audit } from "@/lib/admin/auth";

export const POST = handle(async (req) => {
  const a = await requireRole(req, "tickets");
  const { eventId } = (await req.json()) as { eventId: number };
  const t = await db.ticketType.create({
    data: { eventId: Number(eventId), name: "New ticket", description: "", days: ["SAT", "SUN"], active: false },
  });
  await audit(a.id, "create", "TicketType", t.id, null, t);
  return Response.json({ id: t.id });
});
