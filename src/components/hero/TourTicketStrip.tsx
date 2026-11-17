"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWaitlist } from "@/components/waitlist";
import { Container } from "@/components/ui/Container";
import { TourTicket } from "./TourTicketCard";
import { CityMarquee } from "./CityMarquee";
import { countdown, nextStopIndex, pickActive, stopLabel, ticketHref, toTicketCities, type StripEvent } from "./tourTicket";
import "./tourTicketStrip.css";

/** Keep in sync with the `.tts-track` animation duration in tourTicketStrip.css. */
const LOOP_S = 46;
const MOBILE = "(max-width: 767.98px)";
const REDUCED = "(prefers-reduced-motion: reduce)";
/** The solid stop of the fade gradient (79%) must end exactly at the ticket's right edge. */
const FADE_SOLID = 0.79;

/** The marquee's CSS animation (not the track's opacity fade-in transition, which getAnimations() can list first). */
function marqueeAnimation(track: HTMLElement): Animation | null {
  return track.getAnimations().find((a) => (a as CSSAnimation).animationName === "tts-marquee") ?? null;
}

/**
 * Hero tour strip: a festival ticket on the left, a kinetic marquee of the six cities behind it.
 * The marquee item currently "touching" the ticket's right edge (mobile: marquee left + 24px) drives the ticket.
 */
