import { db } from "@/lib/db";
import { handle, requireRole, audit, HttpError } from "@/lib/admin/auth";
import { refundSchema } from "@/lib/schemas/admin";
import { adminRefund } from "@/lib/admin/refund";
import { sendEmail } from "@/lib/email";

/** POST /api/admin/bookings/:id/(cancel|refund|resend) */
export const POST = handle(async (req, ctx) => {
  const { id: rawId, action } = await ctx.params;
  const id = Number(rawId);
  const booking = await db.booking.findUnique({ where: { id }, include: { payments: true, event: true } });
  if (!booking) throw new HttpError(404, "Booking not found.");

  if (action === "resend") {
    const a = await requireRole(req, "bookings.email");
    if (booking.status !== "CONFIRMED") throw new HttpError(400, "Only confirmed bookings have a confirmation email.");
    await sendEmail({ to: booking.leadEmail, subject: `Your OFF GRAVITY booking ${booking.reference}`, html: `<p>Booking <strong>${booking.reference}</strong> for ${booking.event.city} is confirmed. Open My bookings on the site to download your tickets.</p>` });
    await db.emailNotification.create({ data: { bookingId: id, type: "resend_confirmation", status: "sent", attempts: 1 } });
    await audit(a.id, "resend_email", "Booking", id, null, null);
    return Response.json({ ok: true });
  }

  const a = await requireRole(req, "bookings.money"); // Support can never reach this
  if (action === "refund" || action === "cancel") {
    const body = refundSchema.parse(await req.json());
    const captured = booking.payments.find((p) => p.status === "CAPTURED" || p.status === "PARTIALLY_REFUNDED");
    let result: unknown = null;
    if (captured) {
      try { result = await adminRefund(captured.id, action === "cancel" ? undefined : body.amountPaise, body.reason, a.id); }
      catch (e) { throw new HttpError(400, (e as Error).message); }
    } else if (action === "cancel" && booking.status !== "CANCELLED") {
      // Unpaid booking: release held seats.
      await db.$transaction([
        db.booking.update({ where: { id }, data: { status: "CANCELLED" } }),
        db.$executeRaw`UPDATE "TicketInventory" SET held = GREATEST(held - ${booking.quantity}, 0) WHERE "ticketTypeId" = ${booking.ticketTypeId} AND day = ${booking.day}::"Day"`,
      ]);
    } else throw new HttpError(400, "There is no captured payment to refund.");
    await audit(a.id, action, "Booking", id, { status: booking.status }, { result, reason: body.reason });
    return Response.json({ ok: true });
  }
  throw new HttpError(404, "Unknown action.");
});
