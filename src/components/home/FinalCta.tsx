import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "@/components/site/BookButton";
import { WaitlistForm } from "@/components/waitlist";
import { TEASER } from "@/content/video";
import { HOME } from "@/content/home";
import { DISCLAIMER } from "@/lib/tour";
import { ctaFor } from "@/lib/cta";
import type { EventView } from "@/lib/events";

/** S5 — closing panel. Footer follows directly in the same dark tone. */
export function FinalCta({ events }: { events: EventView[] }) {
  const mode = ctaFor(events);
  const bg = TEASER.frames[5];
  return (
    <section id="join" aria-labelledby="final-h" className="relative isolate overflow-hidden bg-ink text-white">
      <Image src={`${bg.base}.jpg`} alt="" fill sizes="100vw" quality={70} loading="lazy" className="-z-20 object-cover opacity-30" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(29,38,50,.88),rgba(14,21,32,.94))]" />
      <div className="container-og flex flex-col items-center py-[var(--section-y-tight)] text-center">
        <h2 id="final-h" className="t-campaign" style={{ fontSize: "clamp(32px,9.4vw,112px)" }}>Ready to go<br />off gravity?</h2>
        <p className="t-lead mt-5 font-bold text-mint">{HOME.cta.tagline}</p>

        <div className="mt-10 w-full max-w-[760px]">
          {mode === "book" ? (
            <Link href="/#tour" className="btn-primary mx-auto">Find your city &amp; book<ArrowIcon /></Link>
          ) : mode === "waitlist" ? (
            <WaitlistForm variant="inline" tone="dark" source="final-cta" cities={events.filter((e) => e.status === "WAITLIST_OPEN").map((e) => ({ slug: e.slug, city: e.city }))} />
          ) : (
            <Link href="/#tour" className="btn-primary mx-auto">Explore the tour<ArrowIcon /></Link>
          )}
        </div>
        <p className="mt-8 text-[15px] text-on-dark">{DISCLAIMER}</p>
      </div>
    </section>
  );
}
