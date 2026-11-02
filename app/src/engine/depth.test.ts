import { describe, expect, it } from 'vitest';
import {
  coverDepth,
  FOOT_IN_CELL,
  figureDepth,
  loweredBy,
  overDepth,
  rowDepth,
  sleeperDepth,
  thingDepth,
} from './depth';

describe('the depths of a painted scene (D76, D95)', () => {
  it('draws a row over the figures above it and under the figure standing on it', () => {
    expect(rowDepth(8)).toBeGreaterThan(figureDepth(7 + FOOT_IN_CELL));
    expect(rowDepth(8)).toBeLessThan(figureDepth(8 + FOOT_IN_CELL));
  });

  it('draws a door or its arch over the figure in its doorway, under the row below', () => {
    // The wizard is drawn a little over a figure on the same row.
    expect(rowDepth(8, true)).toBeGreaterThan(figureDepth(8 + FOOT_IN_CELL) + 0.0005);
    expect(rowDepth(8, true) + 0.001).toBeLessThan(figureDepth(9 + FOOT_IN_CELL));
    expect(rowDepth(8, true) + 0.001).toBeLessThan(rowDepth(9));
  });

  it('draws a shut door over the figure in its doorway, and an open one under them', () => {
    const standing = figureDepth(8 + FOOT_IN_CELL);
    expect(thingDepth(8, true, false)).toBeGreaterThan(standing);
    expect(thingDepth(8, true, true)).toBeLessThan(standing);
    expect(thingDepth(8, true, true)).toBeGreaterThan(figureDepth(7 + FOOT_IN_CELL));
  });

  it('draws a wall seen from above over every figure of the scene', () => {
    expect(overDepth(24)).toBeGreaterThan(figureDepth(24 + FOOT_IN_CELL + 0.5) + 0.0005);
  });

  it('lays a sleeper over its bed and under its quilt, under a figure on the bed’s row (D97)', () => {
    expect(sleeperDepth(6)).toBeGreaterThan(rowDepth(6));
    expect(coverDepth(6)).toBeGreaterThan(sleeperDepth(6));
    expect(coverDepth(6)).toBeLessThan(figureDepth(6 + FOOT_IN_CELL));
  });

  it('lowers a figure only on the cells a scene names', () => {
    const lowered = [{ cells: [[10, 4], [14, 4]] as [[number, number], [number, number]], by: 0.5 }];
    expect(loweredBy(lowered, [12, 4])).toBe(0.5);
    expect(loweredBy(lowered, [12, 5])).toBe(0);
    expect(loweredBy(undefined, [12, 4])).toBe(0);
    // Drawn lower, the keeper behind a counter on the row below is behind it.
    expect(figureDepth(4 + FOOT_IN_CELL + 0.5)).toBeLessThan(rowDepth(5));
  });
});
