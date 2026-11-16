"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TOUR, DISCLAIMER } from "@/lib/tour";
import { STEPS, inr, shortDates, dayDate, type Day, type EventDTO, type Quote, type TicketDTO } from "./types";
import { emptyP, validateField, validateParticipants, type P, type PField } from "./validation";
import Confirmed from "./Confirmed";

type PayState = "idle" | "creating" | "waiting" | "verifying" | "failed" | "unverified" | "expired";
type LoadState = "loading" | "ready" | "error";
type Booking = { reference: string; orderId: string; amountPaise: number; keyId: string; holdExpiresAt: string };
declare global {
  interface Window { Razorpay?: new (o: Record<string, unknown>) => { open(): void; on(e: string, cb: () => void): void } }
}

const SKEY = "og-booking-v1";
const MSG: Record<string, string> = {
  SOLD_OUT: "That entry has just sold out for this day. Pick another ticket or day.",
  HOLD_EXPIRED: "Your hold ran out and the slots were released. Start again to pick new ones.",
  NOT_ON_SALE: "This ticket isn't on sale right now.",
  NOT_FOUND: "We couldn't find that ticket. Go back and pick again.",
  BAD_QUANTITY: "That number of participants isn't allowed for this ticket.",
  DOB_REQUIRED: "Add a date of birth for every participant.",
  RATE_LIMITED: "Too many attempts. Wait a minute and try again.",
  INVALID: "Some details look wrong. Go back and check the form.",
  SERVER_ERROR: "Something went wrong on our side. Please try again in a moment.",
  BAD_SIGNATURE: "We couldn't verify that payment yet.",
};
const msgFor = (code: unknown, fallback: string) => (typeof code === "string" && MSG[code]) || fallback;
const card = (sel: boolean, disabled?: boolean) =>
  `text-left rounded-[24px] p-5 sm:p-6 transition-all w-full ${disabled ? "bg-white/50 text-text-muted opacity-60 cursor-not-allowed" : sel ? "bg-ink text-white shadow-[0_10px_30px_rgba(29,38,50,.25)]" : "bg-white hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(29,38,50,.12)]"} focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-cobalt`;
const inputCls = "w-full rounded-2xl bg-white px-4 py-3.5 text-[17px] text-ink shadow-[inset_0_0_0_1.5px_rgba(29,38,50,.18)] focus:outline-3 focus:outline-cobalt aria-[invalid=true]:shadow-[inset_0_0_0_2px_#B3261E]";
const errCls = "mt-1.5 text-[15px] font-semibold text-[#B3261E]";

function Field({ id, label, error, children }: { id: string; label: string; error?: string | null; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block font-bold text-[15px] mb-1.5">{label}</label>
      {children}
      {error && <p id={id + "-err"} role="alert" className={errCls}>{error}</p>}
    </div>
  );
}

