"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";

type T = { name: string; token: string };
export default function Confirmed(p: { reference: string; city: string; dayLabel: string; entry: string; qty: number; lead: string; total: string; onNew: () => void }) {
  const [tickets, setTickets] = useState<(T & { qr: string })[]>([]);
  const [err, setErr] = useState(false);
  useEffect(() => {
    // Assumed route (contract for backend B): GET /api/booking/[reference]/tickets -> { tickets: [{ name, token }] }
    fetch(`/api/booking/${p.reference}/tickets`).then((r) => r.json()).then(async (d) => {
      const out = await Promise.all((d.tickets as T[]).map(async (t) => ({ ...t, qr: await QRCode.toDataURL(t.token, { margin: 1, width: 240, color: { dark: "#1D2632", light: "#FFFFFF" } }) })));
      setTickets(out);
    }).catch(() => setErr(true));
  }, [p.reference]);
  return (
    <div>
      <div className="rounded-[28px] bg-mint p-8 sm:p-12">
        <h1 className="t-campaign !text-[clamp(40px,6vw,80px)]" tabIndex={-1}>You&apos;re going off gravity.</h1>
        <p className="t-lead mt-4">Booking reference <strong className="font-extrabold">{p.reference}</strong></p>
      </div>
      <div className="mt-6 rounded-[24px] bg-white p-6 sm:p-8 space-y-3">
        {[["City", p.city], ["Day", p.dayLabel], ["Entry", p.entry], ["Participants", String(p.qty)], ["Lead participant", p.lead], ["Total paid", p.total], ["Payment", "Verified"]].map(([k, v]) => v ? <div key={k} className="flex justify-between gap-4"><span className="text-text-muted">{k}</span><span className="font-bold text-right">{v}</span></div> : null)}
      </div>
      <h2 className="t-card mt-10 mb-4">Your tickets</h2>
      {err && <p role="alert">We couldn&apos;t load your QR codes just now. Download the PDF or open My bookings.</p>}
      <div className="grid sm:grid-cols-2 gap-4">
        {tickets.map((t, i) => (<figure key={i} className="rounded-[24px] bg-white p-5 flex items-center gap-5"><img src={t.qr} width={120} height={120} alt={`Ticket QR code for ${t.name}`} /><figcaption><span className="font-extrabold block">{t.name}</span><span className="text-[15px] text-text-muted">Show this at entry</span></figcaption></figure>))}
      </div>
      <div className="flex flex-wrap items-center gap-6 mt-8">
        <a className="btn-primary" href={`/api/booking/${p.reference}/ticket.pdf`} download>Download ticket (PDF)</a>
        <Link className="link-secondary" href="/my-bookings">View in My bookings</Link>
        <button className="link-secondary" onClick={p.onNew}>Make another booking</button>
      </div>
      <p className="mt-8 text-[15px] text-text-muted">A confirmation email with your tickets is on its way.</p>
    </div>
  );
}
