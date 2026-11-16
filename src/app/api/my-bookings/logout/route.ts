import { clearCustomerSession } from "@/lib/customer-session";
export async function POST() { await clearCustomerSession(); return Response.json({ ok: true }); }
