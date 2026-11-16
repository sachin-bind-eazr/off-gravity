import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { generateOtp, hashOtp, OTP_TTL_MS } from "@/lib/otp";
import { sendEmail } from "@/lib/email";

const schema = z.object({ email: z.string().trim().toLowerCase().email(), reference: z.string().trim().optional() });
const GENERIC = { ok: true, message: "If that email has bookings, we've sent a 6-digit code. It's valid for 10 minutes." };

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  const { email } = parsed.data;
  const ok = (await rateLimit(`otp:email:${email}`, 5, 3600)) && (await rateLimit(`otp:ip:${clientIp(req)}`, 20, 3600));
  if (!ok) return Response.json({ error: "Too many attempts. Try again in an hour." }, { status: 429 });

  const has = await db.booking.findFirst({ where: { leadEmail: { equals: email, mode: "insensitive" } }, select: { id: true } });
  if (has) {
    const code = generateOtp();
    await db.otpCode.deleteMany({ where: { email } });
    await db.otpCode.create({ data: { email, codeHash: hashOtp(email, code), expiresAt: new Date(Date.now() + OTP_TTL_MS) } });
    await sendEmail({
      to: email, subject: "Your OFF GRAVITY sign-in code",
      html: `<p>Your code is <strong style="font-size:24px;letter-spacing:4px">${code}</strong>.</p><p>It's valid for 10 minutes. If you didn't ask for it, ignore this email.</p>`,
    }).catch(() => undefined);
  }
  return Response.json(GENERIC); // identical either way
}
