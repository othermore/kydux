// Where a painted thing is drawn when a level places it on another tile than the
// one it is painted on (D85): a key under a bookcase, a key in a different place
// in each way of a level, a book on the floor across the room. There, the middle
// of its picture is the middle of the tile (D109), whatever the offset it is
// painted with. Kept apart from painted.ts so that it is tested without Phaser.

import type { Tile } from './sight';

/** How many cells a painted thing is moved from where it is painted: the level's
 * tile less the painted cell, none when the painting does not say. The rows it is
 * drawn among follow it so. */
export function shiftBy(paintedAt: Tile | undefined, tile: Tile): Tile {
  return paintedAt ? [tile[0] - paintedAt[0], tile[1] - paintedAt[1]] : [0, 0];
}

/** How far, in cells, a painted thing's picture is drawn from where it is painted:
 * none on its painted cell; on another, so far that the middle of what is drawn of
 * it, `middle`, in the scene's cells, is the tile's middle (D109). */
export function drawnShift(paintedAt: Tile | undefined, tile: Tile, middle: [number, number]): [number, number] {
  if (!paintedAt || (paintedAt[0] === tile[0] && paintedAt[1] === tile[1])) return [0, 0];
  return [tile[0] + 0.5 - middle[0], tile[1] + 0.5 - middle[1]];
}
