import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GRACE, LAST_TIP, nextTip, TIP_TIME, TIPS, Wait } from './waiting';

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

function waiting(tips = true, storage = kept()) {
  const shown: string[] = [];
  const offered: number[] = [];
  const wait = new Wait({
    tips,
    storage,
    keys: KEYS,
    onTip: (key) => shown.push(key),
    onOffer: () => offered.push(Date.now()),
  });
  return { wait, shown, offered, storage };
}

describe('the wait while a screen loads (D214)', () => {
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

  it('holds a ready screen until its tip has been up ten seconds, offering Go on', () => {
    const { wait, shown, offered } = waiting();
    vi.advanceTimersByTime(GRACE + 3000);
    const open = vi.fn();
    wait.ready(open);
    expect(open).not.toHaveBeenCalled();
    expect(offered).toHaveLength(1);
    vi.advanceTimersByTime(TIP_TIME - 3000 - 1);
    expect(open).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(open).toHaveBeenCalledOnce();
    // No other tip came while the screen waited for this one to be read.
    expect(shown).toEqual(['a']);
  });

  it('opens a ready screen at once when Go on is pressed, and only once', () => {
    const { wait } = waiting();
    vi.advanceTimersByTime(GRACE);
    const open = vi.fn();
    wait.ready(open);
    wait.go();
    expect(open).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(TIP_TIME);
    expect(open).toHaveBeenCalledOnce();
  });

  it('shows a child who has not begun no tip, however long the wait', () => {
    const { wait, shown } = waiting(false);
    vi.advanceTimersByTime(TIP_TIME * 5);
    expect(shown).toEqual([]);
    const open = vi.fn();
    wait.ready(open);
    expect(open).toHaveBeenCalledOnce();
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
    wait.go();
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

