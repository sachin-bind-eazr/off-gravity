"use client";
import Link from "next/link";
import { ArrowIcon } from "@/components/site/BookButton";
import { fmtFull } from "../format";
import { editionLabel } from "./labels";
import "./cityticket.css";

type Props = {
  slug: string; city: string; code: string; stop: number; total: number; start: string; end: string;
  stub: { bg: string; fg: string; dark: boolean };
  mode: "waitlist" | "book" | "none";
  inLine?: number | null;
  onJoin: () => void;
};

/** Premium waitlist ticket for the selected city. Shows only what the city list doesn't: the action. */
export function CityTicket({ slug, city, code, stop, total, start, end, stub, mode, inLine, onJoin }: Props) {
  const book = mode === "book";
  return (
    <div className="ct" style={{ ["--stub-bg" as string]: stub.bg, ["--stub-fg" as string]: stub.fg }}>
      <div className="ct-stub">
        <div className="ct-stub-top">
          <span>Stop {stop} of {total}</span>
          <span className="ct-pill">{editionLabel(slug)}</span>
        </div>
        <h3 className="ct-city">{city}</h3>
        <p className="ct-dates">{fmtFull(start, end)}</p>
      </div>
      <div className="ct-body">
        <p className="ct-head">{book ? `Book ${city}` : `Join the ${city} waitlist`}</p>
        <p className="ct-line">{book ? "Pick your day and entry, then lock in your slot." : "Be first in line when tickets go live. Waitlist members get early access and the lowest prices."}</p>
        <div className="ct-actions">
          {book
            ? <Link href={`/book?city=${slug}`} className="btn-primary ct-btn">Book {city}<ArrowIcon /></Link>
            : <button type="button" onClick={onJoin} className="btn-primary ct-btn">Join the waitlist<ArrowIcon /></button>}
          <Link href={`/events/${slug}`} className="link-secondary ct-link">Event details</Link>
        </div>
        <p className="ct-code">
          <span>OG-{code}-WL</span>
          {!book && inLine != null && <span>{inLine.toLocaleString("en-IN")} already in line</span>}
        </p>
      </div>
    </div>
  );
}
