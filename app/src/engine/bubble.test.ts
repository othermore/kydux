import { describe, expect, it } from 'vitest';
import { type Box, bubbleBelow, bubbleShift, bubbleWrap } from './bubble';

const box = (left: number, top: number, right: number, bottom: number): Box => ({ left, top, right, bottom });

describe('a speaker\'s bubble', () => {
  it('is at most a third of the scene wide, and otherwise as wide as the page asks', () => {
    expect(bubbleWrap(6, 12)).toBe(4);
    expect(bubbleWrap(6, 25)).toBe(6);
    expect(bubbleWrap(4, 20)).toBe(4);
  });

  const above = box(100, 0, 300, 80);
  const below = box(100, 120, 300, 200);

  it('goes above who speaks when it covers no one there', () => {
    expect(bubbleBelow(above, below, [box(400, 0, 440, 80)], true)).toBe(false);
  });

  it('goes below when above it would cover another figure, as in the first story', () => {
    expect(bubbleBelow(above, below, [box(180, 40, 220, 100)], true)).toBe(true);
  });

  it('stays above when it would cover someone on either side', () => {
    expect(bubbleBelow(above, below, [box(180, 40, 220, 100), box(180, 130, 220, 180)], true)).toBe(false);
  });

  it('goes below when there is no room above, whoever stands there', () => {
    expect(bubbleBelow(above, below, [box(180, 130, 220, 180)], false)).toBe(true);
  });

  it('moves to the nearer side that clears who it would cover, and stays in the scene', () => {
    const figure = box(150, 40, 190, 100);
    expect(bubbleShift(above, [figure], 800)).toBe(196 - 100);
    // Against the scene's right side it goes the other way.
    expect(bubbleShift(above, [box(250, 40, 290, 100)], 300)).toBe(250 - 6 - 300);
    expect(bubbleShift(above, [], 800)).toBe(0);
  });

  it('stays where it is when no side clears everyone', () => {
    expect(bubbleShift(box(0, 0, 200, 80), [box(90, 10, 110, 70)], 200)).toBe(0);
  });
});
