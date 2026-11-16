import { z } from "zod";
export const nameSchema = z.string().trim().min(2, "Enter the participant's full name.");
export const emailSchema = z.string().trim().email("Enter an email like name@example.com. Your ticket is sent here.");
export const mobileSchema = z.string().trim().regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number.");
export const dobSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date of birth.");
export type PField = "name" | "email" | "phone" | "emergencyPhone" | "dob";
export function validateField(f: PField, v: string, requiresDob: boolean): string | null {
  const s = f === "name" ? nameSchema : f === "email" ? emailSchema : f === "dob" ? dobSchema : mobileSchema;
  if (f === "dob" && !requiresDob) return null;
  const r = s.safeParse(v ?? "");
  return r.success ? null : r.error.issues[0].message;
}
export type P = { name: string; email: string; phone: string; emergencyPhone: string; dob: string };
export const emptyP = (): P => ({ name: "", email: "", phone: "", emergencyPhone: "", dob: "" });
export function validateParticipants(ps: P[], requiresDob: boolean, consent: boolean) {
  const errs: Record<string, string> = {};
  ps.forEach((p, i) => {
    const fields: PField[] = i === 0 ? ["name", "email", "phone", "emergencyPhone"] : ["name"];
    if (requiresDob) fields.push("dob");
    fields.forEach((f) => { const e = validateField(f, p[f], requiresDob); if (e) errs[`${i}.${f}`] = e; });
  });
  if (!consent) errs.consent = "Accept the terms to continue.";
  return errs;
}
