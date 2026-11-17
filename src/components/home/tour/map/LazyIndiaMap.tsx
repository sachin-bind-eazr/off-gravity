"use client";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import dynamic from "next/dynamic";
import "./map.css";

const IndiaMap = dynamic(() => import("./IndiaMap").then((m) => m.IndiaMap), {
  ssr: false,
  loading: () => <MapPlaceholder />,
});

function MapPlaceholder({ hostRef }: { hostRef?: React.Ref<HTMLDivElement> }) {
  return <div ref={hostRef} className="og-map" role="group" aria-label="Map of India showing the 2027 tour route"><p className="og-map__msg">Loading map…</p></div>;
}

/** Defers the d3/topojson map bundle until the map is near the viewport. */
export function LazyIndiaMap(props: ComponentProps<typeof IndiaMap>) {
  const host = useRef<HTMLDivElement>(null);
  const [go, setGo] = useState(false);
  useEffect(() => {
    const el = host.current; if (!el || go) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setGo(true); io.disconnect(); } }, { rootMargin: "400px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [go]);
  if (go) return <IndiaMap {...props} />;
  return <MapPlaceholder hostRef={host} />;
}
