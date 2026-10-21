import { describe, expect, it } from 'vitest';
import { layout } from './layout';

describe('layout', () => {
  it('says how each door opens (D43)', () => {
    const map = layout({
      id: 'doors',
      map: ['#######', '#SABCD#', '#######'],
      things: [
        { kind: 'door', id: 'a', marker: 'A' },
        { kind: 'door', id: 'b', marker: 'B', locked: true },
        { kind: 'door', id: 'c', marker: 'C', sealed: 'zelim' },
        { kind: 'door', id: 'd', marker: 'D', password: 'ambrel' },
      ],
    });
    expect(map.things.map((thing) => [thing.id, thing.lock])).toEqual([
      ['a', 'none'],
      ['b', 'key'],
      ['c', 'spell'],
      ['d', 'word'],
    ]);
  });

  it('lists the shelves, what is carried, and gives only a teacher sight (D46, D48, D49)', () => {
    const map = layout({
      id: 'library',
      map: ['######', '#S=.G#', '######'],
      carrying: ['wand'],
      actors: [{ kind: 'ghost', id: 'eldra', marker: 'G' }],
    });
    expect(map.shelves).toEqual([[2, 1]]);
    expect(map.carrying).toEqual(['wand']);
    expect(map.actors[0]?.sight).toBe(0);
  });
});
