import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { WaitlistForm } from "@/components/waitlist";
import { TEASER } from "@/content/video";
import { HOME } from "@/content/home";
import { DISCLAIMER } from "@/lib/tour";
import { ctaFor } from "@/lib/cta";
import type { EventView } from "@/lib/events";
import "./finalcta.css";

/** Closing panel. Footer follows directly. */
export function FinalCta({ events }: { events: EventView[] }) {
  const mode = ctaFor(events);
  const bg = TEASER.frames[5];
  // waitlist accepts every city that is still going ahead (provisional included)
  const open = events.filter((e) => e.status !== "CANCELLED" && e.status !== "SALES_CLOSED");
  return (
    <section id="join" aria-labelledby="final-h" className="og-section og-section--dark fc">
      <div className="fc-bg" aria-hidden="true"><Image src={`${bg.base}.jpg`} alt="" fill sizes="100vw" quality={75} loading="lazy" /></div>
      <Container>
      <div className="grid-12 items-center">
        <div className="col-span-12 lg:col-span-7">
          <p className="t-kicker on-dark">{HOME.cta.tagline}</p>
          <h2 id="final-h" className="t-h2">Ready to go off gravity?</h2>
          <p className="fc-note t-label measure">{DISCLAIMER}</p>
        </div>
        <div className="col-span-12 lg:col-span-5">
          <div className="fc-form">
            {mode === "book" ? (
              <Button href="/#tour" size="lg" trailingIcon={ArrowRight}>Find your city</Button>
            ) : (
              <WaitlistForm variant="stacked" tone="dark" source="final-cta" cities={open.map((e) => ({ slug: e.slug, city: e.city }))} />
            )}
          </div>
        </div>
      </div>
      </Container>
    </section>
  );
}
