import { describe, expect, it } from "vitest";
import { TOUR } from "@/lib/tour";
import {
  countdown,
  fullDates,
  istMidnight,
  nextStopIndex,
  pickActive,
  stopLabel,
  ticketHref,
  toTicketCities,
  type StripEvent,
} from "./tourTicket";

const events = (status = "PROVISIONAL"): StripEvent[] =>
  TOUR.map((t) => ({ slug: t.slug, city: t.city, season: t.season, start: t.start, end: t.end, status }));

/** Tour order shuffled, so sorting is actually exercised. */
const shuffled = (): StripEvent[] => {
  const e = events();
  return [e[3], e[0], e[5], e[1], e[4], e[2]];
};

const at = (iso: string) => Date.parse(iso);

describe("istMidnight", () => {
  it("is 00:00 IST (18:30 UTC the previous day)", () => {
    expect(istMidnight("2027-01-30")).toBe(at("2027-01-29T18:30:00Z"));
    expect(new Date(istMidnight("2027-04-24")).toISOString()).toBe("2027-04-23T18:30:00.000Z");
  });
  it("ignores any time part after the date", () => {
    expect(istMidnight("2027-01-30T15:00:00Z")).toBe(at("2027-01-29T18:30:00Z"));
  });
});

describe("fullDates", () => {
  it.each([
    ["mumbai", "Sat 30 – Sun 31 Jan 2027"],
    ["bengaluru", "Sat 20 – Sun 21 Feb 2027"],
    ["delhi", "Sat 6 – Sun 7 Mar 2027"],
    ["chandigarh", "Sat 3 – Sun 4 Apr 2027"],
    ["jaipur", "Sat 10 – Sun 11 Apr 2027"],
    ["satara", "Sat 24 – Sun 25 Apr 2027"],
  ])("%s → %s", (slug, want) => {
    const t = TOUR.find((x) => x.slug === slug)!;
    expect(fullDates(t.start, t.end)).toBe(want);
  });
  it("cross-month", () => {
    expect(fullDates("2027-01-31", "2027-02-01")).toBe("Sun 31 Jan – Mon 1 Feb 2027");
  });
  it("cross-year", () => {
    expect(fullDates("2026-12-31", "2027-01-01")).toBe("Thu 31 Dec 2026 – Fri 1 Jan 2027");
  });
  it("single day", () => {
    expect(fullDates("2027-01-30", "2027-01-30")).toBe("Sat 30 Jan 2027");
  });
});

describe("toTicketCities", () => {
  const cities = toTicketCities(shuffled());
  it("sorts by start date into tour order with stops 1–6", () => {
    expect(cities.map((c) => c.slug)).toEqual(["mumbai", "bengaluru", "delhi", "chandigarh", "jaipur", "satara"]);
    expect(cities.map((c) => c.stop)).toEqual([1, 2, 3, 4, 5, 6]);
  });
  it("carries the season", () => {
    expect(cities.map((c) => c.season)).toEqual([1, 1, 1, 2, 2, 2]);
  });
  it("start = 00:00 IST on day 1, end = 00:00 IST the day after the last day", () => {
    expect(cities[0].startMs).toBe(at("2027-01-30T00:00:00+05:30"));
    expect(cities[0].endMs).toBe(at("2027-02-01T00:00:00+05:30"));
    expect(cities[0].dates).toBe("Sat 30 – Sun 31 Jan 2027");
    expect(cities[0].city).toBe("Mumbai");
  });
  it("does not mutate the input", () => {
    const input = shuffled();
    const before = input.map((e) => e.slug);
    toTicketCities(input);
    expect(input.map((e) => e.slug)).toEqual(before);
  });
  it.each([
    ["SALES_OPEN", "book"],
    ["PROVISIONAL", "waitlist"],
    ["WAITLIST_OPEN", "waitlist"],
    ["CONFIRMED", "waitlist"],
    ["SOLD_OUT", "none"],
    ["CANCELLED", "none"],
    ["COMPLETED", "none"],
    ["", "none"],
  ])("status %s → mode %s", (status, mode) => {
    expect(toTicketCities(events(status))[0].mode).toBe(mode);
  });
});

describe("nextStopIndex", () => {
  const cities = toTicketCities(events());
  it("before the tour → 0", () => {
    expect(nextStopIndex(cities, at("2026-11-17T12:00:00+05:30"))).toBe(0);
  });
  it("during Mumbai → 0", () => {
    expect(nextStopIndex(cities, at("2027-01-30T00:00:00+05:30"))).toBe(0);
    expect(nextStopIndex(cities, at("2027-01-31T23:59:59+05:30"))).toBe(0);
  });
  it("once Mumbai ends (1 Feb 00:00 IST) → 1", () => {
    expect(nextStopIndex(cities, at("2027-02-01T00:00:00+05:30"))).toBe(1);
  });
  it("after the whole tour → -1", () => {
    expect(nextStopIndex(cities, at("2027-04-26T00:00:00+05:30"))).toBe(-1);
  });
  it("empty → -1", () => {
    expect(nextStopIndex([], 0)).toBe(-1);
  });
});

