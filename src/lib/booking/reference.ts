import { randomInt } from "crypto";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function makeReference(cityCode: string): string {
  let s = "";
  for (let i = 0; i < 5; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return `OG-${cityCode}-${s}`;
}
export const REFERENCE_RE = /^OG-(MUM|BLR|DEL|CHD|JAI|STR)-[A-Z2-9]{5}$/;
