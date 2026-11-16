import { describe, expect, it } from 'vitest';
import { type Effect, EFFECTS, pitched, STEP_LOWER, STEPS } from './sfx';

describe("every figure's steps (D132)", () => {
  it('has three steps, taps of filtered noise: the wizard’s the shortest and quietest, the grown-ups’ the lowest', () => {
    const [wizard, child, adult] = STEPS.map((name) => EFFECTS[name]);
    for (const step of [wizard!, child!, adult!]) {
      expect(step.wave).toBe('noise');
      expect(step.seconds).toBeLessThanOrEqual(0.15);
      expect(step.volume).toBeLessThan(EFFECTS.bump.volume);
    }
    expect(wizard!.seconds).toBeLessThan(child!.seconds);
    expect(wizard!.volume).toBeLessThan(child!.volume);
    expect(child!.seconds).toBeLessThan(adult!.seconds);
    expect(adult!.from).toBeLessThan(child!.from);
    expect(adult!.from).toBeLessThan(wizard!.from);
  });

  it('plays every other step a little lower, so that a walk does not tick like a clock', () => {
    const lower = pitched(EFFECTS.step, STEP_LOWER);
    expect(STEP_LOWER).toBeLessThan(1);
    expect(lower.from).toBeCloseTo(EFFECTS.step.from * STEP_LOWER);
    expect(lower.to).toBeCloseTo(EFFECTS.step.to * STEP_LOWER);
    expect(lower.seconds).toBe(EFFECTS.step.seconds);
  });
});

describe("the wizard's lift (D244)", () => {
  it('lifts with air that rises and is gone, as a thing struck', () => {
    const lift: Effect = EFFECTS.lift;
    expect(lift.wave).toBe('noise');
    expect(lift.to).toBeGreaterThan(lift.from);
  });

  it('has no landing of its own: the landing is the wind switched off (D255)', () => {
    expect('set_down' in EFFECTS).toBe(false);
  });
});
