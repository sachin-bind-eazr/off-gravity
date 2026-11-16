import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { STATIC_TIERS } from "@/content/tiers";
export const dynamic = "force-dynamic";
const HEADERS = { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" };

type Out = {
  id: number | string; tierKey: string | null; name: string; hook: string | null; perks: string[]; stubColour: string | null;
  priceFromPaise: number | null; gstMode: "INCLUSIVE" | "EXCLUSIVE"; badge: "popular" | "limited" | null; mostPicked: boolean;
  sortOrder: number; code: string; purchasable: boolean;
};
const code = (i: number) => `T${String(i + 1).padStart(2, "0")}`;
const fallback = (): Out[] => STATIC_TIERS.map((t, i) => ({
  id: `static-${t.tierKey}`, tierKey: t.tierKey, name: t.name, hook: t.hook, perks: t.perks, stubColour: t.stubColour,
  priceFromPaise: null, gstMode: "INCLUSIVE", badge: t.badge, mostPicked: t.badge === "popular", sortOrder: t.sortOrder, code: code(i), purchasable: false,
}));

async function earlyBird() {
  const eb = await db.contentBlock.findUnique({ where: { key: "earlybird.hours" } }).catch(() => null);
  const n = eb ? Number(eb.body) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Public: homepage "Ways in" tiers for ONE event (?event=<slug>).
 * Root cause of the old "announced soon" message: an empty list was returned both when the DB was unreachable
 * and when no tier was flagged for the homepage. Now:
 *  - rows with visibility PREVIEW are shown (price TBA until set, never purchasable via this route);
 *  - DB unreachable / event has no tier rows at all -> static definitions (cards always show);
 *  - tier rows exist but every one is HIDDEN -> {tiers: [], hidden: true} (admin explicitly hid them).
 * Never exposes capacity, inventory or personal data.
 */
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("event");
  if (!slug) return NextResponse.json({ tiers: fallback() }, { headers: HEADERS });
  try {
    const ev = await db.event.findUnique({ where: { slug }, select: { id: true, status: true } });
    if (!ev) return NextResponse.json({ tiers: fallback() }, { headers: HEADERS });
    const rows = await db.ticketType.findMany({
      where: { eventId: ev.id, tierKey: { not: null } },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: { id: true, tierKey: true, name: true, hook: true, perks: true, stubColour: true, pricePaise: true, gstMode: true, mostPicked: true, limited: true, sortOrder: true, visibility: true, active: true, capacity: true, salesOpen: true, salesClose: true },
    });
    const earlyBirdHours = await earlyBird();
    if (rows.length === 0) return NextResponse.json({ tiers: fallback(), earlyBirdHours }, { headers: HEADERS });
    const shown = rows.filter((r) => r.visibility === "PREVIEW");
    if (shown.length === 0) return NextResponse.json({ tiers: [], hidden: true, earlyBirdHours }, { headers: HEADERS });
    const now = new Date();
    const tiers: Out[] = shown.map((t, i) => {
      const priced = t.pricePaise != null && t.pricePaise > 0;
      const inWindow = !!t.salesOpen && !!t.salesClose && t.salesOpen <= now && t.salesClose >= now;
      return {
        id: t.id, tierKey: t.tierKey, name: t.name, hook: t.hook, perks: t.perks.slice(0, 4), stubColour: t.stubColour,
        priceFromPaise: priced ? t.pricePaise : null, gstMode: t.gstMode,
        badge: t.limited ? "limited" : t.mostPicked ? "popular" : null, mostPicked: t.mostPicked, sortOrder: t.sortOrder, code: code(i),
        purchasable: ev.status === "SALES_OPEN" && t.active && priced && t.capacity != null && inWindow,
      };
    });
    return NextResponse.json({ tiers, earlyBirdHours }, { headers: HEADERS });
  } catch {
    return NextResponse.json({ tiers: fallback(), degraded: true }, { headers: HEADERS });
  }
}
