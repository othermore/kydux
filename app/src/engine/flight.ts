// Flying (D185): a figure on its broom is drawn from its sheet's flying rows, one a
// way it faces, lifted half a cell above its cell with a soft shadow on the ground,
// bobbing over the rows' three frames (level, a little up, a little down); a flown
// step takes a third of a walked one's time, at every speed, so that a flight is
// three times as fast to the eye. Kept apart from scene.ts so that it is tested
// without Phaser.

import type { Facing } from './sight';

/** How far above its cell a flying figure is drawn, in cells. */
export const FLY_LIFT = 0.5;
/** How long a flown step takes, against a walked one. */
export const FLOWN = 1 / 3;
/** How long each of the bobbing's frames is shown, in milliseconds. */
export const BOB_MS = 160;
/** How far a sheet with no flying rows bobs, in cells, up and down. */
export const BOB_CELLS = 0.04;

/** The rows of a sheet, by the way a figure faces. */
const ROW: Record<Facing, number> = { down: 0, left: 1, right: 2, up: 3 };

/** The frame a flying figure shows `ms` into its flight, facing a way: the flying
 * rows' level, up, level, down frames in turn; null for a sheet with no such rows. */
export function flyFrame(flyRow: number | undefined, facing: Facing, ms: number): number | null {
  if (flyRow === undefined) return null;
  const step = [0, 1, 0, 2][Math.floor(Math.max(0, ms) / BOB_MS) % 4] ?? 0;
  return (flyRow + ROW[facing]) * 3 + step;
}

/** How far a figure drawn from a sheet with no flying rows is lifted besides its
 * lift, `ms` into its flight, in cells: a slow rise and fall. */
export function bobOf(ms: number): number {
  return Math.sin((Math.max(0, ms) / (BOB_MS * 4)) * Math.PI * 2) * BOB_CELLS;
}

/** How long a tick of the playback lasts, against a tick, by what its figures do in
 * it: a flown tick, every move in it flown and none walked, a third (D185). */
export function flownTick(events: { kind: string; data: Record<string, unknown> }[]): boolean {
  const moves = events.filter((event) => event.kind === 'move' || event.kind === 'circle');
  return moves.length > 0 && moves.every((event) => event.kind === 'circle' || event.data.flying === true);
}
