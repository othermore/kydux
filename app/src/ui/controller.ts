// The run of a level, apart from the DOM (D29): what state a run is in, what
// each button does, and what the screen should show, as a snapshot the level
// screen renders. It holds no words: an outcome is data, said by the card in
// the language of the moment, so that a change of language needs no new run.

import type { LoadedLevel } from '../content/levels';
import type { Playback, Speed } from '../engine/playback';
import type { LevelJson, RunResult, WayResult, WorldResult } from '../runtime/protocol';
import type { RuntimeStatus } from '../runtime/runtime';
import type { GoalMark } from './goals';
import type { Outcome } from './outcome';

export type RunState =
  | 'loading'
  | 'ready'
  | 'running'
  | 'playing'
  | 'paused'
  | 'done'
  | 'failed';

export interface RunSnapshot {
  state: RunState;
  /** The runtime's own status, for the status line. */
  runtime: RuntimeStatus;
  /** The last run's world, the way shown of a level with ways, or null before a run
   * and after a restart. */
  world: WorldResult | null;
  /** The ids of the last run's ways (D51), empty for a level played one way, and the
   * way shown. */
  ways: string[];
  way: string | null;
  /** What the card says, or null while it is hidden. */
  outcome: Outcome | null;
  /** What the child's code printed in the last run. */
  printed: string;
  runningLine: number | null;
  errorLine: number | null;
  /** One mark for each goal, at the tick being shown. */
  goals: GoalMark[];
  /** The tick being shown, and how many the run has. */
  tick: number;
  length: number;
  speed: Speed;
  canRun: boolean;
  canStop: boolean;
  /** Whether a playback paused by the timeline can go on. */
  canPlay: boolean;
  /** Whether the timeline can be dragged: there is a run to show. */
  canSeek: boolean;
}

/** What the controller needs of the runtime, so that tests can give a fake. */
export interface RuntimeLike {
  readonly status: RuntimeStatus;
  readonly wallClockMs: number;
  run(code: string, level?: LevelJson): Promise<RunResult>;
  interrupt(): void;
  onStatus(listener: (status: RuntimeStatus) => void): () => void;
}

/** What the controller needs of the scene. */
export interface SceneLike {
  readonly playback: Playback;
  load(world: WorldResult): void;
  reset(): void;
}

const DEFAULT_TICK_LIMIT = 1000;

/** A world for a run that came back without one, as when the worker was ended. */
function emptyWorld(status: WorldResult['status'], result: Partial<RunResult>): WorldResult {
  return {
    status,
    events: [],
    goals: [],
    ticks: 0,
    stdout: result.stdout ?? '',
    error: result.error ?? null,
  };
}

export class RunController {
  private readonly runtime: RuntimeLike;
  private readonly level: LoadedLevel;
  private scene: SceneLike | null = null;
  /** The last run's result as the world gave it, every way's within it. */
  private result: WorldResult | null = null;
  /** The world shown: the result's own, or one of its ways'. */
  private world: WorldResult | null = null;
  private shownWay: string | null = null;
  private outcome: Outcome | null = null;
  private runningLine: number | null = null;
  private errorLine: number | null = null;
  private tick = 0;
  private speed: Speed;
  /** Bumped at every run and restart, so that a run's late answer is dropped. */
  private generation = 0;
  private listeners: ((snapshot: RunSnapshot) => void)[] = [];
  private unsubscribe: (() => void)[] = [];

  constructor(parts: { runtime: RuntimeLike; level: LoadedLevel; speed: Speed }) {
    this.runtime = parts.runtime;
    this.level = parts.level;
    this.speed = parts.speed;
    this.unsubscribe.push(
      this.runtime.onStatus((status) => {
        if (status === 'failed' && this.outcome?.kind !== 'failed') {
          this.outcome = { kind: 'failed' };
        }
        this.changed();
      }),
    );
  }

  /** The scene, once it is drawn: until then a run cannot start. */
  attach(scene: SceneLike): void {
    this.scene = scene;
    scene.playback.setSpeed(this.speed);
    this.unsubscribe.push(
      scene.playback.onTick((tick, events) => {
        this.tick = tick;
        this.runningLine = events[0]?.line ?? null;
        this.changed();
      }),
      scene.playback.onState((state) => {
        if (state === 'done' && this.world) this.finish();
        this.changed();
      }),
    );
    this.changed();
  }

  get snapshot(): RunSnapshot {
    const state = this.state();
    return {
      state,
      runtime: this.runtime.status,
      world: this.world,
      ways: this.result?.ways?.map((way) => way.id) ?? [],
      way: this.shownWay,
      outcome: this.outcome,
      printed: this.outcome ? (this.world?.stdout ?? '') : '',
      runningLine: this.runningLine,
      errorLine: this.errorLine,
      goals: this.marks(),
      tick: this.tick,
      length: this.scene?.playback.length ?? 0,
      speed: this.speed,
      canRun: this.scene !== null && this.runtime.status === 'ready',
      canStop: state === 'running' || state === 'playing',
      canPlay: state === 'paused',
      canSeek:
        this.world !== null && (this.scene?.playback.length ?? 0) > 0 && state !== 'running',
    };
  }

