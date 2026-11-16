// End-to-end API checks against a running dev server on the TEST database (see scripts/test-db.mjs).
// Run: node scripts/e2e-api.mjs   (server: set -a; . ./.env.test; NEXT_DIST_DIR=.next-a5 npx next dev -p 3105)
import crypto from "node:crypto";
import pg from "pg";
const BASE = process.env.BASE ?? "http://localhost:3105";
const SECRET = "stub_secret_for_hmac_tests", WH = "stub_webhook_secret";
const db = new pg.Client({ connectionString: "postgresql://postgres:postgres@localhost:5433/offgravity_test" });
await db.connect();
let fails = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };
const post = async (p, b, h = {}) => {
  const r = await fetch(BASE + p, { method: "POST", headers: { "content-type": "application/json", ...h }, body: JSON.stringify(b) });
  let j = null; const t = await r.text(); try { j = JSON.parse(t); } catch {}
  return { s: r.status, j, t, r };
};
const phone = () => "9" + String(Math.floor(Math.random() * 1e9)).padStart(9, "0");
const parts = (n, email) => Array.from({ length: n }, (_, i) => (i === 0 ? { name: "Test Lead", email, phone: phone(), emergencyPhone: phone() } : { name: "Guest " + i }));
const create = (ticketTypeId, day, quantity, email, key = crypto.randomUUID()) =>
  post("/api/booking/create", { eventSlug: "mumbai", day, ticketTypeId, quantity, idempotencyKey: key, participants: parts(quantity, email), consent: true });
const sign = (o, p) => crypto.createHmac("sha256", SECRET).update(o + "|" + p).digest("hex");
const inv = async (t, d) => (await db.query('select sold,held from "TicketInventory" where "ticketTypeId"=$1 and day=$2::"Day"', [t, d])).rows[0] ?? { sold: 0, held: 0 };
const { rows: tt } = await db.query("select id,name from \"TicketType\" where name like 'TEST %'");
const T = Object.fromEntries(tt.map((r) => [r.name.replace("TEST ", "").split(" ")[0].toLowerCase(), r.id]));
for (const t of ["Payment", "Participant", "EmailNotification", "Booking", "TicketInventory", "WebhookEvent", "RateLimit"]) await db.query(`delete from "${t}"`);

// events + quote
let r = await (await fetch(BASE + "/api/events")).json();
ok(r.events.find((e) => e.slug === "mumbai").tickets.length === 3, "events lists 3 on-sale test tickets");
ok(r.events.find((e) => e.slug === "delhi").tickets.length === 0, "events hides tickets for non-open events");
let q = await post("/api/booking/quote", { eventSlug: "mumbai", day: "SAT", ticketTypeId: T.squad, quantity: 3 });
ok(q.s === 200 && q.j.subtotalPaise === 300000 && q.j.taxPaise === 54000 && q.j.totalPaise === 354000, "quote: 3 x 1000 + 18% GST = 3540 (" + JSON.stringify(q.j) + ")");
q = await post("/api/booking/quote", { eventSlug: "mumbai", day: "SAT", ticketTypeId: T.individual, quantity: 3 });
ok(q.s === 400, "quote rejects quantity outside ticket limits");
q = await post("/api/booking/quote", { eventSlug: "mumbai", day: "SAT", ticketTypeId: T.individual, quantity: 1, price: 1 });
ok(q.s === 200 && q.j.totalPaise === 118000, "quote ignores client-supplied price");

// validation
let v = await post("/api/booking/create", { eventSlug: "mumbai", day: "SAT", ticketTypeId: T.individual, quantity: 1, idempotencyKey: "abcdefgh1", participants: [{ name: "A", email: "bad", phone: "123" }], consent: true });
ok(v.s === 400, "create rejects invalid participant data (server-side Zod)");
v = await post("/api/booking/create", { eventSlug: "mumbai", day: "SAT", ticketTypeId: T.individual, quantity: 1, idempotencyKey: "abcdefgh2", participants: parts(1, "a@example.com"), consent: false });
ok(v.s === 400, "create rejects missing consent");
v = await create(T.kids, "SAT", 1, "kid@example.com");
ok(v.s === 400, "create requires DOB for kids ticket (" + v.t.slice(0, 80) + ")");

// idempotency
const key = crypto.randomUUID();
const a = await create(T.individual, "SUN", 1, "idem@example.com", key);
const b = await create(T.individual, "SUN", 1, "idem@example.com", key);
ok(a.s === 200 && b.s === 200 && a.j.reference === b.j.reference && a.j.orderId === b.j.orderId, "create is idempotent on key");
ok((await inv(T.individual, "SUN")).held === 1, "idempotent replay reserved only 1 seat");

// oversell: 20 parallel against capacity 5
const res = await Promise.all(Array.from({ length: 20 }, (_, i) => create(T.individual, "SAT", 1, `buyer${i}@example.com`)));
const wins = res.filter((x) => x.s === 200);
const sold = res.filter((x) => x.s === 409 && x.j.error === "SOLD_OUT").length;
ok(wins.length === 5 && sold === 15, `oversell guard: ${wins.length} succeeded, ${sold} SOLD_OUT (want 5/15)`);
const iv = await inv(T.individual, "SAT");
ok(iv.held === 5 && iv.sold === 0, "inventory held=5 sold=0 " + JSON.stringify(iv));

