"use client";
import { useEffect, useState } from "react";
import { adminFetch } from "./api";
import { Panel, Text, Notice, inputCls, btnPrimary, btnGhost, Field } from "./ui";

type Ev = { id: number; city: string; status: string; count: number };
type Row = { id: number; reference: string; city: string; email: string; name: string; whatsapp: string; tier: string; partySize: number; whatsappOptIn: string; source: string; joined: string };
type TierCount = { eventId: number; tier: string; count: number };
const TIERS = [["solo", "Solo runner"], ["squad", "Squad pack"], ["glow", "Glow Night pass"], ["family", "Parent-child duo"], ["undecided", "Not sure yet"]] as const;

export function WaitlistAdmin({ events, threshold, earlyBirdHours, canExport, canEditSettings }: {
  events: Ev[]; threshold: string; earlyBirdHours: string; canExport: boolean; canEditSettings: boolean;
}) {
  const [eventId, setEventId] = useState<string>(String(events[0]?.id ?? ""));
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("");
  const [tierCounts, setTierCounts] = useState<TierCount[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [th, setTh] = useState(threshold);
  const [eb, setEb] = useState(earlyBirdHours);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      const p = new URLSearchParams();
      if (eventId) p.set("event", eventId);
      if (q.trim()) p.set("q", q.trim());
      if (tier) p.set("tier", tier);
      const { ok, data } = await adminFetch(`/api/admin/waitlist?${p}`, "GET");
      setLoading(false);
      if (ok) { setRows(data.rows); setTotal(data.total); setTierCounts(data.tierCounts ?? []); }
    }, 250);
    return () => clearTimeout(t);
  }, [eventId, q, tier]);

  async function saveSettings() {
    const n = Number(th);
    if (!Number.isInteger(n) || n < 0) return setMsg({ kind: "err", text: "Threshold must be a whole number, 0 or more." });
    if (eb.trim() && (!Number.isInteger(Number(eb)) || Number(eb) < 1)) return setMsg({ kind: "err", text: "Early-bird window must be a whole number of hours, or blank." });
    const a = await adminFetch("/api/admin/content", "PUT", { key: "waitlist.threshold", body: String(n) });
    const b = await adminFetch("/api/admin/content", "PUT", { key: "earlybird.hours", body: eb.trim() });
    setMsg(a.ok && b.ok ? { kind: "ok", text: "Saved." } : { kind: "err", text: "Couldn't save settings." });
  }

  const exportHref = `/api/admin/waitlist?export=1${eventId ? `&event=${eventId}` : ""}${q.trim() ? `&q=${encodeURIComponent(q.trim())}` : ""}${tier ? `&tier=${tier}` : ""}`;
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-extrabold">Waitlist</h1>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {events.map((e) => (
          <button key={e.id} type="button" onClick={() => setEventId(String(e.id))} className={`cursor-pointer rounded-2xl p-4 text-left ${String(e.id) === eventId ? "bg-ink text-white" : "bg-white"}`}>
            <span className="block text-sm font-bold opacity-80">{e.city}</span>
            <span className="block text-3xl font-extrabold">{e.count}</span>
            <span className="block text-xs opacity-70">{e.status.replace("_", " ").toLowerCase()}</span>
          </button>
        ))}
      </div>
      <Panel title={`Entries (${total})`}>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <Field label="Event"><select className={inputCls} value={eventId} onChange={(e) => setEventId(e.target.value)}><option value="">All events</option>{events.map((e) => <option key={e.id} value={e.id}>{e.city}</option>)}</select></Field>
          <Field label="Tier"><select className={inputCls} value={tier} onChange={(e) => setTier(e.target.value)}><option value="">All tiers</option>{TIERS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
          <Text label="Search" value={q} onChange={setQ} placeholder="Email, name, WhatsApp or reference" />
          {canExport && <a className={btnGhost} href={exportHref}>Export CSV</a>}
        </div>
        <ul className="mb-4 flex flex-wrap gap-2" aria-label="Interest by tier">
          {TIERS.map(([k, l]) => <li key={k} className="rounded-full bg-cream px-3 py-1 text-sm font-bold">{l}: {tierCounts.filter((c) => c.tier === k && (!eventId || c.eventId === Number(eventId))).reduce((n, c) => n + c.count, 0)}</li>)}
        </ul>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-[15px]">
            <thead><tr className="border-b border-ink/15"><th className="py-2 pr-3">Joined</th><th className="pr-3">City</th><th className="pr-3">Email</th><th className="pr-3">Name</th><th className="pr-3">WhatsApp</th><th className="pr-3">Tier</th><th className="pr-3">Party</th><th className="pr-3">WA opt-in</th><th className="pr-3">Reference</th><th>Source</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-ink/10"><td className="py-2 pr-3">{r.joined.slice(0, 16).replace("T", " ")}</td><td className="pr-3">{r.city}</td><td className="pr-3">{r.email}</td><td className="pr-3">{r.name}</td><td className="pr-3">{r.whatsapp}</td><td className="pr-3">{r.tier}</td><td className="pr-3">{r.partySize}</td><td className="pr-3">{r.whatsappOptIn}</td><td className="pr-3 font-mono text-sm">{r.reference}</td><td>{r.source}</td></tr>
              ))}
              {!rows.length && <tr><td colSpan={10} className="py-6 text-text-muted">{loading ? "Loading…" : "No waitlist entries yet."}</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
      {canEditSettings && (
        <Panel title="Settings">
          <div className="grid max-w-[520px] gap-4">
            <Text label="Public count threshold" type="number" value={th} onChange={setTh} hint="The 'people in line' number is only shown publicly once a city reaches this count (default 100)." />
            <Text label="Early-bird window (hours)" type="number" value={eb} onChange={setEb} hint="Blank means no early-bird window." />
            <div><button className={btnPrimary} onClick={saveSettings}>Save settings</button></div>
            {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
          </div>
        </Panel>
      )}
    </div>
  );
}
