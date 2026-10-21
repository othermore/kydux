import { describe, expect, it } from 'vitest';
import { clampSplit, SPLIT_MAX, SPLIT_MIN, splitAt } from './look';

describe('the split', () => {
  it('keeps a share inside its range', () => {
    expect(clampSplit(0.5)).toBe(0.5);
    expect(clampSplit(0.1)).toBe(SPLIT_MIN);
    expect(clampSplit(0.9)).toBe(SPLIT_MAX);
    expect(clampSplit(SPLIT_MIN)).toBe(SPLIT_MIN);
    expect(clampSplit(SPLIT_MAX)).toBe(SPLIT_MAX);
  });

  it('reads a share that is not a number as the middle', () => {
    expect(clampSplit(Number.NaN)).toBeCloseTo(0.55);
    expect(clampSplit(Number.POSITIVE_INFINITY)).toBeCloseTo(0.55);
  });

  it('turns a pointer into a share of the box', () => {
    expect(splitAt(600, 100, 1000)).toBeCloseTo(0.5);
    expect(splitAt(100, 100, 1000)).toBe(SPLIT_MIN);
    expect(splitAt(1100, 100, 1000)).toBe(SPLIT_MAX);
    expect(splitAt(500, 100, 0)).toBeCloseTo(0.55);
  });
});
