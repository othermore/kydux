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
// alone; and the rest, a very faint air while the wizard hovers and no gust sounds. The
// mix as it is written is the owner's, set by ear. The settings' switch silences the
// wind with the effects. While it sounds it keeps the sound context awake (D231).
// Nothing is read back from a node (D252): the wind keeps the points it last gave the
// sound's clock for each param it plans, and the rest's curves, and counts from them the
// level a gust taken on, a drop and the rest start from (levelAt, curveAt).
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
/** The whistle's narrow band and its middle with the level; its gain grows as the
 * square of the level, to a quarter of GUST_HIGH at GUST_HIGH, and is a quarter of that
 * at GUST_LOW: it is heard at the peaks alone. */
const WHISTLE_Q = 12;
const WHISTLE_LOW_HERTZ = 1700;
const WHISTLE_HIGH_HERTZ = 2600;
/** The rest: a band at 300 Hz, at this level while the wizard hovers; the time constants,
 * in seconds, of its fall when a gust starts or the wind stops, and of its coming. */
const REST_HERTZ = 300;
export const REST_LEVEL = 0.006;
const REST_FALL = 0.05;
const REST_RISE = 0.2;

/** A point of a gust's level in time: `at` seconds from its start. */
export interface GustPoint {
  at: number;
  level: number;
}

/** The value of a list of points at a moment, on the straight line between the two
 * points round it, as the sound's clock draws a ramp: the first point's before it, the
 * last point's after it; 0 for a list with no point (D252). */
export function levelAt(points: readonly GustPoint[], at: number): number {
  const first = points[0];
  if (!first) return 0;
  if (at <= first.at) return first.level;
  for (let index = 1; index < points.length; index += 1) {
    const after = points[index] as GustPoint;
    if (at > after.at) continue;
    const before = points[index - 1] as GustPoint;
    const span = after.at - before.at;
    return span <= 0 ? after.level : before.level + ((after.level - before.level) * (at - before.at)) / span;
  }
  return (points[points.length - 1] as GustPoint).level;
}

/** A level that goes toward its targets, as setTargetAtTime draws it: from `from` at
 * `at`, then toward each target from its own moment, `level + (start − level) ·
 * e^(−t/constant)`, each starting from where the one before has come. */
export interface Curve {
  from: number;
  at: number;
  targets: readonly { level: number; at: number; constant: number }[];
}

