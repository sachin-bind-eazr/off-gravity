import { db } from "@/lib/db";
import { getCustomerEmail } from "@/lib/customer-session";

export const dynamic = "force-dynamic";
const NOT_FOUND = "No booking matches that email and reference. Check both, or find the reference in your confirmation email.";

export async function GET(req: Request) {
  const email = await getCustomerEmail();
  if (!email) return Response.json({ error: "Sign in with your email code first." }, { status: 401 });
  const ref = new URL(req.url).searchParams.get("ref")?.trim().toUpperCase();
  // Every query is filtered by the session's email on the server.
  const rows = await db.booking.findMany({
    where: { leadEmail: { equals: email, mode: "insensitive" }, ...(ref ? { reference: ref } : {}) },
    orderBy: { createdAt: "desc" },
    include: { event: true, ticketType: true, participants: { select: { id: true, name: true } }, payments: { select: { status: true } } },
  });
  if (ref && rows.length === 0) return Response.json({ error: NOT_FOUND }, { status: 404 });
  const now = Date.now();
  return Response.json({
    email,
    bookings: rows.map((b) => ({
      reference: b.reference, status: b.status, city: b.event.city, day: b.day,
      date: b.event.startDate.toISOString().slice(0, 10), entry: b.ticketType.name, quantity: b.quantity,
      participants: b.participants.map((p) => p.name), amountPaise: b.amountPaise,
      paymentStatus: b.payments.some((p) => p.status === "CAPTURED") ? "Verified" : b.payments.some((p) => p.status === "REFUNDED") ? "Refunded" : "Not paid",
      terms: b.policySnapshot, canResume: b.status === "PENDING" && b.holdExpiresAt.getTime() > now,
    })),
  });
}
