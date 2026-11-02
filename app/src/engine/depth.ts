// Where a painted scene's things and its figures are drawn among one another
// (D76, D95): a row's things over the figures standing above the row, a shut door
// or an arch over the figure standing in its doorway, a door swung open on the
// row of the wall it lies against (D111), a thing lying inside furniture under it, a wall seen from above over every figure, and a figure drawn lower on
// a cell the scene lowers, its legs behind what stands below it, or sideways on a
// cell the scene nudges, on the painted strip (D105). Kept apart from painted.ts so
// that it is tested without Phaser.

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

/** How a painted thing is drawn among the rows, besides its row: `under`, a door
 * or a gate over the figure in its doorway while it is shut (D95); `inside`, a
 * thing lying on a cell no one walks, inside the furniture there, under that
 * row's things. */
export interface ThingDrawn {
  under?: boolean;
  open?: boolean;
  inside?: boolean;
}

/** The depth of a painted thing standing on row `row`, just over its row's image
 * and under the figure standing on the row: a door or a gate marked `under` is over
 * the figure in its doorway while it is shut; open, what is seen through it is
 * under that figure, and its arch over them (D95); a thing `inside` furniture is
 * just under its row's image. */
export function thingDepth(row: number, { under = false, open = false, inside = false }: ThingDrawn = {}): number {
  if (inside) return rowDepth(row) - 0.00001;
  return rowDepth(row, under && !open) + 0.00001;
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

/** The depth of the light over a scene `rows` rows tall (D124): over every row and
 * figure, under the speech. */
export function lightDepth(rows: number): number {
  return overDepth(rows) + 1;
}

/** The cells a scene draws a figure lower on: each range is its first and last cell,
 * and by how much of a cell (D95). */
export type Lowered = { cells: [Tile, Tile]; by: number }[];

/** How much lower, as a part of a cell, a figure is drawn on a tile (D95). */
export function loweredBy(lowered: Lowered | undefined, tile: Tile): number {
  return byOf(lowered, tile);
}

/** The cells a scene draws a figure sideways on, on its painted strip (D105): each
 * range is its first and last cell, and by how much of a cell, to the left when
 * less than 0. */
export type Nudged = Lowered;

/** How far sideways, as a part of a cell, a figure is drawn on a tile (D105). */
export function nudgedBy(nudged: Nudged | undefined, tile: Tile): number {
  return byOf(nudged, tile);
}

function byOf(ranges: Lowered | undefined, [x, y]: Tile): number {
  const range = ranges?.find(({ cells: [[x0, y0], [x1, y1]] }) => x >= x0 && x <= x1 && y >= y0 && y <= y1);
  return range?.by ?? 0;
}
