import { NextResponse } from "next/server";
import { createRequestSchema } from "@/lib/schemas/booking";
import { createBooking } from "@/lib/booking/service";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { fail } from "@/lib/booking/http";
export async function POST(req: Request) {
  try {
    if (!(await rateLimit(`book:${clientIp(req)}`, 10, 60))) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    return NextResponse.json(await createBooking(createRequestSchema.parse(await req.json())));
  } catch (e) { return fail(e); }
}
