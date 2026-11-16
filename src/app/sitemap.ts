import type { MetadataRoute } from "next";
import { getEvents } from "@/lib/events";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const ev = await getEvents();
  return [{ url: base }, { url: `${base}/book` }, ...ev.map(e => ({ url: `${base}/events/${e.slug}` })), ...["terms", "privacy", "refund-policy"].map(p => ({ url: `${base}/${p}` }))];
}
