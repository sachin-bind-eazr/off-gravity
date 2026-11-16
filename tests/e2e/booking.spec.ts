/**
 * Browser tests for /book. Needs: the test Postgres (npm run test:db), seeded + scripts/seed-test-data.ts applied,
 * and a dev server started with .env.test on port 3105 (RAZORPAY_TEST_STUB=1). Razorpay checkout.js is replaced by a
 * stub in the browser; the signature it returns is a REAL HMAC with the test secret, so server verification is real.
 * No real payment is ever made.
 */
import { test, expect, type Page } from "@playwright/test";
import crypto from "node:crypto";
import pg from "pg";

const SECRET = "stub_secret_for_hmac_tests";
const sign = (o: string, p: string) => crypto.createHmac("sha256", SECRET).update(`${o}|${p}`).digest("hex");

async function resetDb() {
  const db = new pg.Client({ connectionString: "postgresql://postgres:postgres@localhost:5433/offgravity_test" });
  await db.connect();
  for (const t of ["Payment", "Participant", "EmailNotification", "Booking", "TicketInventory", "RateLimit"]) await db.query(`delete from "${t}"`);
  await db.end();
}

/** Fake checkout.js: opens "instantly", then calls handler with a real signature (or fails on demand). */
async function stubRazorpay(page: Page, mode: "success" | "dismiss" = "success") {
  await page.route("https://checkout.razorpay.com/v1/checkout.js", (route) => {
    const paymentId = "pay_" + crypto.randomBytes(5).toString("hex");
    const body = `
      window.__sig = (o) => fetch("/__sig?o=" + o + "&p=${paymentId}").then(r => r.text());
      window.Razorpay = function (opts) {
        this.on = function () {};
        this.open = async function () {
          if ("${mode}" === "dismiss") { opts.modal.ondismiss(); return; }
          const sig = await window.__sig(opts.order_id);
          opts.handler({ razorpay_order_id: opts.order_id, razorpay_payment_id: "${paymentId}", razorpay_signature: sig });
        };
      };`;
    route.fulfill({ contentType: "application/javascript", body });
  });
  await page.route("**/__sig*", (route) => {
    const u = new URL(route.request().url());
    route.fulfill({ contentType: "text/plain", body: sign(u.searchParams.get("o")!, u.searchParams.get("p")!) });
  });
}

const phone = () => "9" + String(Math.floor(Math.random() * 1e9)).padStart(9, "0");
async function fillLead(page: Page, email = "e2e@example.com") {
  await page.getByLabel("Full name").first().fill("Asha Rao");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mobile number").fill(phone());
  await page.getByLabel("Emergency contact number").fill(phone());
  await page.getByLabel(/I accept the/).check();
}
const noOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

test.beforeEach(async () => { await resetDb(); });

test("full flow: city to confirmed, with server-side totals and QR", async ({ page }) => {
  await stubRazorpay(page);
  await page.goto("/book");
  await page.getByRole("radio", { name: /Mumbai/ }).click();
  await page.getByRole("radio", { name: /Saturday/ }).click();
  await expect(page.getByRole("heading", { name: "Choose your entry" })).toBeVisible();
  await page.getByRole("radio", { name: /TEST Individual entry/ }).click();
  await page.getByRole("button", { name: /Continue/ }).click();

  // validation copy
  await page.getByRole("button", { name: /Review booking/ }).click();
  await expect(page.getByText("Enter the participant's full name.")).toBeVisible();
  await expect(page.getByText("Accept the terms to continue.")).toBeVisible();
  await fillLead(page);
  await page.getByRole("button", { name: /Review booking/ }).click();

  await expect(page.getByRole("heading", { name: "Review your booking" })).toBeVisible();
  await expect(page.getByText("₹1,180").first()).toBeVisible(); // 1000 + 18% GST, from /api/booking/quote
  await page.getByRole("button", { name: /Pay now/ }).click();

  await expect(page.getByRole("heading", { name: /going off gravity/i })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/OG-MUM-/).first()).toBeVisible();
  await expect(page.getByText("Verified")).toBeVisible();
  await expect(page.getByAltText(/Ticket QR code/)).toBeVisible();
  const pdf = await page.request.get((await page.getByRole("link", { name: /Download ticket/ }).getAttribute("href"))!);
  expect(pdf.status()).toBe(200);
  expect((await pdf.body()).subarray(0, 4).toString()).toBe("%PDF");
});

