// My bookings checks (OTP, isolation) against the dev server + TEST db. Run after scripts/e2e-api.mjs (needs its bookings).
// Dev email provider prints OTP bodies to the server log; point LOG at it.
import fs from "node:fs";
import pg from "pg";
const BASE = process.env.BASE ?? "http://localhost:3105";
const LOG = process.env.LOG ?? ".next-a5.log";
const db = new pg.Client({ connectionString: "postgresql://postgres:postgres@localhost:5433/offgravity_test" });
await db.connect();
await db.query('delete from "RateLimit"');
let fails = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };
const post = async (p, b, h = {}) => { const r = await fetch(BASE + p, { method: "POST", headers: { "content-type": "application/json", ...h }, body: JSON.stringify(b) }); return { s: r.status, j: await r.json().catch(() => null), r }; };
const lastCode = async () => { await new Promise((r) => setTimeout(r, 800)); const m = [...fs.readFileSync(LOG, "utf8").matchAll(/code is\s+(\d{6})/g)]; return m.at(-1)?.[1]; };

const refOf = async (email) => (await db.query('select reference from "Booking" where "leadEmail"=$1 limit 1', [email])).rows[0]?.reference;
const mine = "buyer1@example.com", theirs = "buyer2@example.com";
const myRef = await refOf(mine), theirRef = await refOf(theirs);
ok(myRef && theirRef, "two customers with bookings exist");

const known = await post("/api/my-bookings/request", { email: mine });
const unknown = await post("/api/my-bookings/request", { email: "nobody-here@example.com" });
ok(known.s === 200 && unknown.s === 200 && JSON.stringify(known.j) === JSON.stringify(unknown.j), "request response identical for known and unknown emails");
ok((await post("/api/my-bookings/request", { email: "not-an-email" })).s === 400, "invalid email rejected");
ok((await fetch(BASE + "/api/my-bookings/list")).status === 401, "list without session -> 401");

const code = await lastCode();
ok(/^\d{6}$/.test(code ?? ""), "6-digit code issued (dev log)");
const wrong = await post("/api/my-bookings/verify", { email: mine, code: code === "000000" ? "111111" : "000000" });
ok(wrong.s === 400, "wrong code rejected");
const right = await post("/api/my-bookings/verify", { email: mine, code });
ok(right.s === 200, "right code accepted");
const cookie = right.r.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
ok(/HttpOnly/i.test(right.r.headers.getSetCookie().join(";")), "session cookie is HttpOnly");
ok((await post("/api/my-bookings/verify", { email: mine, code })).s === 400, "code cannot be reused");

const list = await (await fetch(BASE + "/api/my-bookings/list", { headers: { cookie } })).json();
ok(list.bookings?.length >= 1 && list.bookings.every((b) => b.reference !== theirRef), "list returns only my bookings");
const own = await fetch(`${BASE}/api/my-bookings/list?ref=${myRef}`, { headers: { cookie } });
ok(own.status === 200, "own reference found");
const cross = await fetch(`${BASE}/api/my-bookings/list?ref=${theirRef}`, { headers: { cookie } });
const cj = await cross.json();
ok(cross.status === 404 && /No booking matches that email and reference/.test(cj.error), "other customer's reference -> not found (exact copy)");
ok((await fetch(`${BASE}/api/booking/${theirRef}/ticket.pdf`, { headers: { cookie } })).status === 404, "cannot download another customer's ticket PDF");
ok((await fetch(`${BASE}/api/booking/${theirRef}/receipt.pdf`, { headers: { cookie } })).status === 404, "cannot download another customer's receipt PDF");

// attempt lockout: 5 wrong codes then right code must fail
await post("/api/my-bookings/request", { email: theirs });
const c2 = await lastCode();
for (let i = 0; i < 5; i++) await post("/api/my-bookings/verify", { email: theirs, code: c2 === "123456" ? "654321" : "123456" });
ok((await post("/api/my-bookings/verify", { email: theirs, code: c2 })).s === 400, "locked after 5 wrong attempts");
await db.end();
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
