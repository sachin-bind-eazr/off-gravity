import { SiteNav, SiteFooter } from "@/components/site";
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (<><SiteNav /><main className="section-y"><div className="container-og max-w-[820px]">
    <p className="mb-4 inline-block rounded-full bg-lilac-tint px-4 py-1.5 text-[15px] font-bold">Draft, subject to legal review</p>
    <h1 className="t-section mb-10">{title}</h1><div className="space-y-5 text-[17px] text-text-muted">{children}</div>
  </div></main><SiteFooter /></>);
}
