import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SWAY_MS, Sway, type SwayClock } from './sway';

const clock: SwayClock = {
  every(ms, callback) {
    const timer = setInterval(callback, ms);
    return () => clearInterval(timer);
  },
};

describe('a floating figure sways while it stands (D120)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('goes standing, a step, standing, the other step, and on', () => {
    const shown: number[] = [];
    const sway = new Sway(clock, (step) => shown.push(step));
    sway.start();
    expect(shown).toEqual([1]);
    vi.advanceTimersByTime(1000);
    // Its frame changes within a second.
    expect(shown).toEqual([1, 0, 1]);
    vi.advanceTimersByTime(SWAY_MS * 3);
    expect(shown).toEqual([1, 0, 1, 2, 1, 0]);
  });

  it('stops for a walk and starts again from the standing frame', () => {
    const shown: number[] = [];
    const sway = new Sway(clock, (step) => shown.push(step));
    sway.start();
    vi.advanceTimersByTime(SWAY_MS);
    sway.stop();
    expect(sway.swaying).toBe(false);
    vi.advanceTimersByTime(SWAY_MS * 4);
    expect(shown).toEqual([1, 0]);
    sway.start();
    expect(shown.at(-1)).toBe(1);
    expect(sway.swaying).toBe(true);
  });
});
