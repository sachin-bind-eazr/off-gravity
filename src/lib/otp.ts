import { createHash, randomInt, timingSafeEqual } from "crypto";
export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export function generateOtp(): string { return String(randomInt(0, 1_000_000)).padStart(6, "0"); }
export function hashOtp(email: string, code: string): string {
  return createHash("sha256").update(`${process.env.SESSION_SECRET ?? "dev-only-secret"}:${email.toLowerCase()}:${code}`).digest("hex");
}
export type OtpRow = { codeHash: string; expiresAt: Date; attempts: number };
export type OtpResult = "ok" | "expired" | "locked" | "wrong";
/** Pure check used by the verify route and unit tests. */
export function checkOtp(row: OtpRow | null, email: string, code: string, now = new Date()): OtpResult {
  if (!row || row.expiresAt < now) return "expired";
  if (row.attempts >= OTP_MAX_ATTEMPTS) return "locked";
  const a = Buffer.from(row.codeHash), b = Buffer.from(hashOtp(email, code));
  return a.length === b.length && timingSafeEqual(a, b) ? "ok" : "wrong";
}
