// How the camera's zoom moves (D106), kept apart from camera.ts so that it is
// tested without Phaser: the buttons step through ZOOMS, the wheel turns the zoom
// a little at a time between the same limits, and the words said on the scene are
// drawn larger as it zooms out, never smaller on the screen than at zoom 1.

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
