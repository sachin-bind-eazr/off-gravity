import { SiteNav, SiteFooter } from "@/components/site";
import { getEvents } from "@/lib/events";
import { ctaFor } from "@/lib/cta";
import { WaitlistProvider } from "@/components/waitlist";
import { Hero } from "@/components/home/Hero";
import { Story } from "@/components/home/story/Story";
import { Obstacles } from "@/components/home/obstacles";
import { Tour } from "@/components/home/Tour";
import { FinalCta } from "@/components/home/FinalCta";
import { HeaderCta } from "@/components/home/HeaderCta";

export const revalidate = 60;

export default async function Home() {
  const events = await getEvents();
  return (
      <WaitlistProvider cities={events.filter((e) => e.status === "WAITLIST_OPEN").map((e) => ({ slug: e.slug, city: e.city }))}>
        <SiteNav cta={<HeaderCta mode={ctaFor(events)} />} />
        <main id="main">
          <Hero events={events} />
          <Story />
          <Obstacles />
          <Tour events={events} />
          <FinalCta events={events} />
        </main>
        <SiteFooter />
      </WaitlistProvider>
  );
}
