import { describe, expect, it } from 'vitest';
import {
  coverDepth,
  FOOT_IN_CELL,
  figureDepth,
  loweredBy,
  MARK_DEPTH,
  markDepthIn,
  nudgedBy,
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
    expect(thingDepth(8, { under: true })).toBeGreaterThan(standing);
    expect(thingDepth(8, { under: true, open: true })).toBeLessThan(standing);
    expect(thingDepth(8, { under: true, open: true })).toBeGreaterThan(figureDepth(7 + FOOT_IN_CELL));
  });

  it('draws a thing lying inside furniture under its row, a thing on the floor over it', () => {
    expect(thingDepth(14, { inside: true })).toBeLessThan(rowDepth(14));
    expect(thingDepth(14)).toBeGreaterThan(rowDepth(14));
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

  it('nudges a figure sideways only on the cells a scene names (D105)', () => {
    const nudged = [{ cells: [[16, 5], [16, 6]] as [[number, number], [number, number]], by: -0.4 }];
    expect(nudgedBy(nudged, [16, 6])).toBe(-0.4);
    expect(nudgedBy(nudged, [16, 7])).toBe(0);
    expect(nudgedBy(undefined, [16, 6])).toBe(0);
  });

  it('lays the goal\'s mark on the ground, under every row, thing and figure (D160)', () => {
    // Under the arch of its own row, the figure standing on it and the row above's things.
    expect(MARK_DEPTH).toBeLessThan(rowDepth(0));
    expect(MARK_DEPTH).toBeLessThan(rowDepth(1, true));
    expect(MARK_DEPTH).toBeLessThan(figureDepth(FOOT_IN_CELL - 1));
    expect(MARK_DEPTH).toBeLessThan(thingDepth(0, { lying: true }));
    // Over the floor's own pictures: a hole is drawn at 2.8.
    expect(MARK_DEPTH).toBeGreaterThan(2.8);
  });

  it('lays the mark in an open doorway over the door\'s open picture, under who stands there (D172)', () => {
    const open = thingDepth(6, { under: true, open: true });
    const inDoorway = markDepthIn(open);
    // Over the open picture, the doorway's floor, and its row's own image.
    expect(inDoorway).toBeGreaterThan(open);
    expect(inDoorway).toBeGreaterThan(rowDepth(6));
    // Under the figure standing in the doorway, and the next row's things.
    expect(inDoorway).toBeLessThan(figureDepth(6 + FOOT_IN_CELL));
    expect(inDoorway).toBeLessThan(rowDepth(7));
    // A shut door's picture is over the figure in its doorway, and over the mark too.
    expect(thingDepth(6, { under: true })).toBeGreaterThan(inDoorway);
  });

  it('lays a key under its row\'s things, a torch on its row over it, a figure above under it (D164)', () => {
    expect(thingDepth(7, { lying: true })).toBeLessThan(rowDepth(7));
    expect(thingDepth(7, { lying: true })).toBeGreaterThan(figureDepth(6 + FOOT_IN_CELL));
    expect(thingDepth(7, { lying: true })).toBeLessThan(figureDepth(7 + FOOT_IN_CELL));
  });
});
