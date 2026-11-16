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

  it('never sleeps while a gust sounds, and sleeps after its fall', async () => {
    const { Wind } = await import('./sound');
    const wind = new Wind(() => 0.5);
    // A gust of two seconds, its fall 0.575 s after it.
    wind.gust(2);
    vi.advanceTimersByTime(2500);
    expect(sleeps()).toBe(0);
    // Then the three seconds after a sound's end.
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
    const wind = new Wind(() => 0.5);
    setHidden(true);
    wind.gust(2);
    expect(asked).not.toContain('resume');
    setHidden(false);
    expect(asked).toContain('resume');
    wind.stop(0.02);
  });
});

/** A param of the wind's graph that keeps what it is asked to do, in order. */
class RecordedParam {
  calls: [string, ...number[]][] = [];
  constructor(public value: number) {}
  setValueAtTime(value: number, at: number) {
    this.calls.push(['set', value, at]);
    this.value = value;
    return this;
  }
  linearRampToValueAtTime(value: number, at: number) {
    this.calls.push(['linear', value, at]);
    return this;
  }
  exponentialRampToValueAtTime(value: number, at: number) {
    this.calls.push(['exponential', value, at]);
    return this;
  }
  setTargetAtTime(value: number, at: number, constant: number) {
    this.calls.push(['target', value, at, constant]);
    return this;
  }
  cancelScheduledValues(at: number) {
    this.calls.push(['cancel', at]);
    return this;
  }
}

const recordedNode = (params: Record<string, RecordedParam>) => ({
  ...params,
  type: '',
  loop: false,
  buffer: null,
  connect: (next: unknown) => next,
  disconnect: () => undefined,
  start: () => undefined,
  stop: () => undefined,
});

/** A context whose params keep what they are asked, its clock at one second. */
class RecordingContext {
  state: AudioContextState = 'running';
  sampleRate = 8000;
  currentTime = 1;
  destination = recordedNode({});
  resume = () => Promise.resolve();
  suspend = () => Promise.resolve();
  createBuffer = (_channels: number, length: number) => ({ getChannelData: () => new Float32Array(length) });
  createGain = () => recordedNode({ gain: new RecordedParam(1) });
  createBiquadFilter = () => recordedNode({ frequency: new RecordedParam(350), Q: new RecordedParam(1) });
  createOscillator = () => recordedNode({ frequency: new RecordedParam(440) });
  createBufferSource = () => recordedNode({});
}

describe("the broom's wind, a gust for each flown command (D243)", () => {
  const blowing = async () => {
    vi.stubGlobal('AudioContext', RecordingContext);
    const sound = await import('./sound');
    const wind = new sound.Wind(() => 0.5);
    wind.gust(2);
    const graph = wind.graph;
    if (!graph) throw new Error('no wind');
    const param = (node: unknown, name = 'gain') => (node as Record<string, RecordedParam>)[name] as RecordedParam;
    return { sound, wind, graph, param };
  };

  it('gives a gust whole to the sound clock: its level, the air band and the whistle, from 0 back to 0', async () => {
    const { graph, param } = await blowing();
    const level = param(graph.gust).calls.filter(([kind]) => kind === 'linear');
    expect(level.length).toBeGreaterThan(5);
    expect(level[level.length - 1]?.[1]).toBe(0);
    expect(param(graph.airBand, 'frequency').calls.filter(([kind]) => kind === 'linear')).toHaveLength(level.length);
    expect(param(graph.whistleBand, 'frequency').calls.filter(([kind]) => kind === 'linear')).toHaveLength(level.length);
    expect(param(graph.whistleLevel).calls.filter(([kind]) => kind === 'linear')).toHaveLength(level.length);
  });

  it('takes a sounding gust on from its level now, with no second voice', async () => {
    const { wind, graph, param } = await blowing();
    const level = param(graph.gust);
    level.calls = [];
    wind.gust(0.133);
    expect(wind.graph).toBe(graph);
    expect(level.calls[0]?.[0]).toBe('cancel');
    expect(level.calls[1]?.[0]).toBe('set');
  });

  it('fades to nothing when stopped, in the time it is given', async () => {
    const { wind, graph, param } = await blowing();
    const level = param(graph.gust);
    level.calls = [];
    wind.stop(0.15);
    expect(level.calls).toContainEqual(['linear', 0, 1.15]);
    expect(wind.blowing).toBe(true);
    vi.advanceTimersByTime(200);
    expect(wind.blowing).toBe(false);
  });

  it('sets a voice turned off or on at once in the mix: the rest off as written', async () => {
    const { sound, graph, param } = await blowing();
    expect(param(graph.rest).value).toBe(0);
    sound.mixWind('whistle', false, 1);
    expect(param(graph.whistle).value).toBe(0);
    expect(param(graph.air).value).toBe(1);
    sound.mixWind('rest', true, 1);
    expect(param(graph.rest).value).toBe(1);
  });
});
