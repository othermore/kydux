import { describe, expect, it } from 'vitest';
import { layout } from './layout';

describe('what a level of chapter 3 tells the page', () => {
  const on = {
    map: ['S.E'],
    goals: [{ kind: 'reach', marker: 'E', hidden: true }],
    enchanted: [[1, 0, 2, 0]],
    actors: [{ kind: 'teacher', id: 'dask', at: [1, 0], facing: 'left' }],
    ways: [{ id: 'one' }, { id: 'two', actors: [{ id: 'dask', at: [2, 0], facing: 'right' }] }],
  };

  it('draws no mark for a hidden reach (D134)', () => {
    expect(layout({ map: ['S.E'], goals: [{ kind: 'reach', marker: 'E' }] }).markers).toEqual([['E', [2, 0]]]);
    expect(layout(on).markers).toEqual([]);
  });

  it('gives the enchanted cells (D135)', () => {
    expect(layout(on).enchanted).toEqual([
      [1, 0],
      [2, 0],
    ]);
  });

  it('gives where a way puts an actor and which way it turns it (D51, D137)', () => {
    expect(layout(on).ways.two).toEqual({ dask: [2, 0] });
    expect(layout(on).wayFacings.two).toEqual({ dask: 'right' });
  });
});

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

  it('draws a thing carried with a picture from it, in the hands from the start (D123)', () => {
    const map = layout({
      id: 'in-hand',
      map: ['#####', '#S.G#', '#####'],
      carrying: ['wand', { kind: 'book', art: 'old_book' }],
    });
    expect(map.carrying).toEqual(['wand', 'book']);
    expect(map.things).toEqual([
      { id: 'book', kind: 'book', tile: [1, 1], lock: 'none', open: false, art: 'old_book', carried: true },
    ]);
  });

  it("keeps where each way puts the things and actors it moves (D51, D85)", () => {
    const map = layout({
      id: 'ways',
      map: ['#######', '#S..K.#', '#######'],
      things: [{ kind: 'key', id: 'key', marker: 'K' }],
      actors: [{ kind: 'ghost', id: 'eldra', at: [5, 1] }],
      ways: [
        { id: 'near', things: [{ id: 'key', at: [2, 1] }] },
        { id: 'far', things: [{ id: 'key', at: [5, 1] }], actors: [{ id: 'eldra', at: [3, 1] }] },
      ],
    });
    expect(map.ways).toEqual({ near: { key: [2, 1] }, far: { key: [5, 1], eldra: [3, 1] } });
    expect(map.things[0]?.tile).toEqual([4, 1]);
  });

  it('keeps the bed an actor lies asleep in, and the tile it gets up on (D91)', () => {
    const map = layout({
      id: 'room',
      map: ['#####', '#S..#', '#####'],
      things: [{ kind: 'bed', id: 'bed_1', at: [3, 1] }],
      actors: [
        { kind: 'friend', id: 'mate', at: [2, 1], asleep: 'bed_1' },
        { kind: 'friend', id: 'nuri', at: [1, 1] },
      ],
    });
    expect(map.actors.map((actor) => [actor.id, actor.tile, actor.asleep])).toEqual([
      ['mate', [2, 1], 'bed_1'],
      ['nuri', [1, 1], undefined],
    ]);
  });
});

describe('chapter 4 in the layout', () => {
  it('hides or shows a broom by the way that moves it onto the straw or off it (D202)', () => {
    const level = {
      id: 'shed',
      map: ['S....'],
      things: [{ kind: 'broom', id: 'broom_3', at: [1, 0], hidden: true }],
      ways: [{ id: 'a' }, { id: 'b', things: [{ id: 'broom_3', at: [3, 0], hidden: false }] }],
    };
    const shaped = layout(level);
    expect(shaped.wayHidden).toEqual({ a: {}, b: { broom_3: false } });
    expect(shaped.things[0]?.hidden).toBe(true);
  });

  it('reads the low cells, the hidden things and the race with its path walked out (D184, D186, D189, D220)', () => {
    const level = {
      id: 'race',
      map: ['S.~..', '.....'],
      things: [{ kind: 'broom', id: 'broom_1', at: [1, 1], hidden: true }],
      actors: [{ kind: 'racer', id: 'zarek', at: [0, 1] }],
      race: { against: 'zarek', lines: 3, path: [[2, 1], [4, 1], [4, 0]], rings: [], finish: [4, 0] },
    };
    const shaped = layout(level);
    expect(shaped.low).toEqual([[2, 0]]);
    expect(shaped.terrain[0]?.[2]).toBe('low');
    expect(shaped.things[0]?.hidden).toBe(true);
    expect(shaped.race).toEqual({
      against: 'zarek',
      lines: 3,
      path: [[1, 1], [2, 1], [3, 1], [4, 1], [4, 0]],
      finish: [4, 0],
    });
  });
});
