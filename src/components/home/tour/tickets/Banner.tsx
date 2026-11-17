"use client";
import { Button } from "@/components/ui/Button";

export function WaitlistBanner({ onJoin }: { onJoin: () => void }) {
  return (
    <div className="tk-banner">
      <div className="tk-banner-copy">
        <p className="t-kicker on-dark">Waitlist early access</p>
        <h3 className="t-h3">Get priority access and the lowest ticket prices.</h3>
        <p className="t-body">When sales open, waitlist members get first pick of every tier, in every city.</p>
      </div>
      <div className="tk-banner-act"><Button variant="primary" size="lg" onClick={onJoin}>Join the waitlist</Button></div>
    </div>
  );
}