describe("countdown", () => {
  const [mumbai] = toTicketCities(events());
  it("concrete value from 17 Nov 2026 12:00 IST", () => {
    expect(countdown(mumbai, at("2026-11-17T12:00:00+05:30"))).toBe("73d 12h 00m");
  });
  it("zero-pads hours and minutes, not days", () => {
    expect(countdown(mumbai, mumbai.startMs - (3 * 86_400_000 + 7 * 3_600_000 + 41 * 60_000))).toBe("3d 07h 41m");
    expect(countdown(mumbai, mumbai.startMs - (73 * 86_400_000 + 7 * 3_600_000 + 41 * 60_000))).toBe("73d 07h 41m");
  });
  it("matches the display pattern", () => {
    expect(countdown(mumbai, at("2026-12-01T09:13:00+05:30"))).toMatch(/^\d+d \d{2}h \d{2}m$/);
  });
  it("floors partial minutes", () => {
    expect(countdown(mumbai, mumbai.startMs - 59_999)).toBe("0d 00h 00m");
    expect(countdown(mumbai, mumbai.startMs - 60_000)).toBe("0d 00h 01m");
  });
  it("exactly at start → Live now", () => {
    expect(countdown(mumbai, mumbai.startMs)).toBe("Live now");
  });
  it("last minute of the last day (31 Jan 23:59 IST) → Live now", () => {
    expect(countdown(mumbai, at("2027-01-31T23:59:00+05:30"))).toBe("Live now");
  });
  it("at endMs → Finished", () => {
    expect(countdown(mumbai, mumbai.endMs)).toBe("Finished");
    expect(countdown(mumbai, at("2027-02-01T00:00:00+05:30"))).toBe("Finished");
  });
});

describe("stopLabel", () => {
  const cities = toTicketCities(events());
  it("next stop", () => {
    expect(stopLabel(cities[0], 0, 0)).toBe("Next stop");
    expect(stopLabel(cities[3], 3, 3)).toBe("Next stop");
  });
  it("other stops show stop number and season", () => {
    expect(stopLabel(cities[2], 2, 0)).toBe("Stop 03 · Season 1");
    expect(stopLabel(cities[5], 5, 0)).toBe("Stop 06 · Season 2");
    expect(stopLabel(cities[0], 0, -1)).toBe("Stop 01 · Season 1");
  });
});

describe("pickActive", () => {
  it("largest left that is <= edge", () => {
    const items = [
      { idx: 0, left: -500 },
      { idx: 1, left: 100 },
      { idx: 2, left: 504 },
      { idx: 3, left: 900 },
    ];
    expect(pickActive(items, 504)).toBe(2); // exactly on the edge counts
    expect(pickActive(items, 503)).toBe(1);
    expect(pickActive(items, 10_000)).toBe(3);
  });
  it("none reached → null", () => {
    expect(pickActive([{ idx: 0, left: 600 }, { idx: 1, left: 900 }], 504)).toBeNull();
    expect(pickActive([], 504)).toBeNull();
  });
  it("ties keep the first item seen", () => {
    expect(pickActive([{ idx: 4, left: 300 }, { idx: 1, left: 300 }], 504)).toBe(4);
  });
  it("duplicated set (same idx 0–5 twice): second-set Mumbai wins over first-set Satara once it passes the edge", () => {
    const lefts = [0, 400, 900, 1400, 1900, 2500];
    const items = [
      ...lefts.map((l, i) => ({ idx: i, left: l - 2800 })), // first set; Satara at -300
      ...lefts.map((l, i) => ({ idx: i, left: l + 200 })), // second set; Mumbai at 200, Bengaluru at 600
    ];
    expect(pickActive(items, 504)).toBe(0);
    expect(pickActive(items, 150)).toBe(5); // Mumbai (200) not yet there → first-set Satara (-300)
    expect(pickActive(items, 600)).toBe(1);
  });
});

describe("ticketHref", () => {
  it("booking link when selling", () => {
    expect(ticketHref({ slug: "mumbai", mode: "book" })).toBe("/book?city=mumbai");
  });
  it("null (waitlist drawer) otherwise", () => {
    expect(ticketHref({ slug: "mumbai", mode: "waitlist" })).toBeNull();
    expect(ticketHref({ slug: "mumbai", mode: "none" })).toBeNull();
  });
  it("follows the event status end to end", () => {
    const c = toTicketCities([{ ...events()[2], status: "SALES_OPEN" }])[0];
    expect(ticketHref(c)).toBe("/book?city=delhi");
  });
});
