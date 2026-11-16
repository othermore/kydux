// The sounds that go on while something lasts, made as the game plays, as the
// effects are (sfx.ts): the wind of a flight (D185, D243). Nothing of it sounds unless
// asked: each flown `move_*` command of the wizard's is one gust, planned whole for the
// command's length (gustPlan): it rises as the command starts, wanders as it goes, a new
// level drawn at random every eighth to a third of a second, peaks once, and falls after
// the last cell. No two gusts are alike. A command that starts while a gust sounds takes
// that gust on from where it is: no second gust is laid over it. At rest there is none.
// One loop of noise feeds three voices, each through its mix (windMix, set by the page
// of themes under ?debug, D203): the air, a band whose pitch follows the gust's level,
// higher as it is louder; the whistle, a narrow high band heard at the gust's peaks
// alone; and the rest, a very faint air while the wizard hovers, off unless its mix is
// on. The settings' switch silences it with the effects. While it sounds it keeps the
// sound context awake (D231).
//
//   noise (2 s, looped) ─┬→ bandpass (Q 1.1) → lowpass → gust ──────→ air ─────┐
//                        ├→ bandpass (Q 12) → whistle level ────────→ whistle ─┼→ out → speakers
//                        └→ bandpass at 300 Hz → rest level ────────→ rest ────┘

import { audio, isMuted, keepAwake, noise, wake } from './sfx';

/** A gust's peak is drawn between these, as a gain of the noise. */
export const GUST_LOW = 0.035;
export const GUST_HIGH = 0.07;
/** The air's band: its Q, and its middle at silence and at GUST_HIGH; the lowpass over
 * it. */
const AIR_Q = 1.1;
const AIR_LOW_HERTZ = 320;
const AIR_HIGH_HERTZ = 1000;
const AIR_LOWPASS = 2400;
/** The whistle's narrow band and its middle with the level; its gain is a quarter of
 * the level's square. */
const WHISTLE_Q = 12;
const WHISTLE_LOW_HERTZ = 1700;
const WHISTLE_HIGH_HERTZ = 2600;
/** The rest: a band at 300 Hz, at this level while the wizard hovers. */
const REST_HERTZ = 300;
const REST_LEVEL = 0.006;

/** A point of a gust's level in time: `at` seconds from its start. */
export interface GustPoint {
  at: number;
  level: number;
}

/** A gust planned for a command of `seconds` (D243): its level in time, from 0 and back
 * to 0. A peak drawn between GUST_LOW and GUST_HIGH; a rise to 0.6 to 1 of it, over three
 * tenths of the command, from 0.06 to 0.25 seconds; then a new level every 0.12 to 0.3
 * seconds, drawn between 0.45 of the peak and the peak, the one nearest a place drawn
 * between a quarter and seven tenths of the command being the peak; the last level held
 * to the command's end, and a fall to 0 in 0.45 to 0.7 seconds. A command shorter than its
 * rise is the rise and the fall. `random` draws each number, from 0 to 1. */
export function gustPlan(seconds: number, random: () => number = Math.random): GustPoint[] {
  const between = (low: number, high: number) => low + random() * (high - low);
  const peak = between(GUST_LOW, GUST_HIGH);
  const rise = Math.min(0.25, Math.max(0.06, seconds * 0.3));
  const points: GustPoint[] = [
    { at: 0, level: 0 },
    { at: rise, level: peak * between(0.6, 1) },
  ];
  const targets: GustPoint[] = [];
  for (let at = rise + between(0.12, 0.3); at < seconds; at += between(0.12, 0.3)) {
    targets.push({ at, level: peak * between(0.45, 1) });
  }
  if (targets.length > 0) {
    const peakAt = seconds * between(0.25, 0.7);
    const nearest = targets.reduce((best, point) => (Math.abs(point.at - peakAt) < Math.abs(best.at - peakAt) ? point : best));
    nearest.level = peak;
  }
  points.push(...targets);
  const last = points[points.length - 1] as GustPoint;
  const end = Math.max(seconds, last.at);
  if (end > last.at) points.push({ at: end, level: last.level });
  points.push({ at: end + between(0.45, 0.7), level: 0 });
  return points;
}

/** The wind's three voices, as the page of themes sets them: whether each sounds and its
 * volume, 1 its own (D243). Never kept: the air and the whistle on and at 1, the rest
 * off, when the page loads. */
