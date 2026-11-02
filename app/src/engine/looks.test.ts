import { describe, expect, it } from 'vitest';
import {
  colourDistance,
  DEFAULT_LOOK,
  dormitoryMate,
  FRIEND_SETS,
  friendSets,
  friendSheet,
  isLook,
  LOOKS,
  lookOf,
  looksFor,
  teacherFriend,
} from './looks';

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

describe("the friends' colours (D90)", () => {
  it('never put a friend near the wizard, nor the two friends near each other', () => {
    for (const look of LOOKS) {
      const sets = friendSets(look);
      const nuri = FRIEND_SETS.nuri[sets.nuri].robe;
      const teku = FRIEND_SETS.teku[sets.teku].robe;
      expect(colourDistance(nuri, look.robe), `Nuri for ${look.id}`).toBeGreaterThan(30);
      expect(colourDistance(teku, look.robe), `Teku for ${look.id}`).toBeGreaterThan(30);
      expect(colourDistance(nuri, teku), `the friends for ${look.id}`).toBeGreaterThan(30);
    }
  });

  it("names the sheet of a friend's set, the same for a look all the game", () => {
    const moss = lookOf('moss');
    expect(friendSheet('nuri', moss)).toBe(`nuri-${friendSets(moss).nuri}`);
    expect(friendSheet('nuri', moss)).not.toBe('nuri-a');
    expect(friendSheet('wenna', moss)).toBe('wenna');
  });
});
