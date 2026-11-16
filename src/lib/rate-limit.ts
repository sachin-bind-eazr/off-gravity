import { db } from "./db";
/** Fixed-window limiter in Postgres. Returns true if allowed. */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  const now = new Date(); const resetAt = new Date(now.getTime() + windowSec * 1000);
  const row = await db.rateLimit.findUnique({ where: { key } });
  if (!row || row.resetAt < now) { await db.rateLimit.upsert({ where:{key}, create:{key,count:1,resetAt}, update:{count:1,resetAt} }); return true; }
  if (row.count >= limit) return false;
  await db.rateLimit.update({ where:{key}, data:{ count:{ increment:1 } } }); return true;
}
export function clientIp(req: Request){ return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"; }
