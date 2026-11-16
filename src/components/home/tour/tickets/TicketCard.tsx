"use client";
import { useRef } from "react";
import Link from "next/link";
import { ArrowIcon } from "@/components/site/BookButton";
import { STUB, TIER_NUMBER, inr, type TierCard } from "./types";

type Mode = "waitlist" | "book" | "none";

export function TicketCard({ tier, index, slug, cityCode, mode, onHold }: { tier: TierCard; index: number; slug: string; cityCode: string; mode: Mode; onHold: (tier: TierCard) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const s = STUB[tier.stubColour];
  const n = String(TIER_NUMBER[tier.tierKey] ?? index + 1).padStart(2, "0");
  const code = `OG-${cityCode}-T${n}`;
  const labelId = `tk-${slug}-${tier.id}`;

  const move = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-py * 8).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(px * 8).toFixed(2)}deg`);
  };
  const leave = () => { const el = ref.current; if (!el) return; el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); };
  const click = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a,button")) return;
    if (mode === "waitlist") onHold(tier);
    else if (mode === "book") window.location.assign(`/book?city=${slug}`);
  };

  return (
    <li className="tk-li" style={{ ["--i" as string]: index }}>
      <div ref={ref} className={`tk${mode !== "none" ? " tk--live" : ""}`} onPointerMove={move} onPointerLeave={leave} onClick={click}>
        <article className="tk-face" aria-labelledby={labelId}>
          <div className={`tk-stub tk-stub--${tier.stubColour}`} style={{ background: s.bg, color: s.fg, ["--glow" as string]: s.glow }}>
            {tier.mostPicked && <span className="tk-pick">Most picked</span>}
            <span className="tk-num" aria-hidden="true">{n}</span>
            <div className="tk-stub-copy">
              <h4 id={labelId} className="tk-name">{tier.name}</h4>
              {tier.hook && <p className="tk-hook">{tier.hook}</p>}
            </div>
          </div>
          <div className="tk-perf" aria-hidden="true" />
          <div className="tk-body">
            <div className="tk-price">
              <span className="tk-price-label">Price</span>
              {tier.priceFromPaise
                ? <><span className="tk-price-val">From {inr(tier.priceFromPaise)}</span><span className="tk-price-note">per participant · {tier.gstMode === "INCLUSIVE" ? "incl. GST" : "+ GST"}</span></>
                : <span className="tk-price-val">Announced soon</span>}
            </div>
            <ul className="tk-perks">
              {tier.perks.slice(0, 4).map((p) => <li key={p}><span aria-hidden="true" className="tk-dot" />{p}</li>)}
            </ul>
            <div className="tk-foot">
              {mode === "waitlist" && <button type="button" className="tk-btn" onClick={() => onHold(tier)}>Hold my spot<ArrowIcon /></button>}
              {mode === "book" && <Link href={`/book?city=${slug}`} className="tk-btn">Book this tier<ArrowIcon /></Link>}
              {mode === "none" && <p className="tk-soon">Opening soon</p>}
              <p className="tk-code" aria-label={`Ticket code ${code}`}>{code}</p>
            </div>
          </div>
        </article>
      </div>
    </li>
  );
}
