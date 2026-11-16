import "server-only";
import { db } from "@/lib/db";
import { refundPayment } from "./razorpay";
/** Starts a refund; final status arrives via refund.* webhook. Caller must have role-checked. */
export async function startRefund(bookingId: number, amountPaise: number | undefined, reason: string, actorId: number) {
  const pay = await db.payment.findFirst({ where: { bookingId, status: "CAPTURED" } });
  if (!pay?.razorpayPaymentId) throw new Error("No captured payment");
  const amt = amountPaise ?? pay.amountPaise;
  if (amt <= 0 || amt > pay.amountPaise) throw new Error("Invalid refund amount");
  const r = await refundPayment(pay.razorpayPaymentId, amt, { reason });
  return db.refund.create({ data: { paymentId: pay.id, razorpayRefundId: r.id, amountPaise: amt, status: r.status ?? "created", reason, actorId } });
}
