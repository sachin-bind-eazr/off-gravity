import { Suspense } from "react";
import type { Metadata } from "next";
import { SiteNav, SiteFooter } from "@/components/site";
import BookingFlow from "@/components/booking/BookingFlow";

export const metadata: Metadata = { title: "Book your slot", description: "Pick your city, day and entry, then pay securely to lock in your OFF GRAVITY slot." };

export default function BookPage() {
  return (
    <>
      <SiteNav />
      <main id="main" className="min-h-[70vh]">
        <Suspense fallback={<div className="container-og py-20">Loading…</div>}>
          <BookingFlow />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
