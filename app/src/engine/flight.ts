// Flying (D185): a figure on its broom is drawn from its sheet's flying rows, one a
// way it faces, in the row's level frame, lifted half a cell above its cell with a soft
// shadow on the ground; the page moves it slowly up and down, a hover on a clock that
// runs only while the program plays (D235); a flown step takes a third of a walked
// one's time, at every speed, so that a flight is three times as fast to the eye. In a ring's cell a flying figure flies through the
// ring's hole (D232): drawn higher, its feet and broom above the ring's lower rim, and
// its feet past the ring's plane the way it last flew, upward behind the ring, downward
// in front of it. Kept apart from scene.ts so that it is tested without Phaser.

import { FOOT_IN_CELL } from './depth';
import type { Facing, Tile } from './sight';

/** How far above its cell a flying figure is drawn, in cells. */
export const FLY_LIFT = 0.5;
/** How long a flown step takes, against a walked one. */
export const FLOWN = 1 / 3;
/** How long a flying figure's hover takes to rise and fall once, in milliseconds of
 * the hover's clock (D235). */
export const HOVER_MS = 2400;
/** How far a flying figure hovers up and down, in cells. */
export const HOVER_CELLS = 0.05;

/** How much higher a figure flying in a ring's cell is drawn, in cells, so that its feet
 * and its broom are inside the ring's hole, above its lower rim: the ring's picture
 * (content/art/things/things.json: two cells tall, its foot at 0.88 of its cell) has
 * its hole from 0.89 cells above its cell's top down to its cell's top, and a flying
 * figure's feet are drawn FLY_LIFT above its feet on the ground, at FOOT_IN_CELL. */
export const RING_RAISE = 0.35;
/** How far past a ring's plane a flying figure's feet are in the ring's cell, in cells,
 * the way it flew in. The ring stands among the figures at three quarters of its cell
 * (depth.ts), their feet at FOOT_IN_CELL: so far past it, the figure is drawn behind the
 * ring when it flew up into its cell and in front of it when it flew down. */
export const RING_PAST = 0.2;

/** A figure flying through a ring's cell (D232): how much higher it is drawn, and how
 * far its feet are past the ring's plane the way it last flew upward or downward
 * (negative, up the scene; positive, down it), in cells. Both are whole at its feet's
 * place in the ring's cell and fade to none a cell above or below it, so that the
 * figure climbs into the hole and out of it. `feet` is where its feet stand on the
 * ground, in cells (across, down); `rings`, the rings' cells; `footInCell`, where in a
 * cell a figure's feet stand. */
export function throughRing(
  feet: [number, number],
  rings: readonly Tile[],
  way: 'up' | 'down',
  footInCell = FOOT_IN_CELL,
): { raise: number; past: number } {
  const column = Math.floor(feet[0]);
  let near = 0;
  for (const [x, y] of rings) {
    if (x === column) near = Math.max(near, 1 - Math.abs(feet[1] - (y + footInCell)));
  }
  return { raise: RING_RAISE * near, past: (way === 'up' ? -1 : 1) * RING_PAST * near };
}

/** The rows of a sheet, by the way a figure faces. */
const ROW: Record<Facing, number> = { down: 0, left: 1, right: 2, up: 3 };

/** The frame a flying figure is drawn in, facing a way: its flying row's level frame,
 * the first of the row's three (D235); null for a sheet with no such rows. */
export function flyFrame(flyRow: number | undefined, facing: Facing): number | null {
  if (flyRow === undefined) return null;
  return (flyRow + ROW[facing]) * 3;
}

/** Where in its rise and fall a figure is at the hover clock's zero, from 0 to 1: the
 * wizard at its start, any other figure by its id, so that two figures in the air do
 * not rise together (D235). */
export function hoverPhase(id: string): number {
  if (id === 'wizard') return 0;
  let sum = 0;
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i);
  return (sum % 8) / 8;
}

/** How far a flying figure is lifted by its hover, in cells, upward positive, `ms` into
 * the hover's clock: a slow smooth rise and fall (D235). */
export function hoverOf(ms: number, phase: number): number {
  return Math.sin((ms / HOVER_MS + phase) * Math.PI * 2) * HOVER_CELLS;
}

/** How long a tick of the playback lasts, against a tick, by what its figures do in
 * it: a flown tick, every move in it flown and none walked, a third (D185). */
export function flownTick(events: { kind: string; data: Record<string, unknown> }[]): boolean {
  const moves = events.filter((event) => event.kind === 'move');
  return moves.length > 0 && moves.every((event) => event.data.flying === true);
}
