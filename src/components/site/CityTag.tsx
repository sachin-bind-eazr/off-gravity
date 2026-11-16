export function CityTag({ tag, className = "" }: { tag: string | null | undefined; className?: string }) {
  if (!tag) return null;
  const cls = tag === "Season finale" ? "bg-orange text-ink" : tag === "Tour opener" ? "bg-ink text-white" : "bg-lilac text-ink";
  return <span className={`inline-block rounded-full px-3 py-1 text-[14px] font-bold ${cls} ${className}`}>{tag}</span>;
}
