import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { checkOtp } from "@/lib/otp";
import { createCustomerSession } from "@/lib/customer-session";

const schema = z.object({ email: z.string().trim().toLowerCase().email(), code: z.string().regex(/^\d{6}$/) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter the 6-digit code." }, { status: 400 });
  const { email, code } = parsed.data;
  if (!(await rateLimit(`otpv:ip:${clientIp(req)}`, 30, 3600))) return Response.json({ error: "Too many attempts. Try again later." }, { status: 429 });

  const row = await db.otpCode.findFirst({ where: { email }, orderBy: { createdAt: "desc" } });
  const result = checkOtp(row, email, code);
  if (result === "ok" && row) {
    await db.otpCode.deleteMany({ where: { email } });
    await createCustomerSession(email);
    return Response.json({ ok: true });
  }
  if (row && result === "wrong") await db.otpCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
  const msg = result === "locked" ? "Too many wrong codes. Request a new code." : result === "expired" ? "That code has expired. Request a new one." : "That code isn't right. Check it and try again.";
  return Response.json({ error: msg }, { status: 400 });
}
