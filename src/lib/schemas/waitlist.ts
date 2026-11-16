import { z } from "zod";
const blankToUndef = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
export const TIER_KEYS = ["solo", "squad", "glow", "family", "undecided"] as const;
export type TierKey = (typeof TIER_KEYS)[number];
const PARTY_MSG = "Enter a party size from 1 to 8.";
export const waitlistSchema = z.object({
  eventSlug: z.string().trim().min(1, "Choose a city."),
  email: z.string().trim().toLowerCase().email("Enter an email like name@example.com."),
  name: z.preprocess(blankToUndef, z.string().trim().max(120).optional()),
  whatsappNumber: z.preprocess(blankToUndef, z.string().trim().regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number.").optional()),
  consent: z.literal(true, { message: "Tick the box so we can message you about this event." }),
  whatsappOptIn: z.boolean().default(false),
  tier: z.preprocess(blankToUndef, z.enum(TIER_KEYS, { message: "Choose a ticket tier." }).default("undecided")),
  partySize: z.preprocess(blankToUndef, z.coerce.number({ message: PARTY_MSG }).int(PARTY_MSG).min(1, PARTY_MSG).max(8, PARTY_MSG).default(1)),
  source: z.string().trim().max(40).default("site"),
  // honeypot: real users leave it empty
  website: z.string().optional(),
});
export type WaitlistInput = z.infer<typeof waitlistSchema>;
