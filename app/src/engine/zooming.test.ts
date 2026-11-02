import { describe, expect, it } from 'vitest';
import { steppedZoom, wheeledZoom, wordsScale } from './zooming';

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
});
