// The game's sound effects, made as it plays (plan, phase 4): each is a few
// numbers for a small synthesizer, an oscillator or noise whose pitch slides
// and whose loudness rises and falls, so that no sound file is loaded and the
// same effect always sounds the same. The settings can silence them.

/** What an effect is made of: its wave, its pitch from start to end in hertz,
 * its length in seconds, and how loud it is from 0 to 1. */
export interface Effect {
  wave: OscillatorType | 'noise';
  from: number;
  to: number;
  seconds: number;
  volume: number;
  /** A second note after the first, for a chime. */
  then?: Effect;
}

export const EFFECTS = {
  // Every figure's steps are heard (D132): the wizard's soft and its own, every other
  // figure's of a second, rounder timbre.
  step: { wave: 'triangle', from: 220, to: 180, seconds: 0.06, volume: 0.07 },
  step_other: { wave: 'sine', from: 160, to: 130, seconds: 0.07, volume: 0.09 },
  bump: { wave: 'square', from: 120, to: 60, seconds: 0.14, volume: 0.18 },
  cast: { wave: 'sine', from: 600, to: 1400, seconds: 0.35, volume: 0.2 },
  door: { wave: 'noise', from: 400, to: 200, seconds: 0.25, volume: 0.15 },
  pick_up: { wave: 'square', from: 660, to: 990, seconds: 0.09, volume: 0.12 },
  say: { wave: 'triangle', from: 440, to: 520, seconds: 0.08, volume: 0.1 },
  win: {
    wave: 'triangle',
    from: 523,
    to: 523,
    seconds: 0.14,
    volume: 0.22,
    then: {
      wave: 'triangle',
      from: 659,
      to: 659,
      seconds: 0.14,
      volume: 0.22,
      then: { wave: 'triangle', from: 784, to: 784, seconds: 0.3, volume: 0.22 },
    },
  },
  fail: { wave: 'sawtooth', from: 300, to: 150, seconds: 0.3, volume: 0.12 },
} satisfies Record<string, Effect>;

export type EffectName = keyof typeof EFFECTS;

let context: AudioContext | null = null;
let muted = false;
/** The last effect played, for the tests: the page's data-sound says it. */
let played: (name: EffectName) => void = () => {};

export function setMuted(value: boolean): void {
  muted = value;
}

export function onPlayed(listener: (name: EffectName) => void): void {
  played = listener;
}

function audio(): AudioContext | null {
  if (context) return context;
  const Audio = globalThis.AudioContext ?? (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Audio) return null;
  try {
    context = new Audio();
  } catch {
    context = null;
  }
  return context;
}

function noise(ctx: AudioContext, seconds: number): AudioBufferSourceNode {
  const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * seconds)), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // The same noise every time: a small pseudo-random sequence, not Math.random.
  let seed = 7;
  for (let i = 0; i < data.length; i += 1) {
    seed = (seed * 16807) % 2147483647;
    data[i] = (seed / 2147483647) * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  return source;
}

function sound(ctx: AudioContext, effect: Effect, at: number): void {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(effect.volume, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + effect.seconds);
  gain.connect(ctx.destination);
  if (effect.wave === 'noise') {
    const source = noise(ctx, effect.seconds);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(effect.from, at);
    filter.frequency.exponentialRampToValueAtTime(effect.to, at + effect.seconds);
    source.connect(filter).connect(gain);
    source.start(at);
    source.stop(at + effect.seconds);
  } else {
    const oscillator = ctx.createOscillator();
    oscillator.type = effect.wave;
    oscillator.frequency.setValueAtTime(effect.from, at);
    oscillator.frequency.exponentialRampToValueAtTime(effect.to, at + effect.seconds);
    oscillator.connect(gain);
    oscillator.start(at);
    oscillator.stop(at + effect.seconds);
  }
  if (effect.then) sound(ctx, effect.then, at + effect.seconds);
}

/** Plays an effect, unless the sound is off. */
export function play(name: EffectName): void {
  played(name);
  if (muted) return;
  const ctx = audio();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();
  sound(ctx, EFFECTS[name], ctx.currentTime);
}
