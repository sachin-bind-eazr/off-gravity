"use client";
import Image from "next/image";
import { motion, type MotionValue } from "framer-motion";

export type PanelData = { id: string; n: string; title: string; line: string; tone: string; photo: string; alt: string };

/** Natural-colour photo (no grade, tint or filter); the solid band sits over the lower part of the card. */
export function StoryPanel({ p, index, total, scale, dim, motionOn }: {
  p: PanelData; index: number; total: number;
  scale: MotionValue<number>; dim: MotionValue<number>; motionOn: boolean;
}) {
  return (
    <li className="st-item" style={{ ["--i" as string]: index }}>
      <motion.article className={`st-card st-tone-${p.tone}`} style={motionOn ? { scale } : undefined} data-panel={p.id} aria-label={`${index + 1} of ${total}: ${p.title}`}>
        <div className="st-media">
          <Image
            src={`/images/story/${p.photo}.jpg`}
            alt={p.alt}
            fill
            sizes="(min-width:900px) 640px, calc(100vw - 48px)"
            priority={false}
            className="st-img"
          />
          <span className="st-caption">Illustrative image</span>
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
