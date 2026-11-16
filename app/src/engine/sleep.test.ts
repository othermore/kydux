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

/** A param of the wind's graph that keeps what it is asked to do, in order, and the
 * values assigned to it. Its value read back is a number nothing sets, 99, so that a
 * call that carries 99 shows a value read back from the node (D252). */
const READ_BACK = 99;
class RecordedParam {
  calls: [string, ...number[]][] = [];
  assigned: number[] = [];
  constructor(readonly made: number) {}
  get value(): number {
    return READ_BACK;
  }
  set value(value: number) {
    this.assigned.push(value);
  }
  /** The last value assigned. */
  get last(): number | undefined {
    return this.assigned[this.assigned.length - 1];
  }
  setValueAtTime(value: number, at: number) {
    this.calls.push(['set', value, at]);
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

  it('starts the first gust of a new sound from nothing, and its bands from their low ends', async () => {
    const { graph, param } = await blowing();
    const held = (node: unknown, name = 'gain') => {
      const { calls } = param(node, name);
      const cancel = calls.findIndex(([kind]) => kind === 'cancel');
      return calls[cancel + 1];
    };
    expect(held(graph.gust)).toEqual(['set', 0, 1]);
    expect(held(graph.whistleLevel)).toEqual(['set', 0, 1]);
    expect(held(graph.restLevel)).toEqual(['set', 0, 1]);
    expect(held(graph.airBand, 'frequency')).toEqual(['set', 320, 1]);
    expect(held(graph.whistleBand, 'frequency')).toEqual(['set', 1700, 1]);
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

  it('brings the rest back when the gust has fallen, while the wizard hovers', async () => {
    const { sound, wind, graph, param } = await blowing();
    const plan = sound.gustPlan(2, () => 0.5);
    const falls = (plan[plan.length - 1] as { at: number }).at;
    const rest = param(graph.restLevel);
    rest.calls = [];
    wind.rest(true);
    const targets = rest.calls.filter(([kind]) => kind === 'target');
    expect(targets).toHaveLength(2);
    expect(targets[0]).toEqual(['target', 0, 1, 0.05]);
    expect(targets[1]?.[1]).toBe(sound.REST_LEVEL);
    expect(targets[1]?.[2]).toBeCloseTo(1 + falls, 6);
    // With no gust, it comes at once.
    vi.advanceTimersByTime(falls * 1000 + 1);
    rest.calls = [];
    wind.rest(true);
    expect(rest.calls.filter(([kind]) => kind === 'target')).toEqual([['target', sound.REST_LEVEL, 1, 0.2]]);
  });

  it('keeps the rest asked for when a gust is dropped at a bump, and not when all stops', async () => {
    const { sound, wind, graph, param } = await blowing();
    const rest = param(graph.restLevel);
    wind.rest(true);
    rest.calls = [];
    wind.drop(0.05);
    expect(param(graph.gust).calls).toContainEqual(['linear', 0, 1.05]);
    const after = rest.calls.filter(([kind]) => kind === 'target');
    expect(after[after.length - 1]?.[1]).toBe(sound.REST_LEVEL);
    expect(after[after.length - 1]?.[2]).toBeCloseTo(1.05, 6);
    rest.calls = [];
    wind.stop(0.15);
    expect(rest.calls.filter(([kind]) => kind === 'target')).toEqual([['target', 0, 1, 0.05]]);
  });

  it('is taken away once stopped, the rest on in the mix or not', async () => {
    const { sound, wind } = await blowing();
    sound.mixWind('rest', true, 1);
    wind.rest(true);
    vi.advanceTimersByTime(5000);
    expect(wind.graph).not.toBeNull();
    wind.stop(0.15);
    vi.advanceTimersByTime(400);
    expect(wind.graph).toBeNull();
  });

  it("sets a voice turned off or on at once in the mix, from the owner's mix as written", async () => {
    const { sound, graph, param } = await blowing();
    expect(param(graph.air).last).toBe(1.1);
    expect(param(graph.whistle).last).toBe(1);
    expect(param(graph.rest).last).toBe(0.5);
    sound.mixWind('whistle', false, 1);
    expect(param(graph.whistle).last).toBe(0);
    expect(param(graph.air).last).toBe(1.1);
    sound.mixWind('rest', false, 0.5);
    expect(param(graph.rest).last).toBe(0);
    sound.mixWind('rest', true, 1);
    expect(param(graph.rest).last).toBe(1);
  });
});

describe("the wind's levels counted from its own plan, never read back (D252)", () => {
  type Line = { at: number; level: number }[];
  const param = (node: unknown, name = 'gain') => (node as Record<string, RecordedParam>)[name] as RecordedParam;
  /** The value a param is held at by the last cancel of its calls. */
  const heldAfterCancel = (recorded: RecordedParam) => {
    const cancel = recorded.calls.map(([kind]) => kind).lastIndexOf('cancel');
    return recorded.calls.slice(cancel).find(([kind]) => kind === 'set')?.[1];
  };
  /** The line a param was given since its last cancel: its held value, then each ramp. */
  const lineOf = (recorded: RecordedParam): Line => {
    const cancel = recorded.calls.map(([kind]) => kind).lastIndexOf('cancel');
    const after = recorded.calls.slice(cancel + 1);
    const held = after.find(([kind]) => kind === 'set') as [string, number, number];
    return [
      { at: held[2], level: held[1] },
      ...after.filter(([kind]) => kind === 'linear').map(([, level, at]) => ({ at: at as number, level: level as number })),
    ];
  };
  const allParams = (graph: Record<string, unknown>) =>
    Object.values(graph).flatMap((node) =>
      ['gain', 'frequency', 'Q'].map((name) => (node as Record<string, RecordedParam>)[name]).filter((one) => one instanceof RecordedParam),
    ) as RecordedParam[];

  const start = async () => {
    vi.stubGlobal('AudioContext', RecordingContext);
    const sound = await import('./sound');
    const sfx = await import('./sfx');
    const ctx = sfx.audio() as unknown as RecordingContext;
    const wind = new sound.Wind(() => 0.5);
    wind.gust(2);
    const graph = wind.graph;
    if (!graph) throw new Error('no wind');
    return { sound, ctx, wind, graph };
  };

  it('takes a second gust on, with the clock moved into the first, from the level counted from its plan', async () => {
    const { sound, ctx, wind, graph } = await start();
    const lines = {
      gust: lineOf(param(graph.gust)),
      air: lineOf(param(graph.airBand, 'frequency')),
      whistle: lineOf(param(graph.whistleBand, 'frequency')),
      whistleLevel: lineOf(param(graph.whistleLevel)),
    };
    ctx.currentTime = 1.6;
    wind.gust(0.133);
    expect(heldAfterCancel(param(graph.gust))).toBeCloseTo(sound.levelAt(lines.gust, 1.6), 12);
    expect(heldAfterCancel(param(graph.airBand, 'frequency'))).toBeCloseTo(sound.levelAt(lines.air, 1.6), 9);
    expect(heldAfterCancel(param(graph.whistleBand, 'frequency'))).toBeCloseTo(sound.levelAt(lines.whistle, 1.6), 9);
    expect(heldAfterCancel(param(graph.whistleLevel))).toBeCloseTo(sound.levelAt(lines.whistleLevel, 1.6), 12);
    expect(heldAfterCancel(param(graph.gust))).toBeGreaterThan(0);
  });

  it("drops a gust from the level counted to 0, and the gust after starts from the drop's line", async () => {
    const { sound, ctx, wind, graph } = await start();
    const first = lineOf(param(graph.gust));
    ctx.currentTime = 1.5;
    wind.drop(0.05);
    const held = heldAfterCancel(param(graph.gust)) as number;
    expect(held).toBeCloseTo(sound.levelAt(first, 1.5), 12);
    expect(param(graph.gust).calls).toContainEqual(['linear', 0, 1.55]);
    ctx.currentTime = 1.52;
    wind.gust(0.133);
    const drop = [
      { at: 1.5, level: held },
      { at: 1.55, level: 0 },
    ];
    expect(heldAfterCancel(param(graph.gust))).toBeCloseTo(sound.levelAt(drop, 1.52), 12);
  });

  it('starts the rest after a gust from the value its curve has at that moment', async () => {
    const { sound, ctx, wind, graph } = await start();
    const rest = param(graph.restLevel);
    wind.rest(true);
    // The rest's curve as given: held, then its targets.
    const cancel = rest.calls.map(([kind]) => kind).lastIndexOf('cancel');
    const after = rest.calls.slice(cancel + 1);
    const held = after.find(([kind]) => kind === 'set') as [string, number, number];
    const curve = {
      from: held[1],
      at: held[2],
      targets: after
        .filter(([kind]) => kind === 'target')
        .map(([, level, at, constant]) => ({ level: level as number, at: at as number, constant: constant as number })),
    };
    ctx.currentTime = 4;
    vi.advanceTimersByTime(3000);
    wind.gust(0.133);
    expect(heldAfterCancel(rest)).toBeCloseTo(sound.curveAt(curve, 4), 12);
    expect(heldAfterCancel(rest)).toBeGreaterThan(0);
  });

  it('carries no value read back from a node in any call', async () => {
    const { ctx, wind, graph } = await start();
    wind.rest(true);
    ctx.currentTime = 1.4;
    wind.gust(1);
    ctx.currentTime = 1.6;
    wind.drop(0.05);
    ctx.currentTime = 1.7;
    wind.gust(0.5);
    wind.remix();
    ctx.currentTime = 2;
    wind.stop(0.15);
    const params = allParams(graph as unknown as Record<string, unknown>);
    const calls = params.flatMap((one) => one.calls);
    expect(calls.length).toBeGreaterThan(30);
    expect(calls.filter((call) => call.slice(1).includes(READ_BACK))).toEqual([]);
    expect(params.flatMap((one) => one.assigned)).not.toContain(READ_BACK);
  });
});