test("refresh keeps progress (URL + sessionStorage)", async ({ page }) => {
  await page.goto("/book?city=mumbai&day=sat");
  await page.getByRole("radio", { name: /TEST Squad entry/ }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByLabel("Full name").first().fill("Persist Me");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Who's taking part?" })).toBeVisible();
  await expect(page.getByLabel("Full name").first()).toHaveValue("Persist Me");
});

test("tickets: error state with retry, then success", async ({ page }) => {
  let fail = true;
  await page.route("**/api/events", (route) => (fail ? route.fulfill({ status: 500, body: "{}" }) : route.continue()));
  await page.goto("/book?city=mumbai&day=sat");
  await expect(page.getByText("We couldn't load tickets")).toBeVisible();
  await expect(page.getByText("Loading tickets…")).toHaveCount(0);
  fail = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("radio", { name: /TEST Individual entry/ })).toBeVisible();
});

test("tickets: database down (degraded API) is an honest empty state, not an endless spinner", async ({ page }) => {
  await page.route("**/api/events", (route) => route.fulfill({ json: { degraded: true, events: [{ slug: "mumbai", city: "Mumbai", code: "MUM", season: 1, start: "2027-01-30", end: "2027-01-31", tag: null, status: "PROVISIONAL", salesOpen: false, tickets: [] }] } }));
  await page.goto("/book?city=mumbai&day=sat");
  await expect(page.getByText(/unavailable right now/)).toBeVisible();
});

