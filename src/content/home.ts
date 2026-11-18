/**
 * Homepage v3 copy. Rewritten in our own words.
 * Any fact with `confirm` is NOT confirmed by the client: rendered, but listed for sign-off.
 */
export type Confirm = { confirm: true; note: string };
export const HOME = {
  hero: { watchLabel: "Watch the obstacles", duration: "1:23" },
  story: {
    kicker: "What is OFF GRAVITY",
    h2: "A fitness festival built around giant inflatables.",
    body: [
      "OFF GRAVITY is a two-day tour through six Indian cities, built around India's first inflatable obstacle run.",
      "You race timed waves through a course of giant inflatables, then roll straight into a festival village.",
      "Saturday turns into Glow Night. Sunday belongs to families and anyone chasing a podium.",
    ],
    // `photo` = file stem in public/images/story; the panel loads the generated -v2.webp asset
    panels: [
      { id: "timed", n: "01", title: "Timed racing", line: "Every wave is timed. Chase your best, or beat your friend's.", tone: "mint", photo: "01-timed-racing", alt: "Indian runners racing over the first inflatable hurdle beneath a timing gantry" },
      { id: "leaderboards", n: "02", title: "Live leaderboards", line: "City and national rankings, updated through the weekend.", tone: "ink", photo: "02-live-leaderboards", alt: "Three obstacle racers comparing their result beside a live event leaderboard" },
      { id: "family", n: "03", title: "Family wave", line: "A parent-and-child batch on smaller inflatables.", tone: "lilac", photo: "03-family-wave", alt: "A mother and school-age child crossing a smaller inflatable obstacle together", confirm: { confirm: true, note: "Family wave age limit (reference said 6+ / 6–14)" } },
      { id: "glow", n: "04", title: "Glow Night", line: "Saturday after dark: lights, music and a glowing finish.", tone: "night", photo: "04-glow-night", alt: "Two runners crossing an illuminated inflatable finish arch at night", confirm: { confirm: true, note: "UV kits and live DJ at Glow Night" } },
      { id: "recovery", n: "05", title: "Recovery village", line: "Stretch, hydrate, refuel and slow down after your wave.", tone: "cream", photo: "05-recovery-village", alt: "Tired obstacle racers cooling down, stretching and hydrating in the recovery village", confirm: { confirm: true, note: "Food trucks and hammocks in recovery village" } },
      { id: "game", n: "06", title: "Game layer", line: "Checkpoints, bonus obstacles and point multipliers on the course.", tone: "orange", photo: "06-game-layer", alt: "A racer touching a lit checkpoint pad while another takes a bonus obstacle lane", confirm: { confirm: true, note: "'Gaming overlay' / game layer mechanics" } },
    ],
  },
  obstacles: {
    kicker: "Know your obstacles",
    caption: "Official obstacle teaser",
    stats: [
      { title: "Timed waves", line: "Every wave runs against the clock." },
      { title: "Recorded splits", line: "See where you gained and lost time." },
      { title: "National leaderboard", line: "Ranked against all six cities." },
    ],
  },
  tour: {
    kicker: "The 2027 tour",
    h2: "Pick your city.",
    waysInKicker: "Ways in",
    // Draft tier examples only; real tiers come from admin ticket types.
    exampleTiers: ["Solo runner", "Squad pack (4)", "Glow Night pass (Jaipur only)", "Parent-child duo"],
    priceUnset: "Price announced soon",
  },
  cta: {
    h2: "Ready to go off gravity?",
    tagline: "Run. Bounce. Repeat.",
    waitlistSuccess: (city: string) => `You're in line for ${city}. We'll message you before tickets open.`,
  },
  footer: {
    blurb: "India's first play-fitness festival, organised by The Great Inflate Run.",
    contactEmail: { value: "[Contact email TBC]", confirm: true, note: "Contact email from reference draft" },
    instagram: { value: "[Instagram TBC]", confirm: true, note: "Instagram handle from reference draft" },
  },
  /** Unconfirmed facts mentioned in the reference draft; also tracked inline above. Report to client. */
  confirmFacts: [
    "3-storey slide, foam pit, spinning finish obstacle",
    "Chip timing, UV kits, live DJ",
    "Kids aged 6+ / 6–14 (family wave age limit)",
    "Finisher medals and squad bibs",
    "48-hour early-bird window",
    "Food trucks and hammocks",
    "'Gaming overlay' / game layer",
    "Contact email and Instagram handle",
    "'Filmed at the prototype course' caption",
    "Obstacle heights",
  ],
} as const;
