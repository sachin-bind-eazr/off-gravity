import Image from "next/image";
import Link from "next/link";
import type { EventView } from "@/lib/events";
import { ctaFor } from "@/lib/cta";
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
          <Image src="/assets/art/hero-course.webp" alt="Campaign artwork: runners racing across giant inflatable slides and obstacles" fill priority quality={92} sizes="(min-width:860px) 78vw, 100vw" className="hero-push" />
        </div>
        <div className="og-hero__copy">
          <div className="og-hero__col">
            <p className="text-[15px] font-bold text-mint">India&rsquo;s first play-fitness festival</p>
            <h1 className="t-campaign og-hero__h1 mt-4">Fitness,<br />minus the<br />gravity.</h1>
            <p className="og-hero__lead mt-6 max-w-[440px] text-[clamp(17px,1.5vw,20px)] leading-[1.55] text-on-dark">Race a timed course of giant inflatable obstacles, then stay for the festival. Two days in six cities, from 30 January 2027.</p>
            <HeroActions mode={mode} />
          </div>
        </div>
        <span className="og-hero__cue" aria-hidden />
      </div>
      <div className="og-hero__strip">
        <div className="mx-auto max-w-[1312px] overflow-x-auto px-[var(--pad)]">
          <ul className="flex min-w-max items-center gap-8 py-5 text-[16px]">
            <li>
              <Link href={`/events/${next.slug}`} className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-mint" aria-hidden />
                <span><span className="text-on-dark">Next stop</span> <strong className="font-extrabold text-white">{next.city}, {fmtRange(next.start, next.end, true)}</strong></span>
              </Link>
            </li>
            {events.slice(1).map((e) => (
              <li key={e.slug}>
                <Link href={`/events/${e.slug}`} className="hover:text-mint">{e.city}</Link>
                {e.slug === "jaipur" && <span className="ml-2 rounded-full bg-lilac px-2.5 py-0.5 text-[14px] font-bold text-ink">Evening edition</span>}
                {e.slug === "satara" && <span className="ml-2 rounded-full bg-orange px-2.5 py-0.5 text-[14px] font-bold text-ink">Season finale</span>}
              </li>
            ))}
            <li className="text-on-dark">Dates provisional</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