export function TourTicketStrip({ events, initialNow }: { events: StripEvent[]; initialNow: number }) {
  const router = useRouter();
  const { open } = useWaitlist();
  const cities = useMemo(() => toTicketCities(events), [events]);
  /** stable identity of the city list: setup effects re-run only when the cities themselves change */
  const citiesKey = cities.map((c) => c.slug).join(",");

  // countdown clock: first value comes from the server (initialNow), then the client clock every 30s
  const [now, setNow] = useState(initialNow);
  const nextIdx = nextStopIndex(cities, now);
  const fallbackIdx = nextIdx < 0 ? 0 : nextIdx;

  const [active, setActive] = useState(() => { const n = nextStopIndex(cities, initialNow); return n < 0 ? 0 : n; });
  const [punch, setPunch] = useState<"a" | "b" | null>(null);
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [running, setRunning] = useState(false);

  const rootRef = useRef<HTMLElement>(null);
  const ticketRef = useRef<HTMLButtonElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  const fallbackRef = useRef(fallbackIdx);
  /** last index the detection loop saw; a manual pick holds until this changes */
  const lastDetected = useRef<number | null>(null);

  useEffect(() => { fallbackRef.current = fallbackIdx; }, [fallbackIdx]);

  const show = useCallback((i: number) => {
    if (i === activeRef.current) return;
    activeRef.current = i;
    setActive(i);
    setPunch((p) => (p === "a" ? "b" : "a"));
  }, []);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 30_000);
    return () => { clearTimeout(first); clearInterval(id); };
  }, []);

  useEffect(() => {
    const m = window.matchMedia(REDUCED);
    const f = () => setReduced(m.matches);
    f();
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);

  // fade width = ticket right edge (relative to the band) / 0.79, kept in sync on resize
  useLayoutEffect(() => {
    const root = rootRef.current, ticket = ticketRef.current;
    if (!root || !ticket) return;
    const measure = () => {
      const edge = ticket.getBoundingClientRect().right - root.getBoundingClientRect().left;
      root.style.setProperty("--tts-edge", `${edge}px`);
      root.style.setProperty("--tts-fade-w", `${edge / FADE_SOLID}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    ro.observe(ticket);
    return () => ro.disconnect();
  }, [citiesKey]);

  /** Loop progress (0–1) that puts city `idx` (first set) with its left edge just past the detection edge. */
  const loopFracFor = useCallback((idx: number): number | null => {
    const track = trackRef.current, marquee = marqueeRef.current, ticket = ticketRef.current;
    if (!track || !marquee || !ticket) return null;
    const dup = track.querySelector<HTMLElement>(".tts-set--dup");
    const item = track.querySelectorAll<HTMLElement>(".tts-item")[idx];
    const setW = dup?.offsetLeft ?? 0;
    if (!item || setW <= 0) return null;
    const edgeRel = window.matchMedia(MOBILE).matches ? 24 : ticket.getBoundingClientRect().right - marquee.getBoundingClientRect().left;
    let frac = ((item.offsetLeft - edgeRel + 2) / setW) % 1;
    if (frac < 0) frac += 1;
    return frac;
  }, []);

  // start the loop with the ticket's city sitting just past the edge, so the first detection agrees with the ticket
  useEffect(() => {
    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      const track = trackRef.current;
      const frac = window.matchMedia(REDUCED).matches ? null : loopFracFor(activeRef.current);
      if (track && frac !== null) track.style.animationDelay = `${(-frac * LOOP_S).toFixed(3)}s`;
      setReady(true);
    };
    // item widths depend on Archivo; wait for it so the alignment is measured on the real glyphs
    if (document.fonts?.ready) document.fonts.ready.then(start, start);
    else start();
    return () => { cancelled = true; };
  }, [citiesKey, loopFracFor]);

  /**
   * Keyboard focus on a city: the paused track could hold it anywhere (even off the left edge), so move the
   * loop to bring that city to the ticket edge, where it is visible, and show it on the ticket.
   */
  const [focused, setFocused] = useState<number | null>(null);
  const onItemBlur = useCallback(() => setFocused(null), []);
  const onItemFocus = useCallback((idx: number, el: HTMLElement) => {
    if (!el.matches(":focus-visible")) return;
    setFocused(idx);
    if (!window.matchMedia(REDUCED).matches) {
      const track = trackRef.current;
      const anim = track ? marqueeAnimation(track) : null;
      const frac = loopFracFor(idx);
      if (track && anim && frac !== null) {
        // progress = (currentTime - delay) / duration, and the start alignment set a negative delay
        const dur = LOOP_S * 1000, delay = (parseFloat(track.style.animationDelay) || 0) * 1000;
        anim.currentTime = (((frac * dur + delay) % dur) + dur) % dur;
      }
    }
    show(idx);
  }, [loopFracFor, show]);

  // detection: rAF throttled to ~100ms, layout reads only, only while visible on screen and in a visible tab
  useEffect(() => {
    if (!ready || reduced) return;
    const root = rootRef.current, ticket = ticketRef.current, marquee = marqueeRef.current, track = trackRef.current;
    if (!root || !ticket || !marquee || !track) return;
    const els = [...track.querySelectorAll<HTMLElement>(".tts-item")];
    const mobile = window.matchMedia(MOBILE);
    let raf = 0, inView = false;
    let anim: Animation | null = null;

    // Geometry is measured once (and again on resize): item offsets in the track, one set's width and the
    // detection edge, all relative to the marquee. Each tick then only needs the loop's progress, which the
    // animation reports without touching layout, so the loop never forces a style/layout recalc.
    let geo: { items: { idx: number; off: number }[]; setW: number; edge: number } | null = null;
    const measure = () => {
      const dup = track.querySelector<HTMLElement>(".tts-set--dup");
      const mLeft = marquee.getBoundingClientRect().left;
      geo = {
        items: els.map((el) => ({ idx: Number(el.dataset.idx), off: el.offsetLeft })),
        setW: dup?.offsetLeft ?? 0,
        edge: mobile.matches ? 24 : ticket.getBoundingClientRect().right - mLeft,
      };
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);

    const read = () => {
      // progress from currentTime (no style flush, unlike getComputedTiming): (currentTime − delay) / duration.
      // The Animation object is looked up once: getAnimations() itself flushes style on every call.
      if (!anim || anim.playState === "idle") anim = marqueeAnimation(track);
      // currentTime only advances when the main thread renders a frame (the track animates on the compositor),
      // so derive it from the clock: running → (now − startTime) × rate; paused → startTime is null and
      // currentTime holds the paused position.
      const st = anim?.startTime;
      const ct = anim ? (typeof st === "number" ? (performance.now() - st) * anim.playbackRate : anim.currentTime) : null;
      const dur = LOOP_S * 1000, delay = (parseFloat(track.style.animationDelay) || 0) * 1000;
      const progress = typeof ct === "number" ? ((((ct - delay) % dur) + dur) % dur) / dur : null;
      let picked: number | null;
      if (geo && geo.setW > 0 && typeof progress === "number") {
        const shift = progress * geo.setW;
        picked = pickActive(geo.items.map(({ idx, off }) => ({ idx, left: off - shift })), geo.edge);
      } else {
        // no running animation to read (should not happen outside reduced motion): fall back to rects
        const edge = mobile.matches ? marquee.getBoundingClientRect().left + 24 : ticket.getBoundingClientRect().right;
        picked = pickActive(els.map((el) => ({ idx: Number(el.dataset.idx), left: el.getBoundingClientRect().left })), edge);
      }
      const d = picked ?? fallbackRef.current;
      if (d !== lastDetected.current) { lastDetected.current = d; show(d); }
    };
    // A 100ms timer, not requestAnimationFrame: an rAF loop makes the browser produce a main-thread frame
    // (with a style recalc of every running animation) 60×/s, which blocked the main thread under throttling.
    // The read only uses cached geometry + animation progress, so it needs no frame of its own.
    const sync = () => {
      const run = inView && document.visibilityState === "visible";
      // the CSS animations (marquee + arrow nudges) only run while the strip is on screen in a visible tab
      setRunning(run);
      if (run && !raf) { read(); raf = window.setInterval(read, 100); }
      else if (!run && raf) { clearInterval(raf); raf = 0; }
    };
    const io = new IntersectionObserver((entries) => { inView = entries.some((e) => e.isIntersecting); sync(); });
    io.observe(root);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", sync);
      if (raf) clearInterval(raf);
    };
  }, [ready, reduced, show, citiesKey]);

  if (!cities.length) return null;
  const city = cities[active] ?? cities[0];

  const onActivate = () => {
    const href = ticketHref(city);
    if (href) router.push(href);
    // cancelled / sales-closed stops take no sign-ups: show the event page instead of the waitlist
    else if (city.mode === "none") router.push(`/events/${city.slug}`);
    else open(city.slug);
  };

  return (
    <section ref={rootRef} className="tts" data-testid="tour-strip" aria-label="2027 tour" data-ready={ready ? "true" : undefined} data-run={running ? "true" : undefined}>
      <Container className="tts-row">
        <TourTicket
          ref={ticketRef}
          city={city}
          index={active}
          label={stopLabel(city, active, nextIdx)}
          count={countdown(city, now)}
          punch={punch}
          onActivate={onActivate}
        />
      </Container>
      <div className="tts-fade" aria-hidden="true" />
      <CityMarquee cities={cities} active={active} onPick={show} onFocusItem={onItemFocus} onBlurItem={onItemBlur} focused={focused} marqueeRef={marqueeRef} trackRef={trackRef} />
      <ul className="sr-only">
        {cities.map((c) => <li key={c.slug}>{c.city}, {c.dates}, provisional</li>)}
      </ul>
    </section>
  );
}
