"use client";
import Link from "next/link";
import { ArrowIcon } from "@/components/site/BookButton";
import { ACCENT, inr, type TierCard } from "./types";

function Check({ colour }: { colour: string }) {
  const stroke = colour === "#B8A6F4" ? "#6E58C9" : colour === "#02D69C" ? "#00916A" : colour;
  return (
    <svg className="tk-check" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="9" cy="9" r="9" fill={colour} fillOpacity=".22" />
      <path d="M5.2 9.4l2.4 2.4 5.2-5.6" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TicketCard({ tier, index, slug, dim, jaipurDates, onHold, onSwitch }: {
  tier: TierCard; index: number; slug: string; dim: boolean; jaipurDates: string;
  onHold: (t: TierCard) => void; onSwitch: () => void;
}) {
  const accent = ACCENT[tier.stubColour];
  const night = tier.stubColour === "night";
  return (
    <li className={`tk-card${night ? " tk-card--night" : ""}${dim ? " tk-card--dim" : ""}`} style={{ ["--i" as string]: index, ["--accent" as string]: accent }}>
      {tier.badge && <span className={`tk-badge tk-badge--${tier.badge}`}>{tier.badge === "popular" ? "Most popular" : "Limited"}</span>}
      <div className="tk-body">
        <span className="tk-bar" aria-hidden="true" />
        <h4 className="tk-name">{tier.name}</h4>
        <p className="tk-hook">{tier.hook}</p>
        <p className="tk-price">
          <span className="tk-from">From</span>
          <span className="tk-amt">{tier.priceFromPaise ? inr(tier.priceFromPaise) : "TBA"}</span>
          {tier.priceFromPaise ? <span className="tk-gst">{tier.gstMode === "INCLUSIVE" ? "incl. GST" : "+ GST"}</span> : null}
        </p>
        <ul className="tk-perks">
          {tier.perks.slice(0, 4).map((p) => <li key={p}><Check colour={accent} /><span>{p}</span></li>)}
        </ul>
      </div>
      <div className="tk-act">
        {dim ? (
          <button type="button" className="tk-btn" onClick={onSwitch}>Available in Jaipur · {jaipurDates}<ArrowIcon /></button>
        ) : tier.purchasable ? (
          <Link href={`/book?city=${slug}`} className="tk-btn">Book this tier<ArrowIcon /></Link>
        ) : (
          <button type="button" className="tk-btn" onClick={() => onHold(tier)}>Hold my spot<ArrowIcon /></button>
        )}
      </div>
    </li>
  );
}
