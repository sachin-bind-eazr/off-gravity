/**
 * Static "Ways in" tier definitions. Used by GET /api/home/tiers when the database is unreachable or has no
 * preview rows for an event, so the four cards ALWAYS show. Every hook and perk is UNCONFIRMED by the client
 * (confirm: true) and mirrors the seed in tiers-confirm.ts.
 */
export type StaticTier = {
  tierKey: "solo" | "squad" | "glow" | "family";
  name: string; hook: string; perks: string[]; stubColour: "mint" | "orange" | "night" | "lilac";
  badge: "popular" | "limited" | null; sortOrder: number; confirm: true;
};
export const STATIC_TIERS: StaticTier[] = [
  { tierKey: "solo", name: "Solo runner", hook: "One runner, one mission. Beat the clock.", stubColour: "mint", badge: "popular", sortOrder: 10, confirm: true,
    perks: ["Timed wave entry", "Official finisher medal", "Recovery village access", "Live leaderboard ranking"] },
  { tierKey: "squad", name: "Squad pack (4)", hook: "Grab three friends. Bounce harder together.", stubColour: "orange", badge: null, sortOrder: 20, confirm: true,
    perks: ["4 wave entries in the same batch", "Squad leaderboard slot", "Discounted bundle pricing", "Matching squad bibs"] },
  { tierKey: "glow", name: "Glow Night pass", hook: "Saturday after dark: lights, music, chaos.", stubColour: "night", badge: "limited", sortOrder: 30, confirm: true,
    perks: ["Night-wave entry (Jaipur)", "Glow kit included", "DJ + after-party zone", "Limited slots only"] },
  { tierKey: "family", name: "Parent-child duo", hook: "Built for families. Smaller obstacles, full smiles.", stubColour: "lilac", badge: null, sortOrder: 40, confirm: true,
    perks: ["Parent + child entries", "Dedicated family wave", "Mini obstacle course access", "Family photo pack"] },
];
