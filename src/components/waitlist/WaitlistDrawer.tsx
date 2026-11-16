"use client";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { waitlistSchema } from "@/lib/schemas/waitlist";
import { Confetti } from "./Confetti";
import { TIERS, TIER_ORDER, downloadIcs, fmtRange, type DrawerCity, type WaitlistTier } from "./ticket";
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

export function WaitlistDrawer({ cities, initialSlug, initialTier, onClose }: {
  cities: DrawerCity[]; initialSlug?: string; initialTier?: WaitlistTier; onClose: () => void;
}) {
  const uid = useId();
  const reduced = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [closing, setClosing] = useState(false);

  const firstEnabled = cities.find((c) => c.enabled)?.slug ?? cities[0]?.slug ?? "";
  const [slug, setSlug] = useState(() => (cities.find((c) => c.slug === initialSlug && c.enabled) ? initialSlug! : firstEnabled));
  const city = cities.find((c) => c.slug === slug) ?? cities[0];
  const [tier, setTier] = useState<WaitlistTier>(() => (initialTier === "glow" && !city?.glow ? "undecided" : initialTier ?? "undecided"));
  const [party, setParty] = useState(() => TIERS[initialTier ?? "undecided"].party ?? 1);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [wa, setWa] = useState("");
  const [consent, setConsent] = useState(false);
  const [waOptIn, setWaOptIn] = useState(false);
  const [hp, setHp] = useState("");
  const [errs, setErrs] = useState<Errs>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const submitting = useRef(false);

  const requestClose = useCallback(() => {
    if (reduced) { onClose(); return; }
    setClosing(true);
    setTimeout(onClose, 210);
  }, [reduced, onClose]);

  // dialog behaviour: scroll lock, focus in/out, Escape, focus trap
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const body = document.body;
    const overflow = body.style.overflow;
    body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>('input[type="radio"]:checked, input, button')?.focus();
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

  // move focus to the step heading when the step changes (not on first render)
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    headingRef.current?.focus();
  }, [step]);

  // mobile sheet: drag the handle/header down to dismiss
  const drag = useRef<{ y: number; t: number; dy: number } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    if (!window.matchMedia("(max-width:699px)").matches) return;
    if ((e.target as HTMLElement).closest("button")) return;
    drag.current = { y: e.clientY, t: performance.now(), dy: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (panel.current) panel.current.style.animation = "none";
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d || !panel.current) return;
    d.dy = Math.max(0, e.clientY - d.y);
    panel.current.style.transform = `translateY(${d.dy}px)`;
  };
  const onUp = () => {
    const d = drag.current; drag.current = null;
    const p = panel.current; if (!d || !p) return;
    const v = d.dy / Math.max(1, performance.now() - d.t);
    if (d.dy > 110 || (v > 0.6 && d.dy > 40)) { p.style.transition = "transform .2s ease-in"; p.style.transform = "translateY(100%)"; setTimeout(onClose, reduced ? 0 : 190); }
    else { p.style.transition = "transform .2s ease-out"; p.style.transform = ""; setTimeout(() => { p.style.transition = ""; p.style.animation = ""; }, 220); }
  };

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
      if (!d) return optIn ? "Add your WhatsApp number so we can message you there." : "";
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
          consent: true, whatsappOptIn: waOptIn && !!digitsOf(wa), tier, partySize: party, source: "drawer", website: hp,
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
        setStep(3);
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
  const dates = useMemo(() => (city ? fmtRange(city.start, city.end) : ""), [city]);
  const stepLabel = step === 1 ? "Your weekend" : step === 2 ? "Where we reach you" : "You're in line";
  const titleId = `${uid}-title`;
  const err = (k: keyof Errs) => (errs[k] ? <p id={`${uid}-${k}-err`} role="alert" className="wl-err">{errs[k]}</p> : null);

  return (
    <div className="wl-backdrop" data-closing={closing || undefined} onMouseDown={(e) => { if (e.target === e.currentTarget) requestClose(); }}>
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} className="wl-panel" data-closing={closing || undefined}>
        <header className="wl-head" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <div className="wl-handle" aria-hidden="true" />
          <div className="flex items-center gap-3">
            {step < 3 ? (
              <div className="wl-stub" data-tier={tier} style={{ background: t.bg, color: t.fg }}>
                <div className="relative min-w-0 flex-1">
                  <h2 id={titleId} className="truncate text-[20px] font-extrabold leading-tight">{t.name}</h2>
                  <p className="truncate text-[14px] font-semibold opacity-90">{city.city} · {dates}</p>
                </div>
                <span className="wl-num relative" aria-hidden="true">{t.num}</span>
              </div>
            ) : (
              <h2 id={titleId} className="min-w-0 flex-1 text-[20px] font-extrabold leading-tight">Join the waitlist · {done?.city}</h2>
            )}
            <button type="button" onClick={requestClose} aria-label="Close waitlist" className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full bg-ink/10 text-2xl font-bold leading-none hover:bg-ink hover:text-white">×</button>
          </div>
          <div className="mt-3" role="progressbar" aria-label={`Step ${step} of 3: ${stepLabel}`} aria-valuemin={1} aria-valuemax={3} aria-valuenow={step}>
            <div className="grid grid-cols-3 gap-1.5">
              {[1, 2, 3].map((n) => <div key={n} className="wl-seg" data-on={n <= step || undefined}><i /></div>)}
            </div>
          </div>
        </header>

        <div className="wl-body">
          <div aria-live="polite" className="sr-only">{`Step ${step} of 3: ${stepLabel}`}</div>

          {step === 1 && (
            <div className="wl-step grid gap-7">
              <h3 ref={headingRef} tabIndex={-1} className="t-card !text-[26px] outline-none">Your weekend</h3>
              <fieldset className="grid gap-3">
                <legend className="mb-3 text-[16px] font-bold">Which city?</legend>
                <div className="grid grid-cols-2 gap-2.5">
                  {cities.map((c) => (
                    <label key={c.slug} className="wl-opt">
                      <input type="radio" name={`${uid}-city`} value={c.slug} checked={slug === c.slug} disabled={!c.enabled} onChange={() => chooseCity(c.slug)} />
                      <span className="wl-chip">
                        <span className="text-[16px] font-extrabold leading-tight">{c.city}</span>
                        <span className="text-[14px] font-semibold opacity-80">{c.enabled ? fmtRange(c.start, c.end) : "Not open yet"}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-3 text-[16px] font-bold">Which ticket?</legend>
                <div className="grid grid-cols-2 gap-2.5">
                  {TIER_ORDER.map((k) => {
                    const T = TIERS[k]; const off = k === "glow" && !city.glow;
                    return (
                      <label key={k} className="wl-opt">
                        <input type="radio" name={`${uid}-tier`} value={k} checked={tier === k} disabled={off} onChange={() => chooseTier(k)} />
                        <span className="wl-tile" data-tier={k} style={{ background: T.bg, color: T.fg }}>
                          <span className="relative text-[14px] font-bold opacity-80 tabular-nums">{T.num}</span>
                          <span className="relative text-[18px] font-extrabold leading-tight">{T.name}</span>
                          {off && <span className="relative text-[14px] font-semibold opacity-90">Jaipur only</span>}
                        </span>
                      </label>
                    );
                  })}
                  <label className="wl-opt col-span-2">
                    <input type="radio" name={`${uid}-tier`} value="undecided" checked={tier === "undecided"} onChange={() => chooseTier("undecided")} />
                    <span className="wl-tile wl-tile-open"><span className="text-[17px] font-extrabold">Not sure yet</span><span className="text-[14px] font-semibold opacity-80">Pick when tickets open</span></span>
                  </label>
                </div>
              </fieldset>

              <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3">
                <div>
                  <p id={`${uid}-party`} className="text-[16px] font-bold">Party size</p>
                  <p className="text-[14px] text-text-muted">How many of you are racing?</p>
                </div>
                <div className="flex items-center gap-3" role="group" aria-labelledby={`${uid}-party`}>
                  <button type="button" className="wl-step-btn" aria-label="One fewer" disabled={party <= 1} onClick={() => setParty((p) => Math.max(1, p - 1))}>−</button>
                  <output aria-live="polite" className="w-8 text-center text-[22px] font-extrabold tabular-nums">{party}</output>
                  <button type="button" className="wl-step-btn" aria-label="One more" disabled={party >= 8} onClick={() => setParty((p) => Math.min(8, p + 1))}>+</button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <form id={`${uid}-form`} className="wl-step grid gap-4" noValidate onSubmit={(e) => { e.preventDefault(); submit(); }}>
              <h3 ref={headingRef} tabIndex={-1} className="t-card !text-[26px] outline-none">Where we reach you</h3>
              <div>
                <div className="wl-field">
                  <input id={`${uid}-name`} type="text" autoComplete="name" placeholder=" " value={name} onChange={(e) => setName(e.target.value)} />
                  <label htmlFor={`${uid}-name`}>Name</label>
                </div>
              </div>
              <div>
                <div className="wl-field">
                  <input id={`${uid}-email`} type="email" autoComplete="email" inputMode="email" placeholder=" " required value={email} onChange={(e) => { setEmail(e.target.value); if (errs.email) setErr("email", fieldErr.email(e.target.value)); }} onBlur={() => email && setErr("email", fieldErr.email(email))} aria-invalid={!!errs.email} aria-describedby={errs.email ? `${uid}-email-err` : undefined} />
                  <label htmlFor={`${uid}-email`}>Email (required)</label>
                </div>
                {err("email")}
              </div>
              <div>
                <div className="wl-field has-prefix">
                  <span className="wl-prefix" aria-hidden="true">+91</span>
                  <input id={`${uid}-wa`} type="tel" autoComplete="tel-national" inputMode="tel" placeholder=" " value={wa} onChange={(e) => { setWa(e.target.value); if (errs.whatsapp) setErr("whatsapp", fieldErr.whatsapp(e.target.value, waOptIn)); }} onBlur={() => setErr("whatsapp", fieldErr.whatsapp(wa, waOptIn))} aria-invalid={!!errs.whatsapp} aria-describedby={errs.whatsapp ? `${uid}-whatsapp-err` : undefined} />
                  <label htmlFor={`${uid}-wa`}>WhatsApp number (optional)</label>
                </div>
                {err("whatsapp")}
              </div>
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" />
              <div className="grid gap-4 pt-1">
                <div>
                  <label className="wl-check">
                    <input id={`${uid}-consent`} type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); if (errs.consent) setErr("consent", fieldErr.consent(e.target.checked)); }} aria-invalid={!!errs.consent} aria-describedby={errs.consent ? `${uid}-consent-err` : undefined} />
                    <span className="wl-box" aria-hidden="true" />
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
              <p className="text-[14px] text-text-muted">Dates are provisional, subject to venue and permission confirmations.</p>
              <div aria-live="polite">{errs.form && <p role="alert" className="rounded-2xl bg-[#B3261E] px-4 py-3 text-[15px] font-bold text-white">{errs.form}</p>}</div>
            </form>
          )}

          {step === 3 && done && (
            <div className="wl-step relative">
              {!reduced && <Confetti />}
              <h3 ref={headingRef} tabIndex={-1} className="sr-only outline-none">{done.duplicate ? `You're already in line for ${done.city}` : "You're in line"}</h3>
              <div className="wl-ticket" role="group" aria-label="Your waitlist ticket">
                <div className="wl-ticket-inner">
                  <div className="relative flex h-[112px] flex-col justify-center px-6" style={{ background: t.bg, color: t.fg }}>
                    <span className="wl-num absolute right-5 top-4" aria-hidden="true">{t.num}</span>
                    <p className="text-[14px] font-bold opacity-90">{done.duplicate ? `You're already in line for ${done.city}` : "You're in line"}</p>
                    <p className="text-[28px] font-extrabold leading-tight">{TIERS[done.tier].name === "Tier open" ? "Tier to be chosen" : TIERS[done.tier].name}</p>
                  </div>
                  <div className="wl-perf" style={{ marginTop: -1 }} />
                  <div className="grid gap-4 bg-cream px-6 pb-6 pt-5">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[16px]">
                      <div><dt className="text-[14px] text-text-muted">City</dt><dd className="font-extrabold">{done.city}</dd></div>
                      <div><dt className="text-[14px] text-text-muted">Dates (provisional)</dt><dd className="font-extrabold">{fmtRange(done.start, done.end)} 2027</dd></div>
                      <div><dt className="text-[14px] text-text-muted">Party size</dt><dd className="font-extrabold tabular-nums">{done.partySize}</dd></div>
                      {done.count != null && <div><dt className="text-[14px] text-text-muted">In line</dt><dd className="font-extrabold tabular-nums">{done.count}</dd></div>}
                    </dl>
                    {done.reference && (
                      <div className="rounded-2xl border-2 border-dashed border-ink/25 bg-white px-4 py-3">
                        <p className="text-[14px] text-text-muted">Waitlist reference</p>
                        <p className="wl-ref text-[24px] font-extrabold">{done.reference}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p role="status" className="mt-5 text-[17px] font-semibold">We&apos;ll message you before tickets open for {done.city}.</p>
              <div className="mt-5 grid gap-3">
                <button type="button" onClick={() => downloadIcs(done.city, done.start, done.end)} className="cursor-pointer rounded-full bg-white px-6 py-3.5 text-[16px] font-extrabold hover:bg-ink hover:text-white">Add {done.city} dates to calendar</button>
                <button type="button" onClick={() => { setDone(null); setStep(1); setErrs({}); }} className="cursor-pointer rounded-full bg-white px-6 py-3.5 text-[16px] font-extrabold hover:bg-ink hover:text-white">Join another city</button>
              </div>
            </div>
          )}
        </div>

        <footer className="wl-foot">
          {step === 1 && (
            <button type="button" className="btn-primary w-full justify-center !px-6 !py-4 !text-[18px]" onClick={() => setStep(2)} disabled={!city?.enabled}>Next<span aria-hidden="true">→</span></button>
          )}
          {step === 2 && (
            <>
              <button type="button" className="link-secondary cursor-pointer px-2" onClick={() => setStep(1)}>Back</button>
              <button type="submit" form={`${uid}-form`} className="btn-primary flex-1 justify-center !px-6 !py-4 !text-[18px] disabled:opacity-70" disabled={busy} aria-busy={busy}>
                {busy ? <><span className="wl-spin" aria-hidden="true" />Saving…</> : <>Hold my spot<span aria-hidden="true">→</span></>}
              </button>
            </>
          )}
          {step === 3 && <button type="button" className="btn-primary w-full justify-center !px-6 !py-4 !text-[18px]" onClick={requestClose}>Done</button>}
        </footer>
      </div>
    </div>
  );
}
