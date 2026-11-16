"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { BookButton } from "./BookButton";
import "./nav.css";
const SECTION_IDS = ["about", "obstacles", "tour"];
const LINKS = [
  { href: "/#about", label: "About" },
  { href: "/#obstacles", label: "The obstacles" },
  { href: "/#tour", label: "2027 tour" },
  { href: "/events/mumbai#faqs", label: "FAQs" },
];
export function SiteNav({ cta }: { cta?: React.ReactNode } = {}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [active, setActive] = useState<string | null>(null);
  // active-section underline: whichever section spans the viewport's middle line.
  // Re-queries the DOM each time: homepage sections can remount when layout mode (pinned/static) resolves.
  useEffect(() => {
    let raf = 0;
    const calc = () => {
      raf = 0;
      const mid = window.innerHeight * 0.5;
      let cur: string | null = null;
      for (const id of SECTION_IDS) {
        const r = document.getElementById(id)?.getBoundingClientRect();
        if (r && r.top <= mid && r.bottom > mid) cur = id;
      }
      setActive((a) => (a === cur ? a : cur));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(calc); };
    calc();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    const el = menuRef.current!; const f = () => Array.from(el.querySelectorAll<HTMLElement>("a,button"));
    f()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); btnRef.current?.focus(); }
      if (e.key === "Tab") { const items = f(); const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink text-white">
      <div className="mx-auto flex h-[var(--nav-h)] max-w-[1312px] items-center justify-between gap-2 px-[var(--pad)]">
        <Logo height={50} className="og-logo" />
        <nav aria-label="Main" className="hidden items-center gap-8 text-[16px] font-semibold min-[980px]:flex">
          {LINKS.map((l) => { const id = l.href.startsWith("/#") ? l.href.slice(2) : ""; return <Link key={l.label} href={l.href} className="og-navlink hover:text-mint" aria-current={id && active === id ? "location" : undefined}>{l.label}</Link>; })}
        </nav>
        <div className="flex items-center gap-2 min-[400px]:gap-4 min-[980px]:gap-5">
          <Link href="/my-bookings" className="hidden text-[16px] font-semibold hover:text-mint min-[980px]:inline">My bookings</Link>
          {cta ?? <BookButton small>Book your slot</BookButton>}
          <button ref={btnRef} type="button" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(true)} className="inline-flex h-11 items-center rounded-full border border-white/40 px-3.5 text-[15px] font-bold min-[980px]:hidden">Menu</button>
        </div>
      </div>
      {open && (
        <div id="mobile-menu" ref={menuRef} role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-50 flex flex-col bg-ink px-[var(--pad)] py-5">
          <div className="flex h-[52px] items-center justify-between"><Logo height={46} className="og-logo" />
            <button type="button" onClick={() => { setOpen(false); btnRef.current?.focus(); }} className="inline-flex h-11 items-center rounded-full border border-white/30 px-4 text-[15px] font-bold">Close</button></div>
          <nav aria-label="Mobile" className="mt-10 flex flex-col gap-2">
            {[...LINKS, { href: "/my-bookings", label: "My bookings" }].map((l) => (
              <Link key={l.label} href={l.href} onClick={() => setOpen(false)} className="border-b border-white/10 py-4 text-[32px] font-extrabold tracking-tight">{l.label}</Link>))}
          </nav>
          <div className="mt-auto pb-6" onClick={() => setOpen(false)}>{cta ?? <BookButton>Book your slot</BookButton>}</div>
        </div>
      )}
    </header>
  );
}