  run(code: string): void {
    const scene = this.scene;
    if (!scene || this.runtime.status !== 'ready') return;
    if (scene.playback.state === 'playing') scene.playback.stop();
    this.clear();
    scene.reset();
    const generation = ++this.generation;
    this.runtime.run(code, this.level.level).then(
      (result) => {
        if (generation !== this.generation) return;
        const world = result.world;
        if (!world) {
          this.world = emptyWorld(result.status === 'interrupted' ? 'interrupted' : 'error', result);
          this.finish();
          return;
        }
        this.result = world;
        const shown = world.ways?.find((way) => way.id === world.way);
        this.shownWay = shown?.id ?? null;
        this.play(shown ?? world);
      },
      (error: unknown) => {
        if (generation !== this.generation || this.runtime.status === 'failed') return;
        // The worker could not run the code at all: its message is shown as an
        // error, and Run is ready again.
        const message = error instanceof Error ? error.message : String(error);
        this.world = emptyWorld('error', { error: { type: 'Error', message } });
        this.finish();
      },
    );
    this.changed();
  }

  /** Plays back one way of the last run (D51), the goals and the card following it. */
  showWay(id: string): void {
    const way = this.result?.ways?.find((entry) => entry.id === id);
    if (!way || !this.scene) return;
    if (this.scene.playback.state === 'playing') this.scene.playback.stop();
    this.shownWay = id;
    this.outcome = null;
    this.errorLine = null;
    this.tick = 0;
    this.scene.reset();
    this.play(way);
  }

  stop(): void {
    if (this.runtime.status === 'running') this.runtime.interrupt();
    else this.scene?.playback.stop();
  }

  restart(): void {
    this.generation += 1;
    this.scene?.playback.reset();
    this.clear();
    this.changed();
  }

  /** Shows the run as it was at a tick, paused there (the timeline). */
  seek(tick: number): void {
    if (!this.scene || !this.world) return;
    this.scene.playback.seek(tick);
    this.changed();
  }

  /** Loads a world into the scene and plays it from the start. */
  private play(world: WorldResult | WayResult): void {
    const scene = this.scene;
    if (!scene) return;
    this.world = world as WorldResult;
    scene.load(this.world);
    scene.playback.setSpeed(this.speed);
    if (world.events.length === 0) this.finish();
    else scene.playback.play();
    this.changed();
  }

  /** Goes on from where a seek left the playback. */
  resume(): void {
    if (this.scene?.playback.state === 'paused') this.scene.playback.play();
    this.changed();
  }

  setSpeed(speed: Speed): void {
    this.speed = speed;
    this.scene?.playback.setSpeed(speed);
    this.changed();
  }

  onChange(listener: (snapshot: RunSnapshot) => void): () => void {
    this.listeners.push(listener);
    listener(this.snapshot);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  destroy(): void {
    this.generation += 1;
    for (const stop of this.unsubscribe) stop();
    this.unsubscribe = [];
    this.listeners = [];
  }

  private state(): RunState {
    const status = this.runtime.status;
    if (status === 'failed') return 'failed';
    if (!this.scene || status === 'loading' || status === 'restarting') return 'loading';
    if (status === 'running') return 'running';
    if (this.scene.playback.state === 'playing') return 'playing';
    if (this.scene.playback.state === 'paused') return 'paused';
    return this.outcome ? 'done' : 'ready';
  }

  private marks(): GoalMark[] {
    const goals = (this.level.level.goals as unknown[] | undefined) ?? [];
    if (!this.world || this.world.goals.length === 0) return goals.map(() => 'open');
    const reached = (at: number | null) => at !== null && this.tick >= at;
    return this.world.goals.map((goal) =>
      reached(goal.failed_at_tick) ? 'failed' : reached(goal.met_at_tick) ? 'met' : 'open',
    );
  }

  private finish(): void {
    const world = this.world;
    if (!world) return;
    this.runningLine = null;
    this.outcome = this.outcomeOf(world);
    this.errorLine = world.status === 'error' ? (world.error?.line ?? null) : null;
    this.changed();
  }

  private clear(): void {
    this.result = null;
    this.world = null;
    this.shownWay = null;
    this.outcome = this.runtime.status === 'failed' ? { kind: 'failed' } : null;
    this.runningLine = null;
    this.errorLine = null;
    this.tick = 0;
  }

  /** The outcome of the world shown; with ways, said of its way (D51): `won` only when
   * every way is, `way_won` for a way won while another is not. */
  private outcomeOf(world: WorldResult): Outcome {
    const said = this.outcomeOfOne(world);
    if (this.shownWay === null) return said;
    if (said.kind === 'won' && this.result?.status !== 'won') {
      return { kind: 'way_won', way: this.shownWay };
    }
    return { ...said, way: this.shownWay };
  }

  private outcomeOfOne(world: WorldResult): Outcome {
    switch (world.status) {
      case 'won':
        return { kind: 'won' };
      case 'incomplete': {
        const needed = world.goals.filter((g) => !g.bonus);
        const first = world.events.find((e) => e.actor === 'wizard' && e.kind === 'blocked');
        const things = (this.level.level.things as { id: string; kind: string }[] | undefined) ?? [];
        return {
          kind: 'incomplete',
          met: needed.filter((g) => g.met).length,
          total: needed.length,
          blocked:
            first && first.line !== null
              ? {
                  line: first.line,
                  reason: String(first.data.reason),
                  thing: things.find((thing) => thing.id === first.data.by)?.kind ?? null,
                  ...(typeof first.data.spell === 'string' ? { spell: first.data.spell } : {}),
                }
              : undefined,
        };
      }
      case 'too_many_ticks':
        return {
          kind: 'too_many_ticks',
          limit: Number(this.level.level.tick_limit ?? DEFAULT_TICK_LIMIT),
        };
      case 'interrupted':
        return { kind: 'interrupted', seconds: Math.round(this.runtime.wallClockMs / 1000) };
      case 'caught':
        return { kind: 'caught' };
      case 'error':
        return { kind: 'error', error: world.error ?? { type: 'Error', message: '' } };
    }
  }

  private changed(): void {
    const snapshot = this.snapshot;
    for (const listener of this.listeners) listener(snapshot);
  }
}
