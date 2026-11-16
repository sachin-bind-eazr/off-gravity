import { db } from "@/lib/db";
import type { WaitlistTier } from "@prisma/client";
import type { WaitlistInput, TierKey } from "@/lib/schemas/waitlist";
import { makeWaitlistReference } from "./reference";

export const DEFAULT_THRESHOLD = 100;
export async function getThreshold(): Promise<number> {
  const b = await db.contentBlock.findUnique({ where: { key: "waitlist.threshold" } }).catch(() => null);
  const n = Number(b?.body);
  return Number.isFinite(n) && n >= 0 && b?.body.trim() ? Math.floor(n) : DEFAULT_THRESHOLD;
}
/** Public count: null until the count reaches the admin threshold (low numbers hurt credibility). */
export function publicCount(count: number, threshold: number): number | null {
  return count >= threshold ? count : null;
}
export const tierToEnum = (t: TierKey): WaitlistTier => t.toUpperCase() as WaitlistTier;
export const enumToTier = (t: WaitlistTier): TierKey => t.toLowerCase() as TierKey;
const cleanPhone = (n?: string) => n?.replace(/\D/g, "").slice(-10) ?? null;

export type WaitlistResult = { created: boolean; reference: string; tierChanged: boolean; tier: TierKey; partySize: number };

type Existing = { id: number; reference: string; tierInterest: WaitlistTier; name: string | null; whatsappNumber: string | null };

/**
 * One entry per (eventId,email). First submit creates (with a collision-safe reference);
 * a re-submit UPDATES tier/party/whatsapp/name and returns the SAME reference.
 */
export async function upsertWaitlist(eventId: number, cityCode: string, d: WaitlistInput): Promise<WaitlistResult> {
  const tierInterest = tierToEnum(d.tier);
  const update = async (existing: Existing): Promise<WaitlistResult> => {
    const tierChanged = existing.tierInterest !== tierInterest;
    const row = await db.waitlistEntry.update({
      where: { id: existing.id },
      data: {
        tierInterest, partySize: d.partySize, whatsappOptIn: d.whatsappOptIn,
        name: d.name ?? existing.name, whatsappNumber: cleanPhone(d.whatsappNumber) ?? existing.whatsappNumber,
      },
    });
    return { created: false, reference: row.reference, tierChanged, tier: d.tier, partySize: row.partySize };
  };
  const found = await db.waitlistEntry.findUnique({ where: { eventId_email: { eventId, email: d.email } } });
  if (found) return update(found);
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const row = await db.waitlistEntry.create({
        data: {
          eventId, email: d.email, name: d.name ?? null, whatsappNumber: cleanPhone(d.whatsappNumber), consent: true, source: d.source,
          tierInterest, partySize: d.partySize, whatsappOptIn: d.whatsappOptIn, reference: makeWaitlistReference(cityCode),
        },
      });
      return { created: true, reference: row.reference, tierChanged: false, tier: d.tier, partySize: row.partySize };
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e;
      // Either the reference collided (retry with a new one) or a concurrent request created this (event,email) first.
      const again = await db.waitlistEntry.findUnique({ where: { eventId_email: { eventId, email: d.email } } });
      if (again) return update(again);
    }
  }
  throw new Error("Could not allocate a waitlist reference");
}
export async function waitlistCounts(): Promise<Record<number, number>> {
  const rows = await db.waitlistEntry.groupBy({ by: ["eventId"], _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.eventId, r._count._all]));
}
