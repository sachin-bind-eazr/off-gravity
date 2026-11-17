import Image from "next/image";
import Link from "next/link";
import type { EventView } from "@/lib/events";
import { ctaFor } from "@/lib/cta";
import { Container } from "@/components/ui/Container";
import { fmtRange } from "./format";
import { HeroActions, type HeroCtaMode } from "./story/HeroActions";
import "./hero.css";

export function Hero({ events }: { events: EventView[] }) {
  const next = events[0];
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
              <h1 className="t-display">Fitness,<br />minus the<br />gravity.</h1>
              <p className="og-hero__lead t-body-lg measure">Race a timed course of giant inflatable obstacles, then stay for the festival. Two days in six cities, from 30 January 2027.</p>
              <HeroActions mode={mode} />
            </div>
          </div>
        </Container>
      </div>
      <div className="og-hero__strip">
        <Container>
          <ul className="t-body">
            <li>
              <Link href={`/events/${next.slug}`}>
                <span className="text-on-dark">Next stop</span> <strong className="font-bold text-white">{next.city}, {fmtRange(next.start, next.end, true)}</strong>
              </Link>
            </li>
            {events.slice(1).map((e) => (
              <li key={e.slug}>
                <Link href={`/events/${e.slug}`}>{e.city}</Link>
                {e.slug === "jaipur" && <span className="tag t-label">Evening edition</span>}
                {e.slug === "satara" && <span className="tag t-label">Season finale</span>}
              </li>
            ))}
            <li className="t-label text-on-dark">Dates provisional</li>
          </ul>
        </Container>
      </div>
    </section>
  );
}
