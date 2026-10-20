import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Playback, type PlaybackEvent, type PlaybackState } from './playback';

function events(n: number): PlaybackEvent[] {
  return Array.from({ length: n }, (_, i) => ({
    tick: i + 1,
    actor: 'wizard',
    kind: 'move',
    data: { from: [i, 0], to: [i + 1, 0], facing: 'right' },
    line: 1,
  }));
}

function setUp(n = 3) {
  const playback = new Playback({ tickMs: 400 });
  const ticks: [number, string | null][] = [];
  const states: PlaybackState[] = [];
  playback.onTick((tick, event) => ticks.push([tick, event ? event.kind : null]));
  playback.onState((state) => states.push(state));
  playback.load(events(n));
  return { playback, ticks, states };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('Playback', () => {
  it('starts idle at tick 0, telling the listeners', () => {
    const { playback, ticks } = setUp();
    expect(playback.state).toBe('idle');
    expect(playback.tick).toBe(0);
    expect(playback.length).toBe(3);
    expect(ticks).toEqual([[0, null]]);
  });

  it('plays one tick per event, a tick apart, then is done', () => {
    const { playback, ticks, states } = setUp();
    playback.play();
    expect(playback.tick).toBe(1);
    vi.advanceTimersByTime(399);
    expect(playback.tick).toBe(1);
    vi.advanceTimersByTime(1);
    expect(playback.tick).toBe(2);
    vi.advanceTimersByTime(800);
    expect(playback.tick).toBe(3);
    expect(playback.state).toBe('done');
    expect(ticks.map(([t]) => t)).toEqual([0, 1, 2, 3]);
    expect(states).toEqual(['playing', 'done']);
  });

  it('goes faster from the next tick on', () => {
    const { playback } = setUp(4);
    playback.play();
    playback.setSpeed(4);
    expect(playback.tickDuration).toBe(100);
    vi.advanceTimersByTime(400);
    expect(playback.tick).toBe(2);
    vi.advanceTimersByTime(100);
    expect(playback.tick).toBe(3);
  });

  it('pauses and resumes where it was', () => {
    const { playback, states } = setUp();
    playback.play();
    playback.pause();
    vi.advanceTimersByTime(2000);
    expect(playback.tick).toBe(1);
    expect(playback.state).toBe('paused');
    playback.play();
    expect(playback.tick).toBe(2);
    expect(states).toEqual(['playing', 'paused', 'playing']);
  });

  it('stops where it is', () => {
    const { playback } = setUp();
    playback.play();
    vi.advanceTimersByTime(400);
    playback.stop();
    vi.advanceTimersByTime(2000);
    expect(playback.tick).toBe(2);
    expect(playback.state).toBe('done');
  });

  it('resets to the start', () => {
    const { playback, ticks } = setUp();
    playback.play();
    vi.advanceTimersByTime(400);
    playback.reset();
    vi.advanceTimersByTime(2000);
    expect(playback.tick).toBe(0);
    expect(playback.state).toBe('idle');
    expect(ticks.at(-1)).toEqual([0, null]);
  });

  it('is done at once with no events', () => {
    const { playback, states } = setUp(0);
    playback.play();
    expect(playback.state).toBe('done');
    expect(states).toEqual(['done']);
  });

  it('loads new events from the start', () => {
    const { playback } = setUp();
    playback.play();
    vi.advanceTimersByTime(2000);
    playback.load(events(2));
    expect(playback.state).toBe('idle');
    expect(playback.tick).toBe(0);
    expect(playback.length).toBe(2);
  });

  it('stops telling a listener once it unsubscribes', () => {
    const playback = new Playback({ tickMs: 400 });
    const seen: number[] = [];
    const off = playback.onTick((tick) => seen.push(tick));
    playback.load(events(2));
    off();
    playback.play();
    expect(seen).toEqual([0]);
  });
});
