"use client";
import { useWaitlist } from "@/components/waitlist";
import { Button } from "@/components/ui/Button";
import type { CtaMode } from "@/lib/cta";

/** Header CTA driven by event status: sales open → Book, waitlist open → opens waitlist modal, otherwise tour. */
export function HeaderCta({ mode }: { mode: CtaMode }) {
  const waitlist = useWaitlist();
  if (mode === "waitlist") return <Button onClick={() => waitlist.open()}>Join the waitlist</Button>;
  if (mode === "book") return <Button href="/book">Book your slot</Button>;
  return <Button href="/#tour">Explore the tour</Button>;
}
