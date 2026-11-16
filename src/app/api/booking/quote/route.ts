import { NextResponse } from "next/server";
import { quoteRequestSchema } from "@/lib/schemas/booking";
import { quote } from "@/lib/booking/service";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { fail } from "@/lib/booking/http";
export async function POST(req: Request) {
  try {
    if (!(await rateLimit(`quote:${clientIp(req)}`, 60, 60))) return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    return NextResponse.json(await quote(quoteRequestSchema.parse(await req.json())));
  } catch (e) { return fail(e); }
}
