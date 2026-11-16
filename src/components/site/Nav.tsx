"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { BookButton } from "./BookButton";
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
        <Logo height={50} />
        <nav aria-label="Main" className="hidden items-center gap-8 text-[16px] font-semibold min-[980px]:flex">
          {LINKS.map((l) => <Link key={l.label} href={l.href} className="hover:text-mint">{l.label}</Link>)}
        </nav>
        <div className="flex items-center gap-2 min-[400px]:gap-4 min-[980px]:gap-5">
          <Link href="/my-bookings" className="hidden text-[16px] font-semibold hover:text-mint min-[980px]:inline">My bookings</Link>
          {cta ?? <BookButton small>Book your slot</BookButton>}
          <button ref={btnRef} type="button" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(true)} className="inline-flex h-11 items-center rounded-full border border-white/40 px-3.5 text-[15px] font-bold min-[980px]:hidden">Menu</button>
        </div>
      </div>
      {open && (
        <div id="mobile-menu" ref={menuRef} role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-50 flex flex-col bg-ink px-[var(--pad)] py-5">
          <div className="flex h-[52px] items-center justify-between"><Logo height={46} />
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
