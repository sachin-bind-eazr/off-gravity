"use client";
import Link from "next/link";
import { ArrowIcon } from "@/components/site";
import { useVideoModal } from "@/components/video";
import { useWaitlist } from "@/components/waitlist";
import { TEASER } from "@/content/video";
import { HOME } from "@/content/home";

export type HeroCtaMode = "waitlist" | "book" | "none";

export function HeroActions({ mode }: { mode: HeroCtaMode }) {
  const video = useVideoModal();
  const waitlist = useWaitlist();
  return (
    <div className="mt-9 flex flex-wrap items-center gap-x-4 gap-y-4">
      {mode === "waitlist" && (
        <button type="button" onClick={() => waitlist.open()} className="btn-primary">Join the waitlist<ArrowIcon /></button>
      )}
      {mode === "book" && (<Link href="/book" className="btn-primary">Book your slot<ArrowIcon /></Link>)}
      {mode === "none" && (<Link href="/#tour" className="btn-primary">Explore the tour<ArrowIcon /></Link>)}
      <button type="button" onClick={() => video.open()} className="og-watch" aria-label={`${HOME.hero.watchLabel}, ${TEASER.durationLabel}, opens video`}>
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5v11l9-5.5z" fill="currentColor" /></svg>
        <span>{HOME.hero.watchLabel} <span className="og-watch__dur">&middot; {TEASER.durationLabel}</span></span>
      </button>
    </div>
  );
}
