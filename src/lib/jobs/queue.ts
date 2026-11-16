import "server-only";
import { PgBoss } from "pg-boss";
import { db } from "@/lib/db";
import { emailProvider } from "@/lib/email";
import { ticketPdf } from "@/lib/tickets/pdf";

let boss: PgBoss | null = null;
export const JOBS = { confirmation: "send-confirmation", expiry: "expire-holds" } as const;

export async function sendConfirmationNow(bookingId: number) {
  const b = await db.booking.findUnique({ where: { id: bookingId }, include: { event: true } });
  if (!b || b.status !== "CONFIRMED") return;
  const n = await db.emailNotification.create({ data: { bookingId, type: "confirmation", status: "PENDING" } });
  try {
    const pdf = await ticketPdf(b.reference);
    await emailProvider().send({
      to: b.leadEmail,
      subject: `You're going off gravity - ${b.reference}`,
      html: `<p>Your OFF GRAVITY booking <b>${b.reference}</b> for ${b.event.city} is confirmed. Tickets attached.</p><p>Dates are provisional, subject to venue and permission confirmations.</p>`,
      attachments: pdf ? [{ filename: `${b.reference}.pdf`, content: pdf }] : [],
    });
    await db.emailNotification.update({ where: { id: n.id }, data: { status: "SENT", attempts: { increment: 1 } } });
  } catch (e) {
    await db.emailNotification.update({ where: { id: n.id }, data: { status: "FAILED", attempts: { increment: 1 } } });
    throw e;
  }
}

export async function expireDueHolds() {
  const { expireBooking } = await import("@/lib/booking/service");
  const due = await db.booking.findMany({ where: { status: "PENDING", holdExpiresAt: { lt: new Date() } }, select: { id: true } });
  for (const d of due) await expireBooking(d.id);
  return due.length;
}

/** Returns null (never throws) if the queue cannot start, e.g. no database. */
export async function getBoss(): Promise<PgBoss | null> {
  if (boss) return boss;
  if (!process.env.DATABASE_URL) return null;
  try {
    const b = new PgBoss(process.env.DATABASE_URL);
    b.on("error", () => {});
    await b.start();
    await b.createQueue(JOBS.confirmation).catch(() => {});
    await b.createQueue(JOBS.expiry).catch(() => {});
    await b.work(JOBS.confirmation, async (jobs: { data: unknown }[]) => {
      for (const j of jobs) await sendConfirmationNow((j.data as { bookingId: number }).bookingId);
    });
    await b.work(JOBS.expiry, async () => { await expireDueHolds(); });
    await b.schedule(JOBS.expiry, "* * * * *").catch(() => {});
    boss = b;
    return b;
  } catch {
    return null;
  }
}

/** Queued with retries; falls back to one inline attempt if the queue is unavailable. */
export async function enqueueConfirmation(bookingId: number) {
  const b = await getBoss();
  if (b) { await b.send(JOBS.confirmation, { bookingId }, { retryLimit: 5, retryBackoff: true }); return; }
  await sendConfirmationNow(bookingId).catch(() => {});
}
