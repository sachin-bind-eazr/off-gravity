import type { Metadata } from "next";
import { SiteNav, SiteFooter } from "@/components/site";
import { MyBookings } from "@/components/my-bookings/MyBookings";

export const metadata: Metadata = { title: "My bookings", robots: { index: false } };

export default function Page() {
  return (
    <>
      <SiteNav />
      <main className="container-og section-y" style={{ paddingBlock: "clamp(60px,8vw,110px)" }}>
        <h1 className="t-section">My bookings</h1>
        <p className="t-lead mt-4 max-w-xl text-text-muted">Enter the email you booked with. We&apos;ll send a 6-digit code, no password needed.</p>
        <MyBookings />
      </main>
      <SiteFooter />
    </>
  );
}
