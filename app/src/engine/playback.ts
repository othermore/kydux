// The playback of a run's events, tick by tick, at a speed the child chooses:
// each step plays every event of one tick, the wizard's and the actors'. A tick
// in which the wizard does something with its hands, casting, picking up or
// untying, lasts LONG of a tick, so that it is seen through before the next step;
// a tick in which every move is flown lasts a third of one (D185), and in a level
// where the wizard can fly every tick does, a walked step there taking three (D225),
// so that a walk is seen as anywhere else and a flight three times as fast. What happens
// before the first tick, a hidden thing found by the first line (D184), is played
// with the first tick. Its ticks keep one clock: each is due when the ones before it have
// lasted their length from the play's start, and a tick whose timer fired late is
// followed sooner by the next, so that a figure gliding over its flown steps meets them
// on time (D259); only a page held up for longer than HELD starts the clock again from
// there, so that its ticks are not played in a rush. It says how long it is
// to the first tick ahead that holds an event asked for (timeTo, D255), and a figure's
// run of flown steps from the tick shown (flownRun, D259). A tick in which someone says
// something while the program runs is held as long as the words take to read, at most
// TOLD_MOST, both divided by the speed (holdTick, D264). It knows nothing of Phaser: the
// scene listens to it and draws.

import type { WorldEvent } from '../runtime/protocol';
import { FLOWN, flownTick } from './flight';

/** What the playback plays: the world's events, one tick each. */
export type PlaybackEvent = WorldEvent;

/** How long a tick lasts in which the wizard casts or picks up, against a tick. */
export const LONG = 1.6;
export { FLOWN } from './flight';
/** How late a tick's timer may fire, in milliseconds, and the ticks keep their clock, the
 * next ones following sooner; later than this, and than the tick's length, the page was
 * held up and the clock starts again from there (D259). At four times the speed a flown
 * tick lasts 33 ms, and a timer is that late many times in a flight. */
export const HELD = 250;
/** The longest a tick is held for words said while the program runs, in milliseconds
 * at speed 1 (D264). */
export const TOLD_MOST = 10_000;
/** The wizard's events that take a long tick. */
const HANDS = new Set(['cast', 'pick_up', 'untie']);
/** How long a tick's events take, against a tick: LONG for the wizard's hands, a
 * third for a flight (D185), and `pace` for any other: a third where the wizard can
 * fly (D225), one elsewhere. */
export function lengthOf(events: PlaybackEvent[], pace = 1): number {
  if (events.some((event) => event.actor === 'wizard' && HANDS.has(event.kind))) return LONG;
  return flownTick(events) ? FLOWN : pace;
}

/** How long, against a tick, from the start of the tick at `from` (an index of `ticks`)
 * to the start of the first tick after it that holds an event `wanted`: the lengths of
 * the ticks between, as they are played (lengthOf, with the pace); null where no tick
 * ahead holds one (D255). */
export function ticksTo(
  ticks: readonly PlaybackEvent[][],
  from: number,
  wanted: (event: PlaybackEvent) => boolean,
  pace = 1,
): number | null {
  let length = 0;
  for (let index = from; index < ticks.length; index += 1) {
    const events = ticks[index] ?? [];
    if (index > from && events.some(wanted)) return length;
    length += lengthOf(events, pace);
  }
  return null;
}

/** A step of a figure's run of flown steps (D259): its move, and how long its tick
 * lasts, against a tick. */
export interface FlownStep {
  event: PlaybackEvent;
  length: number;
}

/** A figure's run of flown steps from the tick at `from` (an index of `ticks`) on (D259):
 * that tick's flown move of `who`'s, then each next tick's while it holds one that goes
 * on from where the last ended, each with its tick's length as it is played (lengthOf,
 * with the pace). It ends at a tick where the figure does not fly on: it stands, bumps,
 * casts, lands, or the run ends. Empty where the tick at `from` holds no flown move of
 * the figure's. */
export function flownRun(
  ticks: readonly PlaybackEvent[][],
  from: number,
  who: string,
  pace = 1,
): FlownStep[] {
  const run: FlownStep[] = [];
  for (let index = from; index < ticks.length; index += 1) {
    const events = ticks[index] ?? [];
    const own = events.filter((event) => event.actor === who);
    const move = own.find((event) => event.kind === 'move');
    if (!move || move.data.flying !== true || own.some((event) => event.kind === 'bump')) break;
    const last = run[run.length - 1];
    if (last && String(move.data.from) !== String(last.event.data.to)) break;
    run.push({ event: move, length: lengthOf(events, pace) });
  }
  return run;
}

export type PlaybackState = 'idle' | 'playing' | 'paused' | 'done';
export type Speed = 1 | 2 | 4;

export interface PlaybackOptions {
  /** How long one tick lasts at speed 1, in milliseconds. */
  tickMs: number;
  /** How long a tick with nothing flown or done by hand lasts, against tickMs: FLOWN in
   * a level where the wizard can fly (D225), 1 elsewhere. */
  pace?: number;
  schedule?: (callback: () => void, ms: number) => unknown;
  cancel?: (handle: unknown) => void;
  /** The clock the ticks are due by, in milliseconds. */
  now?: () => number;
}

