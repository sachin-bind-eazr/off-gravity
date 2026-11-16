import Link from "next/link";
import { Logo } from "./Logo";
import { TOUR } from "@/lib/tour";
import { HOME } from "@/content/home";

const head = "mb-4 text-[16px] font-extrabold text-white";
const link = "block py-1.5 text-[16px] text-on-dark hover:text-mint";
const plain = "block py-1.5 text-[16px] text-on-dark";

export function SiteFooter() {
  return (
    <footer className="bg-ink-deep text-on-dark">
      <div className="mx-auto grid max-w-[1312px] grid-cols-2 gap-x-8 gap-y-10 px-[var(--pad)] py-[var(--section-y-tight)] min-[860px]:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="col-span-2 min-[860px]:col-span-1">
          <Logo height={64} />
          <p className="mt-5 max-w-[320px] text-[16px]">{HOME.footer.blurb}</p>
        </div>
        <nav aria-label="Footer">
          <h2 className={head}>Explore</h2>
          <Link className={link} href="/#about">About</Link>
          <Link className={link} href="/#obstacles">Obstacles</Link>
          <Link className={link} href="/#tour">Tour</Link>
          <Link className={link} href="/book">Tickets</Link>
          <Link className={link} href="/events/mumbai#faqs">FAQs</Link>
          <Link className={link} href="/my-bookings">My bookings</Link>
        </nav>
        <nav aria-label="2027 tour">
          <h2 className={head}>2027 tour</h2>
          {TOUR.map((t) => (
            <Link key={t.slug} className={link} href={`/events/${t.slug}`}>{t.city}</Link>
          ))}
        </nav>
        <div>
          <h2 className={head}>Connect</h2>
          <p className={plain}>{HOME.footer.contactEmail.value}</p>
          <p className={plain}>[Phone TBC]</p>
          <p className={plain}>{HOME.footer.instagram.value}</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1312px] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-[var(--pad)] py-6 text-[14px] text-on-dark">
          <p>&copy; 2027 The Great Inflate Run. Dates are provisional, subject to venue and permission confirmations.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/terms" className="hover:text-mint">Terms &amp; conditions</Link>
            <Link href="/privacy" className="hover:text-mint">Privacy policy</Link>
            <Link href="/refund-policy" className="hover:text-mint">Refund &amp; cancellation</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
