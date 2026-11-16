// The sounds that go on while something lasts, made as the game plays, as the
// effects are (sfx.ts): the wind of a flight (D185, D236). It is soft low air, noise
// through a narrow band that wanders slowly, with no hiss above it: almost silent while
// the broom hovers, a little louder, at one even level, while it flies on, and with no
// sound of its own at a flown cell. At the lift and at each turn it swells, louder and
// higher for half a second and back over a second, as something that comes near and
// goes away, with two faint high tones a fifth apart in the swell. The scene lets it
// blow only while the program plays and the wizard is in the air. Its two voices, the
// air and the tones, have a mix (windMix), which the page of themes under ?debug sets
// (D203). The steps' taps are not heard while flying. The settings' switch silences it
// with the effects. While it blows, it keeps the sound context awake (D231).
//
//   noise (2 s, looped) → bandpass → lowpass → level → swell → air ─┐
//   two sines ───────────────────────────→ shimmer → tones ─────────┴→ out → speakers

import { audio, isMuted, keepAwake, noise, wake } from './sfx';

/** The air's band: a bandpass round this, its Q, and how far a slow sine moves it up
 * and down, how often, in hertz; the lowpass over it, so that nothing hisses. */
const BAND_HERTZ = 380;
const BAND_Q = 1.4;
const WANDER_HERTZ = 60;
const WANDER_RATE = 0.23;
const LOWPASS_HERTZ = 1800;
/** How loud the air is while the broom hovers, and while it flies on. */
export const LEVEL_HOVER = 0.008;
export const LEVEL_FLYING = 0.02;
/** How fast the air comes up to its flying level, and falls back to the hover's, as
 * time constants in seconds; and how long after a flown move ends it starts to fall. */
const LEVEL_RISE = 0.08;
const LEVEL_FALL = 0.3;
const LEVEL_HOLD = 0.2;
/** The swell: how much louder the air is at its height, the band's frequency there, the
 * tones' loudness there; how long it takes to come, and its time constant back. */
export const SWELL_HEIGHT = 2.2;
const SWELL_HERTZ = 760;
const SHIMMER_HEIGHT = 0.004;
const SWELL_RISE = 0.45;
const SWELL_BACK = 0.37;
/** The two faint tones of the swell, a fifth apart. */
const TONES_HERTZ = [1568, 2349];
/** How long the wind takes to come at its start. */
const START_RISE = 0.4;

/** The wind's two voices, as the page of themes sets them: whether each sounds and its
 * volume, 1 its own (D236). Never kept: each is on and at 1 when the page loads. */
export type WindVoice = 'air' | 'tones';
export const windMix: Record<WindVoice, { on: boolean; volume: number }> = {
  air: { on: true, volume: 1 },
  tones: { on: true, volume: 1 },
};

/** A voice's gain in the mix. */
function mixOf(voice: WindVoice): number {
  const mixed = windMix[voice];
  return mixed.on ? mixed.volume : 0;
}

/** The winds that blow now, which a change of the mix reaches at once. */
const blowing = new Set<Wind>();

/** A voice of the wind turned on or off, or set to a volume: at once in every wind that
 * blows. */
export function mixWind(voice: WindVoice, on: boolean, volume: number): void {
  windMix[voice] = { on, volume };
  for (const wind of blowing) wind.remix();
}

/** The wind's nodes while it blows, by name. */
export interface WindGraph {
  source: AudioBufferSourceNode;
  wander: OscillatorNode;
  sines: OscillatorNode[];
  band: BiquadFilterNode;
  level: GainNode;
  swell: GainNode;
  shimmer: GainNode;
  air: GainNode;
  tones: GainNode;
  out: GainNode;
}

/** A param moved from where it is now: its scheduled values after now dropped, and its
 * value now held, so that what follows starts from it. */
function fromNow(param: AudioParam, now: number): void {
  const value = param.value;
  param.cancelScheduledValues(now);
  param.setValueAtTime(value, now);
}

/** A flight's wind: started, flown on, swelled, stopped. */
export class Wind {
  /** Its nodes while it blows, for the calls and the tests; null while it does not, or
   * where no sound is made. */
  graph: WindGraph | null = null;
  /** Whether it blows, for data-wind and the tests, even where no sound is made. */
  blowing = false;

