import { describe, expect, it } from 'vitest';
import { drawnShift, shiftBy } from './shift';

describe('shiftBy', () => {
  it('is the cells between the painted cell and the level tile (D85)', () => {
    expect(shiftBy([11, 17], [3, 14])).toEqual([-8, -3]);
    expect(shiftBy([11, 17], [11, 17])).toEqual([0, 0]);
  });

  it('is none for a thing the painting places on its own tile only', () => {
    expect(shiftBy(undefined, [12, 14])).toEqual([0, 0]);
  });
});

describe('drawnShift (D109)', () => {
  it('lays a thing where a figure on a nudged tile stands (D105)', () => {
    const [dx, dy] = drawnShift([10, 7], [10, 3], [10.0, 7.5], -0.45);
    expect(dx).toBeCloseTo(0.05);
    expect(dy).toBeCloseTo(-4);
  });

  it('puts the middle of a moved thing on the middle of its tile', () => {
    // A book painted with its middle at 4.43, 10.85, laid on 2,15.
    const [dx, dy] = drawnShift([4, 11], [2, 15], [4.43, 10.85]);
    expect(4.43 + dx).toBeCloseTo(2.5);
    expect(10.85 + dy).toBeCloseTo(15.5);
  });

  it('leaves a thing on its painted cell as it is painted', () => {
    expect(drawnShift([4, 11], [4, 11], [4.43, 10.85])).toEqual([0, 0]);
    expect(drawnShift([4, 11], [4, 11], [4.43, 10.85], -0.45)).toEqual([0, 0]);
    expect(drawnShift(undefined, [2, 15], [4.43, 10.85])).toEqual([0, 0]);
  });
});

