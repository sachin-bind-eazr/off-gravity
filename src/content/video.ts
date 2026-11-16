/**
 * Official obstacle teaser (source: public/know-your-obstacles.mp4, 848x480, 83.2 s, stereo AAC).
 * NOTE: it is The Great Inflate Run's own teaser. It has a branded red intro (0-6 s) and outro (~76-83 s),
 * a persistent "The Great Inflate Run" watermark top-right, a pink/blue palette, and named obstacles with on-screen labels.
 */
export const TEASER = {
  mp4: "/video/obstacles-1080.mp4",
  mp4Mobile: "/video/obstacles-720.mp4",
  webm: "/video/obstacles-1080.webm",
  poster: "/images/teaser/frame-01.jpg",
  duration: 83.2,
  durationLabel: "1:23",
  /** First second of footage with no title card (the intro is ~6 s of branding). */
  contentStart: 6,
  frames: [
    { n: 1, base: "/images/teaser/frame-01", alt: "Participants sliding down a giant inflatable slide, from the official obstacle teaser", w: 1920, h: 1087 },
    { n: 2, base: "/images/teaser/frame-02", alt: "A girl leaping between inflatable arches, from the official obstacle teaser", w: 1920, h: 1087 },
    { n: 3, base: "/images/teaser/frame-03", alt: "Runners climbing an inflatable wall with grips, from the official obstacle teaser", w: 1920, h: 1087 },
    { n: 4, base: "/images/teaser/frame-04", alt: "A runner vaulting an inflatable bollard on the course, from the official obstacle teaser", w: 1920, h: 1087 },
    { n: 5, base: "/images/teaser/frame-05", alt: "A woman crawling out of a giant inflatable ring tunnel, from the official obstacle teaser", w: 1920, h: 1087 },
    { n: 6, base: "/images/teaser/frame-06", alt: "A crowd scrambling up a wide inflatable staircase, from the official obstacle teaser", w: 1920, h: 1087 },
    { n: 7, base: "/images/teaser/frame-07", alt: "A triple-lane inflatable slide, from the official obstacle teaser", w: 1920, h: 1087 },
    { n: 8, base: "/images/teaser/frame-08", alt: "Aerial view of the inflatable course and runners, from the official obstacle teaser", w: 1920, h: 1087 },
  ],
} as const;

/**
 * Chapter start times (seconds). Found by reviewing 1 fps frames.
 * Video order is tunnel (22) -> climb (30) -> slide (45) -> wipeout (72), so the chips are NOT in video order.
 * Other on-screen names seen: Crazy Canyon ~12, Sprint Safari ~19, Turbo Tunnel ~26, Triple Thrill ~33,
 * Tumbling Trail ~41, Leap of Fun ~49, Hole-A-Thon ~57, Mount Madness ~66, Scream Xtreme ~73.
 * "Final wipeout" = Scream Xtreme, the last obstacle shown; the clip shows the empty arena, not people flying.
 */
export const CHAPTER_STARTS: Record<"slide" | "climb" | "tunnel" | "wipeout", number> = { slide: 45, climb: 30, tunnel: 22, wipeout: 72 };
/** [start, end) of each chapter in seconds, for progress bars (sorted by video order). */
export const CHAPTER_RANGES: Record<"slide" | "climb" | "tunnel" | "wipeout", [number, number]> = { tunnel: [22, 30], climb: [30, 41], slide: [45, 49], wipeout: [72, 76] };