export type WindVoice = 'air' | 'whistle' | 'rest';
export const WIND_WRITTEN: Readonly<Record<WindVoice, { on: boolean; volume: number }>> = {
  air: { on: true, volume: 1 },
  whistle: { on: true, volume: 1 },
  rest: { on: false, volume: 1 },
};
export const windMix: Record<WindVoice, { on: boolean; volume: number }> = {
  air: { ...WIND_WRITTEN.air },
  whistle: { ...WIND_WRITTEN.whistle },
  rest: { ...WIND_WRITTEN.rest },
};

/** A voice's gain in the mix. */
function mixOf(voice: WindVoice): number {
  const mixed = windMix[voice];
  return mixed.on ? mixed.volume : 0;
}

/** The winds that sound or are asked for the rest, which a change of the mix reaches
 * at once. */
const winds = new Set<Wind>();

/** A voice of the wind turned on or off, or set to a volume: at once in every wind. */
export function mixWind(voice: WindVoice, on: boolean, volume: number): void {
  windMix[voice] = { on, volume };
  for (const wind of winds) wind.remix();
}

/** The wind's nodes while it sounds, by name. */
export interface WindGraph {
  source: AudioBufferSourceNode;
  airBand: BiquadFilterNode;
  gust: GainNode;
  whistleBand: BiquadFilterNode;
  whistleLevel: GainNode;
  restLevel: GainNode;
  air: GainNode;
  whistle: GainNode;
  rest: GainNode;
  out: GainNode;
}

/** A param moved from where it is now: its scheduled values after now dropped, and its
 * value now held, so that what follows starts from it. */
function fromNow(param: AudioParam, now: number): void {
  const value = param.value;
  param.cancelScheduledValues(now);
  param.setValueAtTime(value, now);
}

/** The air band's middle, the whistle's middle and the whistle's level for a gust's
 * level. */
function airHertz(level: number): number {
  return AIR_LOW_HERTZ + (Math.min(level, GUST_HIGH) / GUST_HIGH) * (AIR_HIGH_HERTZ - AIR_LOW_HERTZ);
}
function whistleHertz(level: number): number {
  return WHISTLE_LOW_HERTZ + (Math.min(level, GUST_HIGH) / GUST_HIGH) * (WHISTLE_HIGH_HERTZ - WHISTLE_LOW_HERTZ);
}
function whistleLevel(level: number): number {
  return (level * level) / 4;
}

/** A flight's wind: a gust for each flown command, the rest while the wizard hovers,
 * stopped. */
