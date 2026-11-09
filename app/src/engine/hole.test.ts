import { describe, expect, it } from 'vitest';
import { holeClosed, holeHeld } from './hole';

describe('holeClosed (D53, D167)', () => {
  it('is closed for its period and open for as long, from tick 0', () => {
    expect([0, 1, 2, 3, 4, 5].map((tick) => holeClosed(2, [], tick))).toEqual([
      true,
      true,
      false,
      false,
      true,
      true,
    ]);
  });

  it('is closed while it is held', () => {
    const holds = [{ from: 4, until: 10 }];
    expect([6, 7, 9, 10, 11].map((tick) => holeClosed(2, holds, tick))).toEqual([
      true,
      true,
      true,
      false,
      false,
    ]);
    expect([3, 4, 9, 10].map((tick) => holeHeld(holds, tick))).toEqual([false, true, true, false]);
  });
});
