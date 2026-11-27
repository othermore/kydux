// The run of a level, apart from the DOM (D29): what state a run is in, what
// each button does, and what the screen should show, as a snapshot the level
// screen renders. It holds no words: an outcome is data, said by the card in
// the language of the moment, so that a change of language needs no new run. A run's
// end sounds when its playback has played its last tick, `win` for a run won and
// `fail` for any other, while the card still waits for the words (D247); a run with no
// playback sounds with its card, and a run stopped has no sound.

import type { LoadedLevel } from '../content/levels';
import type { Playback, Speed } from '../engine/playback';
import { play } from '../engine/sfx';
import type { InterruptedBy, LevelJson, RunResult, WayResult, WorldResult } from '../runtime/protocol';
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
   * way shown, for ?debug's select (D204). */
  ways: string[];
  way: string | null;
  /** What the card says, or null while it is hidden. */
  outcome: Outcome | null;
  /** Whether the run's end has sounded, when its playback ended (D247): the card then
   * shows with no sound. */
  sounded: boolean;
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
  /** Whether the scene is showing the level starting again, before a run (D75). */
  restarting: boolean;
}

/** What the controller needs of the runtime, so that tests can give a fake. */
export interface RuntimeLike {
  readonly status: RuntimeStatus;
  readonly wallClockMs: number;
  run(code: string, level?: LevelJson): Promise<RunResult>;
  interrupt(by?: InterruptedBy): void;
  onStatus(listener: (status: RuntimeStatus) => void): () => void;
}

/** What the controller needs of the scene. */
export interface SceneLike {
  readonly playback: Playback;
  load(world: WorldResult, way?: string | null): void;
  reset(): void;
  /** Shows the level starting again: fades out, puts everything back, calls `ready`
   * and waits for it while nothing is seen, then fades in, and resolves once it is
   * shown (D75, D121); a scene without it is only reset. */
  restartShow?(ready?: () => Promise<void>): Promise<void>;
  /** The level's first way on the scene again, as it opens (D204). */
  firstWay?(): void;
  /** A run played out, the wizard celebrating it when it is `won` (14.3): how long the
   * outcome waits, for the celebration and for the words on the scene to be read to
   * their end (D175); a scene without it shows the outcome at once. */
  settle?(won: boolean): number;
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
  /** The way on the screen before a run: the level's first until a run shows another,
   * and again once the level starts over (D204); null for the first. */
  private onScreenWay: string | null = null;
  /** Whether the last run's way is not the one that was on the screen before it. */
  private wayChanged = false;
  private outcome: Outcome | null = null;
  private runningLine: number | null = null;
  private errorLine: number | null = null;
  private tick = 0;
  private speed: Speed;
  /** Bumped at every run and restart, so that a run's late answer is dropped. */
  private generation = 0;
  /** Whether the scene is showing the level starting again (D75). */
  private restarting = false;
  /** Whether the child stopped this run with Stop: it ends with no outcome (D177). */
  private stopped = false;
  /** Whether this run's end has sounded, when its playback ended (D247). */
  private sounded = false;
  private listeners: ((snapshot: RunSnapshot) => void)[] = [];
  private unsubscribe: (() => void)[] = [];

