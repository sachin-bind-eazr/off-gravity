import "server-only";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { db } from "@/lib/db";
const rupees = (p: number) => `INR ${(p / 100).toFixed(2)}`;
function collect(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((res) => {
    const c: Buffer[] = [];
    doc.on("data", (d: Buffer) => c.push(d));
    doc.on("end", () => res(Buffer.concat(c)));
    doc.end();
  });
}
const load = (reference: string) =>
  db.booking.findUnique({ where: { reference }, include: { event: true, ticketType: true, participants: true, payments: true } });

export async function ticketPdf(reference: string): Promise<Buffer | null> {
  const b = await load(reference);
  if (!b || b.status !== "CONFIRMED") return null;
  const doc = new PDFDocument({ size: "A5", margin: 36 });
  const done = collect(doc);
  for (let i = 0; i < b.participants.length; i++) {
    const p = b.participants[i];
    if (i) doc.addPage();
    doc.fontSize(24).text("OFF GRAVITY").fontSize(10).text("by The Great Inflate Run").moveDown();
    const date = b.day === "SAT" ? b.event.startDate : b.event.endDate;
    doc.fontSize(16).text(`${b.event.city} - ${b.day === "SAT" ? "Saturday" : "Sunday"} ${date.toDateString()}`);
    doc.fontSize(11).text("Dates are provisional, subject to venue and permission confirmations.").moveDown();
    doc.text(`Reference: ${b.reference}`).text(`Entry: ${b.ticketType.name}`).text(`Participant: ${p.name} (${i + 1} of ${b.participants.length})`).moveDown();
    doc.image(await QRCode.toBuffer(p.ticketToken, { width: 220, margin: 1 }), { width: 180 });
  }
  return done;
}
export async function receiptPdf(reference: string): Promise<Buffer | null> {
  const b = await load(reference);
  if (!b || b.status === "PENDING") return null;
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const done = collect(doc);
  doc.fontSize(22).text("OFF GRAVITY - Receipt").moveDown();
  doc.fontSize(12).text(`Reference: ${b.reference}`).text(`Event: ${b.event.city}, ${b.day}`).text(`Entry: ${b.ticketType.name} x ${b.quantity}`)
    .text(`Tax: ${rupees(b.taxPaise)}`).text(`Total: ${rupees(b.amountPaise)}`)
    .text(`Payment id: ${b.payments.find((p) => p.status === "CAPTURED")?.razorpayPaymentId ?? "n/a"}`).moveDown()
    .text(`Terms at booking: ${b.policySnapshot ?? ""}`);
  return done;
}
