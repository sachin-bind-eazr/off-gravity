import { db } from "./db";
import { TOUR } from "./tour";
import { getThreshold, publicCount, waitlistCounts } from "./waitlist";
export type EventView = { slug:string; city:string; code:string; season:number; start:string; end:string; tag:string|null; colour:string; status:string; blurb:string|null; venue:string|null; gatesOpen:string|null; registrationCloses:string|null; distance:string|null; obstacles:string|null; waveTimes:string|null; experiences:string[]; waitlistCount:number|null };
const fallback = (): EventView[] => TOUR.map(t=>({slug:t.slug,city:t.city,code:t.code,season:t.season,start:t.start,end:t.end,tag:t.tag,colour:t.colour,status:"PROVISIONAL",blurb:null,venue:null,gatesOpen:null,registrationCloses:null,distance:null,obstacles:null,waveTimes:null,experiences:["race","movement","recovery","bazaar","family","glow"],waitlistCount:null}));
/** DB-first, falls back to the static tour when the database is unreachable (dev without Postgres). */
export async function getEvents(): Promise<EventView[]> {
  try {
    const rows = await db.event.findMany({ include:{season:true}, orderBy:{startDate:"asc"} });
    if (!rows.length) return fallback();
    const [counts, threshold] = await Promise.all([waitlistCounts().catch(() => ({}) as Record<number, number>), getThreshold()]);
    return rows.map(r=>({slug:r.slug,city:r.city,code:r.cityCode,season:r.season.order,start:r.startDate.toISOString().slice(0,10),end:r.endDate.toISOString().slice(0,10),tag:r.tag,colour:r.colour,status:r.status,blurb:r.blurb,venue:r.venue,gatesOpen:r.gatesOpen,registrationCloses:r.registrationCloses,distance:r.distance,obstacles:r.obstacles,waveTimes:r.waveTimes,experiences:r.experiences,waitlistCount:publicCount(counts[r.id]??0,threshold)}));
  } catch { return fallback(); }
}
export async function getEvent(slug:string){ return (await getEvents()).find(e=>e.slug===slug) ?? null; }
