// The sounds that go on while something lasts, made as the game plays, as the
// effects are (sfx.ts): the wind of a flight (D185), a soft continuous rush of
// filtered noise that starts as the broom lifts, swells a little with each flown
// step and fades as it sets down. The steps' taps are not heard while flying.
// The settings' switch silences it with the effects.

import { audio, isMuted, noise } from './sfx';

/** How loud the wind is while a figure flies, how much louder at a flown step's
 * height, and how long it takes to come and to go, in seconds. */
const WIND_VOLUME = 0.035;
const WIND_SWELL = 0.03;
const WIND_FADE = 0.4;
/** The wind's band: a bandpass round this, wide, and how much higher a step's swell
 * makes it, against it. */
const WIND_HERTZ = 700;
const WIND_RISE = 1.6;

/** A flight's wind: started, swelled at each step, stopped. */
export class Wind {
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  /** Whether it blows, for data-wind and the tests, even where no sound is made. */
  blowing = false;

  start(): void {
    if (this.blowing) return;
    this.blowing = true;
    const ctx = isMuted() ? null : audio();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime;
    const source = noise(ctx, 2);
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(WIND_HERTZ, now);
    filter.Q.setValueAtTime(0.6, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(WIND_VOLUME, now + WIND_FADE);
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(now);
    [this.source, this.filter, this.gain] = [source, filter, gain];
  }

  /** A flown step: the wind swells and falls back over `seconds`. */
  swell(seconds: number): void {
    const ctx = audio();
    if (!this.gain || !this.filter || !ctx) return;
    const now = ctx.currentTime;
    const half = Math.max(0.03, seconds / 2);
    this.gain.gain.cancelScheduledValues(now);
    this.gain.gain.setValueAtTime(Math.max(0.0001, this.gain.gain.value), now);
    this.gain.gain.linearRampToValueAtTime(WIND_VOLUME + WIND_SWELL, now + half);
    this.gain.gain.linearRampToValueAtTime(WIND_VOLUME, now + half * 2);
    this.filter.frequency.cancelScheduledValues(now);
    this.filter.frequency.setValueAtTime(this.filter.frequency.value, now);
    this.filter.frequency.linearRampToValueAtTime(WIND_HERTZ * WIND_RISE, now + half);
    this.filter.frequency.linearRampToValueAtTime(WIND_HERTZ, now + half * 2);
  }

  /** The broom set down: the wind fades out, at once when `now`. */
  stop(now = false): void {
    this.blowing = false;
    const ctx = audio();
    const [source, gain] = [this.source, this.gain];
    [this.source, this.gain, this.filter] = [null, null, null];
    if (!source || !gain || !ctx) return;
    const end = ctx.currentTime + (now ? 0.02 : WIND_FADE);
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    source.stop(end + 0.05);
  }
}
