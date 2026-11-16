"use client";
import { useState } from "react";
import { adminFetch } from "./api";
import { Text, Area, Check, Panel, Notice, Field, inputCls, btnPrimary } from "./ui";

export type EventForm = {
  id: number; city: string; tag: string; blurb: string; colour: string; status: string; startDate: string; endDate: string;
  venue: string; gatesOpen: string; registrationCloses: string; distance: string; obstacles: string; waveTimes: string; experiences: string[];
};
const STATUSES = [["PROVISIONAL", "Provisional"], ["CONFIRMED", "Confirmed"], ["WAITLIST_OPEN", "Waitlist open"], ["SALES_OPEN", "Sales open"], ["SALES_CLOSED", "Sales closed"], ["CANCELLED", "Cancelled"]];
const EXPERIENCES = [["race", "Timed race"], ["movement", "Movement & wellness"], ["recovery", "Recovery village"], ["bazaar", "Fitness & lifestyle bazaar"], ["family", "Family & kids' waves"], ["glow", "Glow Night"]];
const COLOURS = ["mint", "lilac", "cobalt", "white", "night", "ink"];

export function EventEditor({ event }: { event: EventForm }) {
  const [f, setF] = useState(event);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<{ k: "ok" | "err"; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof EventForm>(k: K, v: EventForm[K]) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    setBusy(true); setMsg(null);
    const { id, ...body } = f;
    const { ok, data } = await adminFetch(`/api/admin/events/${id}`, "PUT", body);
    setBusy(false);
    setMsg(ok ? { k: "ok", t: "Saved." } : { k: "err", t: data.error ?? "Could not save." });
  }
  return (
    <Panel>
      <button className="flex w-full cursor-pointer items-center justify-between text-left" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="text-xl font-extrabold">{f.city} <span className="text-base font-semibold text-text-muted">{f.startDate} to {f.endDate} · {f.status.replace("_", " ").toLowerCase()}</span></span>
        <span aria-hidden>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Text label="City" value={f.city} onChange={(v) => set("city", v)} />
          <Field label="Status"><select className={inputCls} value={f.status} onChange={(e) => set("status", e.target.value)}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
          <Text label="Start date" type="date" value={f.startDate} onChange={(v) => set("startDate", v)} />
          <Text label="End date" type="date" value={f.endDate} onChange={(v) => set("endDate", v)} />
          <Text label="Tag" value={f.tag} onChange={(v) => set("tag", v)} hint="e.g. Tour opener, Evening edition" />
          <Field label="Tour colour"><select className={inputCls} value={f.colour} onChange={(e) => set("colour", e.target.value)}>{COLOURS.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <div className="sm:col-span-2"><Area label="City blurb (one line)" rows={2} value={f.blurb} onChange={(v) => set("blurb", v)} /></div>
          <Text label="Venue" value={f.venue} onChange={(v) => set("venue", v)} />
          <Text label="Gates open" value={f.gatesOpen} onChange={(v) => set("gatesOpen", v)} />
          <Text label="Registration closes" value={f.registrationCloses} onChange={(v) => set("registrationCloses", v)} />
          <Text label="Distance" value={f.distance} onChange={(v) => set("distance", v)} />
          <Text label="Obstacles" value={f.obstacles} onChange={(v) => set("obstacles", v)} />
          <Text label="Wave times" value={f.waveTimes} onChange={(v) => set("waveTimes", v)} />
          <fieldset className="grid gap-2 sm:col-span-2"><legend className="mb-1 font-bold">Experiences on at this event</legend>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {EXPERIENCES.map(([v, l]) => <Check key={v} label={l} checked={f.experiences.includes(v)} onChange={(c) => set("experiences", c ? [...f.experiences, v] : f.experiences.filter((x) => x !== v))} />)}
            </div>
          </fieldset>
          <div className="flex items-center gap-4 sm:col-span-2">
            <button className={btnPrimary} onClick={save} disabled={busy}>{busy ? "Saving…" : "Save event"}</button>
            {msg && <Notice kind={msg.k}>{msg.t}</Notice>}
          </div>
        </div>
      )}
    </Panel>
  );
}
