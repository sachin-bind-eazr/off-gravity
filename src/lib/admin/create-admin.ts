// Bootstrap the first Owner:  npx tsx --env-file=.env src/lib/admin/create-admin.ts you@example.com 'a-long-password'
import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password || password.length < 10) throw new Error("Usage: create-admin <email> <password (10+ chars)>");
  const db = new PrismaClient();
  const u = await db.adminUser.upsert({
    where: { email: email.toLowerCase() },
    create: { email: email.toLowerCase(), passwordHash: await argon2.hash(password), role: "OWNER" },
    update: { passwordHash: await argon2.hash(password) },
  });
  console.log("Owner ready:", u.email, "(TOTP is enrolled at first sign-in)");
  await db.$disconnect();
}
main().catch((e) => { console.error(e.message); process.exit(1); });
