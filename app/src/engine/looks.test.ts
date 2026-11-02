import { describe, expect, it } from 'vitest';
import { DEFAULT_LOOK, dormitoryMate, isLook, LOOKS, lookOf, looksFor, teacherFriend } from './looks';

describe('the looks (D36)', () => {
  it('are eight, each with its own id', () => {
    expect(LOOKS).toHaveLength(8);
    expect(new Set(LOOKS.map((look) => look.id)).size).toBe(8);
  });

  it('are four for each gender, with the four skins in each (D61)', () => {
    for (const gender of ['girl', 'boy'] as const) {
      const looks = looksFor(gender);
      expect(looks).toHaveLength(4);
      expect(new Set(looks.map((look) => look.skin)).size).toBe(4);
    }
  });

  it('give the first look for an id the game lacks', () => {
    expect(isLook('teal')).toBe(true);
    expect(isLook('gold')).toBe(false);
    expect(lookOf('teal').id).toBe('teal');
    expect(lookOf('gold')).toBe(DEFAULT_LOOK);
    expect(lookOf(null)).toBe(DEFAULT_LOOK);
  });
});

describe('the friends (D77, D84)', () => {
  it("are the other gender's at the gate and the wizard's own in the dormitory", () => {
    expect(teacherFriend('girl').id).toBe('teku');
    expect(dormitoryMate('girl').id).toBe('nuri');
    expect(dormitoryMate('boy').id).toBe('teku');
    expect(dormitoryMate(null).id).toBe('teku');
  });
});
