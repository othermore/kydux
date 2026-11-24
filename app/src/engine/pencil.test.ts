import { describe, expect, it } from 'vitest';
import { pencilOf } from './pencil';

describe("the pencil of a scene's grid (D337)", () => {
  it('is the common one where the scene names none', () => {
    expect(pencilOf()).toEqual({ colour: 0x3b2f1e, breath: [0.18, 0.32] });
    expect(pencilOf({})).toEqual(pencilOf());
  });

  it("takes the scene's colour and draws at its strength", () => {
    const { colour, breath } = pencilOf({ colour: '#fff1cf', strength: 2 });
    expect(colour).toBe(0xfff1cf);
    expect(breath[0]).toBeCloseTo(0.36);
    expect(breath[1]).toBeCloseTo(0.64);
  });

  it('takes either alone', () => {
    expect(pencilOf({ colour: '#ffffff' })).toEqual({ colour: 0xffffff, breath: [0.18, 0.32] });
    expect(pencilOf({ strength: 1.5 }).colour).toBe(0x3b2f1e);
    expect(pencilOf({ strength: 1.5 }).breath[1]).toBeCloseTo(0.48);
  });

  it('never goes past opaque, and still breathes below it', () => {
    expect(pencilOf({ strength: 4 }).breath).toEqual([0.72, 1]);
    expect(pencilOf({ strength: 10 }).breath).toEqual([1, 1]);
  });
});
