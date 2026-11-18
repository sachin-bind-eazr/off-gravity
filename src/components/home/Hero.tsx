import Image from "next/image";
import type { EventView } from "@/lib/events";
import { ctaFor } from "@/lib/cta";
import { Container } from "@/components/ui/Container";
import { TourTicketStrip } from "@/components/hero/TourTicketStrip";
import { HeroActions, type HeroCtaMode } from "./story/HeroActions";
import "./hero.css";

export function Hero({ events }: { events: EventView[] }) {
  const mode: HeroCtaMode = ctaFor(events);
  return (
    <section className="og-hero">
      <div className="og-hero__stage">
        <div className="og-hero__art">
          <Image src="/assets/art/hero-course.webp" alt="Campaign artwork: runners racing across giant inflatable slides and obstacles" fill priority fetchPriority="high" quality={75} sizes="100vw" />
        </div>
        <Container className="og-hero__copy">
          <div className="grid-12">
            <div className="col-span-12 lg:col-span-7">
              <p className="og-hero__kicker">India&rsquo;s first play-fitness festival</p>
              <h1 className="t-display og-hero__title">Fitness,<br />minus the<br />gravity.</h1>
              <p className="og-hero__lead t-body-lg measure">Race a timed course of giant inflatable obstacles, then stay for the festival. Two days in six cities, from 30 January 2027.</p>
              <HeroActions mode={mode} />
            </div>
          </div>
        </Container>
      </div>
      <TourTicketStrip events={events.map(({ slug, city, season, start, end, status }) => ({ slug, city, season, start, end, status }))} initialNow={Date.now()} />
    </section>
  );
}
