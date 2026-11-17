import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Legacy export kept for pages that still draw an inline arrow. Prefer lucide ArrowRight via <Button trailingIcon>. */
export function ArrowIcon({ className = "" }: { className?: string }) {
  return (<svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>);
}
export function BookButton({ href = "/book", children = "Book your slot", small = false, className = "" }: { href?: string; children?: React.ReactNode; small?: boolean; className?: string }) {
  return <Button href={href} size={small ? "md" : "lg"} trailingIcon={ArrowRight} className={className}>{children}</Button>;
}
