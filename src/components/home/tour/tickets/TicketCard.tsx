"use client";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ACCENT, inr, type TierCard } from "./types";

export function TicketCard({ tier, slug, offCity, jaipurDates, onHold, onSwitch }: {
  tier: TierCard; slug: string; offCity: boolean; jaipurDates: string;
  onHold: (t: TierCard) => void; onSwitch: () => void;
}) {
  const accent = ACCENT[tier.stubColour];
  const priced = !!tier.priceFromPaise;
  return (
    <li className="tk-card" style={{ ["--accent" as string]: accent }}>
      <div className="tk-badges">
        {tier.badge && <span className="tk-badge t-label">{tier.badge === "popular" ? "Most popular" : "Limited"}</span>}
        {offCity && <span className="tk-badge t-label">Jaipur only</span>}
      </div>
      <span className="tk-bar" aria-hidden="true" />
      <h3 className="tk-name t-h3">{tier.name}</h3>
      <p className="tk-hook t-body">{tier.hook}</p>
      <div className="tk-price">
        <p className="tk-price-row">
          <span className="tk-from t-label">From</span>
          <span className="tk-amt t-h3">{priced ? inr(tier.priceFromPaise!) : "TBA"}</span>
          {priced ? <span className="tk-gst t-label">{tier.gstMode === "INCLUSIVE" ? "incl. GST" : "+ GST"}</span> : null}
        </p>
        {offCity && <p className="tk-avail t-label">Available in Jaipur · {jaipurDates}</p>}
      </div>
      <ul className="tk-perks">
        {tier.perks.slice(0, 4).map((p) => (
          <li key={p} className="t-body"><span className="tk-check"><Check size={16} strokeWidth={1.75} aria-hidden /></span><span>{p}</span></li>
        ))}
      </ul>
      <div className="tk-act">
        {offCity ? (
          <Button variant="outline" fullWidth onClick={onSwitch}>Switch to Jaipur</Button>
        ) : tier.purchasable ? (
          <Button variant="outline" fullWidth href={`/book?city=${slug}`}>Book this tier</Button>
        ) : (
          <Button variant="outline" fullWidth onClick={() => onHold(tier)}>Hold my spot</Button>
        )}
      </div>
    </li>
  );
}
