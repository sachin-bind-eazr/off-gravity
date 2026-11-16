import { db } from "@/lib/db";
import { handle, requireRole, audit } from "@/lib/admin/auth";
import { contentSchema } from "@/lib/schemas/admin";

export const PUT = handle(async (req) => {
  const a = await requireRole(req, "content");
  const d = contentSchema.parse(await req.json());
  const before = await db.contentBlock.findUnique({ where: { key: d.key } });
  const after = await db.contentBlock.upsert({ where: { key: d.key }, create: d, update: { body: d.body } });
  await audit(a.id, "update", "ContentBlock", d.key, before, after);
  return Response.json({ ok: true });
});
