/** Display-only tag labels for the homepage tour (DB/seed keep their own values). */
const TAG: Record<string, string> = { mumbai: "Season 1 opener", chandigarh: "Season 2 opener", jaipur: "Evening edition", satara: "Season finale" };
export const tagLabel = (slug: string, dbTag: string | null) => TAG[slug] ?? dbTag;
export const editionLabel = (slug: string) => (slug === "jaipur" ? "Night edition" : "Day edition");
