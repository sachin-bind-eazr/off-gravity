"use client";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
const WaitlistModal = dynamic(() => import("./WaitlistModal").then((m) => m.WaitlistModal), { ssr: false });
import { tourCities, type WaitlistTier } from "./ticket";

export type WaitlistCity = { slug: string; city: string; start?: string; end?: string; waitlistCount?: number | null; glow?: boolean };
export type WaitlistOpenArg = string | { city?: string; tier?: WaitlistTier };
type Ctx = { open: (arg?: WaitlistOpenArg) => void };
const C = createContext<Ctx>({ open: () => {} });
export const useWaitlist = () => useContext(C);

/** Wrap the homepage once. `cities` are the events that can take sign-ups (empty = all six offered). */
export function WaitlistProvider({ cities, events, children }: {
  cities?: WaitlistCity[];
  /** Alternative: pass event views; all non-cancelled, non-closed cities are offered. */
  events?: { slug: string; city: string; status: string; start?: string; end?: string; waitlistCount?: number | null }[];
  children: ReactNode;
}) {
  const list: WaitlistCity[] = useMemo(() => {
    if (cities) return cities;
    // Every city that is not cancelled / sales-closed can take waitlist sign-ups (events are still provisional).
    return (events ?? []).filter((e) => e.status !== "CANCELLED" && e.status !== "SALES_CLOSED");
  }, [cities, events]);
  const modalCities = useMemo(() => tourCities(list), [list]);
  const [state, setState] = useState<{ open: boolean; slug?: string; tier?: WaitlistTier; seq: number }>({ open: false, seq: 0 });
  const open = useCallback((arg?: WaitlistOpenArg) => {
    const a = typeof arg === "string" ? { city: arg } : arg ?? {};
    setState((s) => ({ open: true, slug: a.city, tier: a.tier, seq: s.seq + 1 }));
  }, []);
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);
  const value = useMemo(() => ({ open }), [open]);
  return (
    <C.Provider value={value}>
      {children}
      {state.open && <WaitlistModal key={state.seq} cities={modalCities} initialSlug={state.slug} initialTier={state.tier} onClose={close} />}
    </C.Provider>
  );
}
