// The page's side of Python: starts the worker, runs code in it one run at a
// time, and stops a run that goes on too long, in place through Pyodide's
// interrupt buffer when the page is isolated, else by starting a new worker.

import type { FromWorker, LevelJson, RunResult, RuntimeInfo, ToWorker } from './protocol';

export type RuntimeStatus = 'loading' | 'ready' | 'running' | 'restarting' | 'failed';

/** What the runtime needs of a worker, so that tests can give a fake one. */
export interface WorkerLike {
  postMessage(message: ToWorker): void;
  terminate(): void;
  onmessage: ((event: MessageEvent<FromWorker>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
}

export interface RuntimeOptions {
  /** How long a run may last before it is stopped, in milliseconds. */
  wallClockMs?: number;
  /** How long Python may take to load before it is given up on, in milliseconds. */
  loadTimeoutMs?: number;
  createWorker?: () => WorkerLike;
  /** Whether to share an interrupt buffer; by default, when the page is isolated. */
  isolated?: boolean;
}

const RUN_STATUSES = ['ok', 'error', 'interrupted'];
const WORLD_STATUSES = ['won', 'incomplete', 'error', 'too_many_ticks', 'interrupted'];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Whether a world's result has the shape the page plays back. */
export function isWorldResult(value: unknown): boolean {
  if (!isObject(value) || !WORLD_STATUSES.includes(value.status as string)) return false;
  const { events, goals } = value;
  return (
    Array.isArray(events) &&
    events.every(
      (e) => isObject(e) && typeof e.tick === 'number' && typeof e.kind === 'string' && isObject(e.data),
    ) &&
    Array.isArray(goals) &&
    goals.every((g) => isObject(g) && typeof g.met === 'boolean')
  );
}

/** Whether a worker's result has the shape of a RunResult, its world's too. */
export function isRunResult(value: unknown): value is RunResult {
  return (
    isObject(value) &&
    RUN_STATUSES.includes(value.status as string) &&
    typeof value.stdout === 'string' &&
    typeof value.stderr === 'string' &&
    typeof value.durationMs === 'number' &&
    (value.world === undefined || isWorldResult(value.world))
  );
}

/** SIGINT, which Pyodide turns into KeyboardInterrupt in the running code. */
const SIGINT = 2;
/** How long an interrupt in place may take before the worker is ended instead. */
const INTERRUPT_GRACE_MS = 2000;
/** Pyodide does not say when its WebAssembly fails to arrive: it waits forever.
 * A load that has not finished in this long is taken as failed. */
const LOAD_TIMEOUT_MS = 120_000;

function defaultWorker(): WorkerLike {
  return new Worker(new URL('./worker.ts', import.meta.url), {
    type: 'module',
  }) as unknown as WorkerLike;
}

interface Pending {
  id: number;
  resolve: (result: RunResult) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  started: number;
  interrupted: boolean;
}

export class Runtime {
  readonly wallClockMs: number;
  private readonly loadTimeoutMs: number;
  private readonly createWorker: () => WorkerLike;
  private readonly interruptBuffer: SharedArrayBuffer | null;
  private worker!: WorkerLike;
  private readyPromise!: Promise<RuntimeInfo>;
  private pending: Pending | null = null;
  /** A run asked for and not yet sent: Python may still be loading. */
  private reserved = false;
  private nextId = 1;
  private listeners: ((status: RuntimeStatus) => void)[] = [];
  private lastStatus: RuntimeStatus = 'loading';
  private lastInfo: RuntimeInfo | null = null;

  constructor(options: RuntimeOptions = {}) {
    this.wallClockMs = options.wallClockMs ?? 5000;
    this.loadTimeoutMs = options.loadTimeoutMs ?? LOAD_TIMEOUT_MS;
    this.createWorker = options.createWorker ?? defaultWorker;
    const isolated = options.isolated ?? globalThis.crossOriginIsolated === true;
    this.interruptBuffer =
      isolated && typeof SharedArrayBuffer !== 'undefined' ? new SharedArrayBuffer(4) : null;
    this.start('loading');
  }

  /** Resolves when Python is ready; a new promise after a restart. */
  get ready(): Promise<RuntimeInfo> {
    return this.readyPromise;
  }

  get status(): RuntimeStatus {
    return this.lastStatus;
  }

  get info(): RuntimeInfo | null {
    return this.lastInfo;
  }

  /** Whether a run that goes on too long is stopped in place, without a restart. */
  get interruptsInPlace(): boolean {
    return this.interruptBuffer !== null;
  }

  /** Calls `listener` with the status now and at every change; returns the way to stop. */
  onStatus(listener: (status: RuntimeStatus) => void): () => void {
    this.listeners.push(listener);
    listener(this.lastStatus);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  run(code: string, level?: LevelJson): Promise<RunResult> {
    if (this.pending || this.reserved) {
      return Promise.reject(new Error('a run is already going on'));
    }
    this.reserved = true;
    return this.ready.then(
      () =>
        new Promise<RunResult>((resolve, reject) => {
          this.reserved = false;
          const id = this.nextId++;
          const timer = setTimeout(() => this.interrupt(), this.wallClockMs);
          this.pending = { id, resolve, reject, timer, started: Date.now(), interrupted: false };
          this.setStatus('running');
          this.worker.postMessage(level ? { type: 'run', id, code, level } : { type: 'run', id, code });
        }),
      (error: unknown) => {
        this.reserved = false;
        throw error;
      },
    );
  }

  /** Stops the run going on, if any. */
  interrupt(): void {
    const pending = this.pending;
    if (!pending) return;
    // In place first; if Python has not stopped after a grace, as when it waits
    // in something that does not check for interrupts, the worker is ended.
    if (this.interruptBuffer && !pending.interrupted) {
      pending.interrupted = true;
      Atomics.store(new Int32Array(this.interruptBuffer), 0, SIGINT);
      clearTimeout(pending.timer);
      pending.timer = setTimeout(() => this.interrupt(), INTERRUPT_GRACE_MS);
      return;
    }
    this.finish({
      status: 'interrupted',
      stdout: '',
      stderr: '',
      durationMs: Date.now() - pending.started,
    });
    this.worker.terminate();
    this.start('restarting');
  }

  private start(status: 'loading' | 'restarting'): void {
    this.setStatus(status);
    this.worker = this.createWorker();
    this.readyPromise = new Promise<RuntimeInfo>((resolve, reject) => {
      const worker = this.worker;
      const giveUp = setTimeout(() => {
        worker.terminate();
        this.setStatus('failed');
        reject(new Error('Python did not finish loading'));
      }, this.loadTimeoutMs);
      this.worker.onmessage = (event) => {
        const message = event.data;
        if (message.type === 'ready' || message.type === 'load-error') clearTimeout(giveUp);
        switch (message.type) {
          case 'ready':
            this.lastInfo = {
              pythonVersion: message.pythonVersion,
              worldVersion: message.worldVersion,
            };
            this.setStatus('ready');
            resolve(this.lastInfo);
            break;
          case 'load-error':
            this.setStatus('failed');
            reject(new Error(message.message));
            break;
          case 'result':
            if (this.pending?.id !== message.id) break;
            if (isRunResult(message.result)) {
              this.finish(message.result);
            } else {
              this.fail(new Error('the worker answered with something that is not a result'));
            }
            break;
          case 'crashed':
            if (this.pending?.id === message.id) this.fail(new Error(message.message));
            break;
        }
      };
      this.worker.onerror = (event) => {
        clearTimeout(giveUp);
        const failure = new Error(event.message || 'the Python worker failed');
        const pending = this.pending;
        this.clearPending();
        this.setStatus('failed');
        reject(failure);
        pending?.reject(failure);
      };
    });
    // A failure to load is reported through the status; no caller may be waiting.
    this.readyPromise.catch(() => {});
    this.worker.postMessage(
      this.interruptBuffer ? { type: 'load', interruptBuffer: this.interruptBuffer } : { type: 'load' },
    );
  }

  private finish(result: RunResult): void {
    const pending = this.pending;
    if (!pending) return;
    this.clearPending();
    this.setStatus('ready');
    pending.resolve(result);
  }

  /** The run going on could not be run: its promise rejects, and Python is ready again. */
  private fail(error: Error): void {
    const pending = this.pending;
    if (!pending) return;
    this.clearPending();
    this.setStatus('ready');
    pending.reject(error);
  }

  private clearPending(): void {
    if (this.pending) clearTimeout(this.pending.timer);
    this.pending = null;
  }

  private setStatus(status: RuntimeStatus): void {
    this.lastStatus = status;
    for (const listener of this.listeners) listener(status);
  }
}
