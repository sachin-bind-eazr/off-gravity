import { NextResponse } from "next/server";
import { retryPayment } from "@/lib/booking/service";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { fail } from "@/lib/booking/http";
export async function POST(req: Request, { params }: { params: Promise<{ reference: string }> }) {
  try {
    if (!(await rateLimit(`retry:${clientIp(req)}`, 10, 60))) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    return NextResponse.json(await retryPayment((await params).reference));
  } catch (e) { if ((e as { code?: string }).code === "HOLD_EXPIRED" || (e as Error).message === "HOLD_EXPIRED") return NextResponse.json({ expired: true, error: "HOLD_EXPIRED" }, { status: 410 }); return fail(e); }
}
