// Waitlist + homepage tiers checks against a dev server pointed at the TEST db (never production).
// Run: DATABASE_URL=<test db> NEXT_DIST_DIR=.next-s npx next dev -p 3113  then  node scripts/e2e-waitlist.mjs
import pg from "pg";
const BASE = process.env.BASE ?? "http://localhost:3113";
const DB = process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5433/offgravity_test";
if (!/localhost|127\.0\.0\.1/.test(DB)) throw new Error("Refusing to run against a non-local database");
const db = new pg.Client({ connectionString: DB });
await db.connect();
await db.query('delete from "RateLimit"');
await db.query(`delete from "WaitlistEntry" where email like 'e2e-%'`);
let fails = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };
const post = async (b) => { const r = await fetch(BASE + "/api/waitlist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }); return { s: r.status, j: await r.json().catch(() => null) }; };
const RE = /^WL-[A-Z]{3}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/;

// --- tiers endpoint
const tiers = async (slug) => (await (await fetch(`${BASE}/api/home/tiers?event=${slug}`)).json()).tiers;
const jai = await tiers("jaipur"), mum = await tiers("mumbai");
ok(jai.map((t) => t.tierKey).join() === "solo,squad,glow,family", "Jaipur shows solo, squad, glow, family in sort order");
ok(mum.map((t) => t.tierKey).join() === "solo,squad,family", "Mumbai hides the Glow Night pass");
ok(jai.every((t) => t.priceFromPaise === null), "unpriced drafts expose no price");
ok(jai.every((t) => !("capacity" in t) && !("active" in t) && !("inventory" in t)), "no capacity / inventory / active leaked");
ok(jai.map((t) => t.code).join() === "T01,T02,T03,T04", "codes T01..T04");
ok(jai[0].perks.length === 4 && jai[0].stubColour === "mint", "perks and stub colour present");
ok((await tiers("nope")).length === 0, "unknown event -> empty tiers");
ok(((await (await fetch(`${BASE}/api/home/tiers`)).json()).tiers ?? []).length === 0, "missing event param -> empty tiers");

// --- booking APIs still hide drafts
const ev = await (await fetch(`${BASE}/api/events`)).json();
ok(ev.events.every((e) => e.tickets.length === 0), "booking /api/events lists no draft/unpriced tickets");

// --- waitlist create, duplicate-update, old callers
const email = "e2e-a@example.com";
const a = await post({ eventSlug: "jaipur", email, consent: true });
ok(a.s === 200 && a.j.ok && RE.test(a.j.reference) && a.j.reference.startsWith("WL-JAI-"), "old-style payload works, reference WL-JAI-xxxxx");
ok(a.j.duplicate === false && a.j.tier === "undecided" && a.j.partySize === 1 && a.j.dates.start === "2027-04-10", "defaults + dates in response");
const b = await post({ eventSlug: "jaipur", email: email.toUpperCase(), consent: true, tier: "glow", partySize: 3, whatsappNumber: "+919876543210", whatsappOptIn: true });
ok(b.s === 200 && b.j.duplicate === true && b.j.reference === a.j.reference, "resubmit returns SAME reference, duplicate:true");
const row = (await db.query(`select "tierInterest","partySize","whatsappOptIn","whatsappNumber" from "WaitlistEntry" where email=$1`, [email])).rows;
ok(row.length === 1 && row[0].tierInterest === "GLOW" && row[0].partySize === 3 && row[0].whatsappOptIn === true && row[0].whatsappNumber === "9876543210", "single row updated with new tier / party / whatsapp");
const c = await post({ eventSlug: "mumbai", email, consent: true, tier: "solo" });
ok(c.j.reference !== a.j.reference && c.j.reference.startsWith("WL-MUM-"), "same email, other city -> separate entry");

// --- validation
ok((await post({ eventSlug: "mumbai", email: "e2e-v@example.com", consent: true, tier: "vip" })).s === 400, "bad tier rejected");
ok((await post({ eventSlug: "mumbai", email: "e2e-v@example.com", consent: true, partySize: 9 })).s === 400, "party size 9 rejected");
ok((await post({ eventSlug: "mumbai", email: "e2e-v@example.com", consent: false })).s === 400, "missing consent rejected");
ok((await post({ eventSlug: "atlantis", email: "e2e-v@example.com", consent: true })).s === 400, "unknown city rejected");

// --- honeypot
const hp = await post({ eventSlug: "mumbai", email: "e2e-bot@example.com", consent: true, website: "spam" });
const bot = (await db.query(`select 1 from "WaitlistEntry" where email='e2e-bot@example.com'`)).rowCount;
ok(hp.s === 200 && bot === 0, "honeypot: silent 200, nothing stored");

// --- concurrent first submit for the same email must yield one row / one reference
const same = await Promise.all(Array.from({ length: 8 }, () => post({ eventSlug: "delhi", email: "e2e-race@example.com", consent: true, tier: "squad", partySize: 4 })));
const refs = new Set(same.filter((r) => r.s === 200).map((r) => r.j.reference));
const n = (await db.query(`select count(*)::int c from "WaitlistEntry" where email='e2e-race@example.com'`)).rows[0].c;
ok(n === 1 && refs.size === 1, `8 parallel submits -> 1 row, 1 reference (statuses: ${same.map((r) => r.s).join(",")})`);

// --- rate limit per email (5 / 10 min)
await db.query('delete from "RateLimit"');
const codes = [];
for (let i = 0; i < 7; i++) codes.push((await post({ eventSlug: "bengaluru", email: "e2e-rl@example.com", consent: true })).s);
ok(codes.slice(0, 5).every((s) => s === 200) && codes[5] === 429, `rate limit: ${codes.join(",")}`);

await db.query(`delete from "WaitlistEntry" where email like 'e2e-%'`);
await db.query('delete from "RateLimit"');
await db.end();
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exit(fails ? 1 : 0);
