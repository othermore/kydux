import { describe, expect, it } from 'vitest';
import {
  AFTER_BUMP_MS,
  type Box,
  bubbleBelow,
  bubbleMiddle,
  bubbleRoom,
  bubbleShift,
  bubbleTip,
  bubbleWrap,
  readingMs,
  readingTicks,
  settleMs,
  wordsOver,
} from './bubble';
import { FLY_LIFT, RING_RAISE } from './flight';

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

  it('is held in from the sides of the scene, and of what a framing shows of it (D199)', () => {
    // Over who speaks where there is room on both sides.
    expect(bubbleMiddle(900, 150, [0, 2016])).toBe(900);
    // By the scene's side, its half kept inside.
    expect(bubbleMiddle(60, 150, [0, 2016])).toBe(150);
    expect(bubbleMiddle(2000, 150, [0, 2016])).toBe(1866);
    // The finish under the race course's wide framing, which ends short of the scene's
    // right side: the friend's words, drawn larger zoomed out, end at the frame's.
    const sides = bubbleRoom(2016, [125, 1858]);
    expect(bubbleMiddle(1656, 277, sides)).toBe(1581);
    // Wider than what is shown: from its left side.
    expect(bubbleMiddle(400, 500, [100, 900])).toBe(600);
  });

  it('keeps its tail over who speaks where its box is held in or moved, at any scale', () => {
    // The box over who speaks: the tail at its middle.
    expect(bubbleTip(0, 1, 300)).toBe(0);
    // The box held 75 pixels of the scene to the left: the tip as far to the right.
    expect(bubbleTip(75, 1, 300)).toBe(75);
    // Drawn at 1.8, zoomed out: the same pixels of the scene are fewer of the box's own.
    expect(bubbleTip(75, 1.8, 300)).toBeCloseTo(41.67, 2);
    // Never on the box's round corners.
    expect(bubbleTip(400, 1, 300)).toBe(138);
    expect(bubbleTip(-400, 2, 300)).toBe(-138);
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

  it('stay as long where a tick is played in a third (D225): three times the ticks', () => {
    // A ring's wrong way, 60 characters: 3.8 seconds, 29 ticks of a third of 400.
    const thought = 'Este aro se cruza hacia arriba, desde abajo. ¡Así no cuenta!';
    expect(readingMs(thought)).toBe(3800);
    expect(readingTicks(thought, 400)).toBe(10);
    expect(readingTicks(thought, 400 / 3)).toBe(29);
  });

  it('settle when the last of them is read, at once with none, and never for ever', () => {
    expect(settleMs([], 1000)).toBe(0);
    expect(settleMs([1500, 4700], 1000)).toBe(3700);
    expect(settleMs([900], 1000)).toBe(0);
    expect(settleMs([Number.POSITIVE_INFINITY], 1000)).toBe(0);
    expect(settleMs([Number.POSITIVE_INFINITY, 2200], 1000)).toBe(1200);
  });
});

describe('words over a figure in the air (D237)', () => {
  // The scene's headroom: a figure's height, 1.02 cells, and 4 pixels, at 48 a cell.
  const headroom = 48 * 1.02 + 4;

  it('puts the words 1.10 cells over the feet on the ground, 1.60 in the air and 1.95 in a ring', () => {
    expect(wordsOver(headroom, 0, 48).toFixed(2)).toBe('1.10');
    expect(wordsOver(headroom, FLY_LIFT * 48, 48).toFixed(2)).toBe('1.60');
    expect(wordsOver(headroom, (FLY_LIFT + RING_RAISE) * 48, 48).toFixed(2)).toBe('1.95');
  });

  it('shows a thought about a bump half a second after it', () => {
    expect(AFTER_BUMP_MS).toBe(500);
  });
});