/** A curve's value at a moment (D252): held at `from` until its first target starts. */
export function curveAt(curve: Curve, at: number): number {
  let value = curve.from;
  let since = curve.at;
  let toward: Curve['targets'][number] | null = null;
  const went = (start: number, target: Curve['targets'][number], seconds: number) =>
    target.level + (start - target.level) * Math.exp(-Math.max(0, seconds) / target.constant);
  for (const target of curve.targets) {
    if (at < target.at) break;
    if (toward) value = went(value, toward, target.at - since);
    since = target.at;
    toward = target;
  }
  return toward ? went(value, toward, at - since) : value;
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
 * volume, 1 its own (D243). As written they are the owner's mix, set by ear: the air at
 * 1.1, the whistle at 1, the rest at 0.5. A mix set on the page is never kept. */
export type WindVoice = 'air' | 'whistle' | 'rest';
export const WIND_WRITTEN: Readonly<Record<WindVoice, { on: boolean; volume: number }>> = {
  air: { on: true, volume: 1.1 },
  whistle: { on: true, volume: 1 },
  rest: { on: true, volume: 0.5 },
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

/** A param set at once, to a value the wind has counted: assigned, so that the node has
 * it before the sound's clock renders it, and scheduled, so that what follows on the
 * clock starts from it. Its value is never read back (D252): a value only scheduled reads
 * as the node's default, 1 for a gain, until the clock has rendered it, and what a param
 * answers while a plan plays differs from one browser to another. */
function setNow(param: AudioParam, value: number, now: number): void {
  param.value = value;
  param.setValueAtTime(value, now);
}

/** A param's plan started again at `now`, from the value the wind counts it has: its
 * scheduled values after now dropped and that value held. */
function holdAt(param: AudioParam, value: number, now: number): void {
  param.cancelScheduledValues(now);
  setNow(param, value, now);
}

/** The params a gust plans, by name. */
type Planned = 'gust' | 'air' | 'whistle' | 'whistleLevel';

/** The air band's middle, the whistle's middle and the whistle's level for a gust's
 * level. */
function airHertz(level: number): number {
  return AIR_LOW_HERTZ + (Math.min(level, GUST_HIGH) / GUST_HIGH) * (AIR_HIGH_HERTZ - AIR_LOW_HERTZ);
}
function whistleHertz(level: number): number {
  return WHISTLE_LOW_HERTZ + (Math.min(level, GUST_HIGH) / GUST_HIGH) * (WHISTLE_HIGH_HERTZ - WHISTLE_LOW_HERTZ);
}
export function whistleLevel(level: number): number {
  return (level / GUST_HIGH) ** 2 * (GUST_HIGH / 4);
}

/** A flight's wind: a gust for each flown command, the rest while the wizard hovers,
 * a gust dropped, all of it stopped. */
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
  /** The points last given to the sound's clock for each param a gust plans, in the
   * clock's own seconds, and the rest's level's curve (D252): what the wind counts its
   * levels from. Empty while no sound is made. */
  private planned: Record<Planned, GustPoint[]> = { gust: [], air: [], whistle: [], whistleLevel: [] };
  private restCurve: Curve | null = null;

  constructor(private readonly random: () => number = Math.random) {}

  /** Whether a gust sounds, from its start to its fall's end, by the page's own count
   * where no sound is made. */
  get blowing(): boolean {
    return Date.now() < this.gustEnds;
  }

  /** A gust for a command of `seconds`, given whole to the sound's clock; one that
   * sounds is taken on from the level counted now from its points (D252). */
  gust(seconds: number): void {
    const plan = gustPlan(seconds, this.random);
    const last = plan[plan.length - 1] as GustPoint;
    this.gustEnds = Date.now() + last.at * 1000;
    const graph = this.sound();
    const ctx = audio();
    if (!graph || !ctx) return;
    wake(ctx, last.at + 0.05);
    const now = ctx.currentTime;
    // Each param from the level counted now, then the plan's points through the function
    // that gives each: the line the clock draws, kept.
    const lines: [Planned, AudioParam, (level: number) => number][] = [
      ['gust', graph.gust.gain, (level) => level],
      ['air', graph.airBand.frequency, airHertz],
      ['whistle', graph.whistleBand.frequency, whistleHertz],
      ['whistleLevel', graph.whistleLevel.gain, whistleLevel],
    ];
    for (const [name, param, of] of lines) {
      const start = this.levelOf(name, now);
      holdAt(param, start, now);
      const points: GustPoint[] = [{ at: now, level: start }];
      for (const { at, level } of plan.slice(1)) {
        param.linearRampToValueAtTime(of(level), now + at);
        points.push({ at: now + at, level: of(level) });
      }
      this.planned[name] = points;
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

  /** The gust dropped, faded to nothing in `seconds`, 0.05 at a bump, from the level
   * counted now (D252). The rest, while it is asked for, is heard after it. */
  drop(seconds: number): void {
    this.gustEnds = Math.min(this.gustEnds, Date.now() + seconds * 1000);
    const ctx = audio();
    if (this.graph && ctx) {
      const now = ctx.currentTime;
      const end = now + Math.max(0.01, seconds);
      // The gust's level and the whistle's go from where they are counted to be to 0;
      // the bands keep their lines.
      for (const [name, param] of [
        ['gust', this.graph.gust.gain],
        ['whistleLevel', this.graph.whistleLevel.gain],
      ] as const) {
        const start = this.levelOf(name, now);
        holdAt(param, start, now);
        param.linearRampToValueAtTime(0, end);
        this.planned[name] = [
          { at: now, level: start },
          { at: end, level: 0 },
        ];
      }
      this.restLevel(this.graph, now);
    }
    this.settle();
  }

  /** All of it stopped: the gust dropped in `seconds`, 0.15 when the program stops
   * playing and 0.02 at a restart, and the rest asked for no more. */
  stop(seconds: number): void {
    this.resting = false;
    this.drop(seconds);
  }

  /** The mix's gains as windMix has them, at once. */
  remix(): void {
    if (this.resting && mixOf('rest') > 0) this.sound();
    const ctx = audio();
    if (!this.graph || !ctx) return;
    const now = ctx.currentTime;
    setNow(this.graph.air.gain, mixOf('air'), now);
    setNow(this.graph.whistle.gain, mixOf('whistle'), now);
    setNow(this.graph.rest.gain, mixOf('rest'), now);
    this.restLevel(this.graph, now);
    this.settle();
  }

  /** The rest's level from now on, from the value its last curve has now (D252): none
   * while a gust sounds or it is not asked for, and while it is asked for, there again
   * when the gust has fallen. */
  private restLevel(graph: WindGraph, now: number): void {
    const level = graph.restLevel.gain;
    const gust = Math.max(0, this.gustEnds - Date.now()) / 1000;
    // From the value its last curve has now (D252), toward its targets.
    const from = this.restCurve ? curveAt(this.restCurve, now) : 0;
    holdAt(level, from, now);
    const targets: Curve['targets'][number][] = [];
    if (!this.resting || gust > 0) targets.push({ level: 0, at: now, constant: REST_FALL });
    if (this.resting) targets.push({ level: REST_LEVEL, at: now + gust, constant: REST_RISE });
    for (const target of targets) level.setTargetAtTime(target.level, target.at, target.constant);
    this.restCurve = { from, at: now, targets };
  }

  /** What the wind keeps of its plans, let go: no sound, nothing counted. */
  private forget(): void {
    this.planned = { gust: [], air: [], whistle: [], whistleLevel: [] };
    this.restCurve = null;
  }

  /** A planned param's level at a moment, counted from the points it was last given;
   * with none, a gain's 0 and a band's low end, as the nodes are made. */
  private levelOf(name: Planned, at: number): number {
    const points = this.planned[name];
    if (points.length > 0) return levelAt(points, at);
    return name === 'air' ? AIR_LOW_HERTZ : name === 'whistle' ? WHISTLE_LOW_HERTZ : 0;
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
      setNow(filter.frequency, hertz, now);
      setNow(filter.Q, q, now);
      return filter;
    };
    const gain = (value: number) => {
      const node = ctx.createGain();
      setNow(node.gain, value, now);
      return node;
    };
    const airBand = band(AIR_LOW_HERTZ, AIR_Q);
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    setNow(lowpass.frequency, AIR_LOWPASS, now);
    const whistleBand = band(WHISTLE_LOW_HERTZ, WHISTLE_Q);
    const restBand = band(REST_HERTZ, AIR_Q);
    const [gust, whistleLevelNode, restLevelNode] = [gain(0), gain(0), gain(0)];
    const [air, whistle, rest, out] = [gain(mixOf('air')), gain(mixOf('whistle')), gain(mixOf('rest')), gain(1)];
    source.connect(airBand).connect(lowpass).connect(gust).connect(air).connect(out);
    source.connect(whistleBand).connect(whistleLevelNode).connect(whistle).connect(out);
    source.connect(restBand).connect(restLevelNode).connect(rest).connect(out);
    out.connect(ctx.destination);
    source.start(now);
    // A new sound starts from its nodes as made: nothing planned, nothing kept.
    this.forget();
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
    if (!this.graph && !this.resting) winds.delete(this);
    if (heard || !this.graph) return;
    this.quiet = setTimeout(
      () => {
        this.quiet = null;
        if (this.blowing || (this.resting && mixOf('rest') > 0) || !this.graph) return;
        const graph = this.graph;
        this.graph = null;
        this.forget();
        graph.source.stop();
        graph.out.disconnect();
        keepAwake(this, false);
        if (!this.resting) winds.delete(this);
      },
      Math.max(0, this.gustEnds - Date.now()) + 200,
    );
  }
}
