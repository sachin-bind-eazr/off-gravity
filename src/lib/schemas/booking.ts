import { z } from "zod";
export const DayEnum = z.enum(["SAT", "SUN"]);
export const nameSchema = z.string().trim().min(2, "Enter the participant's full name.");
export const emailSchema = z.string().trim().email("Enter an email like name@example.com. Your ticket is sent here.");
export const mobileSchema = z.string().trim().regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number.");
export const participantSchema = z.object({
  name: nameSchema,
  email: emailSchema.optional(),
  phone: mobileSchema.optional(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date of birth.").optional(),
  emergencyPhone: mobileSchema.optional(),
});
export const consentSchema = z.literal(true, { message: "Accept the terms to continue." });
export const quoteRequestSchema = z.object({
  eventSlug: z.string().min(1),
  day: DayEnum,
  ticketTypeId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(20),
});
export const createRequestSchema = quoteRequestSchema
  .extend({
    idempotencyKey: z.string().min(8).max(100),
    participants: z.array(participantSchema).min(1).max(20),
    consent: consentSchema,
  })
  .superRefine((v, ctx) => {
    if (v.participants.length !== v.quantity)
      ctx.addIssue({ code: "custom", path: ["participants"], message: "Participant count must match quantity." });
    const lead = v.participants[0];
    if (lead) {
      if (!lead.email) ctx.addIssue({ code: "custom", path: ["participants", 0, "email"], message: "Enter an email like name@example.com. Your ticket is sent here." });
      if (!lead.phone) ctx.addIssue({ code: "custom", path: ["participants", 0, "phone"], message: "Enter a 10-digit Indian mobile number." });
      if (!lead.emergencyPhone) ctx.addIssue({ code: "custom", path: ["participants", 0, "emergencyPhone"], message: "Enter a 10-digit Indian mobile number." });
    }
  });
export const verifyRequestSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});
export type ParticipantInput = z.infer<typeof participantSchema>;
export type QuoteRequest = z.infer<typeof quoteRequestSchema>;
export type CreateRequest = z.infer<typeof createRequestSchema>;
