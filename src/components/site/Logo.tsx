import Image from "next/image";
import Link from "next/link";
export function Logo({ height = 50, className = "" }: { height?: number; className?: string }) {
  return (
    <Link href="/" aria-label="OFF GRAVITY by The Great Inflate Run, home" className={className}>
      <Image src="/assets/art/logo.png" alt="OFF GRAVITY by The Great Inflate Run" width={Math.round(height * 1.406)} height={height} priority style={{ height, width: "auto" }} />
    </Link>
  );
}
