import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";
import { computeQuote } from "./pricing";
import { makeReference, REFERENCE_RE } from "./reference";
import { verifyCheckoutSignature, verifyWebhookSignature } from "../payments/signature";
import { createRequestSchema, mobileSchema, emailSchema } from "../schemas/booking";
import { makeTicketToken, verifyTicketToken } from "../tickets/token";

describe("pricing", () => {
  it("GST exclusive adds 18%", () => {
    expect(computeQuote(100000, 2, "EXCLUSIVE")).toEqual({ subtotalPaise: 200000, taxPaise: 36000, feesPaise: 0, totalPaise: 236000 });
  });
  it("GST inclusive keeps total", () => {
    const q = computeQuote(118000, 1, "INCLUSIVE");
    expect(q.totalPaise).toBe(118000);
    expect(q.taxPaise).toBe(18000);
    expect(q.subtotalPaise + q.taxPaise).toBe(118000);
  });
});

describe("reference", () => {
  it("matches OG-<CITY>-<5>", () => {
    for (const c of ["MUM", "BLR", "DEL", "CHD", "JAI", "STR"]) expect(makeReference(c)).toMatch(REFERENCE_RE);
  });
});

describe("signatures", () => {
  const secret = "s3cret";
  it("verifies checkout signature", () => {
    const sig = createHmac("sha256", secret).update("order_1|pay_1").digest("hex");
    expect(verifyCheckoutSignature("order_1", "pay_1", sig, secret)).toBe(true);
    expect(verifyCheckoutSignature("order_1", "pay_2", sig, secret)).toBe(false);
    expect(verifyCheckoutSignature("order_1", "pay_1", "bad", secret)).toBe(false);
  });
  it("verifies webhook signature", () => {
    const body = '{"event":"payment.captured"}';
    const sig = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyWebhookSignature(body, sig, secret)).toBe(true);
    expect(verifyWebhookSignature(body + " ", sig, secret)).toBe(false);
  });
});

describe("ticket token", () => {
  it("round-trips and rejects tampering", () => {
    const t = makeTicketToken("OG-MUM-ABCDE", 1);
    expect(verifyTicketToken(t)).toEqual({ reference: "OG-MUM-ABCDE", index: 1 });
    expect(verifyTicketToken(t.slice(0, -2) + "xx")).toBeNull();
  });
});

describe("schemas", () => {
  const base = {
    eventSlug: "mumbai", day: "SAT", ticketTypeId: 1, quantity: 1, idempotencyKey: "abcdefgh12",
    participants: [{ name: "Asha Rao", email: "a@b.com", phone: "9876543210", emergencyPhone: "+919876543211" }], consent: true,
  };
  it("accepts valid", () => expect(createRequestSchema.safeParse(base).success).toBe(true));
  it("rejects missing consent", () => expect(createRequestSchema.safeParse({ ...base, consent: false }).success).toBe(false));
  it("rejects count mismatch", () => expect(createRequestSchema.safeParse({ ...base, quantity: 2 }).success).toBe(false));
  it("validates mobile and email", () => {
    expect(mobileSchema.safeParse("5876543210").success).toBe(false);
    expect(mobileSchema.safeParse("+91 9876543210").success).toBe(true);
    expect(emailSchema.safeParse("nope").success).toBe(false);
  });
});
