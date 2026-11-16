"use client";
import Image from "next/image";
import { motion, type MotionValue } from "framer-motion";
import { frameSrc } from "./frames";

export type PanelData = { id: string; n: string; title: string; line: string; tone: string; frame: number | null };

export function StoryPanel({ p, index, total, priority, scale, dim, motionOn }: {
  p: PanelData; index: number; total: number; priority?: boolean;
  scale: MotionValue<number>; dim: MotionValue<number>; motionOn: boolean;
}) {
  return (
    <li className="st-item" style={{ ["--i" as string]: index }}>
      <motion.article className={`st-card st-tone-${p.tone}`} style={motionOn ? { scale } : undefined} data-panel={p.id} aria-label={`${index + 1} of ${total}: ${p.title}`}>
        <div className="st-media">
          <Image src={frameSrc(p.frame)} alt="Frame from the official OFF GRAVITY obstacle teaser" fill sizes="(min-width:900px) 40vw, 82vw" priority={priority} className="st-img" />
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
