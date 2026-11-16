"use client";
import { useState } from "react";
import { adminFetch } from "./api";
import { Text, Area, Panel, Notice, Field, inputCls, btnPrimary, btnGhost } from "./ui";

type Faq = { id: number; eventId: number | null; question: string; answer: string; order: number };
type Values = Record<"announcement" | "policy.terms" | "policy.privacy" | "policy.refund" | "hold_minutes", string>;

function Block({ k, label, value, multiline }: { k: string; label: string; value: string; multiline?: boolean }) {
  const [v, setV] = useState(value);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  async function save() {
    const { ok, data } = await adminFetch("/api/admin/content", "PUT", { key: k, body: v });
    setErr(!ok); setMsg(ok ? "Saved." : data.error ?? "Could not save.");
  }
  return (
    <div className="grid gap-3">
      {multiline ? <Area label={label} rows={8} value={v} onChange={setV} /> : <Text label={label} value={v} onChange={setV} />}
      <div className="flex items-center gap-3"><button className={btnPrimary} onClick={save}>Save</button>{msg && <Notice kind={err ? "err" : "ok"}>{msg}</Notice>}</div>
    </div>
  );
}

function FaqRow({ faq, events }: { faq: Faq; events: { id: number; city: string }[] }) {
  const [f, setF] = useState(faq);
  const [msg, setMsg] = useState<string | null>(null);
  async function save() {
    const { ok, data } = await adminFetch(`/api/admin/faqs/${f.id}`, "PUT", { eventId: f.eventId, question: f.question, answer: f.answer, order: f.order });
    setMsg(ok ? "Saved." : data.error ?? "Could not save.");
  }
  async function del() {
    if (!confirm("Delete this FAQ?")) return;
    const { ok } = await adminFetch(`/api/admin/faqs/${f.id}`, "DELETE");
    if (ok) location.reload();
  }
  return (
    <div className="grid gap-3 rounded-xl bg-cream p-4">
      <Text label="Question" value={f.question} onChange={(v) => setF({ ...f, question: v })} />
      <Area label="Answer" rows={3} value={f.answer} onChange={(v) => setF({ ...f, answer: v })} />
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Event"><select className={inputCls} value={f.eventId ?? ""} onChange={(e) => setF({ ...f, eventId: e.target.value ? Number(e.target.value) : null })}><option value="">All events</option>{events.map((e) => <option key={e.id} value={e.id}>{e.city}</option>)}</select></Field>
        <Text label="Order" type="number" value={String(f.order)} onChange={(v) => setF({ ...f, order: Number(v) || 0 })} />
        <button className={btnPrimary} onClick={save}>Save</button><button className={btnGhost} onClick={del}>Delete</button>
        {msg && <span className="font-semibold">{msg}</span>}
      </div>
    </div>
  );
}

export function ContentEditor({ values, faqs, events }: { values: Values; faqs: Faq[]; events: { id: number; city: string }[] }) {
  async function addFaq() {
    const { ok } = await adminFetch("/api/admin/faqs", "POST", { eventId: null, question: "New question", answer: "Answer", order: faqs.length });
    if (ok) location.reload();
  }
  return (
    <div className="grid gap-6">
      <Panel title="Announcement bar"><Block k="announcement" label="Homepage announcement (blank hides the bar)" value={values.announcement} /></Panel>
      <Panel title="Booking hold time"><Block k="hold_minutes" label="Minutes a slot is held while paying (default 15)" value={values.hold_minutes} /></Panel>
      <Panel title="Policy pages (draft)">
        <div className="grid gap-8">
          <Block k="policy.terms" label="Terms and conditions" value={values["policy.terms"]} multiline />
          <Block k="policy.privacy" label="Privacy policy" value={values["policy.privacy"]} multiline />
          <Block k="policy.refund" label="Refund and cancellation" value={values["policy.refund"]} multiline />
        </div>
      </Panel>
      <Panel title="FAQs">
        <div className="grid gap-4">{faqs.map((f) => <FaqRow key={f.id} faq={f} events={events} />)}<div><button className={btnGhost} onClick={addFaq}>+ Add FAQ</button></div></div>
      </Panel>
    </div>
  );
}
