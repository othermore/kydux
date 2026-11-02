// Where a painted scene's things and its figures are drawn among one another
// (D76, D95): a row's things over the figures standing above the row, a door or
// its arch over the figure standing in its doorway, a wall seen from above over
// every figure, and a figure drawn lower on a cell the scene lowers, its legs
// behind what stands below it. Kept apart from painted.ts so that it is tested
// without Phaser.

import type { Tile } from './sight';

/** Where a figure's feet stand in its cell on a painted scene, as a part of a cell. */
export const FOOT_IN_CELL = 0.8;
/** Where in its cell a painted row's things are drawn among the figures, as a part
 * of a cell: under whoever stands on the row, whose feet are at FOOT_IN_CELL; or,
 * a door or its arch, over them (D95). */
const ROW_IN_CELL = 0.75;
const UNDER_IN_CELL = 0.9;

/** The depth of a figure whose feet are `feet` tiles down the scene. */
export function figureDepth(feet: number): number {
  return 3 + feet * 0.01;
}

/** The depth of a painted row's things, at three quarters of its cell, so that a
 * row's things cover the figures above them (D76), and a thing `under`, the figure
 * standing on its row too (D95). */
export function rowDepth(row: number, under = false): number {
  return figureDepth(row + (under ? UNDER_IN_CELL : ROW_IN_CELL));
}

/** A bed's frame is its row's; a pupil asleep in it lies just over the frame, and
 * the bed's quilt and sheet just over the sleeper (D97): all under a figure
 * standing on the bed's row, in front of the bed. */
export function sleeperDepth(row: number): number {
  return rowDepth(row) + 0.0002;
}
export function coverDepth(row: number): number {
  return rowDepth(row) + 0.0004;
}

/** The depth of what is drawn over every figure of a scene `rows` rows tall: a wall
 * seen from above (D95). */
export function overDepth(rows: number): number {
  return figureDepth(rows + 2);
}

/** The cells a scene draws a figure lower on: each range is its first and last cell,
 * and by how much of a cell (D95). */
export type Lowered = { cells: [Tile, Tile]; by: number }[];

/** How much lower, as a part of a cell, a figure is drawn on a tile (D95). */
export function loweredBy(lowered: Lowered | undefined, [x, y]: Tile): number {
  const range = lowered?.find(({ cells: [[x0, y0], [x1, y1]] }) => x >= x0 && x <= x1 && y >= y0 && y <= y1);
  return range?.by ?? 0;
}
