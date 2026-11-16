import { db } from "@/lib/db";
import { handle, requireRole, audit, HttpError } from "@/lib/admin/auth";
import { faqSchema } from "@/lib/schemas/admin";

export const PUT = handle(async (req, ctx) => {
  const a = await requireRole(req, "content");
  const id = Number((await ctx.params).id);
  const before = await db.faq.findUnique({ where: { id } });
  if (!before) throw new HttpError(404, "FAQ not found.");
  const after = await db.faq.update({ where: { id }, data: faqSchema.parse(await req.json()) });
  await audit(a.id, "update", "Faq", id, before, after);
  return Response.json({ ok: true });
});

export const DELETE = handle(async (req, ctx) => {
  const a = await requireRole(req, "content");
  const id = Number((await ctx.params).id);
  const before = await db.faq.findUnique({ where: { id } });
  if (!before) throw new HttpError(404, "FAQ not found.");
  await db.faq.delete({ where: { id } });
  await audit(a.id, "delete", "Faq", id, before, null);
  return Response.json({ ok: true });
});
