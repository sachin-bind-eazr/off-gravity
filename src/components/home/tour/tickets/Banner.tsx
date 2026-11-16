"use client";
import { ArrowIcon } from "@/components/site/BookButton";

export function WaitlistBanner({ onJoin }: { onJoin: () => void }) {
  return (
    <div className="tk-banner">
      <div className="tk-banner-copy">
        <p className="tk-banner-kicker">Waitlist early access</p>
        <h4 className="tk-banner-h">Get priority access and the lowest ticket prices.</h4>
        <p className="tk-banner-p">When sales open, waitlist members get first pick of every tier, in every city.</p>
      </div>
      <button type="button" className="tk-banner-btn" onClick={onJoin}>Join the waitlist<ArrowIcon /></button>
    </div>
  );
}
