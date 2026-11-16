import { createHmac, randomBytes, timingSafeEqual } from "crypto";
const secret = () => process.env.TICKET_SIGNING_SECRET ?? "dev-ticket-secret";
const sign = (body: string) => createHmac("sha256", secret()).update(body).digest("base64url").slice(0, 22);
/** Signed opaque token for the QR code; never the raw booking reference alone. */
export function makeTicketToken(reference: string, index: number): string {
  const body = `${reference}.${index}.${randomBytes(4).toString("hex")}`;
  return `${Buffer.from(body).toString("base64url")}.${sign(body)}`;
}
export function verifyTicketToken(token: string): { reference: string; index: number } | null {
  const [b, sig] = token.split(".");
  if (!b || !sig) return null;
  const body = Buffer.from(b, "base64url").toString();
  const exp = sign(body);
  if (exp.length !== sig.length || !timingSafeEqual(Buffer.from(exp), Buffer.from(sig))) return null;
  const [reference, index] = body.split(".");
  return { reference, index: Number(index) };
}
