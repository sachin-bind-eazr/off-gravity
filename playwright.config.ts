import { defineConfig } from "@playwright/test";
// Runs against an already-running dev server on the TEST db: see scripts/test-db.mjs and docs in tests/e2e/booking.spec.ts.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  workers: 1,
  use: { baseURL: process.env.BASE ?? "http://localhost:3105", trace: "retain-on-failure" },
});
