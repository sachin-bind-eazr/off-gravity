"use client";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { watchWithSound } from "@/components/home/obstacles/watch";
import { useWaitlist } from "@/components/waitlist";
import { TEASER } from "@/content/video";
import { HOME } from "@/content/home";

export type HeroCtaMode = "waitlist" | "book" | "none";

export function HeroActions({ mode }: { mode: HeroCtaMode }) {
  const waitlist = useWaitlist();
  return (
    <div className="og-hero__actions">
      {mode === "waitlist" && <Button size="lg" trailingIcon={ArrowRight} onClick={() => waitlist.open()}>Join the waitlist</Button>}
      {mode === "book" && <Button size="lg" trailingIcon={ArrowRight} href="/book">Book your slot</Button>}
      {mode === "none" && <Button size="lg" trailingIcon={ArrowRight} href="/#tour">Explore the tour</Button>}
      <Button size="lg" variant="ghost-on-dark" leadingIcon={Play} onClick={watchWithSound} aria-label={`${HOME.hero.watchLabel}, ${TEASER.durationLabel}, plays inline with sound`}>{HOME.hero.watchLabel}</Button>
    </div>
  );
}
