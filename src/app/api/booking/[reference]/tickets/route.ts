import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCustomerEmail } from "@/lib/customer-session";
import { makeTicketToken } from "@/lib/tickets/token";
export async function GET(_: Request, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const email = await getCustomerEmail();
  const b = email ? await db.booking.findFirst({ where: { reference, leadEmail: email, status: "CONFIRMED" }, include: { participants: { orderBy: { id: "asc" } } } }) : null;
  if (!b) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ tickets: b.participants.map((p, i) => ({ name: p.name, token: makeTicketToken(reference, i) })) });
}
