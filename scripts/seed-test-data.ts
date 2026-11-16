// TEST DATABASE ONLY. Makes Mumbai sellable with one priced ticket (capacity 5) so the flow can be exercised.
import { PrismaClient } from "@prisma/client";
if (process.env.NODE_ENV === "production" || !/localhost:5433/.test(process.env.DATABASE_URL ?? "")) throw new Error("Refusing: test DB only");
const db = new PrismaClient();
async function main() {
const ev = await db.event.update({ where: { slug: "mumbai" }, data: { status: "SALES_OPEN" } });
await db.ticketType.deleteMany({ where: { eventId: ev.id, name: { startsWith: "TEST " } } });
const mk = (name: string, o: object) => db.ticketType.create({ data: { eventId: ev.id, name, description: "Test ticket", pricePaise: 100000, gstMode: "EXCLUSIVE", capacity: 5, days: ["SAT", "SUN"], salesOpen: new Date(Date.now() - 864e5), salesClose: new Date(Date.now() + 864e5 * 30), active: true, ...o } });
const a = await mk("TEST Individual entry", { minPerBooking: 1, maxPerBooking: 1 });
const b = await mk("TEST Squad entry", { minPerBooking: 2, maxPerBooking: 4, capacity: 50 });
const c = await mk("TEST Kids entry", { minPerBooking: 1, maxPerBooking: 2, requiresDob: true, capacity: 50 });
console.log(JSON.stringify({ individual: a.id, squad: b.id, kids: c.id }));
await db.$disconnect();
}
main();