/** Called with tick 0 and no events at a reset, then with each tick and its events;
 * `instant` when the tick is replayed by a seek, to be drawn at once, without tweens. */
type TickListener = (tick: number, events: PlaybackEvent[], instant: boolean) => void;
type StateListener = (state: PlaybackState) => void;

export class Playback {
  readonly tickMs: number;
  readonly pace: number;
  private readonly schedule: (callback: () => void, ms: number) => unknown;
  private readonly cancel: (handle: unknown) => void;
  private readonly now: () => number;
  /** When the tick that plays ends, by the clock: the next one is due then. */
  private due: number | null = null;
  /** When the tick shown began, by the clock: when it was due (D259). */
  private began = 0;
  /** The run's events, one list for each tick, in order. */
  private ticks: PlaybackEvent[][] = [];
  private current = 0;
  private currentState: PlaybackState = 'idle';
  private multiplier: Speed = 1;
  private timer: unknown = null;
  /** How much longer than its length the tick being shown is held, in milliseconds at
   * speed 1 (D264). */
  private holding = 0;
  private tickListeners: TickListener[] = [];
  private stateListeners: StateListener[] = [];

  constructor(options: PlaybackOptions) {
    this.tickMs = options.tickMs;
    this.pace = options.pace ?? 1;
    this.schedule = options.schedule ?? ((callback, ms) => setTimeout(callback, ms));
    this.cancel =
      options.cancel ?? ((handle) => clearTimeout(handle as ReturnType<typeof setTimeout>));
    this.now = options.now ?? (() => performance.now());
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

  /** New events to play, from tick 0; what happened before the first tick is played
   * with it. A tick with no event, the second and third of a walked step where the
   * wizard can fly (D225), is played too, empty, as long as any. */
  load(events: PlaybackEvent[]): void {
    const byTick = new Map<number, PlaybackEvent[]>();
    for (const event of events) {
      const tick = Math.max(event.tick, 1);
      byTick.set(tick, [...(byTick.get(tick) ?? []), event]);
    }
    const last = Math.max(0, ...byTick.keys());
    this.ticks = Array.from({ length: last }, (_, index) => byTick.get(index + 1) ?? []);
    this.reset();
  }

  play(): void {
    if (this.currentState === 'playing' || this.currentState === 'done') return;
    if (this.current >= this.ticks.length) {
      this.setState('done');
      return;
    }
    this.setState('playing');
    this.due = null;
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

  /** How long, in milliseconds at the speed now, from the start of the tick that plays
   * to the start of the first tick ahead that holds an event `wanted`; null where none
   * does (D255). */
  timeTo(wanted: (event: PlaybackEvent) => boolean): number | null {
    const ticks = ticksTo(this.ticks, Math.max(0, this.current - 1), wanted, this.pace);
    return ticks === null ? null : ticks * this.tickDuration;
  }

  /** When the tick shown began by the clock the ticks are due by: when it was due,
   * however late its timer fired, or when it fired where the clock started again (D259). */
  get startedAt(): number {
    return this.began;
  }

  /** Holds the tick being shown, from a tick listener, until words said in it are read
   * (D264): `ms` at speed 1, TOLD_MOST at most, divided by the speed as the tick is; `most`
   * is the sum of its pieces' where the words are said in several bubbles (D274). */
  holdTick(ms: number, most: number = TOLD_MOST): void {
    this.holding = Math.max(this.holding, Math.min(ms, most));
  }

  /** A figure's run of flown steps from the tick shown on, read ahead (D259). */
  flownRun(who: string): FlownStep[] {
    return flownRun(this.ticks, Math.max(0, this.current - 1), who, this.pace);
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
    // This tick is due when the one before it ended, or now at a play's start; a timer
    // that fired later than HELD, and than the tick lasts, starts the clock again from now.
    const now = this.now();
    const length = this.tickDuration * lengthOf(events, this.pace);
    const start = this.due !== null && now - this.due < Math.max(length, HELD) ? this.due : now;
    this.due = start + length;
    this.began = start;
    this.holding = 0;
    for (const listener of this.tickListeners) listener(this.current, events, false);
    // Words said in the tick hold it until they are read (D264).
    if (this.holding > 0) {
      this.due = Math.max(this.due, start + this.holding / this.multiplier);
      this.holding = 0;
    }
    // A listener may have paused it, for the map's window (D134): play() goes on.
    if (this.currentState !== 'playing') return;
    this.timer = this.schedule(
      () => {
        this.timer = null;
        if (this.currentState === 'playing') this.next();
      },
      Math.max(0, this.due - now),
    );
  }

  private clearTimer(): void {
    if (this.timer !== null) this.cancel(this.timer);
    this.timer = null;
    this.due = null;
  }

  private setState(state: PlaybackState): void {
    if (state === this.currentState) return;
    this.currentState = state;
    for (const listener of this.stateListeners) listener(state);
  }
}
