import { describe, it, expect } from "vitest";
import { can } from "./roles";
import { toCsv } from "./csv";
import { checkOtp, hashOtp, generateOtp } from "../otp";
import { ticketStatus, ticketReady } from "../schemas/admin";

describe("role guard matrix", () => {
  it("support cannot touch money, emergency contacts, events or tickets", () => {
    for (const p of ["bookings.money", "participants.emergency", "events", "tickets", "content", "users"] as const) expect(can("SUPPORT", p)).toBe(false);
    expect(can("SUPPORT", "bookings.view")).toBe(true);
    expect(can("SUPPORT", "bookings.email")).toBe(true);
  });
  it("manager manages everything except users; owner everything", () => {
    expect(can("MANAGER", "bookings.money")).toBe(true);
    expect(can("MANAGER", "users")).toBe(false);
    expect(can("OWNER", "users")).toBe(true);
  });
});

describe("otp", () => {
  const email = "a@b.com";
  const row = (code: string, over = {}) => ({ codeHash: hashOtp(email, code), expiresAt: new Date(Date.now() + 60_000), attempts: 0, ...over });
  it("generates 6 digits", () => expect(generateOtp()).toMatch(/^\d{6}$/));
  it("accepts the right code and rejects wrong/expired/locked", () => {
    expect(checkOtp(row("123456"), email, "123456")).toBe("ok");
    expect(checkOtp(row("123456"), email, "654321")).toBe("wrong");
    expect(checkOtp(row("123456", { expiresAt: new Date(Date.now() - 1) }), email, "123456")).toBe("expired");
    expect(checkOtp(row("123456", { attempts: 5 }), email, "123456")).toBe("locked");
    expect(checkOtp(null, email, "123456")).toBe("expired");
  });
  it("code is bound to the email", () => expect(checkOtp(row("123456"), "other@b.com", "123456")).toBe("wrong"));
});

describe("tickets and csv", () => {
  it("cannot be on sale without price, capacity and window", () => {
    expect(ticketReady({ pricePaise: null, capacity: 10, salesOpen: "x", salesClose: "y" })).toBe(false);
    expect(ticketStatus({ pricePaise: 100, capacity: 10, salesOpen: "x", salesClose: "y", active: true })).toBe("On sale");
    expect(ticketStatus({ pricePaise: 100, capacity: 10, salesOpen: "x", salesClose: "y", active: false })).toBe("Ready");
    expect(ticketStatus({ pricePaise: null, capacity: null, salesOpen: null, salesClose: null, active: true })).toBe("Draft");
  });
  it("csv escapes quotes and neutralises formulas", () => {
    expect(toCsv([{ a: '=1+1', b: 'x,"y"' }])).toBe('a,b\n\'=1+1,"x,""y"""');
  });
});
