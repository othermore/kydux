// The playback of a run's events, one tick per event, at a speed the child
// chooses. It knows nothing of Phaser: the scene listens to it and draws.

import type { WorldEvent } from '../runtime/protocol';

/** What the playback plays: the world's events, one tick each. */
export type PlaybackEvent = WorldEvent;

export type PlaybackState = 'idle' | 'playing' | 'paused' | 'done';
export type Speed = 1 | 2 | 4;

export interface PlaybackOptions {
  /** How long one tick lasts at speed 1, in milliseconds. */
  tickMs: number;
  schedule?: (callback: () => void, ms: number) => unknown;
  cancel?: (handle: unknown) => void;
}

type TickListener = (tick: number, event: PlaybackEvent | null) => void;
type StateListener = (state: PlaybackState) => void;

export class Playback {
  readonly tickMs: number;
  private readonly schedule: (callback: () => void, ms: number) => unknown;
  private readonly cancel: (handle: unknown) => void;
  private events: PlaybackEvent[] = [];
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

  get length(): number {
    return this.events.length;
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
    this.events = [...events];
    this.reset();
  }

  play(): void {
    if (this.currentState === 'playing' || this.currentState === 'done') return;
    if (this.current >= this.events.length) {
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
    for (const listener of this.tickListeners) listener(0, null);
    this.setState('idle');
  }

  /** From the next tick on. */
  setSpeed(multiplier: Speed): void {
    this.multiplier = multiplier;
  }

  /** Called with tick 0 and no event at a reset, then with each tick and its event. */
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
    const event = this.events[this.current];
    if (!event) {
      this.setState('done');
      return;
    }
    this.current += 1;
    for (const listener of this.tickListeners) listener(this.current, event);
    this.timer = this.schedule(() => {
      this.timer = null;
      if (this.currentState === 'playing') this.next();
    }, this.tickDuration);
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
