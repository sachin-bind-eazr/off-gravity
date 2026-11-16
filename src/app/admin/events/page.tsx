import { db } from "@/lib/db";
import { requirePage } from "@/lib/admin/page-guard";
import { EventEditor } from "@/components/admin/EventEditor";

export default async function Page() {
  await requirePage("events");
  const events = await db.event.findMany({ orderBy: { startDate: "asc" } });
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-extrabold">Events</h1>
      <p className="text-text-muted">Blank fields show as [TBC] on the public site.</p>
      {events.map((e) => (
        <EventEditor key={e.id} event={{
          id: e.id, city: e.city, tag: e.tag ?? "", blurb: e.blurb ?? "", colour: e.colour, status: e.status,
          startDate: e.startDate.toISOString().slice(0, 10), endDate: e.endDate.toISOString().slice(0, 10),
          venue: e.venue ?? "", gatesOpen: e.gatesOpen ?? "", registrationCloses: e.registrationCloses ?? "",
          distance: e.distance ?? "", obstacles: e.obstacles ?? "", waveTimes: e.waveTimes ?? "", experiences: e.experiences,
        }} />
      ))}
    </div>
  );
}
