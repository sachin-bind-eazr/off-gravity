"use client";
import { useState } from "react";
import { adminFetch } from "./api";
import { Text, Area, Check, Panel, Notice, Field, inputCls, btnPrimary, btnGhost } from "./ui";
import { ticketStatus, ticketReady, SALE_BLOCK_MESSAGE, TICKET_TIER_KEYS, STUB_COLOURS } from "@/lib/schemas/admin";

export type TicketForm = {
  id: number; name: string; description: string; priceRupees: string; gstMode: string; capacity: string;
  minPerBooking: number; maxPerBooking: number; days: string[]; salesOpen: string; salesClose: string;
  eligibility: string; requiresDob: boolean; active: boolean;
  tierKey: string; hook: string; perks: string[]; stubColour: string; showOnHomepage: boolean; mostPicked: boolean; limited: boolean; sortOrder: number;
};
const toPaise = (s: string) => (s.trim() === "" || isNaN(Number(s)) ? null : Math.round(Number(s) * 100));
const toInt = (s: string) => (s.trim() === "" || isNaN(Number(s)) ? null : Math.floor(Number(s)));

export function NewTicketButton({ eventId }: { eventId: number }) {
  return <div><button className={btnGhost} onClick={async () => { await adminFetch("/api/admin/tickets", "POST", { eventId }); location.reload(); }}>+ Add ticket type</button></div>;
}

export function TicketEditor({ ticket }: { ticket: TicketForm }) {
  const [f, setF] = useState(ticket);
  const [msg, setMsg] = useState<{ k: "ok" | "err"; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof TicketForm>(k: K, v: TicketForm[K]) => setF((p) => ({ ...p, [k]: v }));
  const pricePaise = toPaise(f.priceRupees), capacity = toInt(f.capacity);
  const ready = ticketReady({ pricePaise, capacity, salesOpen: f.salesOpen, salesClose: f.salesClose });
  const status = ticketStatus({ pricePaise, capacity, salesOpen: f.salesOpen, salesClose: f.salesClose, active: f.active });

  async function save() {
    setBusy(true); setMsg(null);
    const { ok, data } = await adminFetch(`/api/admin/tickets/${f.id}`, "PUT", {
      name: f.name, description: f.description, pricePaise, gstMode: f.gstMode, capacity,
      minPerBooking: f.minPerBooking, maxPerBooking: f.maxPerBooking, days: f.days,
      salesOpen: f.salesOpen ? new Date(f.salesOpen + ":00Z").toISOString() : null, salesClose: f.salesClose ? new Date(f.salesClose + ":00Z").toISOString() : null,
      eligibility: f.eligibility, requiresDob: f.requiresDob, active: f.active,
      tierKey: f.tierKey || null, hook: f.hook, perks: f.perks.map((p) => p.trim()).filter(Boolean).slice(0, 4), stubColour: f.stubColour || null,
      showOnHomepage: f.showOnHomepage, mostPicked: f.mostPicked, limited: f.limited, sortOrder: f.sortOrder,
    });
    setBusy(false);
    setMsg(ok ? { k: "ok", t: "Saved." } : { k: "err", t: data.error ?? "Could not save." });
  }
  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold">{f.name || "Untitled ticket"}</h2>
        <span className={`rounded-full px-4 py-1 text-sm font-bold ${status === "On sale" ? "bg-mint" : status === "Ready" ? "bg-lilac" : "bg-ink/10"}`}>{status}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Text label="Name" value={f.name} onChange={(v) => set("name", v)} />
        <Text label="Price per participant (₹)" value={f.priceRupees} onChange={(v) => set("priceRupees", v)} placeholder="Not set" />
        <div className="sm:col-span-2"><Area label="Description" rows={2} value={f.description} onChange={(v) => set("description", v)} /></div>
        <Field label="GST"><select className={inputCls} value={f.gstMode} onChange={(e) => set("gstMode", e.target.value)}><option value="INCLUSIVE">Price includes GST</option><option value="EXCLUSIVE">GST added on top</option></select></Field>
        <Text label="Capacity (per day)" value={f.capacity} onChange={(v) => set("capacity", v)} placeholder="Not set" />
        <Text label="Min per booking" type="number" value={String(f.minPerBooking)} onChange={(v) => set("minPerBooking", Math.max(1, Number(v) || 1))} />
        <Text label="Max per booking" type="number" value={String(f.maxPerBooking)} onChange={(v) => set("maxPerBooking", Math.max(1, Number(v) || 1))} />
        <Text label="Sales open (UTC)" type="datetime-local" value={f.salesOpen} onChange={(v) => set("salesOpen", v)} />
        <Text label="Sales close (UTC)" type="datetime-local" value={f.salesClose} onChange={(v) => set("salesClose", v)} />
        <div className="sm:col-span-2"><Area label="Eligibility text" rows={2} value={f.eligibility} onChange={(v) => set("eligibility", v)} /></div>
        <fieldset className="flex flex-wrap gap-6 sm:col-span-2"><legend className="mb-1 font-bold">Days available</legend>
          {[["SAT", "Saturday"], ["SUN", "Sunday"]].map(([v, l]) => <Check key={v} label={l} checked={f.days.includes(v)} onChange={(c) => set("days", c ? [...f.days, v] : f.days.filter((x) => x !== v))} />)}
        </fieldset>
        <fieldset className="grid gap-4 rounded-2xl bg-cream p-4 sm:col-span-2 sm:grid-cols-2">
          <legend className="px-1 font-bold">Homepage &ldquo;Ways in&rdquo; card</legend>
          <Check label="Show as preview tier on homepage (price TBA until set)" checked={f.showOnHomepage} onChange={(v) => set("showOnHomepage", v)} />
          <Check label="Badge: Most popular" checked={f.mostPicked} onChange={(v) => set("mostPicked", v)} />
          <Check label="Badge: Limited" checked={f.limited} onChange={(v) => set("limited", v)} />
          <Field label="Tier"><select className={inputCls} value={f.tierKey} onChange={(e) => set("tierKey", e.target.value)}><option value="">None</option>{TICKET_TIER_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}</select></Field>
          <Field label="Stub colour"><select className={inputCls} value={f.stubColour} onChange={(e) => set("stubColour", e.target.value)}><option value="">Default</option>{STUB_COLOURS.map((k) => <option key={k} value={k}>{k}</option>)}</select></Field>
          <Text label="Hook (one line)" value={f.hook} onChange={(v) => set("hook", v)} />
          <Text label="Sort order" type="number" value={String(f.sortOrder)} onChange={(v) => set("sortOrder", Math.max(0, Math.floor(Number(v) || 0)))} />
          {[0, 1, 2, 3].map((i) => <Text key={i} label={`Perk ${i + 1}`} value={f.perks[i] ?? ""} onChange={(v) => { const p = [...f.perks]; while (p.length < 4) p.push(""); p[i] = v; set("perks", p); }} />)}
        </fieldset>
        <Check label="Date of birth required" checked={f.requiresDob} onChange={(v) => set("requiresDob", v)} />
        <div>
          <Check label="On sale" checked={f.active} onChange={(v) => set("active", v)} />
          {!ready && <p className="mt-1 text-sm text-text-muted">{SALE_BLOCK_MESSAGE}</p>}
        </div>
        <div className="flex items-center gap-4 sm:col-span-2">
          <button className={btnPrimary} onClick={save} disabled={busy}>{busy ? "Saving…" : "Save ticket"}</button>
          {msg && <Notice kind={msg.k}>{msg.t}</Notice>}
        </div>
      </div>
    </Panel>
  );
}
