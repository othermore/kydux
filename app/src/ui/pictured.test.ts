import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type Picture, pictured, PICTURES_MS } from './pictured';

/** A picture of the page, in memory: `come()` and `fail()` are the browser's events. */
function picture(more: { complete?: boolean; loading?: string } = {}) {
  const heard: Record<string, (() => void)[]> = { load: [], error: [] };
  const one: Picture = {
    complete: more.complete ?? false,
    loading: more.loading,
    addEventListener: (kind, then) => void heard[kind]?.push(then),
  };
  return {
    one,
    come: () => heard.load?.forEach((then) => then()),
    fail: () => heard.error?.forEach((then) => then()),
  };
}

/** Whether `promise` has resolved, once what is queued has run. */
async function settled(promise: Promise<void>): Promise<boolean> {
  let done = false;
  void promise.then(() => {
    done = true;
  });
  await vi.advanceTimersByTimeAsync(0);
  return done;
}

describe("a screen's pictures (D341)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('are in at once where there is none, or all have come already', async () => {
    expect(await settled(pictured([]))).toBe(true);
    expect(await settled(pictured([picture({ complete: true }).one]))).toBe(true);
  });

  it('are in when the last one comes, and a picture that fails counts as come', async () => {
    const castle = picture();
    const figure = picture();
    const all = pictured([castle.one, figure.one, picture({ complete: true }).one]);
    expect(await settled(all)).toBe(false);
    castle.come();
    expect(await settled(all)).toBe(false);
    figure.fail();
    expect(await settled(all)).toBe(true);
  });

  it('do not wait for a picture fetched only when it is scrolled to', async () => {
    expect(await settled(pictured([picture({ loading: 'lazy' }).one]))).toBe(true);
  });

  it('are waited for no longer than PICTURES_MS', async () => {
    const all = pictured([picture().one]);
    await vi.advanceTimersByTimeAsync(PICTURES_MS - 1);
    expect(await settled(all)).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await settled(all)).toBe(true);
  });
});
