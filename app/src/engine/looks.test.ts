import { describe, expect, it } from 'vitest';
import { DEFAULT_LOOK, isLook, LOOKS, lookOf } from './looks';

describe('the looks (D36)', () => {
  it('are eight, each with its own id', () => {
    expect(LOOKS).toHaveLength(8);
    expect(new Set(LOOKS.map((look) => look.id)).size).toBe(8);
  });

  it('have four skins, and both hair styles with each', () => {
    const skins = new Set(LOOKS.map((look) => look.skin));
    expect(skins.size).toBe(4);
    for (const skin of skins) {
      const styles = new Set(LOOKS.filter((look) => look.skin === skin).map((look) => look.hairStyle));
      expect(styles).toEqual(new Set(['short', 'long']));
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
