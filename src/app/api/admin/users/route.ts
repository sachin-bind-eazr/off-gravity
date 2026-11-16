import { db } from "@/lib/db";
import { handle, requireRole, audit, hashPassword, HttpError } from "@/lib/admin/auth";
import { userSchema } from "@/lib/schemas/admin";

export const POST = handle(async (req) => {
  const a = await requireRole(req, "users"); // Owner only
  const d = userSchema.parse(await req.json());
  if (await db.adminUser.findUnique({ where: { email: d.email.toLowerCase() } })) throw new HttpError(400, "An admin with that email already exists.");
  const u = await db.adminUser.create({ data: { email: d.email.toLowerCase(), passwordHash: await hashPassword(d.password), role: d.role } });
  await audit(a.id, "create", "AdminUser", u.id, null, { email: u.email, role: u.role });
  return Response.json({ id: u.id });
});
