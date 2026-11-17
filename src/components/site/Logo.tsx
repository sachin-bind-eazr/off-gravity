import Image from "next/image";
import Link from "next/link";

// Official OFF GRAVITY badge (client-supplied, public/logo/), cut out onto transparency in public/assets/brand/.
// "ink": black badge with mint lettering (nav, light or dark backgrounds). "cream": cream badge with ink lettering (dark footer).
const SRC = {
  ink: { src: "/assets/brand/logo-ink.png", ratio: 857 / 655 },
  cream: { src: "/assets/brand/logo-cream.png", ratio: 860 / 647 },
} as const;

export function Logo({ height = 50, className = "", variant = "ink", priority = false }: { height?: number; className?: string; variant?: keyof typeof SRC; priority?: boolean }) {
  const { src, ratio } = SRC[variant];
  const width = Math.round(height * ratio);
  return (
    <Link href="/" aria-label="OFF GRAVITY by The Great Inflate Run, home" className={className}>
      <Image src={src} alt="OFF GRAVITY by The Great Inflate Run" width={width} height={height} priority={priority} sizes={`${width}px`} style={{ height, width }} />
    </Link>
  );
}
