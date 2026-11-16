import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "@/components/site/BookButton";
import { WaitlistForm } from "@/components/waitlist";
import { TEASER } from "@/content/video";
import { HOME } from "@/content/home";
import { DISCLAIMER } from "@/lib/tour";
import { ctaFor } from "@/lib/cta";
import type { EventView } from "@/lib/events";
import "./finalcta.css";

/** S5 — closing panel. Footer follows directly in the same dark tone. */
export function FinalCta({ events }: { events: EventView[] }) {
  const mode = ctaFor(events);
  const bg = TEASER.frames[5];
  // waitlist accepts every city that is still going ahead (provisional included)
  const open = events.filter((e) => e.status !== "CANCELLED" && e.status !== "SALES_CLOSED");
  return (
    <section id="join" aria-labelledby="final-h" className="relative isolate overflow-hidden bg-ink text-white">
      <div className="fc-bg" aria-hidden="true"><Image src={`${bg.base}.jpg`} alt="" fill sizes="100vw" quality={75} loading="lazy" /></div>
      <div aria-hidden="true" className="fc-grade" />
      <div className="container-og flex flex-col items-center pt-[var(--section-y-tight)] pb-[clamp(48px,6vw,80px)] text-center">
        <h2 id="final-h" className="t-campaign" style={{ fontSize: "clamp(32px,9.4vw,112px)" }}>Ready to go<br />off gravity?</h2>
        <p className="t-lead mt-5 font-bold text-mint">{HOME.cta.tagline}</p>

        <div className="mt-10 w-full max-w-[760px]">
          {mode === "book" ? (
            <Link href="/#tour" className="btn-primary mx-auto">Find your city &amp; book<ArrowIcon /></Link>
          ) : (
            <WaitlistForm variant="inline" tone="dark" source="final-cta" cities={open.map((e) => ({ slug: e.slug, city: e.city }))} />
          )}
        </div>
        <p className="mt-6 text-[15px] text-on-dark">{DISCLAIMER}</p>
      </div>
      <div className="fc-rule" aria-hidden="true" />
    </section>
  );
}
