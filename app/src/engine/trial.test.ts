import { describe, expect, it } from 'vitest';
import {
  blurred,
  goodTrial,
  type Pixels,
  paleTrial,
  spread,
  TRIAL_FADE_MS,
  TRIAL_SEEN_MS,
  TRIAL_STAGED_SEEN_MS,
  trialLeft,
  trialLines,
  trialSheet,
  trialShown,
  trialTime,
} from './trial';

/** A figure on a frame: a white body with a dark outline, on nothing. */
function figure(width = 40, height = 40, colour: [number, number, number] = [250, 250, 250]): Pixels {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 10; y < 30; y += 1) {
    for (let x = 10; x < 30; x += 1) {
      const edge = x === 10 || x === 29 || y === 10 || y === 29;
      const [r, g, b] = edge ? [20, 20, 20] : colour;
      data.set([r, g, b, 255], (y * width + x) * 4);
    }
  }
  return { width, height, data };
}

const alphaAt = (pixels: Pixels, x: number, y: number) => pixels.data[(y * pixels.width + x) * 4 + 3] ?? 0;

describe('a trial drawn from the figure (D263)', () => {
  it('with its colour is the whole figure, half transparent, with an edge of light round it', () => {
    const made = goodTrial(figure(40, 40, [200, 30, 30]), 96);
    // The body is whole, its colour washed with the light under it: a red creature is
    // still red, lighter.
    const at = (20 * 40 + 20) * 4;
    expect(alphaAt(made, 20, 20)).toBe(255);
    expect(made.data[at]).toBeGreaterThan(200);
    expect(made.data[at + 1]).toBeGreaterThan(60);
    expect(made.data[at + 1]).toBeLessThan(made.data[at] ?? 0);
    // Outside the figure, its light.
    expect(alphaAt(made, 8, 20)).toBeGreaterThan(0);
    expect(alphaAt(made, 0, 0)).toBeLessThan(alphaAt(made, 8, 20));
  });

  it('with no colour is the lines alone: the inside seen through, the edge drawn', () => {
    const made = paleTrial(figure(), 96);
    const inside = alphaAt(made, 20, 20);
    const edge = alphaAt(made, 10, 20);
    expect(edge).toBeGreaterThan(200);
    // A white creature's trial is full where the pale one is all but empty.
    expect(inside).toBeLessThan(alphaAt(goodTrial(figure(), 96), 20, 20) / 2);
    const lines = trialLines(figure(), 96);
    expect(lines[20 * 40 + 20]).toBe(0);
    expect(lines[20 * 40 + 10]).toBe(1);
  });

  it('is drawn frame by frame, each frame within its bounds', () => {
    const sheet: Pixels = { width: 80, height: 40, data: new Uint8ClampedArray(80 * 40 * 4) };
    const one = figure();
    for (let y = 0; y < 40; y += 1) {
      sheet.data.set(one.data.subarray(y * 160, y * 160 + 160), y * 320);
      sheet.data.set(one.data.subarray(y * 160, y * 160 + 160), y * 320 + 160);
    }
    const made = trialSheet(sheet, [40, 40], 96, true);
    expect(alphaAt(made, 10, 20)).toBe(alphaAt(made, 50, 20));
  });

  it('spreads and blurs as the trials were drawn', () => {
    const plane = new Float32Array(25);
    plane[12] = 1;
    expect(Array.from(spread(plane, 5, 5, 3)).filter((v) => v === 1)).toHaveLength(9);
    expect(Array.from(spread(spread(plane, 5, 5, 3), 5, 5, 3, true)).filter((v) => v === 1)).toHaveLength(1);
    const soft = blurred(plane, 5, 5, 1);
    expect(soft[12]).toBeLessThan(1);
    expect(soft[11]).toBeGreaterThan(0);
  });
});

describe("a trial that does not hold, by the page's clock (D276, D285)", () => {
  /** The milliseconds a trial has left after `ms` of the page's clock at `speed`, in frames of 16. */
  const after = (staged: boolean, ms: number, speed: number) => {
    let left = trialTime(staged);
    for (let spent = 0; spent < ms; spent += 16) left = trialLeft(left, Math.min(16, ms - spent), speed, staged);
    return left;
  };

  it('staged with no colour, is whole at nine seconds after the card at speed 4 and gone at eleven and a quarter', () => {
    expect(trialTime(true)).toBe(TRIAL_STAGED_SEEN_MS + TRIAL_FADE_MS);
    expect(trialShown(after(true, 9_000, 4))).toBe(1);
    expect(trialShown(after(true, 10_500, 4))).toBeCloseTo(0.5);
    expect(after(true, 11_250, 4)).toBeLessThanOrEqual(0);
    expect(trialShown(after(true, 11_250, 4))).toBe(0);
  });

  it('called in a run, is gone in a second and a quarter at speed 4, and in five at the normal speed', () => {
    expect(trialTime(false)).toBe(TRIAL_SEEN_MS + TRIAL_FADE_MS);
    expect(trialShown(after(false, 900, 4))).toBe(1);
    expect(after(false, 1_250, 4)).toBeLessThanOrEqual(0);
    expect(trialShown(after(false, 4_000, 1))).toBe(1);
    expect(after(false, 5_000, 1)).toBeLessThanOrEqual(0);
  });
});
