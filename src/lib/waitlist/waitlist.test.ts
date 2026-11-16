import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({ db: null as any, store: null as any, refs: null as any, state: { nextId: 1, collideNext: 0 } }));
type Row = { id: number; reference: string; tierInterest: string; name: string | null; whatsappNumber: string | null; partySize: number };
const store = new Map<string, Row>();
const refs = new Set<string>();
const db = {
  waitlistEntry: {
    findUnique: async ({ where }: { where: { eventId_email: { eventId: number; email: string } } }) => store.get(`${where.eventId_email.eventId}:${where.eventId_email.email}`) ?? null,
    create: async ({ data }: { data: Record<string, any> }) => {
      if (h.state.collideNext > 0) { h.state.collideNext--; throw { code: "P2002" }; }
      if (refs.has(data.reference)) throw { code: "P2002" };
      if (store.has(`${data.eventId}:${data.email}`)) throw { code: "P2002" };
      const row = { id: h.state.nextId++, ...data } as Row; store.set(`${data.eventId}:${data.email}`, row); refs.add(data.reference); return row;
    },
    update: async ({ where, data }: { where: { id: number }; data: Record<string, any> }) => {
      const row = [...store.values()].find((r) => r.id === where.id)!; Object.assign(row, data); return row;
    },
  },
  contentBlock: { findUnique: async () => null },
};
h.db = db;
vi.mock("@/lib/db", () => ({ get db() { return h.db; } }));

import { waitlistSchema } from "@/lib/schemas/waitlist";
import { upsertWaitlist, publicCount } from "./index";
import { WAITLIST_REF_RE, makeWaitlistReference } from "./reference";
import { ctaFor, ctaMode } from "@/lib/cta";
import { can } from "@/lib/admin/roles";

const ok = { eventSlug: "mumbai", email: "  Fan@Example.com ", consent: true as const };

describe("waitlistSchema", () => {
  it("normalises email and defaults source", () => {
    const r = waitlistSchema.parse(ok);
    expect(r.email).toBe("fan@example.com");
    expect(r.source).toBe("site");
  });
  it("treats empty optional strings as absent", () => {
    const r = waitlistSchema.parse({ ...ok, name: "", whatsappNumber: "" });
    expect(r.name).toBeUndefined();
    expect(r.whatsappNumber).toBeUndefined();
  });
  it("rejects bad email, bad mobile and missing consent", () => {
    expect(waitlistSchema.safeParse({ ...ok, email: "nope" }).success).toBe(false);
    expect(waitlistSchema.safeParse({ ...ok, whatsappNumber: "12345" }).success).toBe(false);
    expect(waitlistSchema.safeParse({ ...ok, consent: false }).success).toBe(false);
    expect(waitlistSchema.safeParse({ ...ok, consent: undefined }).success).toBe(false);
  });
  it("accepts +91 mobile numbers", () => {
    expect(waitlistSchema.safeParse({ ...ok, whatsappNumber: "+91 98765 43210".replace(/ /g, "") }).success).toBe(true);
  });
  it("passes a filled honeypot through so the route can silently drop it", () => {
    expect(waitlistSchema.parse({ ...ok, website: "spam" }).website).toBe("spam");
  });
});

describe("upsertWaitlist", () => {
  beforeEach(() => { store.clear(); refs.clear(); h.state.nextId = 1; h.state.collideNext = 0; });
  it("creates a new entry with a WL-<CITY>-<5> reference and sane defaults", async () => {
    const r = await upsertWaitlist(1, "MUM", waitlistSchema.parse(ok));
    expect(r.created).toBe(true);
    expect(r.reference).toMatch(WAITLIST_REF_RE);
    expect(r.reference.startsWith("WL-MUM-")).toBe(true);
    expect(r.tier).toBe("undecided");
    expect(r.partySize).toBe(1);
  });
  it("re-submit updates tier/party/whatsapp and returns the SAME reference", async () => {
    const first = await upsertWaitlist(1, "MUM", waitlistSchema.parse(ok));
    const second = await upsertWaitlist(1, "MUM", waitlistSchema.parse({ ...ok, tier: "squad", partySize: 4, whatsappOptIn: true }));
    expect(second.created).toBe(false);
    expect(second.reference).toBe(first.reference);
    expect(second.tierChanged).toBe(true);
    expect(store.size).toBe(1);
    const row = [...store.values()][0] as any;
    expect(row.tierInterest).toBe("SQUAD"); expect(row.partySize).toBe(4); expect(row.whatsappOptIn).toBe(true);
  });
  it("identical re-submit reports tierChanged=false (so no repeat email)", async () => {
    await upsertWaitlist(1, "MUM", waitlistSchema.parse({ ...ok, tier: "solo" }));
    const again = await upsertWaitlist(1, "MUM", waitlistSchema.parse({ ...ok, tier: "solo" }));
    expect(again.tierChanged).toBe(false);
  });
  it("retries when a generated reference collides", async () => {
    h.state.collideNext = 3;
    const r = await upsertWaitlist(1, "BLR", waitlistSchema.parse(ok));
    expect(r.created).toBe(true);
  });
  it("same email in a different city is a separate entry", async () => {
    const a = await upsertWaitlist(1, "MUM", waitlistSchema.parse(ok));
    const b = await upsertWaitlist(2, "DEL", waitlistSchema.parse(ok));
    expect(a.reference).not.toBe(b.reference);
    expect(store.size).toBe(2);
  });
  it("stores only the last 10 digits of WhatsApp", async () => {
    await upsertWaitlist(1, "MUM", waitlistSchema.parse({ ...ok, whatsappNumber: "+919876543210" }));
    expect([...store.values()][0].whatsappNumber).toBe("9876543210");
  });
  it("rethrows non-unique errors", async () => {
    const orig = db.waitlistEntry.create;
    db.waitlistEntry.create = async () => { throw new Error("db down"); };
    await expect(upsertWaitlist(1, "MUM", waitlistSchema.parse(ok))).rejects.toThrow("db down");
    db.waitlistEntry.create = orig;
  });
});

