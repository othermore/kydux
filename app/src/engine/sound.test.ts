import { describe, expect, it } from 'vitest';
import { GUST_HIGH, gustPlan } from './sound';

/** A random that gives the same numbers every time, from a seed. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

describe('a gust for each flown command (D243)', () => {
  it('starts at 0 and ends at 0, and is never over its highest', () => {
    const plan = gustPlan(2, seeded(7));
    expect(plan[0]).toEqual({ at: 0, level: 0 });
    expect(plan[plan.length - 1]?.level).toBe(0);
    expect(Math.max(...plan.map((point) => point.level))).toBeLessThanOrEqual(GUST_HIGH);
  });

  it('peaks once, and changes its level every eighth to a third of a second after the rise', () => {
    const plan = gustPlan(2, seeded(11));
    const peak = Math.max(...plan.map((point) => point.level));
    expect(plan.filter((point) => point.level === peak)).toHaveLength(1);
    // The rise, then the targets up to the command's end, then its fall.
    const targets = plan.slice(1, plan.findIndex((point) => point.at >= 2));
    for (let i = 1; i < targets.length; i += 1) {
      const gap = (targets[i]?.at ?? 0) - (targets[i - 1]?.at ?? 0);
      expect(gap).toBeGreaterThanOrEqual(0.12);
      expect(gap).toBeLessThanOrEqual(0.3);
    }
    expect(targets.length).toBeGreaterThan(4);
  });

  it('falls after the command, in 0.45 to 0.7 seconds', () => {
    const plan = gustPlan(1, seeded(3));
    const [held, end] = plan.slice(-2);
    expect(held?.at).toBe(1);
    expect((end?.at ?? 0) - (held?.at ?? 0)).toBeGreaterThanOrEqual(0.45);
    expect((end?.at ?? 0) - (held?.at ?? 0)).toBeLessThanOrEqual(0.7);
  });

  it('is the rise and the fall alone for a one-cell command', () => {
    const plan = gustPlan(0.133, seeded(5));
    // From 0, the rise, held to the command's end, and the fall.
    expect(plan.map((point) => point.at > 0 && point.level > 0)).toEqual([false, true, true, false]);
    expect(plan[1]?.at).toBeCloseTo(0.06);
  });

  it('is never the same twice', () => {
    expect(gustPlan(2, seeded(1))).not.toEqual(gustPlan(2, seeded(2)));
  });
});
