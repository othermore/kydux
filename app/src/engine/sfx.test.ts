import { describe, expect, it } from 'vitest';
import { EFFECTS } from './sfx';

describe("every figure's steps (D132)", () => {
  it('has two steps: the wizard’s, quieter and of its own timbre, and every other figure’s', () => {
    const { step, step_other: other } = EFFECTS;
    expect(step.volume).toBeLessThan(other.volume);
    expect(step.wave).not.toBe(other.wave);
    // Both are short and low, under the scene's other sounds.
    for (const effect of [step, other]) {
      expect(effect.seconds).toBeLessThanOrEqual(0.08);
      expect(effect.volume).toBeLessThan(EFFECTS.bump.volume);
    }
  });
});
