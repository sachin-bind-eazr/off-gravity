import { db } from "@/lib/db";
import { handle, requireRole, audit, HttpError } from "@/lib/admin/auth";
import { revealSchema } from "@/lib/schemas/admin";

export const POST = handle(async (req, ctx) => {
  const a = await requireRole(req, "participants.emergency"); // Support is rejected here
  const id = Number((await ctx.params).id);
  const { reason } = revealSchema.parse(await req.json());
  const p = await db.participant.findUnique({ where: { id }, select: { emergencyPhone: true } });
  if (!p) throw new HttpError(404, "Participant not found.");
  await audit(a.id, "reveal_emergency_contact", "Participant", id, null, { reason }); // logged before returning
  return Response.json({ emergencyPhone: p.emergencyPhone });
});
