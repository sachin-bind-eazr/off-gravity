import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/payments/signature";
import { confirmPayment, markPaymentFailed } from "@/lib/booking/service";

type Evt = {
  event: string;
  payload?: {
    payment?: { entity?: { id: string; order_id: string } };
    refund?: { entity?: { id: string; payment_id: string; status: string } };
  };
};

export async function POST(req: Request) {
  const raw = await req.text();
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const sig = req.headers.get("x-razorpay-signature") ?? "";
  if (!secret || !verifyWebhookSignature(raw, sig, secret)) return NextResponse.json({ error: "BAD_SIGNATURE" }, { status: 400 });
  const eventId = req.headers.get("x-razorpay-event-id");
  if (!eventId) return NextResponse.json({ error: "NO_EVENT_ID" }, { status: 400 });
  const evt = JSON.parse(raw) as Evt;
  try {
    await db.webhookEvent.create({ data: { eventId, type: evt.event } }); // unique id: a duplicate throws
  } catch {
    return NextResponse.json({ ok: true, duplicate: true });
  }
  try {
    const p = evt.payload?.payment?.entity;
    if (evt.event === "payment.captured" && p) await confirmPayment(p.order_id, p.id, evt);
    else if (evt.event === "payment.failed" && p) await markPaymentFailed(p.order_id, evt);
    else if (evt.event.startsWith("refund.") && evt.payload?.refund?.entity) {
      const r = evt.payload.refund.entity;
      const pay = await db.payment.findUnique({ where: { razorpayPaymentId: r.payment_id } });
      if (pay) {
        await db.refund.updateMany({ where: { razorpayRefundId: r.id }, data: { status: r.status } });
        if (r.status === "processed") {
          await db.payment.update({ where: { id: pay.id }, data: { status: "REFUNDED" } });
          await db.booking.update({ where: { id: pay.bookingId }, data: { status: "REFUNDED" } });
        }
      }
    }
  } catch {
    await db.webhookEvent.delete({ where: { eventId } }).catch(() => {}); // let Razorpay retry
    return NextResponse.json({ error: "RETRY" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
