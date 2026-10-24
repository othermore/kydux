// The playback of a run's events, tick by tick, at a speed the child chooses:
// each step plays every event of one tick, the wizard's and the actors'. A tick
// in which the wizard does something with its hands, casting or picking up,
// lasts LONG of a tick, so that it is seen through before the next step. It
// knows nothing of Phaser: the scene listens to it and draws.

import type { WorldEvent } from '../runtime/protocol';

/** What the playback plays: the world's events, one tick each. */
export type PlaybackEvent = WorldEvent;

/** How long a tick lasts in which the wizard casts or picks up, against a tick. */
export const LONG = 1.6;
/** The wizard's events that take a long tick. */
const HANDS = new Set(['cast', 'pick_up']);

/** How long a tick's events take, against a tick (LONG for the wizard's hands). */
export function lengthOf(events: PlaybackEvent[]): number {
  return events.some((event) => event.actor === 'wizard' && HANDS.has(event.kind)) ? LONG : 1;
}

export type PlaybackState = 'idle' | 'playing' | 'paused' | 'done';
export type Speed = 1 | 2 | 4;

export interface PlaybackOptions {
  /** How long one tick lasts at speed 1, in milliseconds. */
  tickMs: number;
  schedule?: (callback: () => void, ms: number) => unknown;
  cancel?: (handle: unknown) => void;
}

/** Called with tick 0 and no events at a reset, then with each tick and its events;
 * `instant` when the tick is replayed by a seek, to be drawn at once, without tweens. */
type TickListener = (tick: number, events: PlaybackEvent[], instant: boolean) => void;
type StateListener = (state: PlaybackState) => void;

export class Playback {
  readonly tickMs: number;
  private readonly schedule: (callback: () => void, ms: number) => unknown;
  private readonly cancel: (handle: unknown) => void;
  /** The run's events, one list for each tick, in order. */
  private ticks: PlaybackEvent[][] = [];
  private current = 0;
  private currentState: PlaybackState = 'idle';
  private multiplier: Speed = 1;
  private timer: unknown = null;
  private tickListeners: TickListener[] = [];
  private stateListeners: StateListener[] = [];

  constructor(options: PlaybackOptions) {
    this.tickMs = options.tickMs;
    this.schedule = options.schedule ?? ((callback, ms) => setTimeout(callback, ms));
    this.cancel =
      options.cancel ?? ((handle) => clearTimeout(handle as ReturnType<typeof setTimeout>));
  }

  get tick(): number {
    return this.current;
  }

  get state(): PlaybackState {
    return this.currentState;
  }

  /** How many ticks the run has. */
  get length(): number {
    return this.ticks.length;
  }

  get speed(): Speed {
    return this.multiplier;
  }

  /** How long a tick lasts at the speed now, for the scene's tweens. */
  get tickDuration(): number {
    return this.tickMs / this.multiplier;
  }

  /** New events to play, from tick 0. */
  load(events: PlaybackEvent[]): void {
    const byTick = new Map<number, PlaybackEvent[]>();
    for (const event of events) byTick.set(event.tick, [...(byTick.get(event.tick) ?? []), event]);
    this.ticks = [...byTick.keys()].sort((a, b) => a - b).map((tick) => byTick.get(tick) ?? []);
    this.reset();
  }

  play(): void {
    if (this.currentState === 'playing' || this.currentState === 'done') return;
    if (this.current >= this.ticks.length) {
      this.setState('done');
      return;
    }
    this.setState('playing');
    this.next();
  }

  pause(): void {
    if (this.currentState !== 'playing') return;
    this.clearTimer();
    this.setState('paused');
  }

  /** Ends the playback where it is. */
  stop(): void {
    if (this.currentState === 'done') return;
    this.clearTimer();
    this.setState('done');
  }

  /** Back to tick 0, idle, telling the listeners so that they draw the start. */
  reset(): void {
    this.clearTimer();
    this.current = 0;
    for (const listener of this.tickListeners) listener(0, [], false);
    this.setState('idle');
  }

  /** Shows the run as it was at `tick`: back to the start, every tick up to it
   * replayed at once, and paused there; play() goes on from it. */
  seek(tick: number): void {
    const target = Math.max(0, Math.min(Math.round(tick), this.ticks.length));
    this.clearTimer();
    this.current = 0;
    for (const listener of this.tickListeners) listener(0, [], true);
    for (let index = 0; index < target; index += 1) {
      this.current = index + 1;
      const events = this.ticks[index] ?? [];
      for (const listener of this.tickListeners) listener(this.current, events, true);
    }
    this.setState('paused');
  }

  /** From the next tick on. */
  setSpeed(multiplier: Speed): void {
    this.multiplier = multiplier;
  }

  onTick(listener: TickListener): () => void {
    this.tickListeners.push(listener);
    return () => {
      this.tickListeners = this.tickListeners.filter((l) => l !== listener);
    };
  }

  onState(listener: StateListener): () => void {
    this.stateListeners.push(listener);
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== listener);
    };
  }

  private next(): void {
    const events = this.ticks[this.current];
    if (!events) {
      this.setState('done');
      return;
    }
    this.current += 1;
    for (const listener of this.tickListeners) listener(this.current, events, false);
    this.timer = this.schedule(() => {
      this.timer = null;
      if (this.currentState === 'playing') this.next();
    }, this.tickDuration * lengthOf(events));
  }

  private clearTimer(): void {
    if (this.timer !== null) this.cancel(this.timer);
    this.timer = null;
  }

  private setState(state: PlaybackState): void {
    if (state === this.currentState) return;
    this.currentState = state;
    for (const listener of this.stateListeners) listener(state);
  }
}
