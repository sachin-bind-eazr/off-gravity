"use client";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowRight, CalendarPlus, Check, Minus, Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { waitlistSchema } from "@/lib/schemas/waitlist";
import { Confetti } from "./Confetti";
import { TIERS, TIER_ORDER, downloadIcs, fmtLong, type ModalCity, type WaitlistTier } from "./ticket";
import "./waitlist.css";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([tabindex="-1"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

type Done = { city: string; reference: string; duplicate: boolean; tier: WaitlistTier; partySize: number; start: string; end: string; count: number | null };
type Errs = Partial<Record<"email" | "whatsapp" | "consent" | "form", string>>;

function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(m.matches);
    const f = () => setR(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return r;
}

const digitsOf = (v: string) => v.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
const runners = (n: number) => `${n} ${n === 1 ? "runner" : "runners"}`;

/** Centred popup: one-screen waitlist form, then the ticket in place. */
export function WaitlistModal({ cities, initialSlug, initialTier, onClose }: {
  cities: ModalCity[]; initialSlug?: string; initialTier?: WaitlistTier; onClose: () => void;
}) {
  const uid = useId();
  const reduced = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);

  const firstEnabled = cities.find((c) => c.enabled)?.slug ?? cities[0]?.slug ?? "";
  const [slug, setSlug] = useState(() => (cities.find((c) => c.slug === initialSlug && c.enabled) ? initialSlug! : firstEnabled));
  const city = cities.find((c) => c.slug === slug) ?? cities[0];
  const [tier, setTier] = useState<WaitlistTier>(() => (initialTier === "glow" && !city?.glow ? "undecided" : initialTier ?? "undecided"));
  const [party, setParty] = useState(() => TIERS[initialTier ?? "undecided"].party ?? 1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [wa, setWa] = useState("");
  const [consent, setConsent] = useState(false);
  const [waOptIn, setWaOptIn] = useState(false);
  const [hp, setHp] = useState("");
  const [focus, setFocus] = useState("");
  const [errs, setErrs] = useState<Errs>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const submitting = useRef(false);

  const requestClose = useCallback(() => {
    if (reduced) { onClose(); return; }
    setClosing(true);
    setTimeout(onClose, 180);
  }, [reduced, onClose]);

  // dialog behaviour: scroll lock, focus in/out, Escape, focus trap
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const body = document.body;
    const overflow = body.style.overflow;
    body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("input")?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { e.stopPropagation(); requestClose(); return; }
      if (e.key !== "Tab" || !panel.current) return;
      const els = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);
      if (!els.length) return;
      const a = els[0], z = els[els.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [requestClose]);

  const chooseCity = (s: string) => {
    setSlug(s);
    const c = cities.find((x) => x.slug === s);
    if (tier === "glow" && !c?.glow) setTier("undecided");
  };
  const chooseTier = (t: WaitlistTier) => {
    setTier(t);
    const p = TIERS[t].party;
    if (p) setParty(p);
  };

  const fieldErr = {
    email: (v: string) => { const r = waitlistSchema.shape.email.safeParse(v); return r.success ? "" : r.error.issues[0].message; },
    whatsapp: (v: string, optIn: boolean) => {
      const d = digitsOf(v);
      if (!d) return optIn ? "Add your phone number so we can message you on WhatsApp." : "";
      const r = waitlistSchema.shape.whatsappNumber.safeParse(d);
      return r.success ? "" : r.error.issues[0].message;
    },
    consent: (v: boolean) => (v ? "" : "Tick the box so we can email you about tickets."),
  };
  const setErr = (k: keyof Errs, m: string) => setErrs((e) => ({ ...e, [k]: m || undefined }));

  async function submit() {
    if (submitting.current) return;
    const e: Errs = {};
    const em = fieldErr.email(email); if (em) e.email = em;
    const wm = fieldErr.whatsapp(wa, waOptIn); if (wm) e.whatsapp = wm;
    const cm = fieldErr.consent(consent); if (cm) e.consent = cm;
    setErrs(e);
    if (Object.keys(e).length) {
      const id = e.email ? `${uid}-email` : e.whatsapp ? `${uid}-wa` : `${uid}-consent`;
      document.getElementById(id)?.focus();
      return;
    }
    submitting.current = true; setBusy(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          eventSlug: slug, email, name: name || undefined, whatsappNumber: digitsOf(wa) || undefined,
          consent: true, whatsappOptIn: waOptIn && !!digitsOf(wa), tier, partySize: party, source: "modal", website: hp,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone({
          city: data.city ?? city.city,
          reference: data.reference ?? "",
          duplicate: !!data.duplicate,
          tier: (data.tier as WaitlistTier) ?? tier,
          partySize: data.partySize ?? party,
          start: data.dates?.start ?? city.start,
          end: data.dates?.end ?? city.end,
          count: typeof data.count === "number" ? data.count : city.count,
        });
      } else if (res.status === 429) setErrs({ form: "Too many attempts. Your details are still here, try again in a few minutes." });
      else {
        const iss = Array.isArray(data?.issues) ? data.issues : [];
        const m: Errs = {};
        for (const i of iss) {
          const k = String(i.path?.[0] ?? "");
          if (k === "email" && !m.email) m.email = i.message;
          else if (k === "whatsappNumber" && !m.whatsapp) m.whatsapp = i.message;
        }
        setErrs(Object.keys(m).length ? m : { form: "Something went wrong. Your details are still here, try again." });
      }
    } catch {
      setErrs({ form: "Something went wrong. Your details are still here, try again." });
    } finally { submitting.current = false; setBusy(false); }
  }

  const t = TIERS[done ? done.tier : tier];
  const dates = useMemo(() => (city ? fmtLong(city.start, city.end) : ""), [city]);
  const titleId = `${uid}-title`;
  const err = (k: keyof Errs) => (errs[k] ? <p id={`${uid}-${k}-err`} role="alert" className="wl-err">{errs[k]}</p> : null);
  const ph = (id: string, example: string) => (focus === id ? example : " ");

  return (
    <div className="wl-backdrop" data-closing={closing || undefined} onMouseDown={(e) => { if (e.target === e.currentTarget) requestClose(); }}>
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} className="wl-panel" data-closing={closing || undefined}>
        <div className="wl-stub" data-tier={done ? done.tier : tier} style={{ background: t.bg, color: t.fg }}>
          <span className="wl-num relative" aria-hidden="true">{t.num}</span>
          <div className="relative min-w-0 flex-1">
            <p className="t-body-lg truncate font-bold leading-tight">{t.name === "Tier open" ? "Waitlist ticket" : t.name}</p>
            <p className="t-label truncate">{done ? done.city : city.city} · {done ? fmtLong(done.start, done.end) : dates}</p>
          </div>
          <Button variant="outline" leadingIcon={X} onClick={requestClose} aria-label="Close waitlist" className="wl-icon wl-close relative">Close</Button>
        </div>
        <div className="wl-perf" aria-hidden="true" />

        <div className="wl-body">
          {!done ? (
            <form id={`${uid}-form`} noValidate className="grid gap-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
              <div>
                <h2 id={titleId} className="t-h3">Join the waitlist</h2>
                <p className="t-body mt-2 text-text-muted">Drop your details — we&apos;ll ping you the moment tickets go live for your city.</p>
              </div>

              <div className="wl-field">
                <input id={`${uid}-name`} type="text" autoComplete="name" placeholder={ph("name", "e.g. Aria Mehta")} value={name} onChange={(e) => setName(e.target.value)} onFocus={() => setFocus("name")} onBlur={() => setFocus("")} />
                <label htmlFor={`${uid}-name`}>Name</label>
              </div>
              <div>
                <div className="wl-field">
                  <input id={`${uid}-email`} type="email" autoComplete="email" inputMode="email" placeholder={ph("email", "you@example.com")} required value={email} onFocus={() => setFocus("email")} onChange={(e) => { setEmail(e.target.value); if (errs.email) setErr("email", fieldErr.email(e.target.value)); }} onBlur={() => { setFocus(""); if (email) setErr("email", fieldErr.email(email)); }} aria-invalid={!!errs.email} aria-describedby={errs.email ? `${uid}-email-err` : undefined} />
                  <label htmlFor={`${uid}-email`}>Email (required)</label>
                </div>
                {err("email")}
              </div>
              <div>
                <div className="wl-field has-prefix">
                  <span className="wl-prefix" aria-hidden="true">+91</span>
                  <input id={`${uid}-wa`} type="tel" autoComplete="tel-national" inputMode="tel" placeholder={ph("wa", "98765 43210")} value={wa} onFocus={() => setFocus("wa")} onChange={(e) => { setWa(e.target.value); if (errs.whatsapp) setErr("whatsapp", fieldErr.whatsapp(e.target.value, waOptIn)); }} onBlur={() => { setFocus(""); setErr("whatsapp", fieldErr.whatsapp(wa, waOptIn)); }} aria-invalid={!!errs.whatsapp} aria-describedby={errs.whatsapp ? `${uid}-whatsapp-err` : undefined} />
                  <label htmlFor={`${uid}-wa`}>Phone (optional)</label>
                </div>
                {err("whatsapp")}
              </div>
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" />

              <div className="wl-field wl-select">
                <select id={`${uid}-city`} value={slug} onChange={(e) => chooseCity(e.target.value)}>
                  {cities.map((c) => <option key={c.slug} value={c.slug} disabled={!c.enabled}>{c.city} · {fmtLong(c.start, c.end)}{c.enabled ? "" : " (not open yet)"}</option>)}
                </select>
                <label htmlFor={`${uid}-city`}>City and dates</label>
              </div>

              <div className="grid items-end gap-3 min-[520px]:grid-cols-[1fr_auto]">
                <div className="wl-field wl-select">
                  <select id={`${uid}-tier`} value={tier} onChange={(e) => chooseTier(e.target.value as WaitlistTier)}>
                    {TIER_ORDER.map((k) => <option key={k} value={k} disabled={k === "glow" && !city.glow}>{TIERS[k].name}{k === "glow" && !city.glow ? " (Jaipur only)" : ""}</option>)}
                    <option value="undecided">Not sure yet</option>
                  </select>
                  <label htmlFor={`${uid}-tier`}>Ticket</label>
                </div>
                <div className="wl-party" role="group" aria-label="Party size">
                  <Button variant="outline" leadingIcon={Minus} className="wl-icon" aria-label="One fewer runner" disabled={party <= 1} onClick={() => setParty((p) => Math.max(1, p - 1))}>Fewer</Button>
                  <output aria-live="polite" className="t-body min-w-[84px] text-center font-semibold tabular-nums">{runners(party)}</output>
                  <Button variant="outline" leadingIcon={Plus} className="wl-icon" aria-label="One more runner" disabled={party >= 8} onClick={() => setParty((p) => Math.min(8, p + 1))}>More</Button>
                </div>
              </div>

              <div className="grid gap-3.5 pt-1">
                <div>
                  <label className="wl-check">
                    <input id={`${uid}-consent`} type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); if (errs.consent) setErr("consent", fieldErr.consent(e.target.checked)); }} aria-invalid={!!errs.consent} aria-describedby={errs.consent ? `${uid}-consent-err` : undefined} />
                    <span className="wl-box" aria-hidden="true"><Check size={16} strokeWidth={1.75} /></span>
                    <span>Email me about OFF GRAVITY tickets and updates.</span>
                  </label>
                  {err("consent")}
                </div>
                <label className="wl-check">
                  <input type="checkbox" role="switch" checked={waOptIn} onChange={(e) => { setWaOptIn(e.target.checked); if (errs.whatsapp) setErr("whatsapp", fieldErr.whatsapp(wa, e.target.checked)); }} />
                  <span className="wl-sw" aria-hidden="true" />
                  <span>Also message me on WhatsApp.</span>
                </label>
              </div>

              <div aria-live="polite">{errs.form && <p role="alert" className="wl-formerr t-body">{errs.form}</p>}</div>

              <Button type="submit" size="lg" fullWidth loading={busy} trailingIcon={ArrowRight}>{busy ? "Saving…" : "Lock my waitlist spot"}</Button>
              <p className="t-label text-text-muted">We&apos;ll only use your details to notify you about ticket sales for this city. No spam, ever. Dates are provisional, subject to venue and permission confirmations.</p>
            </form>
          ) : (
            <div className="relative">
              {!reduced && <Confetti />}
              <h2 id={titleId} className="sr-only">{done.duplicate ? `You're already in line for ${done.city}` : "You're in line"}</h2>
              <div className="wl-ticket" role="group" aria-label="Your waitlist ticket">
                <div className="wl-ticket-inner">
                  <div className="relative flex h-[104px] flex-col justify-center px-6" style={{ background: t.bg, color: t.fg }}>
                    <span className="wl-num absolute right-5 top-4" aria-hidden="true">{t.num}</span>
                    <p className="t-label">{done.duplicate ? `You're already in line for ${done.city}` : "You're in line"}</p>
                    <p className="t-h3">{TIERS[done.tier].name === "Tier open" ? "Tier to be chosen" : TIERS[done.tier].name}</p>
                  </div>
                  <div className="wl-perf" style={{ marginTop: -1 }} />
                  <div className="grid gap-4 bg-cream px-6 pb-6 pt-5">
                    <dl className="t-body grid grid-cols-2 gap-x-4 gap-y-3">
                      <div><dt className="t-label text-text-muted">City</dt><dd className="font-bold">{done.city}</dd></div>
                      <div><dt className="t-label text-text-muted">Dates (provisional)</dt><dd className="font-bold">{fmtLong(done.start, done.end)}</dd></div>
                      <div><dt className="t-label text-text-muted">Party size</dt><dd className="font-bold tabular-nums">{runners(done.partySize)}</dd></div>
                      {done.count != null && <div><dt className="t-label text-text-muted">In line</dt><dd className="font-bold tabular-nums">{done.count}</dd></div>}
                    </dl>
                    {done.reference && (
                      <div className="wl-refbox">
                        <p className="t-label text-text-muted">Waitlist reference</p>
                        <p className="wl-ref t-h3">{done.reference}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p role="status" className="t-body mt-6">We&apos;ll message you before tickets open for {done.city}.</p>
              <div className="mt-6 grid gap-3">
                <Button size="lg" variant="outline" fullWidth leadingIcon={CalendarPlus} onClick={() => downloadIcs(done.city, done.start, done.end)}>Add to calendar</Button>
                <Button size="lg" variant="outline" fullWidth leadingIcon={RotateCcw} onClick={() => { setDone(null); setErrs({}); }}>Join another city</Button>
                <Button size="lg" fullWidth onClick={requestClose}>Done</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
