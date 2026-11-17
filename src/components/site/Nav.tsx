"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
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
      if (e.key === "Escape") { setOpen(false); document.getElementById("menu-btn")?.focus(); }
      if (e.key === "Tab") { const items = f(); const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <header className="og-nav">
      <Container>
        <div className="og-nav__bar">
          <Logo height={50} className="og-logo" />
          <nav aria-label="Main" className="og-nav__links">
            {LINKS.map((l) => { const id = l.href.startsWith("/#") ? l.href.slice(2) : ""; return <Link key={l.label} href={l.href} className="og-navlink" aria-current={id && active === id ? "location" : undefined}>{l.label}</Link>; })}
          </nav>
          <div className="og-nav__right">
            <Link href="/my-bookings" className="og-navlink og-nav__mylink">My bookings</Link>
            <Button id="menu-btn" variant="ghost-on-dark" leadingIcon={Menu} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(true)} className="og-nav__burger">Menu</Button>
          </div>
        </div>
      </Container>
      {open && (
        <div id="mobile-menu" ref={menuRef} role="dialog" aria-modal="true" aria-label="Menu" className="og-menu">
          <Container className="flex flex-1 flex-col">
            <div className="og-nav__bar"><Logo height={50} className="og-logo" />
              <Button variant="ghost-on-dark" leadingIcon={X} onClick={() => { setOpen(false); document.getElementById("menu-btn")?.focus(); }}>Close</Button></div>
            <nav aria-label="Mobile" className="og-menu__list">
              {[...LINKS, { href: "/my-bookings", label: "My bookings" }].map((l) => (
                <Link key={l.label} href={l.href} onClick={() => setOpen(false)}>{l.label}</Link>))}
            </nav>
            <div className="og-menu__cta" onClick={() => setOpen(false)}>{cta ?? <Button href="/book">Book your slot</Button>}</div>
          </Container>
        </div>
      )}
    </header>
  );
}