  /** The wind built and raised over START_RISE, at the hover's level. */
  start(): void {
    if (this.blowing) return;
    this.blowing = true;
    const ctx = isMuted() ? null : audio();
    if (!ctx) return;
    keepAwake(this, true);
    const now = ctx.currentTime;
    const source = noise(ctx, 2);
    source.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.setValueAtTime(BAND_HERTZ, now);
    band.Q.setValueAtTime(BAND_Q, now);
    // The air wanders: a slow sine moves the band up and down all the while.
    const wander = ctx.createOscillator();
    wander.frequency.setValueAtTime(WANDER_RATE, now);
    const wanderDepth = ctx.createGain();
    wanderDepth.gain.setValueAtTime(WANDER_HERTZ, now);
    wander.connect(wanderDepth).connect(band.frequency);
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(LOWPASS_HERTZ, now);
    const level = ctx.createGain();
    level.gain.setValueAtTime(LEVEL_HOVER, now);
    const swell = ctx.createGain();
    swell.gain.setValueAtTime(1, now);
    const air = ctx.createGain();
    air.gain.setValueAtTime(mixOf('air'), now);
    const shimmer = ctx.createGain();
    shimmer.gain.setValueAtTime(0, now);
    const tones = ctx.createGain();
    tones.gain.setValueAtTime(mixOf('tones'), now);
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, now);
    out.gain.exponentialRampToValueAtTime(1, now + START_RISE);
    source.connect(band).connect(lowpass).connect(level).connect(swell).connect(air).connect(out);
    const sines = TONES_HERTZ.map((hertz) => {
      const sine = ctx.createOscillator();
      sine.frequency.setValueAtTime(hertz, now);
      sine.connect(shimmer);
      sine.start(now);
      return sine;
    });
    shimmer.connect(tones).connect(out);
    out.connect(ctx.destination);
    source.start(now);
    wander.start(now);
    this.graph = { source, wander, sines, band, level, swell, shimmer, air, tones, out };
    blowing.add(this);
  }

  /** A flown move of `seconds`: the air comes up to its flying level, and falls back to
   * the hover's a little after the move ends, unless another flown move comes first, so
   * that a straight flight holds one level with no beat of its cells. */
  fly(seconds: number): void {
    const ctx = audio();
    if (!this.graph || !ctx) return;
    const now = ctx.currentTime;
    const level = this.graph.level.gain;
    level.cancelScheduledValues(now);
    level.setTargetAtTime(LEVEL_FLYING, now, LEVEL_RISE);
    level.setTargetAtTime(LEVEL_HOVER, now + seconds + LEVEL_HOLD, LEVEL_FALL);
  }

  /** At the lift and at a turn: the air louder and higher, and the tones with it, up in
   * SWELL_RISE and back from there; a turn inside a swell starts from where it is. */
  swell(): void {
    const ctx = audio();
    if (!this.graph || !ctx) return;
    const now = ctx.currentTime;
    const height = now + SWELL_RISE;
    for (const [param, top, rest] of [
      [this.graph.swell.gain, SWELL_HEIGHT, 1],
      [this.graph.band.frequency, SWELL_HERTZ, BAND_HERTZ],
      [this.graph.shimmer.gain, SHIMMER_HEIGHT, 0],
    ] as const) {
      fromNow(param, now);
      param.linearRampToValueAtTime(top, height);
      param.setTargetAtTime(rest, height, SWELL_BACK);
    }
  }

  /** The mix's gains as windMix has them, at once. */
  remix(): void {
    const ctx = audio();
    if (!this.graph || !ctx) return;
    const now = ctx.currentTime;
    this.graph.air.gain.setValueAtTime(mixOf('air'), now);
    this.graph.tones.gain.setValueAtTime(mixOf('tones'), now);
  }

  /** The wind fades out in `seconds`: 0.6 at a landing, 0.15 when the program stops
   * playing, 0.02 at a restart. */
  stop(seconds: number): void {
    this.blowing = false;
    blowing.delete(this);
    const ctx = audio();
    const graph = this.graph;
    this.graph = null;
    if (!graph || !ctx) return;
    // The fade is a sound's end, which the context stays awake for.
    wake(ctx, seconds + 0.05);
    keepAwake(this, false);
    const now = ctx.currentTime;
    const end = now + Math.max(0.01, seconds);
    fromNow(graph.out.gain, now);
    graph.out.gain.exponentialRampToValueAtTime(0.0001, end);
    for (const source of [graph.source, graph.wander, ...graph.sines]) source.stop(end + 0.05);
  }
}
