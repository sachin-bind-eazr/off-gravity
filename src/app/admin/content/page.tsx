import { db } from "@/lib/db";
import { requirePage } from "@/lib/admin/page-guard";
import { ContentEditor } from "@/components/admin/ContentEditor";

export default async function Page() {
  await requirePage("content");
  const [blocks, faqs, events] = await Promise.all([
    db.contentBlock.findMany(), db.faq.findMany({ orderBy: [{ eventId: "asc" }, { order: "asc" }] }),
    db.event.findMany({ select: { id: true, city: true }, orderBy: { startDate: "asc" } }),
  ]);
  const body = Object.fromEntries(blocks.map((b) => [b.key, b.body]));
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-extrabold">Content</h1>
      <ContentEditor values={{ announcement: body["announcement"] ?? "", "policy.terms": body["policy.terms"] ?? "", "policy.privacy": body["policy.privacy"] ?? "", "policy.refund": body["policy.refund"] ?? "", hold_minutes: body["hold_minutes"] ?? "15" }} events={events} faqs={faqs.map((f) => ({ id: f.id, eventId: f.eventId, question: f.question, answer: f.answer, order: f.order }))} />
    </div>
  );
}
