import { NextResponse } from "next/server";
import { db } from "@/lib/db";
/** Public, minimal: no names, emails or phone numbers. Used by the payment screen and /book?resume=. */
export async function GET(_: Request, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const b = await db.booking
    .findUnique({ where: { reference: reference.toUpperCase() }, select: { status: true, holdExpiresAt: true, day: true, quantity: true, amountPaise: true, ticketTypeId: true, event: { select: { slug: true } } } })
    .catch(() => null);
  if (!b) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ status: b.status, holdExpiresAt: b.holdExpiresAt.toISOString(), eventSlug: b.event.slug, day: b.day, ticketTypeId: b.ticketTypeId, quantity: b.quantity, amountPaise: b.amountPaise });
}
