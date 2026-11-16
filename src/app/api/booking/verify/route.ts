import { NextResponse } from "next/server";
import { verifyRequestSchema } from "@/lib/schemas/booking";
import { verifyCheckoutSignature } from "@/lib/payments/signature";
import { confirmPayment } from "@/lib/booking/service";
import { createCustomerSession } from "@/lib/customer-session";
import { fail } from "@/lib/booking/http";
export async function POST(req: Request) {
  try {
    const v = verifyRequestSchema.parse(await req.json());
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
    // Signature is verified before anything touches the database.
    if (!verifyCheckoutSignature(v.razorpay_order_id, v.razorpay_payment_id, v.razorpay_signature, secret))
      return NextResponse.json({ error: "BAD_SIGNATURE" }, { status: 400 });
    const r = await confirmPayment(v.razorpay_order_id, v.razorpay_payment_id);
    await createCustomerSession(r.leadEmail);
    return NextResponse.json({ status: "CONFIRMED", reference: r.reference });
  } catch (e) { return fail(e); }
}
