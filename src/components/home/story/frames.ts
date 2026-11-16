import { TEASER } from "@/content/video";
/** Panel `frame` (1-based) to teaser frame JPG path; falls back to the official artwork. */
export function frameSrc(n: number | null | undefined): string {
  const f = n ? TEASER.frames[n - 1] : undefined;
  return f ? `${f.base}.jpg` : "/assets/art/hero-course.jpg";
}
