"use client";
import { useId, useRef, useState } from "react";
import { waitlistSchema } from "@/lib/schemas/waitlist";
import type { WaitlistCity } from "./WaitlistProvider";

type Errs = Partial<Record<"eventSlug" | "email" | "whatsappNumber" | "consent" | "form", string>>;

/**
 * variant "inline": one row on wide screens (final CTA). "stacked": modal.
 * Use tone="dark" on ink backgrounds.
 */
export function WaitlistForm({ cities, initialSlug, source = "site", variant = "stacked", tone = "light", onDone }: {
  cities: WaitlistCity[]; initialSlug?: string; source?: string; variant?: "inline" | "stacked"; tone?: "light" | "dark"; onDone?: () => void;
}) {
  const id = useId();
  const [slug, setSlug] = useState(initialSlug && cities.some((c) => c.slug === initialSlug) ? initialSlug : cities[0]?.slug ?? "");
  const [email, setEmail] = useState("");
  const [wa, setWa] = useState("");
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState("");
  const [errs, setErrs] = useState<Errs>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ city: string; reference?: string; duplicate?: boolean } | null>(null);
  const submitting = useRef(false);
  const dark = tone === "dark";
  const errCls = `mt-1.5 px-2 text-sm font-semibold ${dark ? "text-[#FFB3AD]" : "text-[#8C1D18]"}`;
  const input = `w-full rounded-full border px-5 py-3.5 text-[16px] outline-none ${dark ? "border-white/25 bg-white/10 text-white placeholder:text-on-dark/70 focus:border-mint" : "border-ink/20 bg-white text-ink focus:border-ink"}`;

  function validate(): Errs {
    const r = waitlistSchema.safeParse({ eventSlug: slug, email, whatsappNumber: wa, consent, source, website: hp });
    if (r.success) return {};
    const e: Errs = {};
    for (const i of r.error.issues) {
      const k = String(i.path[0]) as keyof Errs;
      if (!e[k]) e[k] = i.message;
    }
    return e;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (submitting.current) return;
    const e = validate();
    setErrs(e);
    if (Object.keys(e).length) return;
    submitting.current = true;
    setBusy(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ eventSlug: slug, email, whatsappNumber: wa || undefined, consent, tier: "undecided", partySize: 1, source, website: hp }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone({ city: cities.find((c) => c.slug === slug)?.city ?? data.city ?? "", reference: data.reference, duplicate: data.duplicate });
        onDone?.();
      } else if (res.status === 429) setErrs({ form: "Too many attempts. Please try again in a few minutes." });
      else setErrs({ form: data?.issues?.[0]?.message ?? "Something went wrong. Please try again." });
    } catch {
      setErrs({ form: "Couldn't reach the server. Check your connection and try again." });
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  if (done !== null)
    return (
      <p role="status" aria-live="polite" className={`rounded-3xl px-6 py-5 text-lg font-bold ${dark ? "bg-mint text-ink" : "bg-mint/30 text-ink"}`}>
        {done.duplicate ? `You're already in line for ${done.city}.` : `You're in line for ${done.city}. We'll message you before tickets open.`}
        {done.reference && <span className="mt-1 block text-[15px] font-semibold tabular-nums">Reference {done.reference}</span>}
      </p>
    );
  if (!cities.length) return <p className={dark ? "text-white" : "text-ink"}>Sign-ups aren&apos;t open yet.</p>;

  const inline = variant === "inline";
  return (
    <form onSubmit={submit} noValidate aria-busy={busy} className={`relative grid gap-3 ${dark ? "text-white" : "text-ink"}`}>
      <div className={inline ? "grid gap-3 md:grid-cols-[1.4fr_1fr_auto]" : "grid gap-3"}>
        <div>
          <label htmlFor={`${id}-email`} className="sr-only">Email</label>
          <input id={`${id}-email`} type="email" autoComplete="email" inputMode="email" className={input} placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errs.email} aria-describedby={errs.email ? `${id}-email-err` : undefined} />
          {errs.email && <p id={`${id}-email-err`} role="alert" className={errCls}>{errs.email}</p>}
        </div>
        <div>
          <label htmlFor={`${id}-city`} className="sr-only">City</label>
          <select id={`${id}-city`} className={`${input} ${dark ? "[&>option]:text-ink" : ""}`} value={slug} onChange={(e) => setSlug(e.target.value)}>
            {cities.map((c) => <option key={c.slug} value={c.slug}>{c.city}</option>)}
          </select>
          {errs.eventSlug && <p role="alert" className={errCls}>{errs.eventSlug}</p>}
        </div>
        {inline && <button type="submit" disabled={busy} className="btn-primary justify-center disabled:opacity-60">{busy ? "Joining…" : "Join the waitlist"}</button>}
      </div>
      <div>
        <label htmlFor={`${id}-wa`} className="sr-only">WhatsApp number (optional)</label>
        <input id={`${id}-wa`} type="tel" autoComplete="tel" inputMode="tel" className={input} placeholder="WhatsApp number (optional)" value={wa} onChange={(e) => setWa(e.target.value)} aria-invalid={!!errs.whatsappNumber} aria-describedby={errs.whatsappNumber ? `${id}-wa-err` : undefined} />
        {errs.whatsappNumber && <p id={`${id}-wa-err`} role="alert" className={errCls}>{errs.whatsappNumber}</p>}
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      <div>
        <label className="flex cursor-pointer items-start gap-3 text-[15px] font-semibold">
          <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[#02D69C]" checked={consent} onChange={(e) => setConsent(e.target.checked)} aria-invalid={!!errs.consent} aria-describedby={errs.consent ? `${id}-consent-err` : undefined} />
          <span>Email me about OFF GRAVITY tickets and updates.</span>
        </label>
        {errs.consent && <p id={`${id}-consent-err`} role="alert" className={errCls}>{errs.consent}</p>}
      </div>
      {!inline && <button type="submit" disabled={busy} className="btn-primary justify-center disabled:opacity-60">{busy ? "Joining…" : "Join the waitlist"}</button>}
      <div aria-live="polite">{errs.form && <p role="alert" className={errCls}>{errs.form}</p>}</div>
    </form>
  );
}
