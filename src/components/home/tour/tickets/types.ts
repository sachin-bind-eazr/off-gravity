import { STATIC_TIERS } from "@/content/tiers";

export type TierKey = "solo" | "squad" | "glow" | "family" | "undecided";
export type StubColour = "mint" | "orange" | "night" | "lilac" | "ink" | "cream";
export type Badge = "popular" | "limited" | null;
export type TierCard = {
  id: number | string;
  tierKey: TierKey;
  name: string;
  hook: string;
  perks: string[];
  stubColour: StubColour;
  priceFromPaise: number | null;
  gstMode: "INCLUSIVE" | "EXCLUSIVE";
  badge: Badge;
  sortOrder: number;
  purchasable: boolean;
};
export const ACCENT: Record<StubColour, string> = {
  mint: "#02D69C", orange: "#FD6B14", night: "#1A1250", lilac: "#B8A6F4", ink: "#1D2632", cream: "#D9D2BF",
};
const KEY_COLOUR: Record<string, StubColour> = { solo: "mint", squad: "orange", glow: "night", family: "lilac" };
export const inr = (paise: number) => "₹" + new Intl.NumberFormat("en-IN").format(Math.round(paise / 100));

export const STATIC_CARDS: TierCard[] = STATIC_TIERS.map((t) => ({
  id: `static-${t.tierKey}`, tierKey: t.tierKey, name: t.name, hook: t.hook, perks: t.perks, stubColour: t.stubColour,
  priceFromPaise: null, gstMode: "INCLUSIVE", badge: t.badge, sortOrder: t.sortOrder, purchasable: false,
}));

export type Loaded = { tiers: TierCard[]; hidden: boolean; earlyBirdHours: number | null };

/** Normalises GET /api/home/tiers. Empty tiers are only trusted when the API says `hidden: true`. */
export function normalise(json: unknown): Loaded {
  const j = (json ?? {}) as { tiers?: unknown; hidden?: boolean; earlyBirdHours?: number | null };
  const eb = typeof j.earlyBirdHours === "number" && j.earlyBirdHours > 0 ? j.earlyBirdHours : null;
  if (j.hidden === true) return { tiers: [], hidden: true, earlyBirdHours: eb };
  const raw = Array.isArray(j.tiers) ? (j.tiers as Record<string, unknown>[]) : [];
  if (raw.length === 0) return { tiers: STATIC_CARDS, hidden: false, earlyBirdHours: eb };
  const tiers = raw.map((t, i): TierCard => {
    const key = (t.tierKey as TierKey) ?? "undecided";
    const sc = t.stubColour as StubColour;
    const badge: Badge = t.badge === "limited" ? "limited" : t.badge === "popular" || t.mostPicked ? "popular" : null;
    return {
      id: (t.id as number | string) ?? i, tierKey: key, name: String(t.name ?? ""), hook: String(t.hook ?? ""),
      perks: Array.isArray(t.perks) ? (t.perks as string[]).slice(0, 4) : [],
      stubColour: sc && sc in ACCENT ? sc : KEY_COLOUR[key] ?? "ink",
      priceFromPaise: (t.priceFromPaise as number | null) ?? null,
      gstMode: (t.gstMode as "INCLUSIVE" | "EXCLUSIVE") ?? "INCLUSIVE",
      badge, sortOrder: Number(t.sortOrder ?? i), purchasable: t.purchasable === true,
    };
  });
  tiers.sort((a, b) => a.sortOrder - b.sortOrder);
  return { tiers, hidden: false, earlyBirdHours: eb };
}