describe("waitlist reference + new schema fields", () => {
  it("uses only the unambiguous charset", () => {
    for (let i = 0; i < 200; i++) expect(makeWaitlistReference("jai")).toMatch(WAITLIST_REF_RE);
  });
  it("defaults old callers (email+consent only) to undecided/1/no whatsapp", () => {
    const r = waitlistSchema.parse(ok);
    expect([r.tier, r.partySize, r.whatsappOptIn]).toEqual(["undecided", 1, false]);
  });
  it("validates tier and party size", () => {
    expect(waitlistSchema.safeParse({ ...ok, tier: "vip" }).success).toBe(false);
    expect(waitlistSchema.safeParse({ ...ok, partySize: 0 }).success).toBe(false);
    expect(waitlistSchema.safeParse({ ...ok, partySize: 9 }).success).toBe(false);
    expect(waitlistSchema.parse({ ...ok, partySize: "4", tier: "squad" }).partySize).toBe(4);
  });
});

describe("public count threshold", () => {
  it("hides counts below the threshold", () => {
    expect(publicCount(99, 100)).toBeNull();
    expect(publicCount(100, 100)).toBe(100);
    expect(publicCount(0, 0)).toBe(0);
  });
});

describe("cta mode", () => {
  it("maps status to mode", () => {
    expect(ctaMode({ status: "WAITLIST_OPEN" })).toBe("waitlist");
    expect(ctaMode({ status: "SALES_OPEN" })).toBe("book");
    expect(ctaMode({ status: "PROVISIONAL" })).toBe("waitlist");
    expect(ctaMode({ status: "CONFIRMED" })).toBe("waitlist");
    expect(ctaMode({ status: "CANCELLED" })).toBe("none");
    expect(ctaMode({ status: "SALES_CLOSED" })).toBe("none");
  });
  it("sales beats waitlist beats none", () => {
    expect(ctaFor([{ status: "PROVISIONAL" }, { status: "WAITLIST_OPEN" }, { status: "SALES_OPEN" }])).toBe("book");
    expect(ctaFor([{ status: "PROVISIONAL" }, { status: "WAITLIST_OPEN" }])).toBe("waitlist");
    expect(ctaFor([{ status: "PROVISIONAL" }])).toBe("waitlist");
    expect(ctaFor([{ status: "CANCELLED" }, { status: "SALES_CLOSED" }])).toBe("none");
  });
});

describe("waitlist permissions", () => {
  it("support can view but not export; manager and owner can export", () => {
    expect(can("SUPPORT", "waitlist.view")).toBe(true);
    expect(can("SUPPORT", "waitlist.export")).toBe(false);
    expect(can("MANAGER", "waitlist.export")).toBe(true);
    expect(can("OWNER", "waitlist.export")).toBe(true);
  });
});

import { ticketSchema } from "@/lib/schemas/admin";
describe("ticketSchema homepage fields", () => {
  const base = { name: "Solo runner", description: "", pricePaise: null, gstMode: "INCLUSIVE" as const, capacity: null, minPerBooking: 1, maxPerBooking: 1, days: ["SAT" as const], salesOpen: null, salesClose: null, eligibility: "", requiresDob: false, active: false };
  it("old payloads (no homepage fields) still validate and leave fields undefined", () => {
    const r = ticketSchema.parse(base);
    expect(r.perks).toBeUndefined(); expect(r.showOnHomepage).toBeUndefined();
  });
  it("rejects more than 4 perk lines and unknown stub colours/tiers", () => {
    expect(ticketSchema.safeParse({ ...base, perks: ["a", "b", "c", "d", "e"] }).success).toBe(false);
    expect(ticketSchema.safeParse({ ...base, stubColour: "lime" }).success).toBe(false);
    expect(ticketSchema.safeParse({ ...base, tierKey: "vip" }).success).toBe(false);
    expect(ticketSchema.safeParse({ ...base, perks: ["a", "b", "c", "d"], stubColour: "night", tierKey: "glow", showOnHomepage: true, mostPicked: true, sortOrder: 5, hook: "x" }).success).toBe(true);
  });
});
