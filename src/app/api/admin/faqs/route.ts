import { db } from "@/lib/db";
import { handle, requireRole, audit } from "@/lib/admin/auth";
import { faqSchema } from "@/lib/schemas/admin";

export const POST = handle(async (req) => {
  const a = await requireRole(req, "content");
  const d = faqSchema.parse(await req.json());
  const f = await db.faq.create({ data: d });
  await audit(a.id, "create", "Faq", f.id, null, f);
  return Response.json({ id: f.id });
});
