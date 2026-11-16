import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GRACE, LAST_TIP, nextTip, readFor, TIP_TIME, TIPS, Wait } from './waiting';

/** A browser's storage, in memory. */
function kept(): Pick<Storage, 'getItem' | 'setItem'> & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
}

const KEYS = ['a', 'b', 'c'];

function waiting(tips = true, storage = kept(), more: { due?: boolean; reading?: number } = {}) {
  const shown: string[] = [];
  const wait = new Wait({
    tips,
    storage,
    keys: KEYS,
    due: more.due,
    reading: () => more.reading ?? 6000,
    onTip: (key) => shown.push(key),
  });
  return { wait, shown, storage };
}

describe('the wait while a screen loads (D214, D221)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('shows no tip inside the grace, and opens a screen ready then at once', () => {
    const { wait, shown } = waiting();
    vi.advanceTimersByTime(GRACE - 1);
    expect(shown).toEqual([]);
    const open = vi.fn();
    wait.ready(open);
    expect(open).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(TIP_TIME * 3);
    expect(shown).toEqual([]);
  });

  it('shows a tip after the grace, and the next one every ten seconds', () => {
    const { shown } = waiting();
    vi.advanceTimersByTime(GRACE);
    expect(shown).toEqual(['a']);
    vi.advanceTimersByTime(TIP_TIME - 1);
    expect(shown).toEqual(['a']);
    vi.advanceTimersByTime(1);
    expect(shown).toEqual(['a', 'b']);
    vi.advanceTimersByTime(TIP_TIME * 2);
    // After the last tip comes the first.
    expect(shown).toEqual(['a', 'b', 'c', 'a']);
  });

  it('shows a tip at once when one is due: the first wait of a visit, or a new scene', () => {
    const { wait, shown } = waiting(true, kept(), { due: true });
    vi.advanceTimersByTime(0);
    expect(shown).toEqual(['a']);
    // A screen ready at once still waits for the tip's reading time, and opens by itself.
    const open = vi.fn();
    wait.ready(open);
    vi.advanceTimersByTime(6000 - 1);
    expect(open).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(open).toHaveBeenCalledOnce();
  });

  it('shows a tip at once when the scene, known later, is a new one', () => {
    const { wait, shown } = waiting();
    vi.advanceTimersByTime(500);
    wait.due();
    expect(shown).toEqual(['a']);
    // Due again, with a tip up: no other comes before its time.
    wait.due();
    expect(shown).toEqual(['a']);
  });

  it('keeps the grace for a screen of the same scene, or of none, and is quick there', () => {
    const { wait, shown } = waiting(true, kept(), { due: false });
    vi.advanceTimersByTime(800);
    const open = vi.fn();
    wait.ready(open);
    expect(open).toHaveBeenCalledOnce();
    expect(shown).toEqual([]);
  });

  it("holds a ready screen for the tip's reading time, never more than ten seconds, and has no button", () => {
    const { wait, shown } = waiting(true, kept(), { reading: 7000 });
    vi.advanceTimersByTime(GRACE + 3000);
    const open = vi.fn();
    wait.ready(open);
    expect(open).not.toHaveBeenCalled();
    vi.advanceTimersByTime(4000 - 1);
    expect(open).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(open).toHaveBeenCalledOnce();
    // No other tip came while the screen waited for this one to be read.
    expect(shown).toEqual(['a']);
    expect('go' in wait).toBe(false);
    const long = waiting(true, kept(), { reading: 30_000, due: true });
    vi.advanceTimersByTime(0);
    const late = vi.fn();
    long.wait.ready(late);
    vi.advanceTimersByTime(TIP_TIME);
    expect(late).toHaveBeenCalledOnce();
    expect(readFor(30_000)).toBe(TIP_TIME);
    expect(readFor(5_050)).toBe(5_050);
  });

  it('shows a child who has not begun no tip, however long the wait, due or not', () => {
    for (const due of [false, true]) {
      const { wait, shown } = waiting(false, kept(), { due });
      vi.advanceTimersByTime(TIP_TIME * 5);
      wait.due();
      expect(shown).toEqual([]);
      const open = vi.fn();
      wait.ready(open);
      expect(open).toHaveBeenCalledOnce();
    }
  });

  it('goes on from the tip after the last one shown, kept in the browser', () => {
    const storage = kept();
    const first = waiting(true, storage);
    vi.advanceTimersByTime(GRACE + TIP_TIME);
    expect(first.shown).toEqual(['a', 'b']);
    expect(storage.data.get(LAST_TIP)).toBe('1');
    first.wait.dispose();
    const second = waiting(true, storage);
    vi.advanceTimersByTime(GRACE + TIP_TIME);
    expect(second.shown).toEqual(['c', 'a']);
    expect(nextTip(storage, KEYS.length)).toBe(1);
    expect(nextTip(null, KEYS.length)).toBe(0);
  });

  it('opens nothing once dropped, a route changed while it waited', () => {
    const { wait } = waiting();
    vi.advanceTimersByTime(GRACE);
    const open = vi.fn();
    wait.ready(open);
    wait.dispose();
    vi.advanceTimersByTime(TIP_TIME);
    expect(open).not.toHaveBeenCalled();
  });
});

describe('the tips (D214)', () => {
  const catalogs = import.meta.glob<{ tips: Record<string, string> }>('../../../i18n/*.json', {
    eager: true,
    import: 'default',
  });

  it("are the page's words, the same keys in every language, in the order shown", () => {
    const languages = Object.values(catalogs);
    expect(languages.length).toBeGreaterThan(1);
    for (const catalog of languages) expect(Object.keys(catalog.tips)).toEqual([...TIPS]);
  });
});

