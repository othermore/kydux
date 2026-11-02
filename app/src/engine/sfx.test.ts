import { describe, expect, it } from 'vitest';
import { EFFECTS, pitched, STEP_LOWER, STEPS } from './sfx';

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
