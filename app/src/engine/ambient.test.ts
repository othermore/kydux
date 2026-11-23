import { describe, expect, it } from 'vitest';
import { drillStep, nextTry, sameTry, type Try } from './ambient';

const KINDS = { Fox: ['red', 'white', 'black'], Crow: ['black', 'white'], Frog: ['green', 'red'] };

/** A random number that gives the values asked, one after another, then 0.5. */
function given(...values: number[]): () => number {
  return () => values.shift() ?? 0.5;
}

describe("the room-mate's tries (D300)", () => {
  it('is the spark about one time in three, else a kind pale or in one of its colours', () => {
    expect(nextTry(KINDS, null, given(0.1))).toEqual({ look: 'spark', kind: null, color: null });
    expect(nextTry(KINDS, null, given(0.5, 0.0, 0.0))).toEqual({ look: 'good', kind: 'Fox', color: 'red' });
    expect(nextTry(KINDS, null, given(0.5, 0.0, 0.99))).toEqual({ look: 'pale', kind: 'Fox', color: null });
    expect(nextTry(KINDS, null, given(0.9, 0.99, 0.5))).toEqual({ look: 'good', kind: 'Frog', color: 'red' });
  });

  it('never shows the same picture twice running', () => {
    const spark: Try = { look: 'spark', kind: null, color: null };
    expect(nextTry(KINDS, spark, given(0.1, 0.5, 0.0, 0.0))).toEqual({ look: 'good', kind: 'Fox', color: 'red' });
    let previous: Try | null = null;
    let seed = 7;
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    for (let i = 0; i < 200; i += 1) {
      const found = nextTry(KINDS, previous, random);
      expect(sameTry(previous, found)).toBe(false);
      previous = found;
    }
  });

  it('is the spark with no kind to choose from', () => {
    expect(nextTry({}, null, given(0.9))).toEqual({ look: 'spark', kind: null, color: null });
  });
});

describe("the friend's orders round her loop (D300)", () => {
  const loop: [number, number][] = [
    [8, 6],
    [9, 6],
    [9, 7],
    [9, 8],
    [8, 8],
    [8, 7],
  ];

  it("steps from the hare's own cell round the loop and back to it, again and again", () => {
    const steps = Array.from({ length: 8 }, (_, i) => drillStep(loop, [8, 7], i));
    expect(steps.map((step) => step.to)).toEqual([...loop, [8, 6], [9, 6]]);
    expect(steps.map((step) => step.way)).toEqual(['up', 'right', 'down', 'down', 'left', 'up', 'up', 'right']);
    expect(steps[0]).toEqual({ from: [8, 7], to: [8, 6], way: 'up', key: 'ambient.move_up' });
  });
});
