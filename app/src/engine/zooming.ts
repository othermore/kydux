// How the camera's zoom moves (D106), kept apart from camera.ts so that it is
// tested without Phaser: the buttons step through ZOOMS, the wheel turns the zoom
// a little at a time between the same limits, and the words said on the scene are
// drawn larger as it zooms out, never smaller on the screen than at zoom 1. Here too is
// what the camera shows at a level's start, and where a story's window keeps who speaks.

/** The zooms the buttons step through, from the whole scene to a close look. */
export const ZOOMS = [0.5, 0.75, 1, 1.5, 2] as const;
/** How much a wheel's notch of 100 pixels turns the zoom, and the most one turn of
 * the wheel does. */
const NOTCH = 1.1;
const MOST = 1.25;
/** Below this, a wheel's delta counts lines, not pixels (a browser that says so). */
const LINES = 10;
const LINE_PIXELS = 33;

/** The zoom the buttons go to from `zoom`: the next of ZOOMS strictly above or
 * below it, or null at the end. */
export function steppedZoom(zoom: number, step: 1 | -1): number | null {
  const next = step > 0 ? ZOOMS.find((value) => value > zoom + 1e-6) : [...ZOOMS].reverse().find((value) => value < zoom - 1e-6);
  return next ?? null;
}

/** The zoom a turn of the wheel by `deltaY` takes `zoom` to: down zooms out, a
 * notch at a time, at most MOST in one turn, within ZOOMS's first and last. */
export function wheeledZoom(zoom: number, deltaY: number): number {
  const pixels = Math.abs(deltaY) < LINES ? deltaY * LINE_PIXELS : deltaY;
  const factor = Math.min(MOST, Math.max(1 / MOST, NOTCH ** (-pixels / 100)));
  return Math.min(ZOOMS[ZOOMS.length - 1] ?? 2, Math.max(ZOOMS[0] ?? 0.5, zoom * factor));
}

/** How much larger the words said on the scene are drawn at a camera's zoom, the
 * scene's pixels to the screen's: as large as at 1 when it is less, so that they
 * keep their size on the screen; with the scene when it is more. */
export function wordsScale(cameraZoom: number): number {
  return cameraZoom > 0 ? Math.max(1, 1 / cameraZoom) : 1;
}

/** How much room the camera leaves round the figures at a level's start, in tiles. */
const START_ROOM = 0.4;

/** What the camera shows at a level's start: the zoom, as near the one it has as
 * shows the wizard and every actor, and no nearer than `least`; and the point it is on,
 * in tiles, when the window on the wizard would leave a figure out, or null. Each figure
 * is its tile and the one above it, for its head. `shown` is the window at zoom 1, in
 * tiles across and down. */
export function startFrame(
  figures: readonly [number, number][],
  wizard: [number, number],
  shown: [number, number],
  zoom: number,
  least: number,
): { zoom: number; centre: [number, number] | null } {
  const all = [wizard, ...figures];
  const left = Math.min(...all.map(([x]) => x)) - START_ROOM;
  const right = Math.max(...all.map(([x]) => x)) + 1 + START_ROOM;
  const top = Math.min(...all.map(([, y]) => y)) - 1 - START_ROOM;
  const bottom = Math.max(...all.map(([, y]) => y)) + 1 + START_ROOM;
  const needed = Math.min(shown[0] / (right - left), shown[1] / (bottom - top));
  const framed = Math.max(least, Math.min(zoom, needed));
  const [wide, tall] = [shown[0] / framed, shown[1] / framed];
  const [wx, wy] = [wizard[0] + 0.5, wizard[1] + 0.5];
  const inside = left >= wx - wide / 2 && right <= wx + wide / 2 && top >= wy - tall / 2 && bottom <= wy + tall / 2;
  return { zoom: framed, centre: inside ? null : [(left + right) / 2, (top + bottom) / 2] };
}

/** Where a story's window is, down the scene, on who speaks with their words, from
 * `top` to `bottom`: on their middle while they fit in its height with `room` round
 * them, or else on what shows the figure whole at the bottom, for the words to go past
 * the top. */
export function storyMiddle(top: number, bottom: number, height: number, room: number): number {
  if (bottom - top + room * 2 <= height) return (top + bottom) / 2;
  return bottom + room - height / 2;
}
