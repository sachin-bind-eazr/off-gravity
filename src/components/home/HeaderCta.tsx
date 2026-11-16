"use client";
import Link from "next/link";
import { useWaitlist } from "@/components/waitlist";
import type { CtaMode } from "@/lib/cta";

const pill = "inline-flex items-center whitespace-nowrap rounded-full bg-orange px-4 py-3 text-[14px] min-[400px]:px-5 min-[400px]:text-[15px] font-extrabold text-ink transition-transform hover:-translate-y-[3px]";

/** Header CTA driven by event status: sales open → Book, waitlist open → opens waitlist modal, otherwise tour. */
export function HeaderCta({ mode }: { mode: CtaMode }) {
  const waitlist = useWaitlist();
  if (mode === "waitlist") return <button type="button" onClick={() => waitlist.open()} className={pill}>Join the waitlist</button>;
  if (mode === "book") return <Link href="/book" className={pill}>Book your slot</Link>;
  return <Link href="/#tour" className={pill}>Explore the tour</Link>;
}
