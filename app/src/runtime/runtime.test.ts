import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FromWorker, ToWorker } from './protocol';
import { isRunResult, isWorldResult, Runtime, type RuntimeStatus, type WorkerLike } from './runtime';

/** The stamp of the world the tests' page is built with. */
const STAMP = 'cdc7d1ab9503';

class FakeWorker implements WorkerLike {
  sent: ToWorker[] = [];
  terminated = false;
  onmessage: ((event: MessageEvent<FromWorker>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;

  postMessage(message: ToWorker): void {
    this.sent.push(message);
  }

  terminate(): void {
    this.terminated = true;
  }

  answer(message: FromWorker): void {
    this.onmessage?.({ data: message } as MessageEvent<FromWorker>);
  }

  ready(worldStamp = STAMP): void {
    this.answer({ type: 'ready', pythonVersion: '3.14.2', worldVersion: '0.0.1', worldStamp });
  }

  lastRun(): Extract<ToWorker, { type: 'run' }> {
    const run = this.sent.filter((m) => m.type === 'run').at(-1);
    if (!run || run.type !== 'run') throw new Error('no run was sent');
    return run;
  }
}

function setUp(isolated: boolean) {
  const workers: FakeWorker[] = [];
  const statuses: RuntimeStatus[] = [];
  const runtime = new Runtime({
    isolated,
    wallClockMs: 5000,
    stamp: STAMP,
    createWorker: () => {
      const worker = new FakeWorker();
      workers.push(worker);
      return worker;
    },
  });
  runtime.onStatus((s) => statuses.push(s));
  return { runtime, workers, statuses };
}

const ok = { status: 'ok' as const, stdout: '2\n', stderr: '', durationMs: 1 };

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('Runtime', () => {
  it('loads, becomes ready, and runs code', async () => {
    const { runtime, workers, statuses } = setUp(false);
    const worker = workers[0]!;
    expect(worker.sent[0]).toEqual({ type: 'load' });
    worker.ready();
    await expect(runtime.ready).resolves.toEqual({ pythonVersion: '3.14.2', worldVersion: '0.0.1', worldStamp: STAMP });

    const result = runtime.run('print(1 + 1)');
    await vi.waitFor(() => expect(worker.lastRun().code).toBe('print(1 + 1)'));
    worker.answer({ type: 'result', id: worker.lastRun().id, result: ok });
    await expect(result).resolves.toEqual(ok);
    expect(statuses).toEqual(['loading', 'ready', 'running', 'ready']);
  });

  it('refuses to run a world whose stamp is not the page\'s, and says it is stale', async () => {
    const { runtime, workers, statuses } = setUp(false);
    workers[0]!.ready('0123456789ab');
    await expect(runtime.ready).rejects.toThrow(/not the page's cdc7d1ab9503/);
    expect(statuses.at(-1)).toBe('stale');
    expect(runtime.info?.worldStamp).toBe('0123456789ab');
    await expect(runtime.run('print(2)')).rejects.toThrow();
    expect(workers[0]!.sent.filter((m) => m.type === 'run')).toEqual([]);
  });

  it('refuses a second run asked for while Python still loads', async () => {
    const { runtime, workers } = setUp(false);
    const first = runtime.run('print(1)');
    await expect(runtime.run('print(2)')).rejects.toThrow();
    workers[0]!.ready();
    const worker = workers[0]!;
    await vi.waitFor(() => expect(worker.sent.filter((m) => m.type === 'run')).toHaveLength(1));
    worker.answer({ type: 'result', id: worker.lastRun().id, result: ok });
    await expect(first).resolves.toEqual(ok);
  });

  it('lets a run be asked for again after one that could not start', async () => {
    const { runtime, workers } = setUp(false);
    const first = runtime.run('print(1)');
    workers[0]!.answer({ type: 'load-error', message: 'no wasm' });
    await expect(first).rejects.toThrow('no wasm');
    await expect(runtime.run('print(2)')).rejects.toThrow('no wasm');
  });

  it('answers a pending run when the worker itself fails', async () => {
    const { runtime, workers } = setUp(false);
    const worker = workers[0]!;
    worker.ready();
    const result = runtime.run('print(1)');
    await vi.waitFor(() => expect(runtime.status).toBe('running'));
    worker.onerror?.({ message: 'out of memory' } as ErrorEvent);
    await expect(result).rejects.toThrow('out of memory');
    expect(runtime.status).toBe('failed');
  });

  it('refuses a second run while one goes on', async () => {
    const { runtime, workers } = setUp(false);
    workers[0]!.ready();
    void runtime.run('while True: pass');
    await vi.waitFor(() => expect(runtime.status).toBe('running'));
    await expect(runtime.run('print(1)')).rejects.toThrow();
  });

  it('interrupts in place when isolated, through the shared buffer', async () => {
    const { runtime, workers } = setUp(true);
    const worker = workers[0]!;
    const load = worker.sent[0];
    expect(load?.type === 'load' && load.interruptBuffer).toBeInstanceOf(SharedArrayBuffer);
    const buffer = new Int32Array((load as { interruptBuffer: SharedArrayBuffer }).interruptBuffer);
    worker.ready();

    const result = runtime.run('while True: pass');
    await vi.waitFor(() => expect(runtime.status).toBe('running'));
    vi.advanceTimersByTime(5000);
    expect(Atomics.load(buffer, 0)).toBe(2);
    worker.answer({
      type: 'result',
      id: worker.lastRun().id,
      result: { status: 'interrupted', stdout: '', stderr: '', durationMs: 5000 },
    });
    await expect(result).resolves.toMatchObject({ status: 'interrupted' });
    expect(worker.terminated).toBe(false);
    expect(workers).toHaveLength(1);
  });

  it('ends the worker when an interrupt in place is not heard', async () => {
    const { runtime, workers } = setUp(true);
    workers[0]!.ready();
    const result = runtime.run('import time; time.sleep(60)');
    await vi.waitFor(() => expect(runtime.status).toBe('running'));
    vi.advanceTimersByTime(5000 + 2000);
    await expect(result).resolves.toMatchObject({ status: 'interrupted' });
    expect(workers[0]!.terminated).toBe(true);
    expect(workers).toHaveLength(2);
  });

  it('restarts the worker when not isolated', async () => {
    const { runtime, workers, statuses } = setUp(false);
    workers[0]!.ready();
    const result = runtime.run('while True: pass');
    await vi.waitFor(() => expect(runtime.status).toBe('running'));
    vi.advanceTimersByTime(5000);
    await expect(result).resolves.toMatchObject({ status: 'interrupted' });
    expect(workers[0]!.terminated).toBe(true);
    expect(workers).toHaveLength(2);
    expect(statuses.at(-1)).toBe('restarting');

    workers[1]!.ready();
    await expect(runtime.ready).resolves.toMatchObject({ pythonVersion: '3.14.2' });
    expect(statuses.at(-1)).toBe('ready');
  });

  it('rejects a run the worker could not run, and is ready again', async () => {
    const { runtime, workers } = setUp(false);
    const worker = workers[0]!;
    worker.ready();
    const result = runtime.run('print(1)');
    await vi.waitFor(() => expect(runtime.status).toBe('running'));
    worker.answer({ type: 'crashed', id: worker.lastRun().id, message: 'bad JSON' });
    await expect(result).rejects.toThrow('bad JSON');
    expect(runtime.status).toBe('ready');
  });

  it('gives up on a load that never finishes', async () => {
    const workers: FakeWorker[] = [];
    const runtime = new Runtime({
      isolated: false,
      loadTimeoutMs: 1000,
      createWorker: () => {
        const worker = new FakeWorker();
        workers.push(worker);
        return worker;
      },
    });
    const ready = runtime.ready;
    vi.advanceTimersByTime(1000);
    await expect(ready).rejects.toThrow('did not finish loading');
    expect(runtime.status).toBe('failed');
    expect(workers[0]!.terminated).toBe(true);
  });

  it('reports a failure to load', async () => {
    const { runtime, workers } = setUp(false);
    workers[0]!.answer({ type: 'load-error', message: 'no wasm' });
    await expect(runtime.ready).rejects.toThrow('no wasm');
    expect(runtime.status).toBe('failed');
  });
});

describe('the worker\'s answers', () => {
  const world = {
    status: 'won',
    events: [{ tick: 1, actor: 'wizard', kind: 'move', data: {}, line: 1 }],
    goals: [
      {
        kind: 'reach',
        params: {},
        met: true,
        met_at_tick: 1,
        failed: false,
        failed_at_tick: null,
        bonus: false,
        walked_over: false,
      },
    ],
    ticks: 1,
    stdout: '',
    error: null,
  };

  it('take a result and a world of the right shape', () => {
    expect(isRunResult(ok)).toBe(true);
    expect(isRunResult({ ...ok, world })).toBe(true);
    expect(isWorldResult(world)).toBe(true);
  });

  it.each([
    ['nothing', null],
    ['a status unknown', { ...ok, status: 'won' }],
    ['no stdout', { status: 'ok', stderr: '', durationMs: 1 }],
    ['a world with an unknown status', { ...ok, world: { ...world, status: 'cheated' } }],
    ['a world without events', { ...ok, world: { ...world, events: 'all of them' } }],
    ['an event without a tick', { ...ok, world: { ...world, events: [{ kind: 'move', data: {} }] } }],
    ['a goal without met', { ...ok, world: { ...world, goals: [{ kind: 'reach' }] } }],
    [
      'a goal without bonus',
      { ...ok, world: { ...world, goals: [{ ...world.goals[0], bonus: undefined }] } },
    ],
  ])('refuse %s', (_, value) => {
    expect(isRunResult(value)).toBe(false);
  });

  it('turn a result of the wrong shape into a failed run', async () => {
    const { runtime, workers } = setUp(false);
    const worker = workers[0]!;
    worker.ready();
    const result = runtime.run('print(1)');
    await vi.waitFor(() => expect(runtime.status).toBe('running'));
    worker.answer({ type: 'result', id: worker.lastRun().id, result: { won: true } as never });
    await expect(result).rejects.toThrow('not a result');
    expect(runtime.status).toBe('ready');
  });
});
