import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { BookingError } from "./errors";
export function fail(e: unknown) {
  if (e instanceof BookingError) return NextResponse.json({ error: e.code }, { status: e.status });
  if (e instanceof ZodError) return NextResponse.json({ error: "INVALID", issues: e.issues.map((i) => ({ path: i.path, message: i.message })) }, { status: 400 });
  console.error("api error", e instanceof Error ? e.message : "unknown");
  return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
}