// verify
const win = wins[0].j;
const bad = await post("/api/booking/verify", { razorpay_order_id: win.orderId, razorpay_payment_id: "pay_x1", razorpay_signature: "deadbeef" });
ok(bad.s === 400, "verify rejects bad signature");
ok((await post("/api/booking/" + win.reference + "/retry", {})).s === 200, "retry creates a fresh order while hold active");
const good = await post("/api/booking/verify", { razorpay_order_id: win.orderId, razorpay_payment_id: "pay_ok1", razorpay_signature: sign(win.orderId, "pay_ok1") });
ok(good.s === 200 && good.j.status === "CONFIRMED", "verify with real HMAC confirms");
const cookie = good.r.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
const good2 = await post("/api/booking/verify", { razorpay_order_id: win.orderId, razorpay_payment_id: "pay_ok1", razorpay_signature: sign(win.orderId, "pay_ok1") });
ok(good2.s === 200, "verify twice is idempotent");
const iv2 = await inv(T.individual, "SAT");
ok(iv2.sold === 1 && iv2.held === 4, "after confirm: sold=1 held=4 " + JSON.stringify(iv2));
const st = await (await fetch(`${BASE}/api/booking/${win.reference}/status`)).json();
ok(st.status === "CONFIRMED", "status endpoint reports CONFIRMED");
const tk = await fetch(`${BASE}/api/booking/${win.reference}/tickets`, { headers: { cookie } });
const tkj = await tk.json();
ok(tk.status === 200 && tkj.tickets?.length === 1 && tkj.tickets[0].token, "tickets JSON with session cookie");
ok((await fetch(`${BASE}/api/booking/${win.reference}/tickets`)).status === 404, "tickets JSON without session -> 404");
const pdf = await fetch(`${BASE}/api/booking/${win.reference}/ticket.pdf`, { headers: { cookie } });
const buf = Buffer.from(await pdf.arrayBuffer());
ok(pdf.status === 200 && buf.subarray(0, 4).toString() === "%PDF", "ticket PDF served with session (status " + pdf.status + ")");
const other = wins[1].j;
const sess2 = await post("/api/booking/verify", { razorpay_order_id: other.orderId, razorpay_payment_id: "pay_ok2", razorpay_signature: sign(other.orderId, "pay_ok2") });
const cookie2 = sess2.r.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
ok((await fetch(`${BASE}/api/booking/${win.reference}/ticket.pdf`, { headers: { cookie: cookie2 } })).status === 404, "another customer's session cannot download this ticket");

// webhooks
const third = wins[2].j;
const evt = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_wh1", order_id: third.orderId } } } });
const wsig = crypto.createHmac("sha256", WH).update(evt).digest("hex");
const wh = (id, s = wsig) => fetch(BASE + "/api/webhooks/razorpay", { method: "POST", headers: { "x-razorpay-signature": s, "x-razorpay-event-id": id }, body: evt });
ok((await wh("evt_1", "bad")).status === 400, "webhook rejects bad signature");
ok((await wh("evt_1")).status === 200, "webhook payment.captured accepted");
const dup = await (await wh("evt_1")).json();
ok(dup.duplicate === true, "webhook duplicate event id ignored");
const stw = await (await fetch(`${BASE}/api/booking/${third.reference}/status`)).json();
ok(stw.status === "CONFIRMED", "webhook confirmed booking");
ok((await post("/api/booking/" + third.reference + "/retry", {})).s === 410, "retry on confirmed booking -> 410");
const iv3 = await inv(T.individual, "SAT");
ok(iv3.sold === 3 && iv3.held === 2, "sold=3 held=2 after verify+webhook " + JSON.stringify(iv3));

// hold expiry releases seats
await db.query("delete from \"RateLimit\"");
await db.query("update \"Booking\" set \"holdExpiresAt\"=(now() at time zone 'utc')-interval '1 minute' where status='PENDING' and day='SAT'::\"Day\"");
const e1 = await create(T.individual, "SAT", 1, "late@example.com");
ok(e1.s === 200, "after hold expiry the seats are released and bookable again (" + e1.s + ")");
const iv4 = await inv(T.individual, "SAT");
ok(iv4.sold === 3 && iv4.held === 1, "inventory after sweep sold=3 held=1 " + JSON.stringify(iv4));
const exp = await db.query("select count(*)::int c from \"Booking\" where status='EXPIRED'");
ok(exp.rows[0].c === 2, "2 bookings marked EXPIRED");
const lateOrder = wins[3].j.orderId;
const late = await post("/api/booking/verify", { razorpay_order_id: lateOrder, razorpay_payment_id: "pay_late", razorpay_signature: sign(lateOrder, "pay_late") });
ok(late.s === 200, "late payment on expired hold still confirms (money taken)");
await db.end();
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
