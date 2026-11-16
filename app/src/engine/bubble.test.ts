import { describe, expect, it } from 'vitest';
import { type Box, bubbleBelow, bubbleRoom, bubbleShift, bubbleWrap, readingMs, readingTicks, settleMs } from './bubble';

const box = (left: number, top: number, right: number, bottom: number): Box => ({ left, top, right, bottom });

describe('a speaker\'s bubble', () => {
  it('is at most a third of the scene wide, and otherwise as wide as the page asks', () => {
    expect(bubbleWrap(6, 12)).toBe(4);
    expect(bubbleWrap(6, 25)).toBe(6);
    expect(bubbleWrap(4, 20)).toBe(4);
  });

  it('stays inside the scene, and inside what a story step frames of it (D199)', () => {
    expect(bubbleRoom(768, null)).toEqual([0, 768]);
    // The shed framed on rows 3 to 10 of sixteen: no bubble under the frame's bottom.
    expect(bubbleRoom(768, [120, 560])).toEqual([120, 560]);
    // A frame wider than the scene shows its margin: the scene's own sides hold.
    expect(bubbleRoom(576, [-40, 620])).toEqual([0, 576]);
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

describe('the words read to their end (D175)', () => {
  it('stay 0.8 seconds and 50 thousandths for each character, three ticks at least', () => {
    expect(readingMs('Hola')).toBe(1000);
    expect(readingTicks('Hola', 400)).toBe(3);
    // The threshold's sentence, 58 characters: 3.7 seconds, ten ticks of 400.
    const sentence = 'No entres todavía: quédate en el umbral, pasada la puerta.';
    expect([...sentence]).toHaveLength(58);
    expect(readingMs(sentence)).toBe(3700);
    expect(readingTicks(sentence, 400)).toBeGreaterThanOrEqual(9);
    expect(readingTicks(sentence, 400)).toBeLessThanOrEqual(10);
  });

  it('settle when the last of them is read, at once with none, and never for ever', () => {
    expect(settleMs([], 1000)).toBe(0);
    expect(settleMs([1500, 4700], 1000)).toBe(3700);
    expect(settleMs([900], 1000)).toBe(0);
    expect(settleMs([Number.POSITIVE_INFINITY], 1000)).toBe(0);
    expect(settleMs([Number.POSITIVE_INFINITY, 2200], 1000)).toBe(1200);
  });
});
