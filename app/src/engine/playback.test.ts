import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LONG, lengthOf, Playback, type PlaybackEvent, type PlaybackState } from './playback';

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
  playback.onTick((tick, events) => ticks.push([tick, events[0]?.kind ?? null]));
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

  it('gives a tick in which the wizard picks up or casts a longer time', () => {
    const playback = new Playback({ tickMs: 400 });
    const ticks: number[] = [];
    playback.onTick((tick) => ticks.push(tick));
    const [first, second] = events(2);
    playback.load([{ ...first!, kind: 'pick_up', data: { id: 'wand' } }, second!]);
    playback.play();
    expect(ticks).toEqual([0, 1]);
    vi.advanceTimersByTime(400);
    expect(ticks).toEqual([0, 1]);
    vi.advanceTimersByTime(400 * LONG - 400);
    expect(ticks).toEqual([0, 1, 2]);
    expect(lengthOf([{ ...first!, actor: 'eldra', kind: 'cast' }])).toBe(1);
  });

  it('gives going to sleep a tick, the hop, the walk to the pillow being moves of the world (D130)', () => {
    const playback = new Playback({ tickMs: 400 });
    const ticks: number[] = [];
    playback.onTick((tick) => ticks.push(tick));
    const [first, second] = events(2);
    playback.load([{ ...first!, kind: 'sleep', data: { id: 'bed_2' } }, second!]);
    playback.play();
    vi.advanceTimersByTime(399);
    expect(ticks).toEqual([0, 1]);
    vi.advanceTimersByTime(1);
    expect(ticks).toEqual([0, 1, 2]);
    expect(lengthOf([{ ...first!, actor: 'mate', kind: 'sleep' }])).toBe(1);
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

  it('plays every event of a tick together, as one step', () => {
    const playback = new Playback({ tickMs: 400 });
    const seen: [number, string[]][] = [];
    playback.onTick((tick, events) => seen.push([tick, events.map((e) => e.actor)]));
    playback.load([
      { tick: 1, actor: 'wizard', kind: 'move', data: {}, line: 1 },
      { tick: 1, actor: 'teacher', kind: 'move', data: {}, line: 1 },
      { tick: 2, actor: 'wizard', kind: 'wait', data: {}, line: 2 },
    ]);
    expect(playback.length).toBe(2);
    playback.play();
    vi.advanceTimersByTime(400);
    expect(seen).toEqual([
      [0, []],
      [1, ['wizard', 'teacher']],
      [2, ['wizard']],
    ]);
  });

  it('seeks: replays every tick up to one at once, then waits there', () => {
    const playback = new Playback({ tickMs: 400 });
    const seen: [number, boolean][] = [];
    playback.onTick((tick, _events, instant) => seen.push([tick, instant]));
    playback.load(events(4));
    playback.play();
    vi.advanceTimersByTime(4000);
    seen.length = 0;
    playback.seek(2);
    expect(seen).toEqual([
      [0, true],
      [1, true],
      [2, true],
    ]);
    expect(playback.tick).toBe(2);
    expect(playback.state).toBe('paused');
    playback.play();
    expect(playback.tick).toBe(3);
    vi.advanceTimersByTime(400);
    expect(playback.tick).toBe(4);
    vi.advanceTimersByTime(400);
    expect(playback.state).toBe('done');
  });

  it('seeks no further than the run goes', () => {
    const playback = new Playback({ tickMs: 400 });
    playback.load(events(3));
    playback.seek(10);
    expect(playback.tick).toBe(3);
    playback.seek(-2);
    expect(playback.tick).toBe(0);
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
