import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCustomerEmail } from "@/lib/customer-session";
import { receiptPdf } from "@/lib/tickets/pdf";
export async function GET(_: Request, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const email = await getCustomerEmail();
  const b = email ? await db.booking.findFirst({ where: { reference, leadEmail: email }, select: { id: true } }) : null;
  if (!b) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const pdf = await receiptPdf(reference);
  if (!pdf) return NextResponse.json({ error: "NOT_AVAILABLE" }, { status: 409 });
  return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${reference}-receipt.pdf"` } });
}
