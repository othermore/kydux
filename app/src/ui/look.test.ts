import { describe, expect, it } from 'vitest';
import { clampSplit, FIT_MIN, fitOf, SPLIT_MAX, SPLIT_MIN, splitAt } from './look';

describe('the split', () => {
  it('keeps a share inside its range', () => {
    expect(clampSplit(0.5)).toBe(0.5);
    expect(clampSplit(0.1)).toBe(SPLIT_MIN);
    expect(clampSplit(0.9)).toBe(SPLIT_MAX);
    expect(clampSplit(SPLIT_MIN)).toBe(SPLIT_MIN);
    expect(clampSplit(SPLIT_MAX)).toBe(SPLIT_MAX);
  });

  it('reads a share that is not a number as the default', () => {
    expect(clampSplit(Number.NaN)).toBe(0.6);
    expect(clampSplit(Number.POSITIVE_INFINITY)).toBe(0.6);
  });

  it('turns a pointer into a share of the box', () => {
    expect(splitAt(600, 100, 1000)).toBeCloseTo(0.5);
    expect(splitAt(100, 100, 1000)).toBe(SPLIT_MIN);
    expect(splitAt(1100, 100, 1000)).toBe(SPLIT_MAX);
    expect(splitAt(500, 100, 0)).toBe(0.6);
  });
});

describe('the fit of a low window (D359)', () => {
  it('draws the page at its full size from 1024 by 700 up, the smallest window the game is made for', () => {
    expect(fitOf(1024, 700)).toBe(1);
    expect(fitOf(1100, 700)).toBe(1);
    expect(fitOf(1280, 800)).toBe(1);
    expect(fitOf(1920, 1080)).toBe(1);
  });

  it('draws it smaller as the window is narrower or lower, by the tighter of the two', () => {
    expect(fitOf(960, 700)).toBeCloseTo(960 / 1024, 3);
    expect(fitOf(1280, 630)).toBeCloseTo(0.9, 3);
    expect(fitOf(900, 600)).toBeCloseTo(600 / 700, 3);
    expect(fitOf(860, 650)).toBeCloseTo(860 / 1024, 3);
  });

  it('never smaller than its least', () => {
    expect(fitOf(860, 480)).toBe(FIT_MIN);
    expect(fitOf(1024, 400)).toBe(FIT_MIN);
  });

  it('leaves a phone or a tablet, and a window not measured, at its size', () => {
    expect(fitOf(800, 600)).toBe(1);
    expect(fitOf(390, 844)).toBe(1);
    expect(fitOf(0, 0)).toBe(1);
    expect(fitOf(Number.NaN, 600)).toBe(1);
  });
});
