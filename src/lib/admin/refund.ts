import "server-only";
import Razorpay from "razorpay";
import { db } from "../db";

/** Thin wrapper over the Razorpay Refunds API. Webhook (refund.processed) later finalises status. */
export async function adminRefund(paymentId: number, amountPaise: number | undefined, reason: string, actorId: number) {
  const p = await db.payment.findUnique({ where: { id: paymentId }, include: { refunds: true, booking: true } });
  if (!p || !p.razorpayPaymentId) throw new Error("No captured payment to refund.");
  const refunded = p.refunds.reduce((s, r) => s + r.amountPaise, 0);
  const amount = amountPaise ?? p.amountPaise - refunded;
  if (amount <= 0 || amount > p.amountPaise - refunded) throw new Error("Refund amount exceeds what is left to refund.");
  const rz = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID ?? "", key_secret: process.env.RAZORPAY_KEY_SECRET ?? "" });
  const r = await rz.payments.refund(p.razorpayPaymentId, { amount, notes: { reason, booking: p.booking.reference } });
  const full = refunded + amount >= p.amountPaise;
  await db.$transaction(async (tx) => {
    await tx.refund.create({ data: { paymentId: p.id, razorpayRefundId: r.id, amountPaise: amount, status: String(r.status ?? "pending"), reason, actorId } });
    await tx.payment.update({ where: { id: p.id }, data: { status: full ? "REFUNDED" : "PARTIALLY_REFUNDED" } });
    if (full) {
      await tx.booking.update({ where: { id: p.bookingId }, data: { status: "REFUNDED" } });
      if (p.booking.status === "CONFIRMED") {
        await tx.$executeRaw`UPDATE "TicketInventory" SET sold = GREATEST(sold - ${p.booking.quantity}, 0) WHERE "ticketTypeId" = ${p.booking.ticketTypeId} AND day = ${p.booking.day}::"Day"`;
      }
    }
  });
  return { refundId: r.id, amount, full };
}
