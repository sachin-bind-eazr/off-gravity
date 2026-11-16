import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav, SiteFooter, BookButton } from "@/components/site";
import { Faq } from "@/components/city/Faq";
import { getEvent, getEvents } from "@/lib/events";
import { getFaqs, fullDates, parts, tbc, COLOURS } from "@/lib/city-data";
import { DISCLAIMER } from "@/lib/tour";

export const revalidate = 60;
export async function generateStaticParams() {
  return (await getEvents()).map((e) => ({ city: e.slug }));
}
type P = { params: Promise<{ city: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const e = await getEvent((await params).city);
  if (!e) return {};
  const title = `OFF GRAVITY ${e.city}, ${fullDates(e.start, e.end)}`;
  const description = `India's first play-fitness festival comes to ${e.city}: a timed inflatable obstacle race plus a festival. ${DISCLAIMER}`;
  return {
    title,
    description,
    alternates: { canonical: `/events/${e.slug}` },
    openGraph: { title, description, images: ["/assets/art/campaign-poster.jpg"], type: "website" },
  };
}

const EXP: Record<string, { name: string; line: string; tag: string }> = {
  race: { name: "Timed race", line: "Climb, slide and sprint the inflatable course in your wave.", tag: "Timed" },
  movement: { name: "Movement & wellness", line: "Guided movement sessions between the racing.", tag: "Both days" },
  recovery: { name: "Recovery village", line: "A dedicated space to cool down, rest and recover.", tag: "Both days" },
  bazaar: { name: "Fitness & lifestyle bazaar", line: "Discover fitness, lifestyle and wellness brands.", tag: "Both days" },
  family: { name: "Family & kids' waves", line: "Waves designed for families and younger participants.", tag: "Family" },
  glow: { name: "Glow Night", line: "Music, lights and festival energy after the racing.", tag: "Saturday" },
};

export default async function CityPage({ params }: P) {
  const slug = (await params).city;
  const [e, all] = await Promise.all([getEvent(slug), getEvents()]);
  if (!e) notFound();
  const c = COLOURS[e.colour] ?? COLOURS.mint;
  const faqs = await getFaqs(e.slug, e.city);
  const dates = fullDates(e.start, e.end);
  const jai = e.slug === "jaipur";
  const sat = parts(e.start);
  const sun = parts(e.end);
  const exps = e.experiences.filter((k) => EXP[k]);
  const ld = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `OFF GRAVITY ${e.city}`,
    startDate: e.start,
    endDate: e.end,
    eventStatus: "https://schema.org/EventScheduled",
    description: `Timed inflatable obstacle race and festival in ${e.city}. ${DISCLAIMER}`,
    organizer: { "@type": "Organization", name: "The Great Inflate Run" },
    image: ["/assets/art/campaign-poster.jpg"],
  };
  return (
    <>
      <SiteNav />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
        <nav aria-label="Choose a city" className="border-b border-ink/10 bg-cream">
          <ul className="container-og flex gap-3 overflow-x-auto py-4">
            {all.map((x) => (
              <li key={x.slug}>
                <Link
                  href={`/events/${x.slug}`}
                  aria-current={x.slug === e.slug ? "page" : undefined}
                  className={`inline-block whitespace-nowrap rounded-full px-5 py-2 text-[16px] font-bold ${x.slug === e.slug ? "bg-ink text-white" : "bg-white text-ink"}`}
                >
                  {x.city}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section style={{ background: c.bg, color: c.fg }}>
          <div className="container-og grid gap-12 py-[clamp(64px,8vw,120px)] md:grid-cols-[1.3fr_1fr] md:items-end">
            <div>
              <p className="mb-6 font-bold">
                <Link href="/#tour" className="underline underline-offset-4">2027 tour</Link> / Season {e.season}
              </p>
              <h1 className="t-section-lg" style={{ fontSize: "clamp(56px,11vw,168px)", overflowWrap: "anywhere" }}>{e.city}</h1>
              {e.tag && (
                <p className="mt-6 inline-block rounded-full px-4 py-1.5 text-[15px] font-bold" style={{ background: c.panel }}>{e.tag}</p>
              )}
            </div>
            <div className="rounded-[26px] p-7" style={{ background: c.panel }}>
              <p className="text-[20px] font-extrabold">{dates}</p>
              <ul className="mt-4 space-y-2 text-[18px]">
                <li><strong>{sat.weekday}</strong> {sat.day} {sat.month}</li>
                <li><strong>{sun.weekday}</strong> {sun.day} {sun.month}</li>
              </ul>
              <p className="mt-4 text-[15px]">{DISCLAIMER}</p>
              <div className="mt-6">
                <BookButton href={`/book?city=${e.slug}`}>Book your slot in {e.city}</BookButton>
              </div>
            </div>
          </div>
        </section>

        <section className="section-y">
          <div className="container-og grid gap-10 md:grid-cols-2">
            <h2 className="t-section">OFF GRAVITY comes to {e.city}</h2>
            <div className="t-lead space-y-5 text-text-muted">
              <p>{tbc(e.blurb, `Two days of timed inflatable racing and festival in ${e.city}.`)}</p>
              <p>OFF GRAVITY is India&apos;s first play-fitness festival: a timed inflatable obstacle race with waves, splits and national leaderboards, surrounded by movement and wellness sessions, a recovery village, a fitness and lifestyle bazaar, family and kids&apos; waves and a Saturday Glow Night.</p>
            </div>
          </div>
        </section>

        <section className="pb-[var(--section-y)]">
          <div className="container-og">
            <h2 className="t-section mb-12">At this event</h2>
            <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {exps.map((k) => (
                <li key={k} className="rounded-[26px] bg-white p-7">
                  <span className="inline-block rounded-full bg-lilac-tint px-3 py-1 text-[14px] font-bold">{k === "glow" && jai ? "Evening" : EXP[k].tag}</span>
                  <h3 className="t-card mt-4">{EXP[k].name}</h3>
                  <p className="mt-2 text-text-muted">{EXP[k].line}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section-y bg-cobalt text-white">
          <div className="container-og grid gap-10 md:grid-cols-[1fr_1.2fr]">
            <h2 className="t-section">The race</h2>
            <dl className="grid gap-px overflow-hidden rounded-[26px] bg-white/20 sm:grid-cols-2">
              {[
                ["Format", "Timed race"],
                ["Results", "National leaderboard"],
                ["Distance and obstacles", [e.distance, e.obstacles].filter(Boolean).join(" · ") || "[TBC]"],
                ["Wave times", tbc(e.waveTimes)],
              ].map(([k, v]) => (
                <div key={k} className="bg-cobalt-deep p-6">
                  <dt className="text-[15px] text-on-cobalt">{k}</dt>
                  <dd className="mt-1 text-[22px] font-extrabold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="section-y">
          <div className="container-og">
            <h2 className="t-section mb-12">Know before you go</h2>
            <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Venue", tbc(e.venue)],
                ["Gates open", tbc(e.gatesOpen, jai ? "[Evening timings TBC]" : "[TBC]")],
                ["Registration closes", tbc(e.registrationCloses)],
                ["Age and eligibility", "Listed per ticket"],
              ].map(([k, v]) => (
                <div key={k} className="border-t-2 border-ink pt-4">
                  <dt className="text-[15px] font-bold text-text-muted">{k}</dt>
                  <dd className="mt-1 text-[20px] font-extrabold">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-8 text-text-muted">{DISCLAIMER}</p>
          </div>
        </section>

        <section id="faqs" className="pb-[var(--section-y)] scroll-mt-24">
          <div className="container-og max-w-[960px]">
            <h2 className="t-section mb-10">FAQs</h2>
            <Faq items={faqs} />
          </div>
        </section>

        <section className="bg-mint py-20 text-center">
          <div className="container-og">
            <p className="t-section">{e.city}, {dates}</p>
            <div className="mt-8">
              <BookButton href={`/book?city=${e.slug}`}>Book your slot</BookButton>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
