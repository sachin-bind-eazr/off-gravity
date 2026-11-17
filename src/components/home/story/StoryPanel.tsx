import Image from "next/image";

export type PanelData = { id: string; n: string; title: string; line: string; tone: string; photo: string; alt: string };

export function StoryPanel({ p, index, priority }: { p: PanelData; index: number; priority?: boolean }) {
  return (
    <li className="st-item col-span-12 sm:col-span-6 xl:col-span-4" data-reveal>
      <article className={`st-card st-tone-${p.tone}`} data-panel={p.id}>
        <div className="st-media">
          <Image
            src={`/images/story/${p.photo}.jpg`}
            alt={p.alt}
            fill
            sizes="(min-width:1200px) 368px, (min-width:700px) 50vw, 100vw"
            priority={priority && index < 3}
            className="st-img"
          />
          <span className="st-caption t-label">Illustrative image</span>
        </div>
        <div className="st-band">
          <span className="st-num t-label" aria-hidden>{p.n}</span>
          <h3 className="st-title t-h3">{p.title}</h3>
          <p className="st-line t-body">{p.line}</p>
        </div>
      </article>
    </li>
  );
}