test("payment dismissed shows retry copy, retry then succeeds", async ({ page }) => {
  let mode: "dismiss" | "success" = "dismiss";
  const paymentId = "pay_" + crypto.randomBytes(5).toString("hex");
  await page.route("https://checkout.razorpay.com/v1/checkout.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: `window.Razorpay=function(o){this.on=function(){};this.open=async function(){ if(window.__mode==="dismiss"){o.modal.ondismiss();return;} const s=await fetch("/__sig?o="+o.order_id+"&p=${paymentId}").then(r=>r.text()); o.handler({razorpay_order_id:o.order_id,razorpay_payment_id:"${paymentId}",razorpay_signature:s}); }};` }));
  await page.route("**/__sig*", (route) => { const u = new URL(route.request().url()); route.fulfill({ body: sign(u.searchParams.get("o")!, u.searchParams.get("p")!) }); });
  await page.addInitScript(() => { (window as unknown as { __mode: string }).__mode = "dismiss"; });
  await page.goto("/book?city=mumbai&day=sun");
  await page.getByRole("radio", { name: /TEST Individual entry/ }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await fillLead(page);
  await page.getByRole("button", { name: /Review booking/ }).click();
  await page.getByRole("button", { name: /Pay now/ }).click();
  await expect(page.getByText("No money was taken and your booking isn't confirmed.")).toBeVisible();
  mode = "success";
  await page.evaluate(() => { (window as unknown as { __mode: string }).__mode = "success"; });
  await page.getByRole("button", { name: /Try payment again/ }).click();
  await expect(page.getByRole("heading", { name: /going off gravity/i })).toBeVisible({ timeout: 20_000 });
});

test("verify outage after payment says 'still confirming', never 'no money was taken'; re-check confirms", async ({ page }) => {
  await stubRazorpay(page);
  let outage = true;
  await page.route("**/api/booking/verify", (route) => (outage ? route.abort() : route.continue()));
  await page.goto("/book?city=mumbai&day=sat");
  await page.getByRole("radio", { name: /TEST Individual entry/ }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await fillLead(page);
  await page.getByRole("button", { name: /Review booking/ }).click();
  await page.getByRole("button", { name: /Pay now/ }).click();
  await expect(page.getByText("We're still confirming your payment")).toBeVisible();
  await expect(page.getByText("No money was taken")).toHaveCount(0);
  outage = false;
  await page.getByRole("button", { name: /Check payment status/ }).click();
  await expect(page.getByRole("heading", { name: /going off gravity/i })).toBeVisible({ timeout: 20_000 });
});

test("double-click on Pay now creates exactly one booking", async ({ page }) => {
  await stubRazorpay(page, "dismiss");
  await page.goto("/book?city=mumbai&day=sat");
  await page.getByRole("radio", { name: /TEST Individual entry/ }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await fillLead(page);
  await page.getByRole("button", { name: /Review booking/ }).click();
  const creates: string[] = [];
  page.on("request", (r) => { if (r.url().endsWith("/api/booking/create")) creates.push(r.url()); });
  await page.getByRole("button", { name: /Pay now/ }).dblclick();
  await expect(page.getByText(/No money was taken/)).toBeVisible();
  expect(creates.length).toBe(1);
});

test("resume a pending booking from /book?resume=", async ({ page, request }) => {
  await stubRazorpay(page);
  const ev = await (await request.get("/api/events")).json();
  const t = ev.events.find((e: { slug: string }) => e.slug === "mumbai").tickets.find((x: { name: string }) => x.name.includes("Individual"));
  const created = await request.post("/api/booking/create", { data: { eventSlug: "mumbai", day: "SAT", ticketTypeId: t.id, quantity: 1, idempotencyKey: crypto.randomUUID(), consent: true, participants: [{ name: "Resume Me", email: "resume@example.com", phone: phone(), emergencyPhone: phone() }] } });
  const { reference } = await created.json();
  await page.goto(`/book?resume=${reference}`);
  await expect(page.getByRole("heading", { name: "Payment" })).toBeVisible();
  await page.getByRole("button", { name: /Open payment window|Try payment again/ }).click();
  await expect(page.getByRole("heading", { name: /going off gravity/i })).toBeVisible({ timeout: 20_000 });
});

test("resume with an unknown reference explains itself", async ({ page }) => {
  await page.goto("/book?resume=OG-MUM-ZZZZZ");
  await expect(page.getByText(/couldn't find that booking to resume/)).toBeVisible();
});

test("a hand-edited step cannot skip ahead", async ({ page }) => {
  await page.goto("/book?step=6");
  await expect(page.getByRole("heading", { name: "Pick your city" })).toBeVisible();
});

for (const [w, h] of [[1440, 900], [1024, 768], [768, 1024], [390, 844], [320, 568]] as const) {
  test(`no horizontal overflow and screenshots at ${w}px`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await stubRazorpay(page, "dismiss");
    const shot = (n: string) => page.screenshot({ path: `${process.env.SHOTS ?? "test-results/shots"}/${n}-${w}.png`, fullPage: true });
    await page.goto("/book");
    expect(await noOverflow(page)).toBe(true); await shot("1-city");
    await page.getByRole("radio", { name: /Mumbai/ }).click();
    expect(await noOverflow(page)).toBe(true); await shot("2-day");
    await page.getByRole("radio", { name: /Saturday/ }).click();
    await expect(page.getByRole("radio", { name: /TEST Squad entry/ })).toBeVisible();
    expect(await noOverflow(page)).toBe(true); await shot("3-entry");
    await page.getByRole("radio", { name: /TEST Squad entry/ }).click();
    await page.getByRole("button", { name: /Continue/ }).click();
    await page.getByLabel("Full name").nth(1).fill("Second Person");
    await fillLead(page);
    expect(await noOverflow(page)).toBe(true); await shot("4-participants");
    await page.getByRole("button", { name: /Review booking/ }).click();
    await expect(page.getByText("Total").first()).toBeVisible();
    expect(await noOverflow(page)).toBe(true); await shot("5-review");
    await page.getByRole("button", { name: /Pay now/ }).click();
    await expect(page.getByText(/No money was taken/)).toBeVisible();
    expect(await noOverflow(page)).toBe(true); await shot("6-payment");
  });
}
