import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDLE_S, PLAY_TICK_S, startPlayTime } from './playtime';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function setUp(playing = true, visible = true) {
  const target = new EventTarget();
  let seconds = 0;
  const state = { playing, visible };
  startPlayTime({
    playing: () => state.playing,
    visible: () => state.visible,
    add: (more) => (seconds += more),
    now: () => Date.now(),
    target,
  });
  return { target, state, seconds: () => seconds };
}

describe('play time', () => {
  it('counts while the child plays and touches the page', () => {
    const { seconds } = setUp();
    vi.advanceTimersByTime(PLAY_TICK_S * 1000 * 3);
    expect(seconds()).toBe(PLAY_TICK_S * 3);
  });

  it('stops once the page is untouched for IDLE_S, and goes on at a touch', () => {
    const { target, seconds } = setUp();
    vi.advanceTimersByTime(IDLE_S * 1000 + PLAY_TICK_S * 1000 * 3);
    const idle = seconds();
    expect(idle).toBeLessThanOrEqual(IDLE_S);
    vi.advanceTimersByTime(PLAY_TICK_S * 1000 * 3);
    expect(seconds()).toBe(idle);
    target.dispatchEvent(new Event('keydown'));
    vi.advanceTimersByTime(PLAY_TICK_S * 1000);
    expect(seconds()).toBe(idle + PLAY_TICK_S);
  });

  it('does not count off a level, a lesson or a story, nor with the tab hidden', () => {
    const away = setUp(false, true);
    const hidden = setUp(true, false);
    vi.advanceTimersByTime(PLAY_TICK_S * 1000 * 2);
    expect(away.seconds()).toBe(0);
    expect(hidden.seconds()).toBe(0);
  });
});
