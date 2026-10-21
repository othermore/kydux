// What an actor sees: up to its sight straight ahead, stopping before the
// first tile that is not clear (a wall, a closed door, the map's edge). The
// same rule as kydux_world.actors.sight_tiles; tests/fixtures/sight.json holds
// the cases both are tested on.

export type Tile = [number, number];
export type Facing = 'up' | 'down' | 'left' | 'right';

const DELTAS: Record<Facing, Tile> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

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
