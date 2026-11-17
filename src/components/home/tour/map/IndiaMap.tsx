"use client";
/**
 * Styled India map with the 2027 tour route.
 *
 * Boundary data: public/data/india.topo.json, built by scripts/map-build.sh from the DataMeet copy of the
 * Survey of India state boundaries (github.com/datameet/maps, Survey-of-India-Index-Maps/Boundaries/India-States,
 * licence CC-BY-SA 2.5 / ODbL; see /CREDITS.md). It follows India's official depiction (full Jammu & Kashmir,
 * Ladakh and Arunachal Pradesh). No Natural Earth / world-atlas data is used.
 *
 * Land and borders live in a scaled <g>; route, markers and labels live in screen space so strokes and text
 * stay a constant pixel size while the map zooms. Per-frame updates are imperative (attributes/transforms only).
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import { TOUR } from "@/lib/tour";
import type { EventView } from "@/lib/events";
import { fmtRange } from "../../format";
import { editionLabel } from "../labels";
import "./map.css";

type View = { k: number; tx: number; ty: number };
type Pt = { x: number; y: number };
const ZOOM = 1.6;
const DUR = 700;
const EDGE = 40; // min distance from the map edge to the outermost marker centre
type Side = "l" | "r" | "t" | "b" | "tr" | "tl" | "br" | "bl";
const SIDE: Record<string, Side> = { mumbai: "t", bengaluru: "r", delhi: "r", chandigarh: "l", jaipur: "l", satara: "r" };

let topoPromise: Promise<Topology> | null = null;
const loadTopo = () => (topoPromise ??= fetch("/data/india.topo.json").then((r) => { if (!r.ok) throw new Error("map"); return r.json(); }));

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const quad = (a: Pt, c: Pt, b: Pt, t: number): Pt => ({ x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x, y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y });
const ctrl = (a: Pt, b: Pt): Pt => { const d = Math.hypot(b.x - a.x, b.y - a.y); return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 0.2 * d }; };

export function IndiaMap({ events, selected, onSelect }: { events: EventView[]; selected: string; onSelect: (slug: string) => void }) {
  const uid = useId().replace(/:/g, "");
  const wrap = useRef<HTMLDivElement>(null);
  const landG = useRef<SVGGElement>(null);
  const legMask = useRef<(SVGPathElement | null)[]>([]);
  const legBase = useRef<(SVGPathElement | null)[]>([]);
  const legMint = useRef<(SVGPathElement | null)[]>([]);
  const mk = useRef<(HTMLDivElement | null)[]>([]);
  const dot = useRef<HTMLDivElement>(null);
  const [topo, setTopo] = useState<Topology | null>(null);
  const [failed, setFailed] = useState(false);
  const [live, setLive] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const view = useRef<View>({ k: 1, tx: 0, ty: 0 });
  const raf = useRef(0);
  const prevSel = useRef<string | null>(null);
  const firstTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduced = useRef(false);
  const sideRef = useRef<Record<string, Side>>({ ...SIDE });

  const stops = useMemo(() => TOUR.map((t) => ({ ...t, ev: events.find((e) => e.slug === t.slug) })), [events]);
  const selIdx = Math.max(0, stops.findIndex((s) => s.slug === selected));

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let live = true;
    loadTopo().then((t) => live && setTopo(t)).catch(() => live && setFailed(true));
    return () => { live = false; };
  }, []);

  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // start the draw-in + zoom sequence only once the map is actually on screen
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setLive(true); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // projection + paths, recomputed when the topology or the box changes
  const geo = useMemo(() => {
    if (!topo || !size.w || !size.h) return null;
    const obj = topo.objects.states as GeometryCollection;
    const fc = feature(topo, obj);
    const pad = size.w < 520 ? 14 : 30;
    const proj = geoMercator().fitExtent([[pad, pad], [size.w - pad, size.h - pad]], fc);
    const path = geoPath(proj);
    const base: Pt[] = TOUR.map((t) => { const p = proj([t.lng, t.lat])!; return { x: p[0], y: p[1] }; });
    // zoom far enough that EVERY pair of stops is at least ~46px apart on screen (markers never touch)
    let dMin = Infinity;
    for (let i = 0; i < base.length; i++) for (let j = i + 1; j < base.length; j++) dMin = Math.min(dMin, Math.hypot(base[i].x - base[j].x, base[i].y - base[j].y) || 1);
    const kz0 = Math.min(5, Math.max(ZOOM, 46 / dMin));
    // frame the whole route: shrink the zoom until every stop fits between the top and bottom edge (never closer than ~34px apart)
    const ys = base.map((b) => b.y);
    const span = Math.max(...ys) - Math.min(...ys) || 1;
    const kfit = (size.h - 2 * EDGE) / span;
    const kz = Math.max(Math.min(kz0, kfit), Math.min(kz0, 34 / dMin));
    return {
      base, kz, minY: Math.min(...ys), maxY: Math.max(...ys),
      states: fc.features.map((f) => path(f) ?? ""),
      inner: path(mesh(topo, obj, (a, b) => a !== b)) ?? "",
      outer: path(mesh(topo, obj, (a, b) => a === b)) ?? "",
    };
  }, [topo, size.w, size.h]);

  const overlay = () => typeof window !== "undefined" && window.matchMedia("(min-width: 1100px)").matches;

  const targetFor = useCallback((slug: string, side?: Side): View => {
    if (!geo) return { k: 1, tx: 0, ty: 0 };
    const i = TOUR.findIndex((t) => t.slug === slug);
    const b = geo.base[i];
    void side;
    const ov = overlay();
    const ax = ov ? size.w * 0.64 : size.w * 0.5;
    const ay = ov ? size.h * 0.38 : size.h * 0.5;
    let ty = ay - b.y * geo.kz;
    // when the whole route fits vertically, slide the view so no marker is clipped at the top or bottom edge
    const top = geo.minY * geo.kz + ty, bot = geo.maxY * geo.kz + ty;
    if (bot - top <= size.h - 2 * EDGE + 0.5) {
      if (top < EDGE) ty += EDGE - top;
      else if (bot > size.h - EDGE) ty -= bot - (size.h - EDGE);
    }
    return { k: geo.kz, tx: ax - b.x * geo.kz, ty };
  }, [geo, size.w, size.h]);

  /** Write one frame to the DOM. `dt` = travelling-dot progress (0..1) or null. */
  const apply = useCallback((v: View, dotState: { a: number; b: number; t: number } | null) => {
    if (!geo) return;
    landG.current?.setAttribute("transform", `translate(${v.tx} ${v.ty}) scale(${v.k})`);
    const sc = geo.base.map((p) => ({ x: p.x * v.k + v.tx, y: p.y * v.k + v.ty }));
    for (let i = 0; i < 5; i++) {
      const a = sc[i], b = sc[i + 1];
      const c = ctrl(geo.base[i], geo.base[i + 1]);
      const cs = { x: c.x * v.k + v.tx, y: c.y * v.k + v.ty };
      const d = `M${a.x.toFixed(1)} ${a.y.toFixed(1)}Q${cs.x.toFixed(1)} ${cs.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
      legMask.current[i]?.setAttribute("d", d); legBase.current[i]?.setAttribute("d", d); legMint.current[i]?.setAttribute("d", d);
    }
    sc.forEach((p, i) => {
      const m = mk.current[i]; if (!m) return;
      m.style.transform = `translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,0)`;
      m.dataset.tip = p.y < 120 ? "b" : "t";
    });
    const dt = dot.current;
    if (dt) {
      if (dotState) {
        const A = geo.base[dotState.a], B = geo.base[dotState.b];
        const q = quad(A, ctrl(A, B), B, dotState.t);
        dt.style.opacity = dotState.t > 0 && dotState.t < 1 ? "1" : "0";
        dt.style.transform = `translate3d(${(q.x * v.k + v.tx).toFixed(1)}px,${(q.y * v.k + v.ty).toFixed(1)}px,0)`;
      } else dt.style.opacity = "0";
    }
  }, [geo]);

  // Greedy label placement at the target view: each label tries its preferred side, then the others, and takes the
  // first spot that stays inside the map, clear of other labels, other markers and the floating card.
  const placeLabels = useCallback((slug: string) => {
    if (!geo) return;
    const t = targetFor(slug, "r");
    const W = size.w, H = size.h;
    type R = { l: number; t: number; r: number; b: number };
    const hit = (a: R, c: R) => !(a.r <= c.l || a.l >= c.r || a.b <= c.t || a.t >= c.b);
    const pos = TOUR.map((_, i) => ({ x: geo.base[i].x * t.k + t.tx, y: geo.base[i].y * t.k + t.ty }));
    const inView = (i: number) => pos[i].x > -40 && pos[i].x < W + 40 && pos[i].y > -40 && pos[i].y < H + 40;
    const dots: R[] = pos.map((p) => ({ l: p.x - 17, t: p.y - 17, r: p.x + 17, b: p.y + 17 }));
    const placed: R[] = [];
    const wrapEl = wrap.current;
    const panelEl = wrapEl?.parentElement?.parentElement ?? null; // card lives in the panel, beside the map container
    const cardEl = panelEl?.querySelector<HTMLElement>(".og-tour-in") ?? null;
    const obstacles: R[] = [];
    if (wrapEl && cardEl && getComputedStyle(cardEl).position === "absolute") {
      // layout-based box (offset*), so an in-flight scale/translate animation on the card can't shrink the obstacle
      const box = wrapEl.parentElement!; // positioned container of the map
      if (cardEl.offsetParent === box.offsetParent) {
        const l = cardEl.offsetLeft - box.offsetLeft, t = cardEl.offsetTop - box.offsetTop;
        obstacles.push({ l: l - 8, t: t - 8, r: l + cardEl.offsetWidth + 8, b: t + cardEl.offsetHeight + 8 });
      } else {
        const wr = wrapEl.getBoundingClientRect(), cr = cardEl.getBoundingClientRect();
        obstacles.push({ l: cr.left - wr.left - 8, t: cr.top - wr.top - 8, r: cr.right - wr.left + 8, b: cr.bottom - wr.top + 8 });
      }
    }
    const sides: Record<string, Side> = {};
    const hide: Record<string, boolean> = {};
    const selI = TOUR.findIndex((x) => x.slug === slug);
    const order = [selI, ...TOUR.map((_, i) => i).filter((i) => i !== selI)];
    for (const i of order) {
      const tt = TOUR[i];
      const lab = mk.current[i]?.querySelector<HTMLElement>(".og-mk__lab");
      const w = (lab?.offsetWidth ?? 90) + 2, h = (lab?.offsetHeight ?? 36) + 2;
      const { x, y } = pos[i];
      const rect = (s: Side): R =>
        s === "r" ? { l: x + 22, t: y - h / 2, r: x + 22 + w, b: y + h / 2 }
        : s === "l" ? { l: x - 22 - w, t: y - h / 2, r: x - 22, b: y + h / 2 }
        : s === "t" ? { l: x - w / 2, t: y - 20 - h, r: x + w / 2, b: y - 20 }
        : s === "b" ? { l: x - w / 2, t: y + 20, r: x + w / 2, b: y + 20 + h }
        : s === "tr" ? { l: x + 14, t: y - 16 - h, r: x + 14 + w, b: y - 16 }
        : s === "tl" ? { l: x - 14 - w, t: y - 16 - h, r: x - 14, b: y - 16 }
        : s === "br" ? { l: x + 14, t: y + 16, r: x + 14 + w, b: y + 16 + h }
        : { l: x - 14 - w, t: y + 16, r: x - 14, b: y + 16 + h };
      const pref = SIDE[tt.slug];
      const cands: Side[] = [pref, pref === "r" ? "l" : "r", "t", "b", "tr", "tl", "br", "bl"];
      let chosen = pref, got: R | null = null;
      if (inView(i)) {
        for (const c of cands) {
          const r = rect(c);
          const inside = r.l >= 4 && r.r <= W - 4 && r.t >= 4 && r.b <= H - 4;
          const clear = !placed.some((p) => hit(r, p)) && !dots.some((d, j) => j !== i && inView(j) && hit(r, d)) && !obstacles.some((o) => hit(r, o));
          if (inside && clear) { chosen = c; got = r; break; }
        }
        if (!got && i === selI) { chosen = pref; got = rect(pref); }
        if (got) placed.push(got);

      }
      sides[tt.slug] = chosen;
      hide[tt.slug] = !got;
    }
    sideRef.current = sides;
    TOUR.forEach((tt, i) => { const m = mk.current[i]; if (!m) return; m.setAttribute("data-side", sides[tt.slug]); m.setAttribute("data-hide", String(!!hide[tt.slug])); });
  }, [geo, size.w, size.h, targetFor]);

  const animateTo = useCallback((slug: string, from: string | null) => {
    if (!geo) return;
    cancelAnimationFrame(raf.current);
    placeLabels(slug);
    // the floating card swaps content (and size) right after selection: re-run placement once it has settled
    window.setTimeout(() => placeLabels(slug), 60);
    window.setTimeout(() => placeLabels(slug), 400);
    const to = targetFor(slug);
    const start = { ...view.current };
    if (reduced.current) { view.current = to; apply(to, null); return; }
    const a = from ? TOUR.findIndex((t) => t.slug === from) : -1;
    const b = TOUR.findIndex((t) => t.slug === slug);
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / DUR), e = ease(p);
      const v = { k: start.k + (to.k - start.k) * e, tx: start.tx + (to.tx - start.tx) * e, ty: start.ty + (to.ty - start.ty) * e };
      view.current = v;
      apply(v, a >= 0 && a !== b ? { a, b, t: e } : null);
      if (p < 1) raf.current = requestAnimationFrame(step);
      else { view.current = to; apply(to, null); }
    };
    raf.current = requestAnimationFrame(step);
  }, [geo, apply, targetFor, placeLabels]);

  // first paint of the map; the intro zoom starts once the map is on screen
  const booted = useRef(false);
  const zoomed = useRef(false);
  useEffect(() => {
    if (!geo) return;
    if (!booted.current) {
      booted.current = true;
      placeLabels(selected);
      // start already framed on the selected city (no zoomed-out stage, so labels never collide on first paint)
      view.current = targetFor(selected); apply(view.current, null); zoomed.current = true;
      prevSel.current = selected;
      return;
    }
    // resize / re-projection: snap to the target for the current selection
    cancelAnimationFrame(raf.current);
    placeLabels(selected);
    view.current = targetFor(selected); apply(view.current, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo]);

  // selection changes
  useEffect(() => {
    if (!geo || !booted.current) { return; }
    if (prevSel.current === selected) return;
    if (firstTimer.current) { clearTimeout(firstTimer.current); firstTimer.current = null; }
    zoomed.current = true;
    animateTo(selected, prevSel.current);
    prevSel.current = selected;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // The floating card swaps/animates its content after a selection; re-run label placement whenever it changes
  useEffect(() => {
    if (!geo) return;
    const host = wrap.current?.parentElement?.parentElement; if (!host) return;
    let t: ReturnType<typeof setTimeout> | null = null;
    const mo = new MutationObserver(() => { if (t) clearTimeout(t); t = setTimeout(() => placeLabels(prevSel.current ?? selected), 80); });
    mo.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
    const ro = new ResizeObserver(() => placeLabels(prevSel.current ?? selected));
    host.querySelectorAll<HTMLElement>(".og-tour-in").forEach((n) => ro.observe(n));
    return () => { mo.disconnect(); ro.disconnect(); if (t) clearTimeout(t); };
  }, [geo, placeLabels, selected]);

  useEffect(() => () => { cancelAnimationFrame(raf.current); if (firstTimer.current) clearTimeout(firstTimer.current); }, []);

  const w = size.w, h = size.h;
  return (
    <div ref={wrap} className="og-map" data-live={live} role="group" aria-label="Map of India showing the 2027 tour route">
      {geo && (
        <>
          <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
            <defs>
              {stops.slice(0, 5).map((_, i) => (
                <mask key={i} id={`${uid}m${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width={w} height={h}>
                  <path ref={(el) => { legMask.current[i] = el; }} className="og-leg-reveal" style={{ animationDelay: `${(i * 0.27).toFixed(2)}s` }} pathLength={1} fill="none" stroke="#fff" strokeWidth="12" />
                </mask>
              ))}
            </defs>
            <g ref={landG}>
              {geo.states.map((d, i) => <path key={i} d={d} fill="#1D2632" />)}
              <path d={geo.inner} fill="none" stroke="#fff" strokeOpacity=".08" strokeWidth=".5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
              <path d={geo.outer} fill="none" stroke="#fff" strokeOpacity=".18" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            </g>
            {stops.slice(0, 5).map((_, i) => (
              <g key={i}>
                <path ref={(el) => { legBase.current[i] = el; }} mask={`url(#${uid}m${i})`} fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />
                <path ref={(el) => { legMint.current[i] = el; }} className="og-leg-mint" data-done={i < selIdx} pathLength={1} fill="none" stroke="#02D69C" strokeWidth="2.5" strokeLinecap="butt" />
              </g>
            ))}
          </svg>
          <div ref={dot} className="og-dot" aria-hidden="true" />
          {stops.map((s, i) => {
            const on = s.slug === selected;
            const dates = fmtRange(s.start, s.end, true);
            const long = fmtRange(s.start, s.end);
            return (
              <div key={s.slug} ref={(el) => { mk.current[i] = el; }} className="og-mk" data-side={SIDE[s.slug]} data-tip="t" data-on={on} style={{ ["--d" as string]: `${(1.7 + i * 0.1).toFixed(2)}s` }}>
                <button type="button" className="og-mk__btn" aria-pressed={on} aria-label={`${s.city}, stop ${i + 1}, ${long} 2027`} onClick={() => onSelect(s.slug)}>
                  <span className="og-mk__pop"><span className="og-mk__dot">{i + 1}</span></span>
                </button>
                <span className="og-mk__tip" role="tooltip"><b>{s.city}</b> · {long}<br />{editionLabel(s.slug)}</span>
                <span className="og-mk__lab" aria-hidden="true"><span className="og-mk__city">{s.city}</span><span className="og-mk__dates">{dates}</span></span>
              </div>
            );
          })}
        </>
      )}
      {!geo && (
        <p className="og-map__msg">{failed ? "The map couldn't load. The city list still works." : "Loading map…"}</p>
      )}
    </div>
  );
}
