import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** What the context was asked, in order: `resume`, `suspend`, and `start` for every
 * sound scheduled on it. */
let asked: string[] = [];

/** A node of the audio graph that takes any call and any value, and is 0 as a number. */
function anyNode(): unknown {
  const target = () => undefined;
  const proxy: unknown = new Proxy(target, {
    get(_, key) {
      if (key === Symbol.toPrimitive) return () => 0;
      if (key === 'then') return undefined;
      if (key === 'connect') return (next: unknown) => next;
      if (key === 'start') return () => asked.push('start');
      return proxy;
    },
    apply: () => proxy,
    set: () => true,
  });
  return proxy;
}

/** A context that counts what it is asked, its clock the page's while it runs. */
class CountingContext {
  state: AudioContextState = 'running';
  sampleRate = 8000;
  destination = anyNode();
  get currentTime(): number {
    return Date.now() / 1000;
  }
  resume(): Promise<void> {
    asked.push('resume');
    this.state = 'running';
    return Promise.resolve();
  }
  suspend(): Promise<void> {
    asked.push('suspend');
    this.state = 'suspended';
    return Promise.resolve();
  }
  createBuffer(_channels: number, length: number) {
    return { getChannelData: () => new Float32Array(length) };
  }
  createGain = anyNode;
  createOscillator = anyNode;
  createBufferSource = anyNode;
  createBiquadFilter = anyNode;
  createConvolver = anyNode;
}

const THEME = {
  id: 'test',
  tempo: 90,
  metre: [3, 4],
  voices: { tune: { kind: 'celesta', volume: 0.8 } },
  sections: [{ id: 'a', bars: 1, notes: { tune: [[72, 0, 1, 0.6]] } }],
  order: ['a'],
};

const root = { dataset: {} as Record<string, string> };

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers({ now: 1_000_000 });
  asked = [];
  root.dataset = {};
  vi.stubGlobal('AudioContext', CountingContext);
  vi.stubGlobal('document', { documentElement: root });
  vi.stubGlobal('fetch', () => Promise.resolve({ ok: true, json: () => Promise.resolve(THEME) }));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const sleeps = () => asked.filter((call) => call === 'suspend').length;

describe('the sound context asleep while nothing sounds (D231)', () => {
  it('sleeps three seconds after the last sound ends, with the music off, and says so', async () => {
    const { play, EFFECTS } = await import('./sfx');
    expect(root.dataset.audio).toBeUndefined();
    play('bump');
    expect(root.dataset.audio).toBe('awake');
    vi.advanceTimersByTime(EFFECTS.bump.seconds * 1000 + 2900);
    expect(sleeps()).toBe(0);
    play('step');
    vi.advanceTimersByTime(2900);
    expect(sleeps()).toBe(0);
    vi.advanceTimersByTime(EFFECTS.step.seconds * 1000 + 200);
    expect(sleeps()).toBe(1);
    expect(root.dataset.audio).toBe('asleep');
  });

  it('wakes before the next sound is scheduled on its clock', async () => {
    const { play } = await import('./sfx');
    play('bump');
    vi.advanceTimersByTime(10_000);
    expect(sleeps()).toBe(1);
    asked = [];
    play('win');
    expect(asked[0]).toBe('resume');
    expect(asked.slice(1)).toContain('start');
    expect(root.dataset.audio).toBe('awake');
  });

  it('never sleeps while the wind blows, and sleeps after its fade', async () => {
    const { Wind } = await import('./sound');
    const wind = new Wind();
    wind.start();
    vi.advanceTimersByTime(60_000);
    expect(sleeps()).toBe(0);
    wind.stop();
    vi.advanceTimersByTime(3000);
    expect(sleeps()).toBe(0);
    vi.advanceTimersByTime(1000);
    expect(sleeps()).toBe(1);
  });

  it('never sleeps while a theme plays or fades, and sleeps once it has faded', async () => {
    const { music, FADE } = await import('./music');
    music.play('test', 'level');
    music.unlock();
    await vi.advanceTimersByTimeAsync(10);
    expect(root.dataset.music).toBe('playing');
    await vi.advanceTimersByTimeAsync(60_000);
    expect(sleeps()).toBe(0);
    music.setVolume(0);
    await vi.advanceTimersByTimeAsync(FADE * 1000);
    expect(sleeps()).toBe(0);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(sleeps()).toBe(1);
    expect(root.dataset.audio).toBe('asleep');
    music.dispose();
  });

  it('sleeps while the page is hidden, and wakes when it shows only if something is to sound', async () => {
    const { play, setHidden } = await import('./sfx');
    play('bump');
    setHidden(true);
    expect(sleeps()).toBe(1);
    vi.advanceTimersByTime(10_000);
    asked = [];
    setHidden(false);
    expect(asked).toEqual([]);
    const { Wind } = await import('./sound');
    const wind = new Wind();
    setHidden(true);
    wind.start();
    expect(asked).not.toContain('resume');
    setHidden(false);
    expect(asked).toContain('resume');
    wind.stop(true);
  });
});
