"use client";
import type { Ref } from "react";
import { ArrowRight } from "lucide-react";
import type { TicketCity } from "./tourTicket";

type Props = {
  city: TicketCity;
  /** "Next stop" or "Stop 03 · Season 1" */
  label: string;
  /** "73d 07h 41m" / "Live now" */
  count: string;
  index: number;
  /** "a" | "b" alternates on every city change to restart the punch keyframes; null before the first change */
  punch: "a" | "b" | null;
  onActivate: () => void;
  ref?: Ref<HTMLButtonElement>;
};

/** The festival ticket: mint main panel, punched perforation, torn-off stub. */
export function TourTicket({ city, label, count, index, punch, onActivate, ref }: Props) {
  const stopNo = String(city.stop).padStart(2, "0");
  const aria = city.mode === "book"
    ? `Book tickets for ${city.city}, ${city.dates}, provisional`
    : city.mode === "none"
      ? `See ${city.city} event details, ${city.dates}, provisional`
      : `Join the ${city.city} waitlist, ${city.dates}, provisional`;
  const action = city.mode === "book" ? "Book" : city.mode === "none" ? "Details" : "Join";
  return (
    <button ref={ref} type="button" className="tts-ticket" data-slug={city.slug} data-idx={index} aria-label={aria} onClick={onActivate}>
      <span className={`tts-inner${punch ? ` tts-punch-${punch}` : ""}`}>
        <span className="tts-main">
          <span className="tts-row1">
            <span className="tts-label">{label}</span>
            <span className="tts-brand">OFF GRAVITY 2027</span>
          </span>
          <span className="tts-city">{city.city}</span>
          <span className="tts-count">{count}</span>
          <span className="tts-dates"><span className="tts-nw">{city.dates}</span> <span className="tts-nw">· Provisional</span></span>
        </span>
        <span className="tts-perf" aria-hidden="true" />
        <span className="tts-stub" aria-hidden="true">
          <span className="tts-stub-label">Stop</span>
          <span className="tts-stopno">{stopNo}</span>
          <span className="tts-barcode" />
          <span className="tts-join">{action} <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" /></span>
        </span>
      </span>
    </button>
  );
}
