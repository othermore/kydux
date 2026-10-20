import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FromWorker, ToWorker } from './protocol';
import { Runtime, type RuntimeStatus, type WorkerLike } from './runtime';

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

  ready(): void {
    this.answer({ type: 'ready', pythonVersion: '3.14.2', worldVersion: '0.0.1' });
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
    await expect(runtime.ready).resolves.toEqual({ pythonVersion: '3.14.2', worldVersion: '0.0.1' });

    const result = runtime.run('print(1 + 1)');
    await vi.waitFor(() => expect(worker.lastRun().code).toBe('print(1 + 1)'));
    worker.answer({ type: 'result', id: worker.lastRun().id, result: ok });
    await expect(result).resolves.toEqual(ok);
    expect(statuses).toEqual(['loading', 'ready', 'running', 'ready']);
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

  it('reports a failure to load', async () => {
    const { runtime, workers } = setUp(false);
    workers[0]!.answer({ type: 'load-error', message: 'no wasm' });
    await expect(runtime.ready).rejects.toThrow('no wasm');
    expect(runtime.status).toBe('failed');
  });
});
