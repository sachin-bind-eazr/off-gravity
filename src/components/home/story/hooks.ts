"use client";
import { useEffect, useState } from "react";
/** SSR-safe media query; false until mounted. */
export function useMedia(query: string) {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return m;
}
