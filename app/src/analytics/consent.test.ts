import { describe, expect, it } from 'vitest';
import { accept, accepted, answered, cookieDomains, countingCookies, refuse, REFUSAL_LASTS_MS } from './consent';

function memory(): Pick<Storage, 'getItem' | 'setItem'> {
  const kept = new Map<string, string>();
  return { getItem: (key) => kept.get(key) ?? null, setItem: (key, value) => void kept.set(key, value) };
}

describe('the answer to the cookies (D328)', () => {
  it('is kept once given, and is not there before', () => {
    const storage = memory();
    expect(accepted(storage)).toBe(false);
    expect(answered(storage)).toBe(false);
    accept(storage);
    expect(accepted(storage)).toBe(true);
    expect(answered(storage)).toBe(true);
  });

  it('is kept as a no for a day and a half, and asked again after it', () => {
    const storage = memory();
    const then = Date.UTC(2026, 10, 23, 18);
    refuse(storage, then);
    expect(accepted(storage)).toBe(false);
    expect(answered(storage, then)).toBe(true);
    expect(answered(storage, then + REFUSAL_LASTS_MS - 1)).toBe(true);
    expect(answered(storage, then + REFUSAL_LASTS_MS)).toBe(false);
    expect(REFUSAL_LASTS_MS).toBe(36 * 3600 * 1000);
    // A clock set back is no reason to keep a no for longer.
    expect(answered(storage, then - 1)).toBe(false);
  });

  it('is a yes for good, and a yes replaces a no', () => {
    const storage = memory();
    refuse(storage, 0);
    accept(storage);
    expect(accepted(storage)).toBe(true);
    expect(answered(storage, 10 * 365 * 24 * 3600 * 1000)).toBe(true);
  });

  it('is not an answer when it is neither', () => {
    const storage = memory();
    for (const kept of ['maybe', 'no', 'no@', 'no@soon']) {
      storage.setItem('kydux.cookies', kept);
      expect(answered(storage)).toBe(false);
    }
  });

  it('is missing where the browser keeps nothing', () => {
    expect(accepted(null)).toBe(false);
    expect(answered(null)).toBe(false);
    expect(
      accepted({
        getItem: () => {
          throw new Error('refused');
        },
      }),
    ).toBe(false);
  });

  it("finds Google Analytics' cookies and no other", () => {
    expect(countingCookies('_ga=GA1.1.1; theme=dark; _ga_LHD6DKXB9P=GS1.1.2; ga=no')).toEqual([
      '_ga',
      '_ga_LHD6DKXB9P',
    ]);
    expect(countingCookies('')).toEqual([]);
  });

  it('names the domains a cookie may be on', () => {
    expect(cookieDomains('kydux.kidux.org')).toEqual(['', 'kydux.kidux.org', '.kydux.kidux.org', '.kidux.org']);
    expect(cookieDomains('localhost')).toEqual(['', 'localhost']);
  });
});
