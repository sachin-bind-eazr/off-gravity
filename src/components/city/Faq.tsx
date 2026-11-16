"use client";
import { useState } from "react";
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y-2 divide-ink/15 border-y-2 border-ink/15">
      {items.map((f, i) => (
        <div key={i}>
          <h3>
            <button type="button" aria-expanded={open === i} aria-controls={`faq-${i}`} id={`faq-b-${i}`} onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-6 py-6 text-left text-[clamp(20px,2vw,26px)] font-extrabold">
              {f.q}<span aria-hidden className="text-3xl leading-none">{open === i ? "–" : "+"}</span>
            </button>
          </h3>
          <div id={`faq-${i}`} role="region" aria-labelledby={`faq-b-${i}`} hidden={open !== i} className="max-w-[70ch] pb-7 text-text-muted">{f.a}</div>
        </div>
      ))}
    </div>
  );
}
