import { describe, expect, it } from 'vitest';
import { startFrame, steppedZoom, storyMiddle, wheeledZoom, wordsScale } from './zooming';

describe('the zoom (D106)', () => {
  it('steps the buttons through the zooms, from wherever the wheel left it', () => {
    expect(steppedZoom(1, 1)).toBe(1.5);
    expect(steppedZoom(1, -1)).toBe(0.75);
    expect(steppedZoom(1.2, -1)).toBe(1);
    expect(steppedZoom(1.2, 1)).toBe(1.5);
    expect(steppedZoom(2, 1)).toBeNull();
    expect(steppedZoom(0.5, -1)).toBeNull();
  });

  it('turns the zoom a little a notch of the wheel, within its limits', () => {
    expect(wheeledZoom(1, -100)).toBeCloseTo(1.1);
    expect(wheeledZoom(1, 100)).toBeCloseTo(1 / 1.1);
    // A long turn does at most a quarter more or less.
    expect(wheeledZoom(1, -1000)).toBeCloseTo(1.25);
    expect(wheeledZoom(1, 1000)).toBeCloseTo(0.8);
    expect(wheeledZoom(1.95, -100)).toBe(2);
    expect(wheeledZoom(0.52, 100)).toBe(0.5);
    // A delta in lines, as some browsers give it.
    expect(wheeledZoom(1, -3)).toBeCloseTo(1.1 ** 0.99);
  });

  it('draws the words larger zoomed out, never smaller on the screen than at 1', () => {
    expect(wordsScale(1)).toBe(1);
    expect(wordsScale(2)).toBe(1);
    expect(wordsScale(0.5)).toBe(2);
    expect(wordsScale(0.8)).toBeCloseTo(1.25);
  });

  it('frames the wizard and every actor at a level\'s start, zooming out no farther than it must', () => {
    // Near enough: the window stays on the wizard, at its zoom.
    expect(startFrame([[3, 5]], [2, 5], [15, 9], 1, 0.75)).toEqual({ zoom: 1, centre: null });
    // In the window's size but not round the wizard: on the middle of them, at its zoom.
    const off = startFrame([[9, 13]], [2, 5], [15, 11], 1, 0.75);
    expect(off.zoom).toBe(1);
    expect(off.centre).toEqual([6, 9]);
    // Too far for the window: out as far as it must.
    const far = startFrame([[18, 13]], [2, 2], [15, 9], 1, 0.5);
    expect(far.zoom).toBeCloseTo(9 / 13.8);
    // And no farther than the scene holds.
    expect(startFrame([[18, 13]], [2, 2], [15, 9], 1, 0.75).zoom).toBe(0.75);
  });

  it('never zooms in to frame them', () => {
    expect(startFrame([[3, 5]], [2, 5], [15, 9], 0.75, 0.5).zoom).toBe(0.75);
  });

  it('keeps a speaker whole when their words will not fit with them', () => {
    expect(storyMiddle(100, 300, 500, 48)).toBe(200);
    // Words and figure taller than the window: the figure's feet stay in it.
    expect(storyMiddle(100, 700, 500, 48)).toBe(498);
  });
});
