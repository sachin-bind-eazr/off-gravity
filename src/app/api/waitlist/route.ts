import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { waitlistSchema } from "@/lib/schemas/waitlist";
import { upsertWaitlist, getThreshold, publicCount } from "@/lib/waitlist";
import { sendEmail } from "@/lib/email";
import { fail } from "@/lib/booking/http";

const TIER_LABEL: Record<string, string> = { solo: "Solo runner", squad: "Squad pack (4)", glow: "Glow Night pass", family: "Parent-child duo", undecided: "Not sure yet" };

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const d = waitlistSchema.parse(body);
    if (!(await rateLimit(`wl:ip:${clientIp(req)}`, 10, 600)) || !(await rateLimit(`wl:em:${d.email}`, 5, 600)))
      return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    // Honeypot filled: pretend success, store nothing.
    if (d.website && d.website.length > 0) return NextResponse.json({ ok: true });
    const ev = await db.event.findUnique({ where: { slug: d.eventSlug }, select: { id: true, city: true, cityCode: true, status: true, startDate: true, endDate: true } });
    if (!ev || ev.status === "CANCELLED" || ev.status === "SALES_CLOSED") return NextResponse.json({ error: "INVALID", issues: [{ path: ["eventSlug"], message: "Choose a city." }] }, { status: 400 });
    const r = await upsertWaitlist(ev.id, ev.cityCode, d);
    // Email policy: always on first signup; on a re-submit only if the chosen tier changed (repeat clicks never spam).
    if (r.created || r.tierChanged) {
      sendEmail({
        to: d.email,
        subject: `You're on the OFF GRAVITY ${ev.city} waitlist (${r.reference})`,
        html: `<p>${d.name ? `Hi ${esc(d.name)}, you're` : "You're"} in line for OFF GRAVITY ${esc(ev.city)}.</p><p>Reference: <strong>${r.reference}</strong><br/>Tier: ${esc(TIER_LABEL[r.tier])}<br/>Party size: ${r.partySize}</p><p>We'll message you before tickets open. Dates are provisional, subject to venue and permission confirmations.</p><p>Run. Bounce. Repeat.</p>`,
      }).catch(() => console.error("waitlist email failed"));
    }
    return NextResponse.json({
      ok: true, city: ev.city, reference: r.reference, duplicate: !r.created, tier: r.tier, partySize: r.partySize,
      dates: { start: ev.startDate.toISOString().slice(0, 10), end: ev.endDate.toISOString().slice(0, 10) },
    });
  } catch (e) { return fail(e); }
}

/** Public count for one city, only once it passes the admin threshold. */
export async function GET(req: Request) {
  try {
    const slug = new URL(req.url).searchParams.get("event");
    if (!slug) return NextResponse.json({ count: null });
    const ev = await db.event.findUnique({ where: { slug }, select: { id: true } });
    if (!ev) return NextResponse.json({ count: null });
    const [c, t] = await Promise.all([db.waitlistEntry.count({ where: { eventId: ev.id } }), getThreshold()]);
    return NextResponse.json({ count: publicCount(c, t) });
  } catch { return NextResponse.json({ count: null }); }
}
