"use client";
import { useCallback, useEffect, useState } from "react";

type Booking = {
  reference: string; status: "PENDING" | "CONFIRMED" | "CANCELLED" | "REFUNDED" | "EXPIRED"; city: string; day: "SAT" | "SUN"; date: string;
  entry: string; quantity: number; participants: string[]; amountPaise: number; paymentStatus: string; terms: string | null; canResume: boolean;
};
const STATUS: Record<string, { label: string; cls: string }> = {
  CONFIRMED: { label: "Confirmed", cls: "bg-mint text-ink" },
  PENDING: { label: "Pending payment", cls: "bg-lilac text-ink" },
  CANCELLED: { label: "Cancelled", cls: "bg-ink text-white" },
  REFUNDED: { label: "Refunded", cls: "bg-cobalt text-white" },
  EXPIRED: { label: "Cancelled", cls: "bg-ink text-white" },
};
const input = "w-full rounded-2xl bg-white px-5 py-4 text-[17px] outline-none ring-2 ring-transparent focus:ring-ink";
const dayLabel = (d: string, date: string) => {
  const base = new Date(date + "T00:00:00Z"); if (d === "SUN") base.setUTCDate(base.getUTCDate() + 1);
  return base.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
};

export function MyBookings() {
  const [stage, setStage] = useState<"email" | "code" | "list">("email");
  const [email, setEmail] = useState("");
  const [reference, setReference] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const load = useCallback(async (ref?: string) => {
    const r = await fetch(`/api/my-bookings/list${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`);
    const j = await r.json();
    if (r.status === 401) { setStage("email"); return false; }
    if (!r.ok) { setErr(j.error); return false; }
    setBookings(j.bookings); setEmail(j.email); setStage("list"); return true;
  }, []);
  useEffect(() => { void load(); }, [load]); // resumes an existing session

  async function post(url: string, body: unknown) {
    setBusy(true); setErr(null); setMsg(null);
    try { const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); return { ok: r.ok, j: await r.json() }; }
    finally { setBusy(false); }
  }
  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    const { ok, j } = await post("/api/my-bookings/request", { email, reference: reference || undefined });
    if (!ok) return setErr(j.error);
    setMsg(j.message); setStage("code");
  }
  async function verify(e: React.FormEvent) {
    e.preventDefault();
    const { ok, j } = await post("/api/my-bookings/verify", { email, code });
    if (!ok) return setErr(j.error);
    setBusy(true); await load(reference || undefined); setBusy(false);
  }
  async function resend(ref: string) {
    const { ok, j } = await post("/api/my-bookings/resend", { reference: ref });
    ok ? setMsg(`Confirmation email sent for ${ref}.`) : setErr(j.error);
  }
  async function signOut() { await post("/api/my-bookings/logout", {}); setBookings([]); setCode(""); setStage("email"); }

  return (
    <div className="mt-10">
      <div aria-live="polite" className="min-h-6">
        {err && <p role="alert" className="mb-4 rounded-2xl bg-white px-5 py-3 font-semibold text-[#B3261E]">{err}</p>}
        {msg && <p className="mb-4 rounded-2xl bg-mint/30 px-5 py-3 font-semibold">{msg}</p>}
      </div>

      {stage === "email" && (
        <form onSubmit={requestCode} className="grid max-w-xl gap-4">
          <label className="grid gap-2 font-bold">Email
            <input className={input} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
          </label>
          <label className="grid gap-2 font-bold">Booking reference <span className="font-normal text-text-muted">(optional)</span>
            <input className={input} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="OG-MUM-AB12C" />
          </label>
          <div><button disabled={busy} className="btn-primary cursor-pointer disabled:opacity-60">{busy ? "Sending…" : "Send my code"}</button></div>
        </form>
      )}

      {stage === "code" && (
        <form onSubmit={verify} className="grid max-w-xl gap-4">
          <label className="grid gap-2 font-bold">6-digit code sent to {email}
            <input className={input + " tracking-[0.4em]"} inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
          </label>
          <div className="flex flex-wrap items-center gap-6">
            <button disabled={busy || code.length !== 6} className="btn-primary cursor-pointer disabled:opacity-60">{busy ? "Checking…" : "Show my bookings"}</button>
            <button type="button" className="link-secondary cursor-pointer" onClick={() => { setStage("email"); setCode(""); setErr(null); }}>Use a different email</button>
          </div>
        </form>
      )}

      {stage === "list" && (
        <div>
          <div className="mb-6 flex flex-wrap items-center gap-4 text-text-muted">
            <span>Signed in as <strong className="text-ink">{email}</strong></span>
            <button className="link-secondary cursor-pointer" onClick={signOut}>Sign out</button>
          </div>
          {bookings.length === 0 && <p className="rounded-3xl bg-white p-8 text-lg">No bookings found for this email yet.</p>}
          <ul className="grid gap-5">
            {bookings.map((b) => {
              const s = STATUS[b.status] ?? STATUS.CANCELLED;
              return (
                <li key={b.reference} className="rounded-[26px] bg-white p-6 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="t-card">{b.reference}</h2>
                    <span className={`rounded-full px-4 py-1.5 text-[15px] font-bold ${s.cls}`}>{s.label}</span>
                  </div>
                  <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                    <Row k="City" v={b.city} /><Row k="Day" v={dayLabel(b.day, b.date)} />
                    <Row k="Entry" v={b.entry} /><Row k="Participants" v={`${b.quantity}: ${b.participants.join(", ")}`} />
                    <Row k="Payment" v={b.paymentStatus} /><Row k="Total" v={`₹${(b.amountPaise / 100).toLocaleString("en-IN")}`} />
                  </dl>
                  <p className="mt-5 rounded-2xl bg-cream p-4 text-[15px] text-text-muted"><strong className="text-ink">Cancellation and refunds: </strong>{b.terms ?? "The refund and cancellation policy applied at booking will be shown here."}</p>
                  <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                    {b.status === "CONFIRMED" && (<>
                      <a className="link-secondary" href={`/api/booking/${b.reference}/ticket.pdf`}>Download tickets (PDF)</a>
                      <a className="link-secondary" href={`/api/booking/${b.reference}/receipt.pdf`}>Download receipt (PDF)</a>
                      <button className="link-secondary cursor-pointer" onClick={() => resend(b.reference)}>Resend confirmation email</button>
                    </>)}
                    {b.canResume && <a className="btn-primary !py-3 !text-[17px]" href={`/book?resume=${b.reference}`}>Resume payment</a>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
const Row = ({ k, v }: { k: string; v: string }) => (<div><dt className="text-[15px] text-text-muted">{k}</dt><dd className="font-bold">{v}</dd></div>);