export default function BookingFlow() {
  const sp = useSearchParams();
  const [events, setEvents] = useState<EventDTO[] | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [degraded, setDegraded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const resumeRef = useRef(sp.get("resume"));
  const busy = useRef(false);
  const lastPayment = useRef<Record<string, string> | null>(null);
  const [city, setCity] = useState<string | null>(sp.get("city"));
  const [day, setDay] = useState<Day | null>(sp.get("day") === "sat" ? "SAT" : sp.get("day") === "sun" ? "SUN" : null);
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [ps, setPs] = useState<P[]>([emptyP()]);
  const [consent, setConsent] = useState(false);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteErr, setQuoteErr] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [pay, setPay] = useState<PayState>("idle");
  const [payMsg, setPayMsg] = useState<string | null>(null);
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null);
  const [idem, setIdem] = useState("");
  const initialStep = Number(sp.get("step")) || (sp.get("city") ? (sp.get("day") ? 3 : 2) : 1);
  const [step, setStep] = useState(initialStep);
  const [now, setNow] = useState(() => Date.now());
  const [summaryOpen, setSummaryOpen] = useState(false);
  const hydrated = useRef(false);
  const headRef = useRef<HTMLHeadingElement>(null);

  // hydrate from sessionStorage (URL wins for city/day/step)
  useEffect(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem(SKEY) || "null");
      if (s) {
        if (!sp.get("city") && s.city) setCity(s.city);
        if (!sp.get("day") && s.day) setDay(s.day);
        if (!sp.get("step") && !sp.get("city") && s.step) setStep(s.step);
        if (s.ticketId) setTicketId(s.ticketId);
        if (s.qty) setQty(s.qty);
        if (s.ps) setPs(s.ps);
        if (s.booking) setBooking(s.booking);
        if (s.confirmedRef) setConfirmedRef(s.confirmedRef);
        if (s.idem) setIdem(s.idem);
        else setIdem(crypto.randomUUID());
      } else setIdem(crypto.randomUUID());
    } catch {
      setIdem(crypto.randomUUID());
    }
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist to sessionStorage + URL (personal details are kept only in this tab's session storage)
  useEffect(() => {
    if (!hydrated.current) return;
    try { sessionStorage.setItem(SKEY, JSON.stringify({ city, day, step, ticketId, qty, ps, booking, confirmedRef, idem })); } catch {}
  }, [city, day, step, ticketId, qty, ps, booking, confirmedRef, idem]);

  // keep the URL in step with city/day/step only (not on every keystroke)
  useEffect(() => {
    if (!hydrated.current || resumeRef.current) return;
    const u = new URLSearchParams();
    if (city) u.set("city", city);
    if (day) u.set("day", day.toLowerCase());
    u.set("step", String(step));
    window.history.replaceState(null, "", `/book?${u}`);
  }, [city, day, step]);

  const loadEvents = useCallback((attempt = 0) => {
    setLoadState("loading");
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 15000);
    fetch("/api/events", { signal: ac.signal })
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (!r.ok || !Array.isArray(d?.events)) throw new Error("bad response");
        setEvents(d.events); setDegraded(!!d.degraded); setLoadState("ready");
      })
      .catch(() => { if (attempt < 1) setTimeout(() => loadEvents(attempt + 1), 1200); else setLoadState("error"); })
      .finally(() => clearTimeout(t));
  }, []);
  useEffect(() => { loadEvents(); }, [loadEvents]);

  // /book?resume=<reference>: pick a pending booking back up at the payment step
  useEffect(() => {
    const ref = resumeRef.current;
    if (!ref) return;
    (async () => {
      try {
        const r = await fetch(`/api/booking/${encodeURIComponent(ref)}/status`);
        const d = await r.json();
        if (!r.ok) throw new Error("not found");
        if (d.status === "CONFIRMED") { setCity(d.eventSlug); setDay(d.day); setConfirmedRef(ref); setStep(7); }
        else if (d.status === "PENDING" && new Date(d.holdExpiresAt).getTime() > Date.now()) {
          setCity(d.eventSlug); setDay(d.day); setTicketId(d.ticketTypeId); setQty(d.quantity);
          setBooking({ reference: ref, orderId: "", amountPaise: d.amountPaise, keyId: "", holdExpiresAt: d.holdExpiresAt });
          setPay("idle"); setStep(6);
        } else setNotice("That booking can't be resumed because the hold has ended. Start a new booking below.");
      } catch { setNotice("We couldn't find that booking to resume. Start a new booking below."); }
      resumeRef.current = null;
      window.history.replaceState(null, "", "/book");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const firstFocus = useRef(true);
  useEffect(() => { if (firstFocus.current) { firstFocus.current = false; return; } headRef.current?.focus(); document.querySelector('[aria-current="step"]')?.scrollIntoView({ inline: "center", block: "nearest" }); }, [step]);

  const ev = events?.find((e) => e.slug === city) ?? null;
  const tour = TOUR.find((t) => t.slug === city);
  const ticket: TicketDTO | undefined = ev?.tickets.find((t) => t.id === ticketId);
  const tickets = useMemo(() => (ev?.tickets ?? []).filter((t) => day && t.days.includes(day)), [ev, day]);

  // never sit on a step whose inputs are missing (e.g. a hand-edited ?step=6)
  useEffect(() => {
    if (!hydrated.current || loadState !== "ready" || resumeRef.current || confirmedRef || booking) return;
    const allowed = !city ? 1 : !day ? 2 : !ticket ? 3 : step >= 5 && !(ps[0]?.name?.trim().length >= 2 && consent) ? 4 : 5;
    if (step > allowed) setStep(allowed);
  }, [step, loadState, city, day, ticket, confirmedRef, booking, ps, consent]);

  useEffect(() => {
    setPs((p) => (qty > p.length ? [...p, ...Array.from({ length: qty - p.length }, emptyP)] : p.slice(0, qty)));
  }, [qty]);

  // server quote: all money comes from here
  useEffect(() => {
    if (step < 5 || !city || !day || !ticketId) return;
    setQuote(null);
    setQuoteErr(null);
    fetch("/api/booking/quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ eventSlug: city, day, ticketTypeId: ticketId, quantity: qty }) })
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(msgFor(d.error, "Could not get a price. Please try again.")); setQuote(d); })
      .catch((e) => setQuoteErr(e.message));
  }, [step, city, day, ticketId, qty]);

  const holdLeft = booking ? Math.max(0, Math.floor((new Date(booking.holdExpiresAt).getTime() - now) / 1000)) : null;
  useEffect(() => {
    if (holdLeft === 0 && pay !== "verifying" && step === 6 && !confirmedRef) setPay("expired");
  }, [holdLeft, pay, step, confirmedRef]);
  const clock = holdLeft != null && holdLeft > 0 ? `${Math.floor(holdLeft / 60)}:${String(holdLeft % 60).padStart(2, "0")}` : null;

  const go = (n: number) => { setStep(n); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const reset = () => {
    try { sessionStorage.removeItem(SKEY); } catch {}
    setBooking(null); setPay("idle"); setConfirmedRef(null); setIdem(crypto.randomUUID());
    setConsent(false); setPs([emptyP()]); setQty(1); setTicketId(null); setDay(null); setCity(null); setStep(1);
  };

  const onBlur = (i: number, f: PField) => {
    const e = validateField(f, ps[i][f], !!ticket?.requiresDob);
    setErrs((x) => { const n = { ...x }; if (e) n[`${i}.${f}`] = e; else delete n[`${i}.${f}`]; return n; });
  };
  const setP = (i: number, f: PField, v: string) => setPs((a) => a.map((p, j) => (j === i ? { ...p, [f]: v } : p)));

  const toReview = () => {
    const e = validateParticipants(ps, !!ticket?.requiresDob, consent);
    setErrs(e);
    if (!Object.keys(e).length) go(5);
    else setTimeout(() => document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus(), 0);
  };

  function loadScript() {
    return new Promise<void>((res, rej) => {
      if (window.Razorpay) return res();
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => res();
      s.onerror = () => rej(new Error("Could not load Razorpay. Check your connection and try again."));
      document.body.appendChild(s);
    });
  }

  // Runs after Razorpay reports success. Money may already have been taken, so a failure here is "unverified", never "no money was taken".
  async function verifyPayment() {
    const resp = lastPayment.current;
    if (!resp) return;
    setPay("verifying");
    try {
      const r = await fetch("/api/booking/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ razorpay_order_id: resp.razorpay_order_id, razorpay_payment_id: resp.razorpay_payment_id, razorpay_signature: resp.razorpay_signature }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || d.status !== "CONFIRMED") throw new Error(msgFor(d.error, "We couldn't verify the payment yet."));
      lastPayment.current = null;
      setConfirmedRef(d.reference);
      go(7);
    } catch (e) { setPay("unverified"); setPayMsg((e as Error).message); }
  }

  async function openCheckout(b: Booking) {
    await loadScript();
    setPay("waiting");
    const rz = new window.Razorpay!({
      key: b.keyId, amount: b.amountPaise, currency: "INR", order_id: b.orderId, name: "OFF GRAVITY",
      description: `${ev?.city ?? ""} · ${ticket?.name ?? ""}`,
      prefill: { name: ps[0].name, email: ps[0].email, contact: ps[0].phone },
      theme: { color: "#1D2632" },
      modal: { ondismiss: () => setPay((p) => (p === "waiting" ? "failed" : p)) },
      handler: (resp: Record<string, string>) => { lastPayment.current = resp; void verifyPayment(); },
    });
    rz.on("payment.failed", () => { setPay("failed"); setPayMsg(null); });
    rz.open();
  }

  async function startPayment() {
    if (!city || !day || !ticketId || busy.current) return;
    busy.current = true;
    setPay("creating");
    setPayMsg(null);
    const key = idem || crypto.randomUUID();
    if (!idem) setIdem(key);
    try {
      let b = booking;
      if (!b || (holdLeft ?? 0) <= 0) {
        const r = await fetch("/api/booking/create", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({
            eventSlug: city, day, ticketTypeId: ticketId, quantity: qty, idempotencyKey: key, consent: true,
            participants: ps.map((p, i) => ({ name: p.name, ...(i === 0 ? { email: p.email, phone: p.phone, emergencyPhone: p.emergencyPhone } : {}), ...(p.dob ? { dob: p.dob } : {}) })),
          }),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) {
          if (d.error === "SOLD_OUT") { loadEvents(); setNotice(MSG.SOLD_OUT); setPay("idle"); go(3); return; }
          throw new Error(msgFor(d.error, "Could not hold your slots. Please try again."));
        }
        b = d as Booking;
        setBooking(b);
      }
      go(6);
      await openCheckout(b);
    } catch (e) {
      setPay("failed"); setPayMsg((e as Error).message); go(6);
    } finally { busy.current = false; }
  }

  async function retry() {
    if (!booking) return startPayment();
    if (busy.current) return;
    busy.current = true;
    setPay("creating");
    try {
      const r = await fetch(`/api/booking/${booking.reference}/retry`, { method: "POST" });
      const d = await r.json().catch(() => ({}));
      if (r.status === 410 || d.expired) { setPay("expired"); return; }
      if (!r.ok) throw new Error(msgFor(d.error, "Could not restart the payment. Please try again."));
      const nb = { ...booking, ...d } as Booking;
      setBooking(nb);
      await openCheckout(nb);
    } catch (e) { setPay("failed"); setPayMsg((e as Error).message); }
    finally { busy.current = false; }
  }

  const bar = (
    <nav aria-label="Booking progress" className="mb-8 sm:mb-10">
      <ol className="flex gap-2 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const n = i + 1;
          const cur = n === step;
          const done = n < step;
          const canClick = !confirmedRef && done;
          const cls = `flex items-center gap-2 rounded-full px-4 py-2.5 text-[15px] font-bold whitespace-nowrap ${cur ? "bg-ink text-white" : done ? "bg-mint text-ink" : "bg-white text-text-muted"}`;
          return (
            <li key={s} className="shrink-0">
              {canClick ? (
                <button className={cls} onClick={() => go(n)} aria-label={`Back to step ${n}: ${s}`}><span>{n}</span>{s}</button>
              ) : (
                <span className={cls} aria-current={cur ? "step" : undefined}><span>{n}</span>{s}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );

  const summary = (
    <div className="rounded-[26px] bg-ink text-white p-6 sm:p-7">
      <h2 className="font-extrabold text-[22px] mb-4">Your slot</h2>
      <dl className="space-y-3 text-[16px]">
        {([["City", ev?.city ?? tour?.city], ["Day", day && tour ? dayDate(tour.start, day) : null], ["Entry", ticket?.name], ["Participants", ticket ? String(qty) : null], ["Total", quote ? inr(quote.totalPaise) : null]] as [string, string | null | undefined][]).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4"><dt className="text-on-dark">{k}</dt><dd className="font-bold text-right">{v ?? "—"}</dd></div>
        ))}
      </dl>
      <p className="mt-5 text-[14px] text-on-dark">{DISCLAIMER}</p>
    </div>
  );

  const heading = (t: string, sub?: string) => (
    <>
      <h1 ref={headRef} tabIndex={-1} className="t-section outline-none">{t}</h1>
      {sub ? <p className="t-lead text-text-muted mt-3 mb-8">{sub}</p> : <div className="mb-8" />}
    </>
  );
  const nextBtn = (label: string, onClick: () => void, disabled?: boolean) => (
    <button onClick={onClick} disabled={disabled} className="btn-primary mt-8 disabled:opacity-40 disabled:pointer-events-none">{label}<span aria-hidden>→</span></button>
  );

  const body = () => {
    if (step === 7 && confirmedRef)
      return <Confirmed reference={confirmedRef} city={ev?.city ?? tour?.city ?? ""} dayLabel={day && tour ? dayDate(tour.start, day) : ""} entry={ticket?.name ?? ""} qty={qty} lead={ps[0].name} total={booking ? inr(booking.amountPaise) : ""} onNew={reset} />;

    if (step === 1)
      return (
        <>
          {heading("Pick your city", "Six cities, two days each.")}
          {notice && <p role="status" className="mb-4 rounded-2xl bg-white px-5 py-3 font-semibold">{notice}</p>}
          {loadState === "error" && <p role="alert" className="mb-4 font-semibold">We couldn&apos;t load live availability. Cities are shown below. <button className="link-secondary" onClick={() => loadEvents()}>Try again</button></p>}
          {[1, 2].map((season) => (
            <section key={season} className="mb-8" aria-labelledby={`s${season}`}>
              <h2 id={`s${season}`} className="font-bold text-[16px] text-text-muted mb-3">Season {season}</h2>
              <div role="radiogroup" aria-labelledby={`s${season}`} className="grid sm:grid-cols-2 gap-4">
                {TOUR.filter((t) => t.season === season).map((t) => {
                  const e = events?.find((x) => x.slug === t.slug);
                  const closed = !!e && (e.status === "SALES_CLOSED" || e.status === "CANCELLED");
                  return (
                    <button key={t.slug} role="radio" aria-checked={city === t.slug} disabled={closed} className={card(city === t.slug, closed)} onClick={() => { if (city !== t.slug) { setCity(t.slug); setTicketId(null); } go(2); }}>
                      <span className="flex items-baseline justify-between gap-3"><span className="t-card">{t.city}</span><span className="font-bold">{shortDates(t.start, t.end)}</span></span>
                      <span className="mt-3 flex flex-wrap gap-2">
                        {t.tag && <span className="rounded-full bg-lilac text-ink px-3 py-1 text-[14px] font-bold">{t.tag}</span>}
                        {closed && <span className="text-[14px] font-bold">Sales are closed for this city.</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </>
      );

    if (step === 2)
      return (
        <>
          {heading(`Which day in ${tour?.city ?? "your city"}?`)}
          <div role="radiogroup" aria-label="Day" className="grid sm:grid-cols-2 gap-4">
            {(["SAT", "SUN"] as Day[]).map((d) => {
              const avail = !ev || ev.tickets.length === 0 || ev.tickets.some((t) => t.days.includes(d));
              const jaipur = city === "jaipur";
              return (
                <button key={d} role="radio" aria-checked={day === d} disabled={!avail} className={card(day === d, !avail)} onClick={() => { setDay(d); setTicketId(null); go(3); }}>
                  <span className="t-card block">{tour && dayDate(tour.start, d)}</span>
                  <span className="block mt-2 text-[16px] opacity-90">{d === "SAT" ? (jaipur ? "Evening edition, with Glow Night" : "Includes Saturday Glow Night") : jaipur ? "Evening edition, day two" : "Festival day two"}</span>
                  {!avail && <span className="block mt-2 font-bold text-[14px]">No tickets on this day.</span>}
                </button>
              );
            })}
          </div>
        </>
      );

    if (step === 3)
      return (
        <>
          {heading("Choose your entry", "Pick the ticket that fits how you want to race.")}
          {notice && <p role="alert" className="mb-4 rounded-2xl bg-white px-5 py-3 font-semibold">{notice}</p>}
          {loadState === "loading" && !events ? (
            <div role="status" aria-live="polite" className="grid gap-4">
              <span className="sr-only">Loading tickets…</span>
              {[0, 1].map((i) => <div key={i} aria-hidden className="h-[132px] rounded-[24px] bg-white/70 animate-pulse" />)}
            </div>
          ) : loadState === "error" ? (
            <div role="alert" className="rounded-[24px] bg-white p-7">
              <h2 className="t-card">We couldn&apos;t load tickets</h2>
              <p className="mt-2 text-text-muted">Check your connection and try again. Nothing has been booked or charged.</p>
              <button className="btn-primary mt-5 !py-3.5 !text-[17px]" onClick={() => loadEvents()}>Try again</button>
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-[24px] bg-white p-7">
              <h2 className="t-card">Tickets are not on sale yet</h2>
              <p className="mt-2 text-text-muted">{degraded ? "Live ticket information is unavailable right now. Please try again shortly." : <>Ticket types and prices for {ev?.city ?? tour?.city} haven&apos;t been published. Check back soon, or choose another city.</>}</p>
              {degraded && <button className="link-secondary mt-3 mr-5" onClick={() => loadEvents()}>Try again</button>}
              <button className="link-secondary mt-4" onClick={() => go(1)}>Choose another city</button>
            </div>
          ) : (
            <div role="radiogroup" aria-label="Entry" className="grid gap-4">
              {tickets.map((t) => {
                const rem = day ? t.remaining[day] : null;
                const sold = rem === 0;
                const rule = t.minPerBooking === t.maxPerBooking ? `${t.minPerBooking} participant${t.minPerBooking > 1 ? "s" : ""}` : `${t.minPerBooking}–${t.maxPerBooking} participants`;
                return (
                  <button key={t.id} role="radio" aria-checked={ticketId === t.id} disabled={sold} className={card(ticketId === t.id, sold)} onClick={() => { setTicketId(t.id); setQty(t.minPerBooking); }}>
                    <span className="flex items-start justify-between gap-4">
                      <span><span className="t-card block">{t.name}</span><span className="block mt-1.5 opacity-90">{t.description}</span></span>
                      <span className="text-right shrink-0"><span className="block font-extrabold text-[22px]">{inr(t.pricePaise)}</span><span className="block text-[14px] opacity-80">per participant{t.gstMode === "EXCLUSIVE" ? " + GST" : ""}</span></span>
                    </span>
                    <span className="mt-3 flex flex-wrap gap-2 text-[14px] font-bold">
                      <span className="rounded-full bg-mint text-ink px-3 py-1">{rule}</span>
                      {t.eligibility && <span className="rounded-full bg-lilac-tint text-ink px-3 py-1">{t.eligibility}</span>}
                      <span className="rounded-full bg-cream text-ink px-3 py-1">{sold ? "Sold out" : rem == null ? "Available" : `${rem} left`}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {ticket && nextBtn("Continue", () => go(4))}
        </>
      );

    if (step === 4 && ticket)
      return (
        <>
          {heading("Who's taking part?")}
          {ticket.minPerBooking !== ticket.maxPerBooking && (
            <div className="mb-8 flex flex-wrap items-center gap-4">
              <span className="font-bold">Participants</span>
              <div className="flex items-center gap-3 rounded-full bg-white p-1.5" role="group" aria-label="Participant count">
                <button aria-label="Fewer participants" className="size-11 rounded-full bg-cream font-extrabold text-xl disabled:opacity-40" disabled={qty <= ticket.minPerBooking} onClick={() => setQty(qty - 1)}>−</button>
                <output className="w-8 text-center font-extrabold text-xl" aria-live="polite">{qty}</output>
                <button aria-label="More participants" className="size-11 rounded-full bg-cream font-extrabold text-xl disabled:opacity-40" disabled={qty >= ticket.maxPerBooking} onClick={() => setQty(qty + 1)}>+</button>
              </div>
              <span className="text-[15px] text-text-muted">{ticket.minPerBooking}–{ticket.maxPerBooking} allowed</span>
            </div>
          )}
          <div className="space-y-6">
            {ps.map((p, i) => {
              const fs: [PField, string, string, string?][] = i === 0
                ? [["name", "Full name", "name"], ["email", "Email", "email", "email"], ["phone", "Mobile number", "tel", "tel"], ["emergencyPhone", "Emergency contact number", "tel", "tel"]]
                : [["name", "Full name", "off"]];
              if (ticket.requiresDob) fs.push(["dob", "Date of birth", "off"]);
              return (
                <fieldset key={i} className="rounded-[24px] bg-white p-5 sm:p-7">
                  <legend className="font-extrabold text-[20px] float-left w-full mb-3">{i === 0 ? "Lead participant" : `Participant ${i + 1}`}</legend>
                  <div className="grid sm:grid-cols-2 gap-5 clear-both">
                    {fs.map(([f, label, ac, type]) => {
                      const id = `p${i}-${f}`;
                      const er = errs[`${i}.${f}`];
                      return (
                        <Field key={f} id={id} label={label} error={er}>
                          <input id={id} type={f === "dob" ? "date" : type ?? "text"} autoComplete={i === 0 ? ac : "off"} inputMode={f === "phone" || f === "emergencyPhone" ? "numeric" : undefined} className={inputCls} value={p[f]} onChange={(e) => setP(i, f, e.target.value)} onBlur={() => onBlur(i, f)} aria-invalid={!!er} aria-describedby={er ? id + "-err" : undefined} />
                        </Field>
                      );
                    })}
                  </div>
                </fieldset>
              );
            })}
            <div>
              <label className="flex items-start gap-3 text-[16px]">
                <input id="consent" type="checkbox" className="mt-1 size-5 accent-ink" checked={consent} onChange={(e) => { setConsent(e.target.checked); if (e.target.checked) setErrs((x) => { const n = { ...x }; delete n.consent; return n; }); }} aria-invalid={!!errs.consent} />
                <span>I accept the <Link className="underline" href="/terms" target="_blank">Terms</Link>, <Link className="underline" href="/privacy" target="_blank">Privacy</Link> and <Link className="underline" href="/refund-policy" target="_blank">Refund &amp; cancellation</Link> policies, and confirm all participants are fit to take part.</span>
              </label>
              {errs.consent && <p role="alert" className={errCls}>{errs.consent}</p>}
            </div>
          </div>
          {nextBtn("Review booking", toReview)}
        </>
      );

    if (step === 5 && ticket)
      return (
        <>
          {heading("Review your booking")}
          <div className="rounded-[24px] bg-white p-6 sm:p-8 space-y-3 text-[17px]">
            {([["City", ev?.city], ["Day", tour && day ? dayDate(tour.start, day) : ""], ["Entry", ticket.name], ["Participants", String(qty)], ["Lead participant", ps[0].name]] as [string, string | undefined][]).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4"><span className="text-text-muted">{k}</span><span className="font-bold text-right">{v}</span></div>
            ))}
            <hr className="border-ink/10" />
            {quoteErr ? (
              <p role="alert" className={errCls}>{quoteErr}</p>
            ) : !quote ? (
              <p>Getting your price…</p>
            ) : (
              <>
                {([["Ticket subtotal", quote.subtotalPaise], ["Taxes", quote.taxPaise], ["Fees", quote.feesPaise]] as [string, number][]).map(([k, v]) => (
                  <div key={k} className="flex justify-between"><span className="text-text-muted">{k}</span><span className="font-bold">{inr(v)}</span></div>
                ))}
                <div className="flex justify-between text-[22px] font-extrabold pt-2"><span>Total</span><span>{inr(quote.totalPaise)}</span></div>
              </>
            )}
          </div>
          <p className="mt-4 text-text-muted">Your slots are held for a short time while you pay.{clock && ` Hold ends in ${clock}.`}</p>
          <div className="flex flex-wrap items-center gap-6">
            {nextBtn(pay === "creating" ? "Holding your slots…" : "Pay now", startPayment, !quote || pay === "creating")}
            <button className="link-secondary mt-8" onClick={() => go(4)}>Edit details</button>
          </div>
          {pay === "failed" && payMsg && <p role="alert" className={`${errCls} mt-4`}>{payMsg}</p>}
        </>
      );

    if (step === 6)
      return (
        <>
          {heading("Payment")}
          <div className="rounded-[24px] bg-white p-7 sm:p-9" aria-live="polite">
            {(pay === "waiting" || pay === "creating" || pay === "idle") && (
              <>
                <p className="t-card">Waiting for Razorpay…</p>
                <p className="mt-2 text-text-muted">Complete the payment in the Razorpay window (UPI, cards or net banking).{clock && ` Your slots are held for ${clock}.`}</p>
                {pay !== "creating" && <button className="btn-primary mt-6" onClick={retry}>Open payment window<span aria-hidden>→</span></button>}
              </>
            )}
            {pay === "verifying" && (
              <div role="status">
                <div className="size-10 rounded-full border-4 border-ink/15 border-t-ink animate-spin mb-4" aria-hidden />
                <p className="t-card">Verifying payment</p>
                <p className="mt-2 text-text-muted">Don&apos;t close this page.</p>
              </div>
            )}
            {pay === "failed" && (
              <>
                <p className="t-card">Payment didn&apos;t go through</p>
                <p className="mt-2 text-text-muted">No money was taken and your booking isn&apos;t confirmed. Your slots are still held, so you can try again.{payMsg && ` (${payMsg})`}</p>
                <button className="btn-primary mt-6" onClick={retry}>Try payment again<span aria-hidden>→</span></button>
              </>
            )}
            {pay === "unverified" && (
              <div role="alert">
                <p className="t-card">We&apos;re still confirming your payment</p>
                <p className="mt-2 text-text-muted">If money left your account it&apos;s safe: <strong>please don&apos;t pay again.</strong> {payMsg} Check again below, or look in My bookings or your email in a few minutes.</p>
                <div className="mt-6 flex flex-wrap items-center gap-6">
                  <button className="btn-primary" onClick={verifyPayment}>Check payment status<span aria-hidden>→</span></button>
                  <Link className="link-secondary" href="/my-bookings">Open My bookings</Link>
                </div>
              </div>
            )}
            {pay === "expired" && (
              <>
                <p className="t-card">Your hold has expired</p>
                <p className="mt-2 text-text-muted">We&apos;ve released your slots. Start again to pick new ones.</p>
                <button className="btn-primary mt-6" onClick={reset}>Start again<span aria-hidden>→</span></button>
              </>
            )}
          </div>
        </>
      );

    return (
      <>
        <h1 ref={headRef} tabIndex={-1} className="t-section outline-none">Let&apos;s pick up where you left off</h1>
        <button className="btn-primary mt-6" onClick={() => go(1)}>Pick a city<span aria-hidden>→</span></button>
      </>
    );
  };

  const showSummary = step < 7;
  return (
    <div className="container-og py-10 sm:py-14">
      <p className="sr-only" role="status" aria-live="polite">Step {Math.min(step, 7)} of 7: {STEPS[Math.min(step, 7) - 1]}</p>
      {bar}
      <div className={`grid gap-8 lg:gap-12 ${showSummary ? "lg:grid-cols-[1fr_360px]" : ""} items-start`}>
        <div className="min-w-0">{body()}</div>
        {showSummary && (
          <>
            <aside className="hidden lg:block sticky top-28" aria-label="Your slot summary">{summary}</aside>
            <div className="lg:hidden order-first -mt-2">
              <button className="w-full rounded-full bg-ink text-white px-6 py-3.5 font-bold flex justify-between" aria-expanded={summaryOpen} onClick={() => setSummaryOpen(!summaryOpen)}>
                <span>Your slot · {ev?.city ?? tour?.city ?? "No city yet"}</span>
                <span>{quote ? inr(quote.totalPaise) : summaryOpen ? "−" : "+"}</span>
              </button>
              {summaryOpen && <div className="mt-3">{summary}</div>}
            </div>
          </>
        )}
      </div>
      <p className="mt-10 text-[15px] text-text-muted">{DISCLAIMER}</p>
    </div>
  );
}
