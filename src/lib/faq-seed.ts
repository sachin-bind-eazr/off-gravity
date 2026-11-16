export const FAQ_SEED = [
 { q: "Are the {city} dates confirmed?", a: "Dates are provisional, subject to venue and permission confirmations. Everyone who books will be emailed as soon as the venue and dates are confirmed." },
 { q: "Who can take part?", a: "OFF GRAVITY is made for fitness athletes, families with kids and Gen Z squads. Age limits and eligibility are listed on each ticket before you book." },
 { q: "Is the race really timed?", a: "Yes. The Great Inflate Run uses a standardised format with competitive waves, recorded splits and national leaderboards." },
 { q: "What happens at Glow Night?", a: "Saturday evening: music, lights and festival energy after the day's racing. (Jaipur: the festival runs into the night as an evening edition.)" },
 { q: "Can I cancel or change my booking?", a: "The refund and cancellation policy will be published before ticket sales open, and shown again at checkout." },
];
export const fillCity = (s: string, city: string) => s.replaceAll("{city}", city);
