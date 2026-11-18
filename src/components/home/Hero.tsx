import Image from "next/image";
import type { EventView } from "@/lib/events";
import { ctaFor } from "@/lib/cta";
import { Container } from "@/components/ui/Container";
import { HeroActions, type HeroCtaMode } from "./story/HeroActions";
import "./hero.css";

/** Full-viewport hero. The tour ticket strip is its own section right after it (#tour-strip). */
export function Hero({ events }: { events: EventView[] }) {
  const mode: HeroCtaMode = ctaFor(events);
  return (
    <section className="og-hero">
      <div className="og-hero__art">
        {/* rendered width: desktop ≈ 82% of the viewport (art sits right of the ink panel); portrait screens crop a
            landscape image to the full height, so it needs more than the viewport width */}
        <Image src="/assets/art/hero-course-4k.webp" alt="Campaign artwork: runners racing across giant inflatable slides and obstacles" fill priority fetchPriority="high" quality={92} sizes="(min-width:1024px) 90vw, (max-aspect-ratio:1/1) 80vh, 100vw" />
      </div>
      <Container className="og-hero__copy">
        <div className="grid-12">
          <div className="col-span-12 lg:col-span-7">
            <p className="og-hero__kicker">India&rsquo;s first play-fitness festival</p>
            <h1 className="t-display og-hero__title">Fitness,<br />minus the<br />gravity.</h1>
            <p className="og-hero__lead t-body-lg measure">Race a timed course of giant inflatable obstacles, then stay for the festival. Two days in six cities, from 30 January 2027.</p>
            <ul className="og-hero__facts" aria-label="Festival highlights">
              <li><strong>06</strong><span>cities</span></li>
              <li><strong>02</strong><span>days</span></li>
              <li><strong>01</strong><span>giant course</span></li>
            </ul>
            <HeroActions mode={mode} />
          </div>
        </div>
      </Container>
      <a href="#tour-strip" className="og-hero__cue" aria-label="Scroll to the 2027 tour"><span className="og-hero__cue-dot" /></a>
    </section>
  );
}
