// Play time (D70): the seconds the child plays, counted to the game being played.
// Every PLAY_TICK_S seconds a tick is counted when a level, a lesson or a story is
// on screen, the tab is in sight and the child is at the page: something was
// touched (a key, a click, the pointer moved, a scroll, the wheel) within the last
// IDLE_S seconds. A child who walks away stops the count until they come back.

/** How often play time is counted, in seconds, and how long the page may go
 * untouched before the child is taken to have walked away and it stops. */
export const PLAY_TICK_S = 10;
export const IDLE_S = 120;

/** What touching the page is: whatever the child does with it. */
export const TOUCHES = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'scroll', 'touchstart'] as const;

export interface PlayTimeParts {
  /** Whether a level, a lesson or a story is on screen. */
  playing: () => boolean;
  /** Whether the tab is in sight. */
  visible: () => boolean;
  /** Counts the seconds to the game being played. */
  add: (seconds: number) => void;
  /** The clock, and the page touches are heard on: the window's, unless a test
   * gives its own. */
  now?: () => number;
  target?: Pick<EventTarget, 'addEventListener'>;
  every?: (callback: () => void, ms: number) => unknown;
}

/** Starts counting play time; gives the moment it was last touched, for a test. */
export function startPlayTime(parts: PlayTimeParts): { touchedAt: () => number } {
  const now = parts.now ?? (() => Date.now());
  const target = parts.target ?? globalThis;
  const every = parts.every ?? ((callback, ms) => setInterval(callback, ms));
  let touched = now();
  for (const kind of TOUCHES) {
    target.addEventListener(kind, () => (touched = now()), { capture: true, passive: true });
  }
  every(() => {
    const present = parts.visible() && now() - touched < IDLE_S * 1000;
    if (parts.playing() && present) parts.add(PLAY_TICK_S);
  }, PLAY_TICK_S * 1000);
  return { touchedAt: () => touched };
}
