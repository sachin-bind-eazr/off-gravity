import { createHmac, timingSafeEqual } from "crypto";
function safeEq(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string, secret: string) {
  return safeEq(createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex"), signature);
}
export function verifyWebhookSignature(rawBody: string, signature: string, secret: string) {
  return safeEq(createHmac("sha256", secret).update(rawBody).digest("hex"), signature);
}
