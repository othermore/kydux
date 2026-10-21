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
});
