import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LoadedLevel } from '../content/levels';
import { Playback } from '../engine/playback';
import type { RunResult, WorldEvent, WorldResult } from '../runtime/protocol';
import type { RuntimeStatus } from '../runtime/runtime';
import { RunController, type RunSnapshot, type RuntimeLike, type SceneLike } from './controller';

class FakeRuntime implements RuntimeLike {
  status: RuntimeStatus = 'ready';
  readonly wallClockMs = 5000;
  interrupted = 0;
  pending: ((result: RunResult) => void) | null = null;
  private listeners: ((s: RuntimeStatus) => void)[] = [];

  run(): Promise<RunResult> {
    this.set('running');
    return new Promise((resolve) => {
      this.pending = (result) => {
        this.set('ready');
        resolve(result);
      };
    });
  }

  interrupt(): void {
    this.interrupted += 1;
  }

  onStatus(listener: (s: RuntimeStatus) => void): () => void {
    this.listeners.push(listener);
    listener(this.status);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  set(status: RuntimeStatus): void {
    this.status = status;
    for (const listener of this.listeners) listener(status);
  }

  answer(world: WorldResult | undefined, status: RunResult['status'] = 'ok'): void {
    this.pending?.({ status, stdout: world?.stdout ?? '', stderr: '', durationMs: 1, world });
  }
}

class FakeScene implements SceneLike {
  readonly playback = new Playback({ tickMs: 400 });
  load(world: WorldResult): void {
    this.playback.load(world.events);
  }
  reset(): void {
    this.playback.reset();
  }
}

function moves(n: number, line = 1): WorldEvent[] {
  return Array.from({ length: n }, (_, i) => ({
    tick: i + 1,
    actor: 'wizard',
    kind: 'move',
    data: { from: [i + 1, 1], to: [i + 2, 1], facing: 'right' },
    line,
  }));
}

function world(status: WorldResult['status'], events: WorldEvent[], metAt: number | null): WorldResult {
  return {
    status,
    events,
    goals: [
      {
        kind: 'reach',
        params: { marker: 'D' },
        met: metAt !== null,
        met_at_tick: metAt,
        failed: false,
        failed_at_tick: null,
        bonus: false,
        walked_over: false,
      },
    ],
    ticks: events.length,
    stdout: '',
    error: null,
  };
}

const LEVEL: LoadedLevel = {
  id: 'the-long-corridor',
  level: { id: 'the-long-corridor', goals: [{ kind: 'reach', marker: 'D' }], tick_limit: 100 },
  text: { title: 'The corridor', goals: ['Reach the door.'], starting_code: '' },
};

function setUp() {
  const runtime = new FakeRuntime();
  const scene = new FakeScene();
  const controller = new RunController({ runtime, level: LEVEL, speed: 1 });
  const seen: RunSnapshot[] = [];
  controller.onChange((s) => seen.push(s));
  controller.attach(scene);
  return { runtime, scene, controller, seen, last: () => controller.snapshot };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('RunController', () => {
  it('is loading until the scene is drawn, then ready', () => {
    const runtime = new FakeRuntime();
    const controller = new RunController({ runtime, level: LEVEL, speed: 1 });
    expect(controller.snapshot.state).toBe('loading');
    expect(controller.snapshot.canRun).toBe(false);
    controller.attach(new FakeScene());
    expect(controller.snapshot.state).toBe('ready');
    expect(controller.snapshot.canRun).toBe(true);
    expect(controller.snapshot.goals).toEqual(['open']);
  });

  it('goes through a run that wins: running, playing, done', async () => {
    const { runtime, controller, last } = setUp();
    controller.run('wizard.move_right(6)');
    expect(last().state).toBe('running');
    expect(last().canStop).toBe(true);
    runtime.answer(world('won', moves(6), 6));
    await vi.waitFor(() => expect(last().state).toBe('playing'));
    expect(last().runningLine).toBe(1);
    expect(last().goals).toEqual(['open']);
    vi.advanceTimersByTime(400 * 6);
    expect(last().state).toBe('done');
    expect(last().goals).toEqual(['met']);
    expect(last().outcome).toEqual({ kind: 'won' });
    expect(last().runningLine).toBeNull();
  });

  it('marks the line of an error once its events have played', async () => {
    const { runtime, controller, last } = setUp();
    controller.run('x');
    const errs = { ...world('error', moves(2), null), error: { type: 'NameError', message: 'x', line: 3 } };
    runtime.answer(errs);
    await vi.waitFor(() => expect(last().state).toBe('playing'));
    expect(last().errorLine).toBeNull();
    vi.advanceTimersByTime(800);
    expect(last().state).toBe('done');
    expect(last().errorLine).toBe(3);
    expect(last().outcome).toMatchObject({ kind: 'error' });
  });

  it('shows an error with no events at once', async () => {
    const { runtime, controller, last } = setUp();
    controller.run('(');
    runtime.answer({ ...world('error', [], null), error: { type: 'SyntaxError', message: '', line: 1 } });
    await vi.waitFor(() => expect(last().state).toBe('done'));
    expect(last().errorLine).toBe(1);
  });

  it('tells a run stopped by ending the worker as interrupted', async () => {
    const { runtime, controller, last } = setUp();
    controller.run('while True: pass');
    controller.stop();
    expect(runtime.interrupted).toBe(1);
    runtime.answer(undefined, 'interrupted');
    await vi.waitFor(() => expect(last().outcome).toEqual({ kind: 'interrupted', seconds: 5 }));
  });

  it('keeps the first action that could not be done, as data', async () => {
    const { runtime, controller, last } = setUp();
    controller.run('door.open()');
    runtime.answer(
      world('incomplete', [
        { tick: 1, actor: 'wizard', kind: 'blocked', data: { by: 'door', reason: 'far', tried: false }, line: 1 },
      ], null),
    );
    await vi.waitFor(() => expect(last().state).toBe('playing'));
    vi.advanceTimersByTime(400);
    expect(last().outcome).toEqual({
      kind: 'incomplete',
      met: 0,
      total: 1,
      blocked: { line: 1, reason: 'far', thing: null },
    });
  });

  it('restarts: back to the start, the card hidden, a late answer dropped', async () => {
    const { runtime, controller, last } = setUp();
    controller.run('wizard.move_right(6)');
    controller.restart();
    runtime.answer(world('won', moves(6), 6));
    await Promise.resolve();
    expect(last().world).toBeNull();
    expect(last().outcome).toBeNull();
    expect(last().state).toBe('ready');
  });

  it('starts a new run from the start when one is asked for during the playback', async () => {
    const { runtime, scene, controller, last } = setUp();
    controller.run('wizard.move_right(6)');
    runtime.answer(world('won', moves(6), 6));
    await vi.waitFor(() => expect(last().state).toBe('playing'));
    vi.advanceTimersByTime(800);
    controller.run('wizard.move_right(2)');
    expect(scene.playback.state).toBe('idle');
    expect(last().tick).toBe(0);
    runtime.answer(world('incomplete', moves(2), null));
    await vi.waitFor(() => expect(last().state).toBe('playing'));
    vi.advanceTimersByTime(800);
    expect(last().outcome).toMatchObject({ kind: 'incomplete', met: 0, total: 1 });
  });

  it('says a goal walked over and not stopped at', async () => {
    const { runtime, controller, last } = setUp();
    controller.run('wizard.move_right(2)');
    const passed = world('incomplete', moves(2), null);
    passed.goals = passed.goals.map((goal) => ({ ...goal, walked_over: true }));
    runtime.answer(passed);
    await vi.waitFor(() => expect(last().state).toBe('playing'));
    vi.advanceTimersByTime(800);
    expect(last().outcome).toMatchObject({ kind: 'incomplete', walkedOver: true });
  });

  it('changes speed mid-playback', async () => {
    const { runtime, scene, controller, last } = setUp();
    controller.run('wizard.move_right(6)');
    runtime.answer(world('won', moves(6), 6));
    await vi.waitFor(() => expect(last().state).toBe('playing'));
    controller.setSpeed(4);
    expect(scene.playback.tickDuration).toBe(100);
    expect(last().speed).toBe(4);
  });

  it('seeks back after a run, the goals and the line as they were, and plays on', async () => {
    const { runtime, controller, last } = setUp();
    controller.run('wizard.move_right(6)');
    runtime.answer(world('won', moves(6), 6));
    await vi.waitFor(() => expect(last().state).toBe('playing'));
    vi.advanceTimersByTime(400 * 6);
    expect(last().state).toBe('done');
    expect(last().canSeek).toBe(true);

    controller.seek(3);
    expect(last().state).toBe('paused');
    expect(last().tick).toBe(3);
    expect(last().goals).toEqual(['open']);
    expect(last().canPlay).toBe(true);
    expect(last().runningLine).toBe(1);

    controller.resume();
    expect(last().state).toBe('playing');
    vi.advanceTimersByTime(400 * 4);
    expect(last().state).toBe('done');
    expect(last().goals).toEqual(['met']);
  });

  it('cannot seek before there is a run to show', () => {
    const { last } = setUp();
    expect(last().canSeek).toBe(false);
  });

  it('says Python could not start, and offers no run', () => {
    const { runtime, last } = setUp();
    runtime.set('failed');
    expect(last().state).toBe('failed');
    expect(last().outcome).toEqual({ kind: 'failed' });
    expect(last().canRun).toBe(false);
  });
});

describe('RunController with ways (D51)', () => {
  /** A result of two ways: `open` won in 6 ticks, `locked` not, stopped after 2. */
  function twoWays(): WorldResult {
    const open = { ...world('won', moves(6), 6), id: 'open' };
    const locked = { ...world('incomplete', moves(2), null), id: 'locked' };
    return { ...locked, status: 'incomplete', way: 'locked', ways: [open, locked] };
  }

  it('shows the first way not won, said of its way, and lists the ways', async () => {
    const { runtime, controller, last } = setUp();
    controller.run('wizard.move_right(6)');
    runtime.answer(twoWays());
    await vi.waitFor(() => expect(last().state).toBe('playing'));
    expect(last().ways).toEqual(['open', 'locked']);
    expect(last().way).toBe('locked');
    vi.advanceTimersByTime(400 * 2);
    expect(last().outcome).toMatchObject({ kind: 'incomplete', way: 'locked' });
    expect(last().goals).toEqual(['open']);
  });

  it('plays back another way, its goals and its card, and a won way is not a win', async () => {
    const { runtime, controller, last } = setUp();
    controller.run('wizard.move_right(6)');
    runtime.answer(twoWays());
    await vi.waitFor(() => expect(last().state).toBe('playing'));
    vi.advanceTimersByTime(400 * 2);
    controller.showWay('open');
    expect(last().way).toBe('open');
    expect(last().outcome).toBeNull();
    vi.advanceTimersByTime(400 * 6);
    expect(last().goals).toEqual(['met']);
    expect(last().outcome).toEqual({ kind: 'way_won', way: 'open' });
  });

  it('wins only when every way is won, and says so', async () => {
    const { runtime, controller, last } = setUp();
    controller.run('wizard.move_right(6)');
    const open = { ...world('won', moves(6), 6), id: 'open' };
    const also = { ...world('won', moves(6), 6), id: 'also' };
    runtime.answer({ ...open, status: 'won', way: 'open', ways: [open, also] });
    await vi.waitFor(() => expect(last().state).toBe('playing'));
    vi.advanceTimersByTime(400 * 6);
    expect(last().outcome).toEqual({ kind: 'won', way: 'open' });
  });
});


/** A scene that shows the level starting again, done when the test says (D75). */
class RestartingScene extends FakeScene {
  shows = 0;
  finish: (() => void) | null = null;
  restartShow(): Promise<void> {
    this.shows += 1;
    this.playback.reset();
    return new Promise((resolve) => {
      this.finish = resolve;
    });
  }
}

describe('RunController, the level starting again (D75)', () => {
  it('shows the level starting again before every run, and plays only once it is shown', async () => {
    const runtime = new FakeRuntime();
    const scene = new RestartingScene();
    const controller = new RunController({ runtime, level: LEVEL, speed: 1 });
    controller.attach(scene);
    controller.run('wizard.move_right()');
    expect(scene.shows).toBe(1);
    expect(controller.snapshot.restarting).toBe(true);
    // Python answers first: the run waits for the scene.
    runtime.answer(world('won', moves(2), 2));
    await Promise.resolve();
    await Promise.resolve();
    expect(controller.snapshot.state).not.toBe('playing');
    scene.finish?.();
    await vi.waitFor(() => expect(controller.snapshot.state).toBe('playing'));
    expect(controller.snapshot.restarting).toBe(false);
  });

  it('shows it on Restart too', () => {
    const runtime = new FakeRuntime();
    const scene = new RestartingScene();
    const controller = new RunController({ runtime, level: LEVEL, speed: 1 });
    controller.attach(scene);
    controller.restart();
    expect(scene.shows).toBe(1);
    expect(controller.snapshot.restarting).toBe(true);
  });
});
