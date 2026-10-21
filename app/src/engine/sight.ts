// What an actor sees: up to its sight straight ahead, stopping before the
// first tile that is not clear (a wall, a closed door, the map's edge); a
// shelf is clear (D46). The same rule as kydux_world.actors.sight_tiles and
// Level.clear; tests/fixtures/sight.json holds the cases both are tested on.

export type Tile = [number, number];
export type Facing = 'up' | 'down' | 'left' | 'right';

const DELTAS: Record<Facing, Tile> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

/** Whether sight passes a tile of the map: inside it, not a wall, not `shut`
 * (a closed door). A shelf, `=`, is passed. */
export function clearOf(rows: readonly string[], shut: (tile: Tile) => boolean): (tile: Tile) => boolean {
  return ([x, y]) => {
    const row = rows[y];
    if (!row || x < 0 || x >= row.length || row[x] === '#') return false;
    return !shut([x, y]);
  };
}

export function sightTiles(
  clear: (tile: Tile) => boolean,
  from: Tile,
  facing: Facing,
  sight: number,
): Tile[] {
  const [dx, dy] = DELTAS[facing];
  const tiles: Tile[] = [];
  let [x, y] = from;
  for (let step = 0; step < sight; step += 1) {
    x += dx;
    y += dy;
    if (!clear([x, y])) break;
    tiles.push([x, y]);
  }
  return tiles;
}
