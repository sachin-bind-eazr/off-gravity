import "server-only";
import { db } from "@/lib/db";
/** Sellable only with price, capacity, sales window, active flag. */
export function isOnSale(t: { active: boolean; pricePaise: number | null; capacity: number | null; salesOpen: Date | null; salesClose: Date | null }, now = new Date()) {
  return t.active && t.pricePaise != null && t.pricePaise > 0 && t.capacity != null && !!t.salesOpen && !!t.salesClose && t.salesOpen <= now && now <= t.salesClose;
}
export const eventAllowsSales = (status: string) => status === "SALES_OPEN";
export async function getHoldMinutes() {
  const b = await db.contentBlock.findUnique({ where: { key: "hold_minutes" } }).catch(() => null);
  const n = b ? parseInt(b.body, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 15;
}
