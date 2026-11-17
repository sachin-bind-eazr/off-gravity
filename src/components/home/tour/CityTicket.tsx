"use client";
import { Button } from "@/components/ui/Button";
import { fmtFull } from "../format";
import { editionLabel } from "./labels";
import "./cityticket.css";

type Props = {
  slug: string; city: string; code: string; stop: number; total: number; start: string; end: string;
  mode: "waitlist" | "book" | "none";
  inLine?: number | null;
  onJoin: () => void;
};

/** Waitlist card for the selected city. Shows only what the city list doesn't: the action. */
export function CityTicket({ slug, city, code, stop, total, start, end, mode, inLine, onJoin }: Props) {
  const book = mode === "book";
  return (
    <div className="ct">
      <p className="ct-stop t-label">Stop {stop} of {total} · {editionLabel(slug)}</p>
      <h3 className="ct-city t-h3">{city}</h3>
      <p className="ct-dates t-body">{fmtFull(start, end)}</p>
      <p className="ct-head t-body">{book ? `Book ${city}` : `Join the ${city} waitlist`}</p>
      <p className="ct-line t-body">{book ? "Pick your day and entry, then lock in your slot." : "Be first in line when tickets go live. Early access and the lowest prices."}</p>
      <div className="ct-actions">
        {book
          ? <Button variant="primary" fullWidth href={`/book?city=${slug}`}>Book {city}</Button>
          : <Button variant="primary" fullWidth onClick={onJoin}>Join the waitlist</Button>}
        <Button variant="outline" fullWidth href={`/events/${slug}`}>Event details</Button>
      </div>
      <p className="ct-code t-label">
        <span>OG-{code}-WL</span>
        {!book && inLine != null && <span>{inLine.toLocaleString("en-IN")} already in line</span>}
      </p>
    </div>
  );
}
