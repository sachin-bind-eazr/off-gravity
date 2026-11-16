import { db } from "@/lib/db";
import { handle, requireRole, audit, HttpError } from "@/lib/admin/auth";
import { eventSchema } from "@/lib/schemas/admin";

export const PUT = handle(async (req, ctx) => {
  const a = await requireRole(req, "events");
  const id = Number((await ctx.params).id);
  const before = await db.event.findUnique({ where: { id } });
  if (!before) throw new HttpError(404, "Event not found.");
  const d = eventSchema.parse(await req.json());
  const blank = (s: string | null) => (s && s.trim() ? s.trim() : null); // blank renders as [TBC] publicly
  const after = await db.event.update({
    where: { id },
    data: {
      city: d.city, tag: blank(d.tag), blurb: blank(d.blurb), colour: d.colour, status: d.status,
      startDate: new Date(d.startDate), endDate: new Date(d.endDate),
      venue: blank(d.venue), gatesOpen: blank(d.gatesOpen), registrationCloses: blank(d.registrationCloses),
      distance: blank(d.distance), obstacles: blank(d.obstacles), waveTimes: blank(d.waveTimes), experiences: d.experiences,
    },
  });
  await audit(a.id, "update", "Event", id, before, after);
  return Response.json({ ok: true });
});
