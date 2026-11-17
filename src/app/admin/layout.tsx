import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAdmin } from "@/lib/admin/auth";
import { can, type Permission } from "@/lib/admin/roles";
import { LogoutButton } from "@/components/admin/LogoutButton";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const NAV: { href: string; label: string; perm: Permission }[] = [
  { href: "/admin", label: "Overview", perm: "overview" },
  { href: "/admin/events", label: "Events", perm: "events" },
  { href: "/admin/tickets", label: "Tickets", perm: "tickets" },
  { href: "/admin/bookings", label: "Bookings", perm: "bookings.view" },
  { href: "/admin/waitlist", label: "Waitlist", perm: "waitlist.view" },
  { href: "/admin/participants", label: "Participants", perm: "participants.view" },
  { href: "/admin/content", label: "Content", perm: "content" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const a = await getAdmin();
  if (!a) return <div className="min-h-screen bg-cream">{children}</div>;
  return (
    <div className="min-h-screen bg-cream md:grid md:grid-cols-[240px_1fr]">
      <aside className="bg-ink p-5 text-on-dark md:sticky md:top-0 md:h-screen">
        <div className="flex items-center gap-3 md:block">
          <div className="inline-grid h-14 w-14 place-items-center"><Image src="/assets/brand/logo-ink.png" alt="OFF GRAVITY" width={55} height={42} /></div>
          <p className="text-sm md:mt-3">{a.email}<br /><span className="font-bold text-mint">{a.role.toLowerCase()}</span></p>
        </div>
        <nav aria-label="Admin" className="mt-5 flex gap-1 overflow-x-auto md:flex-col">
          {NAV.filter((n) => can(a.role, n.perm)).map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-xl px-4 py-2.5 font-bold hover:bg-white/10">{n.label}</Link>
          ))}
          <LogoutButton />
        </nav>
      </aside>
      <main className="min-w-0 p-5 sm:p-8">{children}</main>
    </div>
  );
}
