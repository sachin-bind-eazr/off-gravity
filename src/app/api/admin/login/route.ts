import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/schemas/admin";
import { verifyPassword, verifyTotp, newTotpSecret, totpUri, startAdminSession, audit } from "@/lib/admin/auth";

const BAD = "Email, password or code is incorrect.";

export async function POST(req: Request) {
  const p = loginSchema.safeParse(await req.json().catch(() => null));
  if (!p.success) return Response.json({ error: BAD }, { status: 400 });
  const email = p.data.email.toLowerCase();
  if (!(await rateLimit(`login:ip:${clientIp(req)}`, 20, 900)) || !(await rateLimit(`login:email:${email}`, 8, 900))) {
    return Response.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  }
  const u = await db.adminUser.findUnique({ where: { email } });
  if (!u || !(await verifyPassword(u.passwordHash, p.data.password))) return Response.json({ error: BAD }, { status: 401 });

  if (!u.totpEnabled) {
    // First sign-in: enrol an authenticator app, then confirm with a code.
    const secret = u.totpSecret ?? newTotpSecret();
    if (!u.totpSecret) await db.adminUser.update({ where: { id: u.id }, data: { totpSecret: secret } });
    if (!p.data.totp) return Response.json({ needsTotpSetup: true, secret, uri: totpUri(u.email, secret) });
    if (!verifyTotp(secret, p.data.totp)) return Response.json({ error: BAD, needsTotpSetup: true, secret, uri: totpUri(u.email, secret) }, { status: 401 });
    await db.adminUser.update({ where: { id: u.id }, data: { totpEnabled: true } });
  } else {
    if (!p.data.totp) return Response.json({ needsTotp: true });
    if (!u.totpSecret || !verifyTotp(u.totpSecret, p.data.totp)) return Response.json({ error: BAD, needsTotp: true }, { status: 401 });
  }
  await startAdminSession({ id: u.id, email: u.email, role: u.role });
  await audit(u.id, "login", "AdminUser", u.id, null, null);
  return Response.json({ ok: true });
}
