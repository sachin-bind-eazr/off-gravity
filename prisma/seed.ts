import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { TOUR } from "../src/lib/tour";
import { FAQ_SEED, fillCity } from "../src/lib/faq-seed";
import { TIER_SEED } from "../src/content/tiers-confirm";

const db = new PrismaClient();

const TICKETS = [
  { name: "Individual entry", description: "One participant, festival access and a race slot.", min: 1, max: 1, dob: false, eligibility: "" },
  { name: "Competitive race entry", description: "One participant in a timed competitive wave, ranked on the national leaderboard.", min: 1, max: 1, dob: false, eligibility: "" },
  { name: "Squad entry", description: "Race together as a squad.", min: 2, max: 6, dob: false, eligibility: "" },
  { name: "Family package", description: "For families racing and playing together.", min: 2, max: 5, dob: true, eligibility: "" },
  { name: "Kids entry", description: "Waves designed for younger participants.", min: 1, max: 4, dob: true, eligibility: "" },
];

async function main() {
  await db.season.upsert({ where: { id: 1 }, update: {}, create: { id: 1, name: "Season 1", order: 1 } });
  await db.season.upsert({ where: { id: 2 }, update: {}, create: { id: 2, name: "Season 2", order: 2 } });
  for (const t of TOUR) {
    const data = {
      city: t.city, cityCode: t.code, seasonId: t.season, startDate: new Date(t.start), endDate: new Date(t.end),
      tag: t.tag, colour: t.colour, status: "PROVISIONAL" as const,
      experiences: ["race", "movement", "recovery", "bazaar", "family", "glow"],
    };
    const ev = await db.event.upsert({ where: { slug: t.slug }, update: {}, create: { slug: t.slug, ...data } });
    if ((await db.ticketType.count({ where: { eventId: ev.id } })) === 0) {
      // Drafts: inactive, no price, capacity or sales window. Admin must complete them.
      await db.ticketType.createMany({
        data: TICKETS.map((k) => ({
          eventId: ev.id, name: k.name, description: k.description, minPerBooking: k.min, maxPerBooking: k.max,
          days: ["SAT", "SUN"] as ("SAT" | "SUN")[], requiresDob: k.dob, eligibility: k.eligibility, active: false,
        })),
      });
    }
    // Homepage "Ways in" tier drafts (idempotent by tierKey). Existing admin edits are never overwritten.
    for (const tier of TIER_SEED) {
      if (await db.ticketType.findFirst({ where: { eventId: ev.id, tierKey: tier.key }, select: { id: true } })) continue;
      await db.ticketType.create({
        data: {
          eventId: ev.id, name: tier.name, description: tier.hook, hook: tier.hook, perks: tier.perks, tierKey: tier.key, stubColour: tier.colour,
          minPerBooking: tier.min, maxPerBooking: tier.max, sortOrder: tier.sortOrder, days: ["SAT", "SUN"], requiresDob: tier.key === "family",
          eligibility: "", active: false, visibility: "PREVIEW", mostPicked: tier.badge === "popular", limited: tier.badge === "limited",
        },
      });
    }
    if ((await db.faq.count({ where: { eventId: ev.id } })) === 0) {
      await db.faq.createMany({ data: FAQ_SEED.map((f, i) => ({ eventId: ev.id, question: fillCity(f.q, t.city), answer: fillCity(f.a, t.city), order: i })) });
    }
  }
  await db.contentBlock.upsert({ where: { key: "hold_minutes" }, update: {}, create: { key: "hold_minutes", body: "15" } });
  const pw = process.env.ADMIN_SEED_PASSWORD;
  const email = process.env.ADMIN_SEED_EMAIL ?? "owner@example.com";
  if (pw) {
    await db.adminUser.upsert({ where: { email }, update: {}, create: { email, passwordHash: await argon2.hash(pw), role: "OWNER" } });
    console.log(`Seeded dev Owner admin: ${email} (TOTP must be set up on first login)`);
  }
  console.log("Seed complete.");
}
main().finally(() => db.$disconnect());
