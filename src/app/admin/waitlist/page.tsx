import { db } from "@/lib/db";
import { requirePage } from "@/lib/admin/page-guard";
import { can } from "@/lib/admin/roles";
import { getThreshold, waitlistCounts } from "@/lib/waitlist";
import { WaitlistAdmin } from "@/components/admin/WaitlistAdmin";

export default async function Page() {
  const a = await requirePage("waitlist.view");
  const [events, counts, threshold, eb] = await Promise.all([
    db.event.findMany({ orderBy: { startDate: "asc" }, select: { id: true, city: true, status: true } }),
    waitlistCounts(),
    getThreshold(),
    db.contentBlock.findUnique({ where: { key: "earlybird.hours" } }),
  ]);
  return (
    <WaitlistAdmin
      events={events.map((e) => ({ id: e.id, city: e.city, status: e.status, count: counts[e.id] ?? 0 }))}
      threshold={String(threshold)}
      earlyBirdHours={eb?.body ?? ""}
      canExport={can(a.role, "waitlist.export")}
      canEditSettings={can(a.role, "content")}
    />
  );
}
