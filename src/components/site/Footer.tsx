import "./nav.css";
import Link from "next/link";
import { Logo } from "./Logo";
import { Section } from "@/components/ui/Container";
import { TOUR } from "@/lib/tour";
import { HOME } from "@/content/home";

const colHead = "t-kicker on-dark";
/* unconfirmed contact details (see HOME.footer, flagged confirm): muted, not link-styled, until the client supplies real ones */
const plain = "og-footer__plain t-body";

export function SiteFooter() {
  return (
    <Section as="footer" tone="none" className="og-footer">
      <div className="grid-12">
        <div className="col-span-12 md:col-span-6 lg:col-span-3">
          <Logo height={64} className="og-logo" />
          <p className="t-body mt-6 max-w-[320px]">{HOME.footer.blurb}</p>
        </div>
        <nav aria-label="Footer" className="col-span-6 lg:col-span-3">
          <h2 className={colHead}>Explore</h2>
          <div className="og-footer__links t-body">
            <Link href="/#about">About</Link>
            <Link href="/#obstacles">Obstacles</Link>
            <Link href="/#tour">Tour</Link>
            <Link href="/book">Tickets</Link>
            <Link href="/events/mumbai#faqs">FAQs</Link>
            <Link href="/my-bookings">My bookings</Link>
          </div>
        </nav>
        <nav aria-label="2027 tour" className="col-span-6 lg:col-span-3">
          <h2 className={colHead}>2027 tour</h2>
          <div className="og-footer__links t-body">
            {TOUR.map((t) => (<Link key={t.slug} href={`/events/${t.slug}`}>{t.city}</Link>))}
          </div>
        </nav>
        <div className="col-span-12 md:col-span-6 lg:col-span-3">
          <h2 className={colHead}>Connect</h2>
          <div className="og-footer__links">
            <p className={plain} data-confirm="true" title={HOME.footer.contactEmail.note}>{HOME.footer.contactEmail.value}</p>
            <p className={plain} data-confirm="true">[Phone TBC]</p>
            <p className={plain} data-confirm="true" title={HOME.footer.instagram.note}>{HOME.footer.instagram.value}</p>
          </div>
        </div>
      </div>
      <div className="og-footer__bar t-label">
        <p>&copy; 2027 The Great Inflate Run. Dates are provisional, subject to venue and permission confirmations.</p>
        <nav aria-label="Legal">
          <Link href="/terms">Terms &amp; conditions</Link>
          <Link href="/privacy">Privacy policy</Link>
          <Link href="/refund-policy">Refund &amp; cancellation</Link>
        </nav>
      </div>
    </Section>
  );
}
