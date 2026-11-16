import Link from "next/link";
export function ArrowIcon({ className = "" }: { className?: string }) {
  return (<svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>);
}
export function BookButton({ href = "/book", children = "Book your slot", small = false, className = "" }: { href?: string; children?: React.ReactNode; small?: boolean; className?: string }) {
  if (small) return (<Link href={href} className={`inline-flex items-center whitespace-nowrap rounded-full bg-orange px-4 py-3 text-[14px] min-[400px]:px-5 min-[400px]:text-[15px] font-extrabold text-ink transition-transform hover:-translate-y-[3px] ${className}`}>{children}</Link>);
  return (<Link href={href} className={`btn-primary ${className}`}>{children}<ArrowIcon /></Link>);
}
