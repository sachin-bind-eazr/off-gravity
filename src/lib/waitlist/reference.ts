import { randomInt } from "node:crypto";
/** Unambiguous charset: no 0/O, 1/I/L. */
export const REF_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function makeWaitlistReference(cityCode: string): string {
  let s = "";
  for (let i = 0; i < 5; i++) s += REF_CHARS[randomInt(REF_CHARS.length)];
  return `WL-${cityCode.toUpperCase()}-${s}`;
}
export const WAITLIST_REF_RE = /^WL-[A-Z]{3}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/;
