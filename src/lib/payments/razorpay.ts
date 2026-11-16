import "server-only";
import Razorpay from "razorpay";
export function razorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID, key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) throw new Error("Razorpay keys not configured");
  return new Razorpay({ key_id, key_secret });
}
export const isTestMode = () => (process.env.RAZORPAY_KEY_ID ?? "").startsWith("rzp_test_");
/** Test stub: only ever active outside production and never with live keys. */
export function stubEnabled() {
  return process.env.RAZORPAY_TEST_STUB === "1" && process.env.NODE_ENV !== "production" && !(process.env.RAZORPAY_KEY_ID ?? "").startsWith("rzp_live_");
}
export async function createOrder(amountPaise: number, receipt: string) {
  if (stubEnabled()) return { id: `order_stub_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`, amount: amountPaise, currency: "INR", receipt };
  return razorpay().orders.create({ amount: amountPaise, currency: "INR", receipt });
}
export async function refundPayment(paymentId: string, amountPaise?: number, notes?: Record<string, string>) {
  return razorpay().payments.refund(paymentId, { ...(amountPaise ? { amount: amountPaise } : {}), notes });
}
