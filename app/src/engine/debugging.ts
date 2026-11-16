// Whether the page is in the tester's mode, opened with `?debug` in the address:
// the scene's layers of cells and masks (debug.ts), every stop of the map open
// (map.ts), and a button that writes a level's solution (level.ts). Kept apart
// from debug.ts so that a screen asks it without loading Phaser.

/** Whether the page was opened with `?debug`. */
export function debugging(): boolean {
  return new URLSearchParams(globalThis.location?.search ?? '').has('debug');
}
