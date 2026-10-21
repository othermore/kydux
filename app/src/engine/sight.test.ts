import { describe, expect, it } from 'vitest';
import fixture from '../../../tests/fixtures/sight.json';
import { type Facing, sightTiles, type Tile } from './sight';

describe('sightTiles', () => {
  it.each(fixture.cases)('$name', (c) => {
    const rows = fixture.map;
    const closed = new Set(c.closed.map(([x, y]) => `${x},${y}`));
    const clear = ([x, y]: Tile) =>
      y >= 0 && y < rows.length && x >= 0 && x < (rows[0]?.length ?? 0) &&
      rows[y]?.[x] !== '#' && !closed.has(`${x},${y}`);
    expect(sightTiles(clear, c.from as Tile, c.facing as Facing, c.sight)).toEqual(c.tiles);
  });
});
