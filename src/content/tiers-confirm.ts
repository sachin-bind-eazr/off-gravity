import { STATIC_TIERS } from "./tiers";
/**
 * Draft "Ways in" tier seed (seeded as PREVIEW for all six cities; 'Jaipur only' for Glow Night is a UI rule). EVERY hook, perk and the existence of each tier is UNCONFIRMED by the client
 * (they come from a reference draft). They are seeded as inactive drafts with no price, capacity or sales window,
 * and are editable per city in admin (Tickets). List them in the client sign-off report.
 */
export type TierSeed = {
  key: "solo" | "squad" | "glow" | "family";
  name: string; hook: string; perks: string[]; colour: "mint" | "orange" | "night" | "lilac";
  min: number; max: number; sortOrder: number;
  /** City slugs where the tier is shown on the homepage by default; "all" or a list. Admin toggles per city afterwards. */
  homepage: "all" | string[];
  badge: "popular" | "limited" | null;
};
export const TIER_SEED: TierSeed[] = STATIC_TIERS.map((t) => ({
  key: t.tierKey, name: t.name, hook: t.hook, perks: t.perks, colour: t.stubColour,
  min: t.tierKey === "squad" ? 4 : t.tierKey === "family" ? 2 : 1, max: t.tierKey === "squad" ? 4 : t.tierKey === "family" ? 2 : 1,
  sortOrder: t.sortOrder, homepage: "all" as const, badge: t.badge,
}));
/** Flat list of unconfirmed facts for the client sign-off report. */
export const TIER_CONFIRM_FACTS: string[] = TIER_SEED.flatMap((t) => [
  `${t.name}: tier exists`, `${t.name}: hook "${t.hook}"`, ...t.perks.map((p) => `${t.name}: perk "${p}"`),
]);
export const EARLY_BIRD_NOTE = "Early-bird access (48-hour window) is shown only if the admin sets earlybird.hours; the 48h figure is unconfirmed.";
