"use client";
import Link from "next/link";
import { ArrowIcon } from "@/components/site/BookButton";

export function EarlyBirdStrip({ mode, city, slug, hours, onJoin }: { mode: "waitlist" | "book" | "none"; city: string; slug: string; hours: number | null; onJoin: () => void }) {
  if (mode === "none") return null;
  const text = mode === "waitlist"
    ? `Waitlist members hear first and get early access before public sales.${hours ? ` Early access opens ${hours} hours before the public.` : ""}`
    : `Tickets are on sale for ${city}. Pick a tier and lock in your weekend.`;
  return (
    <div className="tk-strip">
      <p className="tk-strip-text"><span className="tk-pulse" aria-hidden="true" />{text}</p>
      {mode === "waitlist"
        ? <button type="button" className="tk-strip-btn" onClick={onJoin}>Join the waitlist<ArrowIcon /></button>
        : <Link href={`/book?city=${slug}`} className="tk-strip-btn">Book {city}<ArrowIcon /></Link>}
    </div>
  );
}
