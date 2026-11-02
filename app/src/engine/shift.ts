// Where a painted thing is drawn when a level places it on another tile than the
// one it is painted on (D85): a key behind an armchair, a key in a different
// place in each way of a level, a book drawn on a lower shelf. Kept apart from
// painted.ts so that it is tested without Phaser.

import type { Tile } from './sight';

/** How many cells a painted thing is drawn away from where it is painted: the
 * level's tile less the painted cell, none when the painting does not say. */
export function shiftBy(paintedAt: Tile | undefined, tile: Tile): Tile {
  return paintedAt ? [tile[0] - paintedAt[0], tile[1] - paintedAt[1]] : [0, 0];
}
