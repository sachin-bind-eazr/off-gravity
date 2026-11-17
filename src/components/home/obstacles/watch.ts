/** Tiny shared trigger: any button on the page can ask the obstacles section to play its video with sound. */
export const WATCH_EVENT = "og:watch-with-sound";
export function watchWithSound() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(WATCH_EVENT));
}