export class Wind {
  /** Its nodes while it sounds, for the calls and the tests; null while it does not, or
   * where no sound is made. */
  graph: WindGraph | null = null;
  /** When the gust that sounds ends its fall, on the page's clock in milliseconds. */
  private gustEnds = 0;
  /** Whether the rest is asked for: the wizard hovers, the program plays, no gust. */
  private resting = false;
  /** The timer that takes the sound away once nothing of it is heard. */
  private quiet: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly random: () => number = Math.random) {}

  /** Whether a gust sounds, from its start to its fall's end, by the page's own count
   * where no sound is made. */
  get blowing(): boolean {
    return Date.now() < this.gustEnds;
  }

  /** A gust for a command of `seconds`, given whole to the sound's clock; one that
   * sounds is taken on from its level now. */
  gust(seconds: number): void {
    const plan = gustPlan(seconds, this.random);
    const last = plan[plan.length - 1] as GustPoint;
    this.gustEnds = Date.now() + last.at * 1000;
    const graph = this.sound();
    const ctx = audio();
    if (!graph || !ctx) return;
    wake(ctx, last.at + 0.05);
    const now = ctx.currentTime;
    const params = [graph.gust.gain, graph.airBand.frequency, graph.whistleBand.frequency, graph.whistleLevel.gain];
    for (const param of params) fromNow(param, now);
    for (const { at, level } of plan.slice(1)) {
      graph.gust.gain.linearRampToValueAtTime(level, now + at);
      graph.airBand.frequency.linearRampToValueAtTime(airHertz(level), now + at);
      graph.whistleBand.frequency.linearRampToValueAtTime(whistleHertz(level), now + at);
      graph.whistleLevel.gain.linearRampToValueAtTime(whistleLevel(level), now + at);
    }
    this.restLevel(graph, now);
    this.settle();
  }

  /** The wizard hovers with the program playing, or not: the rest is heard while it does
   * and no gust sounds, where its mix is on. */
  rest(on: boolean): void {
    this.resting = on;
    if (on) winds.add(this);
    this.settle();
    if (on && mixOf('rest') > 0) this.sound();
    const ctx = audio();
    if (this.graph && ctx) this.restLevel(this.graph, ctx.currentTime);
  }

  /** The gust dropped, faded to nothing in `seconds`: 0.05 at a bump, 0.15 when the
   * program stops playing, 0.02 at a restart. */
  stop(seconds: number): void {
    this.gustEnds = Math.min(this.gustEnds, Date.now() + seconds * 1000);
    this.resting = false;
    const ctx = audio();
    if (this.graph && ctx) {
      const now = ctx.currentTime;
      for (const param of [this.graph.gust.gain, this.graph.whistleLevel.gain, this.graph.restLevel.gain]) {
        fromNow(param, now);
        param.linearRampToValueAtTime(0, now + Math.max(0.01, seconds));
      }
    }
    this.settle();
  }

  /** The mix's gains as windMix has them, at once. */
  remix(): void {
    if (this.resting && mixOf('rest') > 0) this.sound();
    const ctx = audio();
    if (!this.graph || !ctx) return;
    const now = ctx.currentTime;
    this.graph.air.gain.setValueAtTime(mixOf('air'), now);
    this.graph.whistle.gain.setValueAtTime(mixOf('whistle'), now);
    this.graph.rest.gain.setValueAtTime(mixOf('rest'), now);
    this.restLevel(this.graph, now);
    this.settle();
  }

  /** The rest's level: on while asked and no gust sounds. */
  private restLevel(graph: WindGraph, now: number): void {
    const level = this.resting && !this.blowing ? REST_LEVEL : 0;
    graph.restLevel.gain.setTargetAtTime(level, now, 0.2);
  }

  /** The wind's nodes, made where they are not; none where no sound is made. */
  private sound(): WindGraph | null {
    if (this.graph) return this.graph;
    const ctx = isMuted() ? null : audio();
    if (!ctx) return null;
    winds.add(this);
    keepAwake(this, true);
    const now = ctx.currentTime;
    const source = noise(ctx, 2);
    source.loop = true;
    const band = (hertz: number, q: number) => {
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(hertz, now);
      filter.Q.setValueAtTime(q, now);
      return filter;
    };
    const gain = (value: number) => {
      const node = ctx.createGain();
      node.gain.setValueAtTime(value, now);
      return node;
    };
    const airBand = band(AIR_LOW_HERTZ, AIR_Q);
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(AIR_LOWPASS, now);
    const whistleBand = band(WHISTLE_LOW_HERTZ, WHISTLE_Q);
    const restBand = band(REST_HERTZ, AIR_Q);
    const [gust, whistleLevelNode, restLevelNode] = [gain(0), gain(0), gain(0)];
    const [air, whistle, rest, out] = [gain(mixOf('air')), gain(mixOf('whistle')), gain(mixOf('rest')), gain(1)];
    source.connect(airBand).connect(lowpass).connect(gust).connect(air).connect(out);
    source.connect(whistleBand).connect(whistleLevelNode).connect(whistle).connect(out);
    source.connect(restBand).connect(restLevelNode).connect(rest).connect(out);
    out.connect(ctx.destination);
    source.start(now);
    this.graph = {
      source,
      airBand,
      gust,
      whistleBand,
      whistleLevel: whistleLevelNode,
      restLevel: restLevelNode,
      air,
      whistle,
      rest,
      out,
    };
    return this.graph;
  }

  /** Once no gust sounds and no rest is heard, the sound is taken away and the context
   * let sleep (D231). */
  private settle(): void {
    if (this.quiet) clearTimeout(this.quiet);
    this.quiet = null;
    const heard = this.resting && mixOf('rest') > 0;
    if (heard || !this.graph) return;
    this.quiet = setTimeout(
      () => {
        this.quiet = null;
        if (this.blowing || (this.resting && mixOf('rest') > 0) || !this.graph) return;
        const graph = this.graph;
        this.graph = null;
        graph.source.stop();
        graph.out.disconnect();
        keepAwake(this, false);
        if (!this.resting) winds.delete(this);
      },
      Math.max(0, this.gustEnds - Date.now()) + 200,
    );
  }
}
