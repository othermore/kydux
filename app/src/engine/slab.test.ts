import { describe, expect, it } from 'vitest';
import { slabHeld, slabInPlace } from './slab';

describe('slabInPlace (D53, D138)', () => {
  it('is in place for its period and away for as long, from tick 0', () => {
    expect([0, 1, 2, 3, 4, 5].map((tick) => slabInPlace(2, [], tick))).toEqual([
      true,
      true,
      false,
      false,
      true,
      true,
    ]);
  });

  it('is in place while it is held', () => {
    const holds = [{ from: 4, until: 10 }];
    expect([6, 7, 9, 10, 11].map((tick) => slabInPlace(2, holds, tick))).toEqual([
      true,
      true,
      true,
      false,
      false,
    ]);
    expect([3, 4, 9, 10].map((tick) => slabHeld(holds, tick))).toEqual([false, true, true, false]);
  });
});
