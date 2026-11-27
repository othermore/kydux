// The messages between the page and the worker that holds Python.

/** A level as its level.json says it; the world reads it. */
export type LevelJson = Record<string, unknown>;

/** What the course gives a level for the page alone, beside its JSON, which goes
 * to the world as it is: the concepts the course has taught up to it, which the
 * notebook follows (D60), absent for a level outside the course, which is shown as
 * one that knows them all; and the words given so far, which the notebook lists
 * (D80), while the world holds a level's own `words` to its own doors. */
export interface CourseGiven {
  concepts?: string[];
  knownWords: string[];
}

// A run is stopped through the shared interrupt buffer, or by ending the
// worker: while Python runs, the worker reads no messages.
export type ToWorker =
  | { type: 'load'; interruptBuffer?: SharedArrayBuffer }
  | { type: 'run'; id: number; code: string; level?: LevelJson };

export type FromWorker =
  | { type: 'ready'; pythonVersion: string; worldVersion: string; worldStamp: string }
  | { type: 'load-error'; message: string }
  | { type: 'result'; id: number; result: RunResult }
  | { type: 'crashed'; id: number; message: string };

/** What an error means, as the world explains it (kydux_world.explain). */
export interface Explanation {
  kind: string;
  params: Record<string, string | number>;
}

export interface ErrorInfo {
  type: string;
  message: string;
  line?: number | null;
  explanation?: Explanation | null;
}

export type WorldStatus =
  | 'won'
  | 'incomplete'
  | 'error'
  | 'too_many_ticks'
  | 'interrupted'
  | 'caught';

/** One tick of a run (kydux_world.world.Event.to_dict). Its data is the event's, as
 * architecture.md's table of events says: a flown `move` of the wizard's, for one,
 * says which step of its command it is and of how many (`step`, `steps`, D243). */
export interface WorldEvent {
  tick: number;
  actor: string;
  kind: string;
  data: Record<string, unknown>;
  line: number | null;
}

/** How a goal came out (kydux_world.goals.GoalResult.to_dict). */
export interface WorldGoal {
  kind: string;
  params: Record<string, unknown>;
  met: boolean;
  met_at_tick: number | null;
  failed: boolean;
  failed_at_tick: number | null;
  /** Not needed to win. */
  bonus: boolean;
  /** A reach goal not met that the wizard walked over on the way. */
  walked_over: boolean;
}

/** What the world says of a run in a level (kydux_world.run.RunResult.to_dict). */
export interface WorldResult {
  status: WorldStatus;
  events: WorldEvent[];
  goals: WorldGoal[];
  ticks: number;
  stdout: string;
  error: ErrorInfo | null;
  /** For a level played in several ways (D51): the way these fields are of, the
   * first not won or the first, and every way's own result. */
  way?: string;
  ways?: WayResult[];
  /** In a level with a familiar (D265): the trial the level is about, whether a familiar
   * was born, the trial's class as written, and the class the living familiar took. */
  familiar?: {
    trial: { kind: string; name?: string; color?: string } | null;
    born: boolean;
    source: string | null;
    learned: string | null;
  };
  /** In the birth level, whether the rehearsal passed (D268). */
  passes?: boolean;
  /** The game's advice for a run that did not win (kydux_world.advice, D349): each a
   * kind and its parameters, the first said under the outcome's words. */
  advice?: Explanation[];
}

/** One way's result, by the way's id. */
export type WayResult = Omit<WorldResult, 'way' | 'ways'> & { id: string };

/** Who stopped a run: the child, with Stop, or the clock, after its seconds (D177). */
export type InterruptedBy = 'child' | 'clock';

export interface RunResult {
  status: 'ok' | 'error' | 'interrupted';
  stdout: string;
  stderr: string;
  error?: ErrorInfo | null;
  durationMs: number;
  world?: WorldResult;
  /** For a run interrupted, who asked for it (D177). */
  interrupted_by?: InterruptedBy;
}

export interface RuntimeInfo {
  pythonVersion: string;
  worldVersion: string;
  /** The stamp of the world running, read from world.zip (scripts/stamp.mjs). */
  worldStamp: string;
}
