import { db } from "@/lib/db";
import { handle, requireRole } from "@/lib/admin/auth";
import { toCsv, csvResponse } from "@/lib/admin/csv";
import { TIER_KEYS } from "@/lib/schemas/waitlist";
import { tierToEnum, enumToTier } from "@/lib/waitlist";

/** GET ?event=<id>&q=<search>[&export=1]. View: Support+; CSV export: Manager/Owner only. */
export const GET = handle(async (req) => {
  const sp = new URL(req.url).searchParams;
  const exporting = !!sp.get("export");
  await requireRole(req, exporting ? "waitlist.export" : "waitlist.view");
  const q = sp.get("q")?.trim();
  const eventId = sp.get("event") ? Number(sp.get("event")) : undefined;
  const tierQ = sp.get("tier");
  const tier = tierQ && (TIER_KEYS as readonly string[]).includes(tierQ) ? tierToEnum(tierQ as (typeof TIER_KEYS)[number]) : undefined;
  const where = {
    ...(eventId ? { eventId } : {}),
    ...(tier ? { tierInterest: tier } : {}),
    ...(q ? { OR: [{ email: { contains: q, mode: "insensitive" as const } }, { name: { contains: q, mode: "insensitive" as const } }, { whatsappNumber: { contains: q } }, { reference: { contains: q, mode: "insensitive" as const } }] } : {}),
  };
  const [total, rows] = await Promise.all([
    db.waitlistEntry.count({ where }),
    db.waitlistEntry.findMany({ where, orderBy: { createdAt: "desc" }, take: exporting ? 20000 : 200, include: { event: { select: { city: true } } } }),
  ]);
  const flat = rows.map((r) => ({
    id: r.id, reference: r.reference, city: r.event.city, email: r.email, name: r.name ?? "", whatsapp: r.whatsappNumber ?? "",
    tier: enumToTier(r.tierInterest), partySize: r.partySize, whatsappOptIn: r.whatsappOptIn ? "yes" : "no", source: r.source, joined: r.createdAt.toISOString(),
  }));
  if (exporting) return csvResponse("waitlist.csv", toCsv(flat));
  // Counts per tier per city (for pricing/capacity planning), unaffected by search/tier filters
  const grouped = await db.waitlistEntry.groupBy({ by: ["eventId", "tierInterest"], _count: { _all: true }, ...(eventId ? { where: { eventId } } : {}) });
  const tierCounts = grouped.map((g) => ({ eventId: g.eventId, tier: enumToTier(g.tierInterest), count: g._count._all }));
  return Response.json({ total, rows: flat, tierCounts });
});
