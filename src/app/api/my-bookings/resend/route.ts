import { z } from "zod";
import { db } from "@/lib/db";
import { getCustomerEmail } from "@/lib/customer-session";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const email = await getCustomerEmail();
  if (!email) return Response.json({ error: "Sign in with your email code first." }, { status: 401 });
  const parsed = z.object({ reference: z.string().min(3) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Missing booking reference." }, { status: 400 });
  if (!(await rateLimit(`resend:${email}`, 5, 3600))) return Response.json({ error: "Too many requests. Try again later." }, { status: 429 });
  const b = await db.booking.findFirst({
    where: { reference: parsed.data.reference.toUpperCase(), leadEmail: { equals: email, mode: "insensitive" }, status: "CONFIRMED" },
    include: { event: true },
  });
  if (!b) return Response.json({ error: "No booking matches that email and reference. Check both, or find the reference in your confirmation email." }, { status: 404 });
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  await sendEmail({
    to: email, subject: `Your OFF GRAVITY booking ${b.reference}`,
    html: `<p>Booking <strong>${b.reference}</strong> for ${b.event.city} is confirmed.</p><p><a href="${site}/my-bookings">Open My bookings</a> to download your tickets.</p>`,
  });
  await db.emailNotification.create({ data: { bookingId: b.id, type: "resend_confirmation", status: "sent", attempts: 1 } });
  return Response.json({ ok: true });
}
