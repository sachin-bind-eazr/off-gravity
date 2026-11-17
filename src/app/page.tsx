import { SiteNav, SiteFooter } from "@/components/site";
import { getEvents } from "@/lib/events";
import { ctaFor } from "@/lib/cta";
import { WaitlistProvider } from "@/components/waitlist";
import { Hero } from "@/components/home/Hero";
import { Story } from "@/components/home/story/Story";
import dynamic from "next/dynamic";
const Obstacles = dynamic(() => import("@/components/home/obstacles/Obstacles"));
const Tour = dynamic(() => import("@/components/home/Tour").then((m) => m.Tour));
import { FinalCta } from "@/components/home/FinalCta";
import { HeaderCta } from "@/components/home/HeaderCta";

export const revalidate = 60;

export default async function Home() {
  const events = await getEvents();
  return (
      <WaitlistProvider cities={events.filter((e) => e.status === "WAITLIST_OPEN").map((e) => ({ slug: e.slug, city: e.city }))}>
        <SiteNav overlay cta={<HeaderCta mode={ctaFor(events)} />} />
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
