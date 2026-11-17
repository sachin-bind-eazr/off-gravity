# Foundation API (use these; do not hand-roll layout/type/buttons)
Import: `import { Container, Section } from "@/components/ui/Container"; import { Button } from "@/components/ui/Button";`

## Layout
- `<Container>`: 1280 max, side padding 24/40/64 (<640 / 640-1023 / >=1024). Class `.og-container`.
- `<Section tone="light|dark|white|none" container={true} as="section" id className>`: vertical padding 128/96/64 + Container. Tone sets bg/text (light=cream, dark=ink). `container={false}` for full-bleed children.
- `.grid-12`: 12 cols, 24px gap. Children use `col-span-12 md:col-span-6 lg:col-span-4` etc (6/6, 4/4/4, 3/3/3/3, 5/7). Tailwind breakpoints here are custom: sm700 md860 lg1000 xl1100; container/type steps at 640/1024.
- Spacing vars: `--s-4 --s-8 --s-12 --s-16 --s-24 --s-32 --s-48 --s-64 --s-96 --s-128`; `--og-section-y`.

## Type (desktop/mobile). Use no other sizes.
`.t-display` 88/48 (Hero H1 only) | `.t-h2` 64/40 | `.t-h3` 28/24 | `.t-body-lg` 20/18 | `.t-body` 16 | `.t-label` 14/600. Tablet (640-1023) gets in-between sizes for display/h2/h3/body-lg.
- Headings: text-wrap balance. `.measure` = max-width 60ch.
- `.t-kicker` (14/600, ink 60%) + `.on-dark` (mint) / `.on-light` (cobalt). No pill/dot.
- Auto rhythm: kicker->heading 16, h2/display->body 24 (adjacent siblings). Add 48 before content yourself (`mt-12` or `var(--s-48)`).
- Deprecated, still defined, migrate callers: `.t-section .t-section-lg .t-campaign .t-card .t-lead .btn-primary .wi-cta .city-chip .container-og .section-y .section-y-tight`.

## Button
`<Button variant="primary|secondary|outline|ghost-on-dark" size="md|lg" href? fullWidth? loading? disabled? leadingIcon={Icon} trailingIcon={Icon} onClick>Label</Button>`
- `href` => Next `<Link>` (internal) or `<a>` (http/mailto/tel); else `<button type="button">` (pass `type="submit"` when needed).
- md 48px, lg 56px, radius 999, nowrap, icon 18px stroke 1.75 (pass the lucide component, not an element). Card buttons: `fullWidth className="mt-auto"`.
- outline on light, ghost-on-dark on dark, primary (orange) only for main CTAs. Focus ring built in (white on dark sections).
- Icons: `lucide-react` only.
