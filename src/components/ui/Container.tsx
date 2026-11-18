import type { ElementType, ReactNode } from "react";

type Props = { as?: ElementType; className?: string; children?: ReactNode; id?: string };

/** Site content column: gutter 24 / 40 / growing on laptops, centred 1552px content on large screens (see globals.css). Use inside every section. */
export function Container({ as: Tag = "div", className = "", ...rest }: Props) {
  return <Tag className={`og-container ${className}`.trim()} {...rest} />;
}

type SectionProps = Props & { tone?: "light" | "dark" | "white" | "none"; container?: boolean };

/** Section wrapper: 128/96/64 vertical padding + Container. tone sets bg/text. */
export function Section({ as: Tag = "section", tone = "none", container = true, className = "", children, ...rest }: SectionProps) {
  const t = tone === "none" ? "" : `og-section--${tone}`;
  return (
    <Tag className={`og-section ${t} ${className}`.trim()} {...rest}>
      {container ? <Container>{children}</Container> : children}
    </Tag>
  );
}

export default Container;
