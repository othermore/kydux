import { describe, expect, it } from 'vitest';
import { curveAt, GUST_HIGH, GUST_LOW, gustPlan, levelAt, whistleLevel } from './sound';

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

  it('whistles at its peaks alone: a quarter of the highest level there, a quarter of that at the lowest peak', () => {
    expect(whistleLevel(GUST_HIGH)).toBeCloseTo(GUST_HIGH / 4);
    expect(whistleLevel(GUST_LOW)).toBeCloseTo(GUST_HIGH / 16);
    expect(whistleLevel(0)).toBe(0);
  });
});

describe('the level counted from the points given to the clock (D252)', () => {
  const points = [
    { at: 1, level: 0 },
    { at: 1.5, level: 0.04 },
    { at: 2, level: 0.02 },
  ];

  it('is on the straight line between the two points round a moment', () => {
    expect(levelAt(points, 1.25)).toBeCloseTo(0.02, 10);
    expect(levelAt(points, 1.75)).toBeCloseTo(0.03, 10);
  });

  it("is a point's own level on it, the first's before it and the last's after it", () => {
    expect(levelAt(points, 1.5)).toBe(0.04);
    expect(levelAt(points, 0.2)).toBe(0);
    expect(levelAt(points, 9)).toBe(0.02);
  });

  it('is 0 for a list with no point', () => {
    expect(levelAt([], 1)).toBe(0);
  });
});

describe("the rest's curve, by setTargetAtTime's own rule (D252)", () => {
  it('is its start at its start, and two thirds of the way after one time constant', () => {
    const curve = { from: 0.006, at: 1, targets: [{ level: 0, at: 1, constant: 0.05 }] };
    expect(curveAt(curve, 1)).toBe(0.006);
    expect(curveAt(curve, 1.05)).toBeCloseTo(0.006 * Math.exp(-1), 12);
  });

  it('holds its start until its first target begins, and goes on toward a second from where the first has come', () => {
    const curve = {
      from: 0.004,
      at: 1,
      targets: [
        { level: 0, at: 1, constant: 0.05 },
        { level: 0.006, at: 1.5, constant: 0.2 },
      ],
    };
    const atSecond = 0.004 * Math.exp(-0.5 / 0.05);
    expect(curveAt(curve, 1.5)).toBeCloseTo(atSecond, 12);
    expect(curveAt(curve, 1.7)).toBeCloseTo(0.006 + (atSecond - 0.006) * Math.exp(-1), 12);
    const later = { from: 0.002, at: 1, targets: [{ level: 0.006, at: 2, constant: 0.2 }] };
    expect(curveAt(later, 1.5)).toBe(0.002);
  });
});
