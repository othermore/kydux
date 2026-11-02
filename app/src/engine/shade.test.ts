import { describe, expect, it } from 'vitest';
import { type Dark, shadeAt, tintOf } from './shade';

const dark: Dark = [{ columns: [13, 14], from: 7.8, to: 6.8, most: 0.9 }];

describe('the dark of a passage (the owner, 2026-10-28)', () => {
  it('leaves a figure outside the passage as it is', () => {
    expect(shadeAt(dark, [12.5, 6.8])).toEqual([0, 0]);
    expect(shadeAt(dark, [13.5, 8.8])).toEqual([0, 0]);
    expect(shadeAt(undefined, [13.5, 6.8])).toEqual([0, 0]);
  });

  it('darkens a figure the deeper it goes, its head more than its feet', () => {
    const [head, feet] = shadeAt(dark, [13.5, 7.3]);
    expect(feet).toBeCloseTo(0.45);
    expect(head).toBeGreaterThan(feet);
    expect(shadeAt(dark, [14.5, 6.8])).toEqual([0.9, 0.9]);
    expect(shadeAt(dark, [14.5, 5.8])).toEqual([0.9, 0.9]);
  });

  it('tints by the shade, white for none and black for all', () => {
    expect(tintOf(0)).toBe(0xffffff);
    expect(tintOf(1)).toBe(0x000000);
    expect(tintOf(0.5)).toBe(0x808080);
  });
});
