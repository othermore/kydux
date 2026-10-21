import { describe, expect, it } from 'vitest';
import fixture from '../../../tests/fixtures/sight.json';
import { clearOf, type Facing, sightTiles, type Tile } from './sight';

describe('sightTiles', () => {
  it.each(fixture.cases)('$name', (c) => {
    const closed = new Set(c.closed.map(([x, y]) => `${x},${y}`));
    const clear = clearOf(fixture.map, ([x, y]) => closed.has(`${x},${y}`));
    expect(sightTiles(clear, c.from as Tile, c.facing as Facing, c.sight)).toEqual(c.tiles);
  });
});
