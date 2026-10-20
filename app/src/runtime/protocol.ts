// The messages between the page and the worker that holds Python.

/** A level as its level.json says it; the world reads it. */
export type LevelJson = Record<string, unknown>;

// A run is stopped through the shared interrupt buffer, or by ending the
// worker: while Python runs, the worker reads no messages.
export type ToWorker =
  | { type: 'load'; interruptBuffer?: SharedArrayBuffer }
  | { type: 'run'; id: number; code: string; level?: LevelJson };

export type FromWorker =
  | { type: 'ready'; pythonVersion: string; worldVersion: string }
  | { type: 'load-error'; message: string }
  | { type: 'result'; id: number; result: RunResult }
  | { type: 'crashed'; id: number; message: string };

export interface ErrorInfo {
  type: string;
  message: string;
  line?: number | null;
}

/** What the world says of a run in a level (kydux_world.run.RunResult.to_dict). */
export type WorldResult = Record<string, unknown>;

export interface RunResult {
  status: 'ok' | 'error' | 'interrupted';
  stdout: string;
  stderr: string;
  error?: ErrorInfo | null;
  durationMs: number;
  world?: WorldResult;
}

export interface RuntimeInfo {
  pythonVersion: string;
  worldVersion: string;
}
