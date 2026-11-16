// Starts a throwaway local Postgres (embedded-postgres) for end-to-end testing. Dev-only.
import EmbeddedPostgres from "embedded-postgres";
import fs from "node:fs";
const dir = ".test-pg-data";
const pg = new EmbeddedPostgres({ databaseDir: dir, user: "postgres", password: "postgres", port: 5433, persistent: true });
if (!fs.existsSync(dir + "/PG_VERSION")) await pg.initialise();
await pg.start();
try { await pg.createDatabase("offgravity_test"); } catch {}
console.log("TEST_DB_READY postgresql://postgres:postgres@localhost:5433/offgravity_test");
process.on("SIGINT", async () => { await pg.stop(); process.exit(0); });
process.on("SIGTERM", async () => { await pg.stop(); process.exit(0); });
setInterval(() => {}, 1 << 30);
