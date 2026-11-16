import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
type Tx = Prisma.TransactionClient | typeof db;
/** Atomic: increments held only if sold+held+qty <= capacity, in ONE statement. */
export async function reserve(tx: Tx, ticketTypeId: number, day: "SAT" | "SUN", qty: number, capacity: number): Promise<boolean> {
  await tx.$executeRaw`INSERT INTO "TicketInventory" ("ticketTypeId","day","sold","held") VALUES (${ticketTypeId}, ${day}::"Day", 0, 0) ON CONFLICT DO NOTHING`;
  const n = await tx.$executeRaw`UPDATE "TicketInventory" SET "held" = "held" + ${qty} WHERE "ticketTypeId" = ${ticketTypeId} AND "day" = ${day}::"Day" AND "sold" + "held" + ${qty} <= ${capacity}`;
  return n === 1;
}
export async function releaseHold(tx: Tx, ticketTypeId: number, day: "SAT" | "SUN", qty: number) {
  await tx.$executeRaw`UPDATE "TicketInventory" SET "held" = GREATEST("held" - ${qty}, 0) WHERE "ticketTypeId" = ${ticketTypeId} AND "day" = ${day}::"Day"`;
}
export async function convertHoldToSold(tx: Tx, ticketTypeId: number, day: "SAT" | "SUN", qty: number) {
  await tx.$executeRaw`UPDATE "TicketInventory" SET "held" = GREATEST("held" - ${qty}, 0), "sold" = "sold" + ${qty} WHERE "ticketTypeId" = ${ticketTypeId} AND "day" = ${day}::"Day"`;
}
export async function addSold(tx: Tx, ticketTypeId: number, day: "SAT" | "SUN", qty: number) {
  await tx.$executeRaw`UPDATE "TicketInventory" SET "sold" = "sold" + ${qty} WHERE "ticketTypeId" = ${ticketTypeId} AND "day" = ${day}::"Day"`;
}
export async function remaining(ticketTypeId: number, capacity: number) {
  const rows = await db.ticketInventory.findMany({ where: { ticketTypeId } });
  const r = { SAT: capacity, SUN: capacity };
  for (const x of rows) r[x.day] = Math.max(capacity - x.sold - x.held, 0);
  return r;
}
