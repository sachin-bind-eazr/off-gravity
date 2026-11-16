import { TOUR } from "@/lib/tour";

/* Dots are placed by real latitude and longitude (each axis scaled linearly to fit the box).
   The horizontal axis is stretched so labels stay readable. */
const W = 360, H = 480;
const PAD = { l: 136, r: 98, t: 52, b: 50 };
const lats = TOUR.map((t) => t.lat), lngs = TOUR.map((t) => t.lng);
const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
const pos = (t: (typeof TOUR)[number]) => ({
  x: PAD.l + ((t.lng - minLng) / (maxLng - minLng)) * (W - PAD.l - PAD.r),
  y: PAD.t + ((maxLat - t.lat) / (maxLat - minLat)) * (H - PAD.t - PAD.b),
});
// Which side each label sits on, chosen so no two labels collide
const SIDE: Record<string, "l" | "r"> = { mumbai: "l", bengaluru: "l", delhi: "r", chandigarh: "l", jaipur: "l", satara: "r" };

export function RouteMap({ selected, dark = false, onSelect }: { selected: string; dark?: boolean; onSelect?: (slug: string) => void }) {
  const pts = TOUR.map((t, i) => ({ t, i, ...pos(t) }));
  const ink = dark ? "#fff" : "#1D2632";
  const numInk = dark ? "#1D2632" : "#fff";
  const selCity = TOUR.find((t) => t.slug === selected)?.city;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`Tour route in order: ${TOUR.map((t) => t.city).join(", ")}. ${selCity} is selected.`}>
      <polyline className="og-route-dash" points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={ink} strokeOpacity=".55" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(({ t, i, x, y }) => {
        const on = t.slug === selected;
        const left = SIDE[t.slug] === "l";
        const r = on ? 21 : 15;
        return (
          <g key={t.slug} onClick={onSelect ? () => onSelect(t.slug) : undefined} style={onSelect ? { cursor: "pointer" } : undefined}>
            <circle cx={x} cy={y} r={r + 10} fill="transparent" />
            {on && <circle cx={x} cy={y} r="31" fill="#FD6B14" opacity=".28" />}
            <circle cx={x} cy={y} r={r} fill={on ? "#FD6B14" : ink} stroke={on ? ink : "none"} strokeWidth="3" style={{ transition: "r .35s, fill .35s" }} />
            <text x={x} y={y + (on ? 7 : 5.5)} textAnchor="middle" fontSize={on ? 19 : 15} fontWeight="800" fill={on ? "#1D2632" : numInk} aria-hidden="true">{i + 1}</text>
            <text x={left ? x - r - 12 : x + r + 12} y={y + 7} textAnchor={left ? "end" : "start"} fontSize="23" fontWeight={on ? 800 : 600} fill={ink}>{t.city}</text>
          </g>
        );
      })}
    </svg>
  );
}
