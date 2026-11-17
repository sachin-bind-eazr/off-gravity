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
      "A two-day tour through six Indian cities, built around India's first inflatable obstacle run. Race timed waves through giant inflatables, then roll into a festival village.",
    ],
    // `photo` = file in public/images/story (without .jpg); `alt` describes what the photo shows
    panels: [
      { id: "timed", n: "01", title: "Timed racing", line: "Every wave runs on the clock.", tone: "mint", photo: "01-timed-racing", alt: "Two sprinters crouched in their starting positions on a red running track, focused on the start line" },
      { id: "leaderboards", n: "02", title: "Live leaderboards", line: "Rankings update all weekend.", tone: "ink", photo: "02-live-leaderboards", alt: "Two athletes in red sportswear sitting on an indoor track, smiling as they check a phone together" },
      { id: "family", n: "03", title: "Family wave", line: "A wave for parents and kids.", tone: "lilac", photo: "03-family-wave", alt: "A smiling mother lifting her laughing toddler into the air outdoors", confirm: { confirm: true, note: "Family wave age limit (reference said 6+ / 6–14)" } },
      { id: "glow", n: "04", title: "Glow Night", line: "Saturday after dark, lights on.", tone: "night", photo: "04-glow-night", alt: "Festival crowd at night with raised hands under blue and orange stage lights", confirm: { confirm: true, note: "UV kits and live DJ at Glow Night" } },
      { id: "recovery", n: "05", title: "Recovery village", line: "Stretch, refuel, slow down.", tone: "white", photo: "05-recovery-village", alt: "A large group stretching together on a sunlit lawn among trees", confirm: { confirm: true, note: "Food trucks and hammocks in recovery village" } },
      { id: "game", n: "06", title: "Game layer", line: "Checkpoints and bonus points.", tone: "mint", photo: "06-game-layer", alt: "An athlete gripping hanging wooden rings on an obstacle course", confirm: { confirm: true, note: "'Gaming overlay' / game layer mechanics" } },
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
