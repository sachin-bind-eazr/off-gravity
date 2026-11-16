export type TierKey = "solo" | "squad" | "glow" | "family" | "undecided";
export type StubColour = "mint" | "orange" | "night" | "lilac" | "ink" | "cream";
export type TierCard = {
  id: number | string;
  tierKey: TierKey;
  name: string;
  hook: string;
  perks: string[];
  stubColour: StubColour;
  priceFromPaise: number | null;
  gstMode: "INCLUSIVE" | "EXCLUSIVE";
  mostPicked: boolean;
  sortOrder: number;
};
export const TIER_NUMBER: Record<string, number> = { solo: 1, squad: 2, glow: 3, family: 4 };
export const STUB: Record<StubColour, { bg: string; fg: string; glow: string; dark: boolean }> = {
  mint: { bg: "#02D69C", fg: "#1D2632", glow: "rgba(255,255,255,.55)", dark: false },
  orange: { bg: "#FD6B14", fg: "#1D2632", glow: "rgba(255,255,255,.45)", dark: false },
  night: { bg: "#1A1250", fg: "#FFFFFF", glow: "rgba(184,166,244,.65)", dark: true },
  lilac: { bg: "#B8A6F4", fg: "#1D2632", glow: "rgba(255,255,255,.6)", dark: false },
  ink: { bg: "#1D2632", fg: "#FFFFFF", glow: "rgba(2,214,156,.45)", dark: true },
  cream: { bg: "#F4EFE3", fg: "#1D2632", glow: "rgba(255,255,255,.7)", dark: false },
};
const KEY_COLOUR: Record<string, StubColour> = { solo: "mint", squad: "orange", glow: "night", family: "lilac" };
export const inr = (paise: number) => "₹" + new Intl.NumberFormat("en-IN").format(Math.round(paise / 100));

/** Accepts the new API shape ({tiers:[...]}) and the legacy one ({tiers:{slug:[...]}}). */
export function normalise(json: unknown, slug: string): { tiers: TierCard[]; earlyBirdHours: number | null } {
  const j = (json ?? {}) as { tiers?: unknown; earlyBirdHours?: number | null };
  const raw = Array.isArray(j.tiers) ? j.tiers : (j.tiers as Record<string, unknown[]> | undefined)?.[slug] ?? [];
  const tiers = (raw as Record<string, unknown>[]).map((t, i): TierCard => {
    const name = String(t.name ?? "");
    const key = (t.tierKey as TierKey) ?? (/solo/i.test(name) ? "solo" : /squad/i.test(name) ? "squad" : /glow/i.test(name) ? "glow" : /parent|family|duo/i.test(name) ? "family" : "undecided");
    const legacyDesc = typeof t.description === "string" ? t.description.split(/\n|;|·/).map((s) => s.trim()).filter(Boolean) : [];
    const sc = t.stubColour as StubColour;
    const colour: StubColour = sc && sc in STUB ? sc : KEY_COLOUR[key] ?? "ink";
    return {
      id: (t.id as number | string) ?? i,
      tierKey: key,
      name,
      hook: String(t.hook ?? legacyDesc[0] ?? ""),
      perks: Array.isArray(t.perks) ? (t.perks as string[]).slice(0, 4) : legacyDesc.slice(1, 5),
      stubColour: colour,
      priceFromPaise: (t.priceFromPaise as number | null) ?? (t.pricePaise as number | null) ?? null,
      gstMode: (t.gstMode as "INCLUSIVE" | "EXCLUSIVE") ?? "INCLUSIVE",
      mostPicked: Boolean(t.mostPicked),
      sortOrder: Number(t.sortOrder ?? i),
    };
  });
  tiers.sort((a, b) => a.sortOrder - b.sortOrder);
  return { tiers, earlyBirdHours: typeof j.earlyBirdHours === "number" ? j.earlyBirdHours : null };
}
