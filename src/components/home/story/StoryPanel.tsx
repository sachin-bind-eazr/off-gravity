"use client";
import Image from "next/image";
import { motion, type MotionValue } from "framer-motion";
import { frameSrc } from "./frames";

/** Brand grade per panel tone (footage is pink/blue, off-palette). */
const GRADE: Record<string, string> = {
  mint: "var(--color-mint)", ink: "var(--color-orange)", lilac: "var(--color-lilac)",
  night: "var(--color-lilac)", cream: "var(--color-mint)", orange: "var(--color-orange)",
};
/** Tight crops biased to the lower-left so top arch lettering and the top-right watermark fall outside the portrait card. */
const CROP = ["38% 82%", "40% 80%", "42% 82%", "45% 80%", "38% 82%", "40% 82%"];

export type PanelData = { id: string; n: string; title: string; line: string; tone: string; frame: number | null };

export function StoryPanel({ p, index, total, priority, scale, dim, motionOn }: {
  p: PanelData; index: number; total: number; priority?: boolean;
  scale: MotionValue<number>; dim: MotionValue<number>; motionOn: boolean;
}) {
  return (
    <li className="st-item" style={{ ["--i" as string]: index }}>
      <motion.article className={`st-card st-tone-${p.tone}`} style={motionOn ? { scale } : undefined} data-panel={p.id} aria-label={`${index + 1} of ${total}: ${p.title}`}>
        <div className="st-media og-grade" style={{ ["--grade" as string]: GRADE[p.tone] ?? "var(--color-mint)", ["--grade-strength" as string]: p.tone === "night" ? 0.9 : 0.8 }}>
          <Image src={frameSrc(p.frame)} alt="Frame from the official OFF GRAVITY obstacle teaser" fill sizes="(min-width:900px) 40vw, 88vw" priority={priority} className="st-img" style={{ objectPosition: CROP[index] ?? "40% 78%" }} />
          {p.tone === "night" && <div className="st-neon" aria-hidden />}
        </div>
        <div className="st-band">
          <span className="st-num" aria-hidden>{p.n}</span>
          <h3 className="st-title">{p.title}</h3>
          <p className="st-line">{p.line}</p>
        </div>
        {motionOn && <motion.div className="st-dim" style={{ opacity: dim }} aria-hidden />}
      </motion.article>
    </li>
  );
}
