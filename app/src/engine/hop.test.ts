import { describe, expect, it } from 'vitest';
import { HOP_RISE, HOP_TICKS, hopAt, hopTop } from './hop';

describe('the hop into a bed (D130)', () => {
  it('leaves from the floor and lands on the lying point, highest at its middle', () => {
    const from: [number, number] = [100, 200];
    const to: [number, number] = [140, 120];
    expect(hopAt(from, to, 0, 30)).toEqual(from);
    const end = hopAt(from, to, 1, 30);
    expect(end[0]).toBeCloseTo(140);
    expect(end[1]).toBeCloseTo(120);
    const middle = hopAt(from, to, 0.5, 30);
    expect(middle[0]).toBeCloseTo(120);
    expect(middle[1]).toBeCloseTo(160 - 30);
    // Above the straight line all the way, rising fastest as it leaves the floor.
    for (const t of [0.1, 0.3, 0.7, 0.9]) expect(hopAt(from, to, t, 30)[1]).toBeLessThan(200 - 80 * t);
    expect(160 - 30 - hopAt(from, to, 0.25, 30)[1]).toBeLessThan(hopAt(from, to, 0, 30)[1] - hopAt(from, to, 0.25, 30)[1]);
  });

  it('takes the lying frame at its top, and lasts most of a tick', () => {
    expect(hopTop(0.49)).toBe(false);
    expect(hopTop(0.5)).toBe(true);
    expect(HOP_TICKS).toBeLessThan(1);
    expect(HOP_RISE).toBeCloseTo(0.35);
  });
});
