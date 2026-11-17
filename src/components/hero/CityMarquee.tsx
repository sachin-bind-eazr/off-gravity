"use client";
import type { Ref } from "react";
import type { TicketCity } from "./tourTicket";

type Props = {
  cities: TicketCity[];
  active: number;
  onPick: (idx: number) => void;
  /** keyboard focus on a first-set city (brings it into view at the ticket edge) */
  onFocusItem?: (idx: number, el: HTMLElement) => void;
  onBlurItem?: () => void;
  /** city with keyboard focus: both copies draw the focus ring, so it shows on whichever copy is on screen */
  focused?: number | null;
  marqueeRef?: Ref<HTMLDivElement>;
  trackRef?: Ref<HTMLDivElement>;
};

function Arrow() {
  return (
    // the nudge animates the HTML wrapper (compositable), not the <svg> itself
    <span className="tts-arrow" aria-hidden="true">
      <svg viewBox="0 0 56 20" fill="none" focusable="false">
        <path d="M2 10H52M44 3l9 7-9 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </span>
  );
}

/** Six city names in tour order, duplicated once; the track loops translateX(0 → -50%). */
export function CityMarquee({ cities, active, onPick, onFocusItem, onBlurItem, focused = null, marqueeRef, trackRef }: Props) {
  const set = (dup: boolean) => (
    <div className={`tts-set${dup ? " tts-set--dup" : ""}`}>
      {cities.map((c, i) => (
        <button
          key={c.slug}
          type="button"
          className="tts-item"
          data-idx={i}
          data-active={i === active ? "true" : undefined}
          data-focus={i === focused ? "true" : undefined}
          aria-hidden={dup ? "true" : undefined}
          tabIndex={dup ? -1 : undefined}
          aria-label={dup ? undefined : `Show ${c.city} on the ticket`}
          onClick={() => onPick(i)}
          onFocus={dup ? undefined : (e) => onFocusItem?.(i, e.currentTarget)}
          onBlur={dup ? undefined : onBlurItem}
        >
          <span className="tts-name">{c.city}</span>
          <Arrow />
        </button>
      ))}
    </div>
  );
  return (
    <div ref={marqueeRef} className="tts-marquee">
      <div ref={trackRef} className="tts-track">
        {set(false)}
        {set(true)}
      </div>
    </div>
  );
}
