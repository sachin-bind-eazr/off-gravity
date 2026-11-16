import "server-only";
import { db } from "@/lib/db";
import { computeQuote } from "./pricing";
import { isOnSale, eventAllowsSales, getHoldMinutes } from "./tickets-on-sale";
import { reserve, releaseHold, convertHoldToSold, addSold, remaining } from "./inventory";
import { makeReference } from "./reference";
import { BookingError } from "./errors";
import { createOrder } from "@/lib/payments/razorpay";
import { makeTicketToken } from "@/lib/tickets/token";
import type { CreateRequest, QuoteRequest } from "@/lib/schemas/booking";
import { enqueueConfirmation } from "@/lib/jobs/queue";

export { BookingError };
const keyId = () => process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID ?? "";

async function loadSellable(req: QuoteRequest) {
  const event = await db.event.findUnique({ where: { slug: req.eventSlug } });
  const ticket = await db.ticketType.findUnique({ where: { id: req.ticketTypeId } });
  if (!event || !ticket || ticket.eventId !== event.id) throw new BookingError("NOT_FOUND", 404);
  if (!eventAllowsSales(event.status) || !isOnSale(ticket) || !ticket.days.includes(req.day)) throw new BookingError("NOT_ON_SALE", 409);
  if (req.quantity < ticket.minPerBooking || req.quantity > ticket.maxPerBooking) throw new BookingError("BAD_QUANTITY", 400);
  return { event, ticket };
}

/** Price always recomputed from the database. */
export async function quote(req: QuoteRequest) {
  const { ticket } = await loadSellable(req);
  const q = computeQuote(ticket.pricePaise!, req.quantity, ticket.gstMode);
  return { ...q, remaining: (await remaining(ticket.id, ticket.capacity!))[req.day] };
}

/** Releases seats held by bookings whose hold ran out. Run lazily so it works even when the pg-boss sweep is not running. */
export async function sweepExpiredHolds() {
  const due = await db.booking.findMany({ where: { status: "PENDING", holdExpiresAt: { lt: new Date() } }, select: { id: true } });
  for (const d of due) await expireBooking(d.id);
  return due.length;
}

export async function createBooking(req: CreateRequest) {
  const existing = await db.booking.findUnique({ where: { idempotencyKey: req.idempotencyKey }, include: { payments: true } });
  if (existing) {
    if (existing.status !== "PENDING" || existing.holdExpiresAt < new Date() || !existing.payments[0]) throw new BookingError("HOLD_EXPIRED", 409);
    return { reference: existing.reference, orderId: existing.payments[0].razorpayOrderId, amountPaise: existing.amountPaise, keyId: keyId(), holdExpiresAt: existing.holdExpiresAt.toISOString() };
  }
  const { event, ticket } = await loadSellable(req);
  await sweepExpiredHolds();
  if (ticket.requiresDob && req.participants.some((p) => !p.dob)) throw new BookingError("DOB_REQUIRED", 400);
  const q = computeQuote(ticket.pricePaise!, req.quantity, ticket.gstMode);
  const holdExpiresAt = new Date(Date.now() + (await getHoldMinutes()) * 60_000);
  const lead = req.participants[0];
  const reference = makeReference(event.cityCode);

  const booking = await db.$transaction(async (tx) => {
    if (!(await reserve(tx, ticket.id, req.day, req.quantity, ticket.capacity!))) throw new BookingError("SOLD_OUT", 409);
    return tx.booking.create({
      data: {
        reference, eventId: event.id, ticketTypeId: ticket.id, day: req.day, quantity: req.quantity, status: "PENDING",
        amountPaise: q.totalPaise, taxPaise: q.taxPaise, holdExpiresAt, idempotencyKey: req.idempotencyKey,
        leadEmail: lead.email!.toLowerCase(), leadName: lead.name,
        policySnapshot: "Refund and cancellation policy as published at the time of booking.",
        participants: {
          create: req.participants.map((p, i) => ({
            name: p.name, email: p.email?.toLowerCase(), phone: p.phone, dob: p.dob ? new Date(p.dob) : null,
            emergencyPhone: p.emergencyPhone, ticketToken: makeTicketToken(reference, i),
          })),
        },
      },
    });
  });
  try {
    const order = await createOrder(q.totalPaise, reference);
    await db.payment.create({ data: { bookingId: booking.id, razorpayOrderId: order.id, amountPaise: q.totalPaise, status: "CREATED" } });
    return { reference, orderId: order.id, amountPaise: q.totalPaise, keyId: keyId(), holdExpiresAt: holdExpiresAt.toISOString() };
  } catch (e) {
    await expireBooking(booking.id);
    throw e;
  }
}

export async function expireBooking(bookingId: number) {
  await db.$transaction(async (tx) => {
    const won = await tx.booking.updateMany({ where: { id: bookingId, status: "PENDING" }, data: { status: "EXPIRED" } });
    if (won.count !== 1) return;
    const bk = await tx.booking.findUniqueOrThrow({ where: { id: bookingId } });
    await releaseHold(tx, bk.ticketTypeId, bk.day, bk.quantity);
  });
}

/** Idempotent: called by both verify route and webhook; whichever arrives first confirms. */
export async function confirmPayment(razorpayOrderId: string, razorpayPaymentId: string, raw?: unknown) {
  const payment = await db.payment.findUnique({ where: { razorpayOrderId }, include: { booking: true } });
  if (!payment) throw new BookingError("NOT_FOUND", 404);
  const b = payment.booking;
  const first = await db.$transaction(async (tx) => {
    const won = await tx.booking.updateMany({ where: { id: b.id, status: { in: ["PENDING", "EXPIRED"] } }, data: { status: "CONFIRMED" } });
    await tx.payment.update({ where: { id: payment.id }, data: { status: "CAPTURED", razorpayPaymentId, ...(raw ? { raw: raw as object } : {}) } });
    if (won.count === 1) {
      // Money was taken: count the seats as sold even if the hold had expired.
      if (b.status === "PENDING") await convertHoldToSold(tx, b.ticketTypeId, b.day, b.quantity);
      else await addSold(tx, b.ticketTypeId, b.day, b.quantity);
    }
    return won.count === 1;
  });
  if (first) await enqueueConfirmation(b.id).catch(() => {});
  return { reference: b.reference, leadEmail: b.leadEmail };
}

export async function markPaymentFailed(razorpayOrderId: string, raw?: unknown) {
  await db.payment.updateMany({ where: { razorpayOrderId, status: "CREATED" }, data: { status: "FAILED", ...(raw ? { raw: raw as object } : {}) } });
}

export async function retryPayment(reference: string) {
  const b = await db.booking.findUnique({ where: { reference } });
  if (!b || b.status !== "PENDING" || b.holdExpiresAt < new Date()) throw new BookingError("HOLD_EXPIRED", 409);
  const order = await createOrder(b.amountPaise, `${reference}-r${Date.now() % 100000}`);
  await db.payment.create({ data: { bookingId: b.id, razorpayOrderId: order.id, amountPaise: b.amountPaise } });
  return { reference, orderId: order.id, amountPaise: b.amountPaise, keyId: keyId(), holdExpiresAt: b.holdExpiresAt.toISOString() };
}
