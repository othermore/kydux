// Whether the page is in the tester's mode, opened with `?debug` in the address:
// the scene's layers of cells and masks (debug.ts), every stop of the map open
// (map.ts), a button that writes a level's solution, the select of a level's ways,
// which the child never sees (level.ts, D204), and the music's mixer (main.ts). The
// published game has no such mode (D335): there the address's `?debug` is nothing.
// Kept apart from debug.ts so that a screen asks it without loading Phaser.

import { published } from '../analytics/site';

/** Whether the page was opened with `?debug`, anywhere but on the published host. */
export function debugging(): boolean {
  return !published() && new URLSearchParams(globalThis.location?.search ?? '').has('debug');
}