  constructor(parts: { runtime: RuntimeLike; level: LoadedLevel; speed: Speed }) {
    this.runtime = parts.runtime;
    this.level = parts.level;
    this.speed = parts.speed;
    this.unsubscribe.push(
      this.runtime.onStatus((status) => {
        // A world that is not the page's runs nothing, as Python that did not start.
        if ((status === 'failed' || status === 'stale') && this.outcome?.kind !== 'failed') {
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
        if (state === 'done' && this.world) this.done(scene);
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
      canRun: this.scene !== null && this.runtime.status === 'ready' && !this.restarting,
      canStop: state === 'running' || state === 'playing',
      canPlay: state === 'paused',
      canSeek:
        this.world !== null &&
        (this.scene?.playback.length ?? 0) > 0 &&
        state !== 'running' &&
        !this.restarting,
      restarting: this.restarting,
      sounded: this.sounded,
    };
  }

  run(code: string): void {
    const scene = this.scene;
    if (!scene || this.runtime.status !== 'ready') return;
    if (scene.playback.state === 'playing') scene.playback.stop();
    this.clear();
    const generation = ++this.generation;
    const ran = this.runtime.run(code, this.level.level);
    // The level starts again on the scene while Python runs, and stays out of sight
    // until the way to show is known and its places are taken (D121); the run plays
    // once both are done, so that a run is never seen to go on from the one before.
    const placed = () =>
      ran.then(
        (result) => {
          if (generation === this.generation && !this.stoppedBy(result)) this.take(result);
        },
        () => undefined,
      );
    const shown = this.startAgain(scene, generation, placed);
    Promise.all([ran, shown]).then(
      ([result]) => {
        if (generation !== this.generation) return;
        if (this.stoppedBy(result)) {
          this.halt();
          return;
        }
        if (!result.world) {
          this.world = emptyWorld(result.status === 'interrupted' ? 'interrupted' : 'error', result);
          this.finish();
          return;
        }
        this.start();
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

  /** Plays back one way of the last run (D51), the goals and the card following it:
   * ?debug's select (D204). */
  showWay(id: string): void {
    const way = this.result?.ways?.find((entry) => entry.id === id);
    if (!way || !this.scene) return;
    if (this.scene.playback.state === 'playing') this.scene.playback.stop();
    this.shownWay = id;
    this.onScreenWay = id;
    this.wayChanged = false;
    this.outcome = null;
    this.errorLine = null;
    this.tick = 0;
    this.scene.reset();
    this.play(way);
  }

  /** Stop, pressed by the child: the program interrupted, or the playback ended where
   * it is, with no outcome either way (D177). */
  stop(): void {
    this.stopped = true;
    if (this.runtime.status === 'running') this.runtime.interrupt('child');
    else this.scene?.playback.stop();
  }

  restart(): void {
    this.generation += 1;
    // Started over, the level is on its first way again (D204).
    this.onScreenWay = null;
    this.scene?.firstWay?.();
    if (this.scene) void this.startAgain(this.scene, this.generation, () => Promise.resolve());
    this.clear();
    this.changed();
  }

  /** The scene put back where the level starts, shown as it is done (D75), `ready`
   * awaited while it is out of sight (D121): no run starts while it is shown, and a
   * showing from a run or restart since is left to the later one. */
  private startAgain(
    scene: SceneLike,
    generation: number,
    ready: () => Promise<void>,
  ): Promise<void> {
    if (!scene.restartShow) {
      scene.reset();
      return ready();
    }
    this.restarting = true;
    this.changed();
    return scene.restartShow(ready).then(() => {
      if (generation !== this.generation) return;
      this.restarting = false;
      this.changed();
    });
  }

  /** Shows the run as it was at a tick, paused there (the timeline). */
  seek(tick: number): void {
    if (!this.scene || !this.world) return;
    this.scene.playback.seek(tick);
    this.changed();
  }

  /** A run's result kept, and the world to show loaded into the scene, its way's
   * places taken (D51, D121). */
  private take(result: RunResult): void {
    const world = result.world;
    if (!world) return;
    this.result = world;
    const shown = world.ways?.find((way) => way.id === world.way);
    this.shownWay = shown?.id ?? null;
    // Told when the way the run shows is not the one on the screen before it (D204).
    const before = this.onScreenWay ?? world.ways?.[0]?.id ?? null;
    this.wayChanged = shown !== undefined && shown.id !== before;
    if (shown) this.onScreenWay = shown.id;
    this.load(shown ?? world);
  }

  private load(world: WorldResult | WayResult): void {
    this.world = world as WorldResult;
    this.scene?.load(this.world, this.shownWay);
  }

  /** Plays the world loaded from its start. */
  private start(): void {
    const scene = this.scene;
    if (!scene || !this.world) return;
    scene.playback.setSpeed(this.speed);
    if (this.world.events.length === 0) this.finish();
    else scene.playback.play();
    this.changed();
  }

  /** Loads a world into the scene and plays it from the start. */
  private play(world: WorldResult | WayResult): void {
    this.load(world);
    this.start();
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
    if (status === 'failed' || status === 'stale') return 'failed';
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

  /** Whether a run's answer is of a run the child stopped: Stop pressed while it ran,
   * whatever it came back with, or a run interrupted by the child (D177). */
  private stoppedBy(result: RunResult): boolean {
    return this.stopped || result.interrupted_by === 'child';
  }

  /** A run the child stopped ends here: no outcome, no goal met or failed, nothing to
   * seek, and the scene left as it is, ready to run again from the start (D177). */
  private halt(): void {
    this.result = null;
    this.world = null;
    this.shownWay = null;
    this.outcome = this.runtime.status === 'failed' ? { kind: 'failed' } : null;
    this.runningLine = null;
    this.errorLine = null;
    this.changed();
  }

  /** The run played out: a run won is celebrated first, and any run's last words are
   * read to their end, its outcome after them, unless another run or a restart came
   * meanwhile (D175); a playback the child stopped finishes nothing (D177). */
  private done(scene: SceneLike): void {
    if (this.stopped) {
      this.halt();
      return;
    }
    // The run's end sounds now, as its last tick is played; the card waits (D247). A
    // playback cut short by a new run has played no end.
    if (this.world && scene.playback.tick >= scene.playback.length) {
      play(this.outcomeOf(this.world).kind === 'won' ? 'win' : 'fail');
      this.sounded = true;
    }
    const wait = scene.settle?.(this.world?.status === 'won') ?? 0;
    if (wait <= 0) {
      this.finish();
      return;
    }
    const generation = this.generation;
    setTimeout(() => {
      if (generation !== this.generation) return;
      this.finish();
      this.changed();
    }, wait);
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
    this.stopped = false;
    this.sounded = false;
    this.result = null;
    this.world = null;
    this.shownWay = null;
    this.outcome = this.runtime.status === 'failed' ? { kind: 'failed' } : null;
    this.runningLine = null;
    this.errorLine = null;
    this.tick = 0;
  }

  /** The outcome of the world shown; with ways (D51), `won` only when every way is,
   * `way_won` for a way won while another is not (?debug's select), and a run whose way
   * is not the one on the screen before it `changed` (D204). */
  private outcomeOf(world: WorldResult): Outcome {
    const told = this.outcomeOfOne(world);
    // The game's first advice, for a run that did not win (D349).
    const advice = told.kind !== 'won' ? world.advice?.[0] : undefined;
    const said: Outcome = advice ? { ...told, advice } : told;
    if (this.shownWay === null) return said;
    if (said.kind === 'won') return this.result?.status === 'won' ? said : { kind: 'way_won' };
    return this.wayChanged ? { ...said, changed: true } : said;
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
          ...(needed.some((g) => g.walked_over) ? { walkedOver: true } : {}),
          blocked:
            first && first.line !== null
              ? {
                  line: first.line,
                  reason: String(first.data.reason),
                  thing: things.find((thing) => thing.id === first.data.by)?.kind ?? null,
                  ...(typeof first.data.spell === 'string' ? { spell: first.data.spell } : {}),
                  ...(Array.isArray(first.data.things) ? { things: first.data.things.map(String) } : {}),
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
