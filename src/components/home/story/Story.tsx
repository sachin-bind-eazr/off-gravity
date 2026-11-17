import { Container } from "@/components/ui/Container";
import { HOME } from "@/content/home";
import { StoryPanel, type PanelData } from "./StoryPanel";
import { ScrollEffects } from "./ScrollEffects";
import "./story.css";

export function Story() {
  const panels = HOME.story.panels as unknown as PanelData[];
  return (
    <section id="about" className="og-section og-section--light st-section" aria-labelledby="story-h2">
      <ScrollEffects />
      <Container>
        <div className="grid-12">
          <div className="col-span-12 lg:col-span-8">
            <p className="t-kicker on-light">{HOME.story.kicker}</p>
            <h2 id="story-h2" className="t-h2">{HOME.story.h2}</h2>
            <p className="t-body-lg measure">{HOME.story.body[0]}</p>
          </div>
        </div>
        <ol className="st-grid grid-12">
          {panels.map((p, i) => (
            <StoryPanel key={p.id} p={p} index={i} priority={false} />
          ))}
        </ol>
      </Container>
    </section>
  );
}
