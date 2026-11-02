import { describe, expect, it } from 'vitest';
import { shiftBy } from './shift';

describe('shiftBy', () => {
  it('is the cells between the painted cell and the level tile (D85)', () => {
    expect(shiftBy([11, 17], [3, 14])).toEqual([-8, -3]);
    expect(shiftBy([11, 17], [11, 17])).toEqual([0, 0]);
  });

  it('is none for a thing the painting places on its own tile only', () => {
    expect(shiftBy(undefined, [12, 14])).toEqual([0, 0]);
  });
});
