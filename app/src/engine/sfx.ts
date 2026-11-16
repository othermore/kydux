// The game's sound effects, made as it plays (plan, phase 4): each is a few
// numbers for a small synthesizer, an oscillator or noise whose pitch slides
// and whose loudness rises and falls, so that no sound file is loaded and the
// same effect always sounds the same. Among them are the wizard's lift and landing,
// air that rises and a broom that is switched off (D244, D253). The settings can silence
// them.
//
// The page's one audio context sleeps while nothing sounds (D231): it is awake while a
// theme plays or fades (music.ts), while a gust of the wind sounds (sound.ts), and until
// three seconds after the last effect's end; then it is suspended, and its audio thread
// does no work. Whatever is about to sound wakes it first, and schedules on its clock, which
// stands still while it sleeps, so that the sound is whole. A hidden page's context is
// suspended; shown again, it wakes only if something is to sound. The root element
// says the state, data-audio: `asleep` or `awake`, nothing before the first sound.

/** What an effect is made of: its wave, its pitch from start to end in hertz (for
 * noise, the lowpass filter's cutoff), its length in seconds, and how loud it is
 * from 0 to 1; `attack`, how long it takes to reach that, 0.01 s unless it says. Its
 * loudness jumps up and dies away at once, most of it gone by a third of its length, as a
 * thing struck does. */
export interface Effect {
  wave: OscillatorType | 'noise';
  from: number;
  to: number;
  seconds: number;
  volume: number;
  attack?: number;
  /** For noise, a band this narrow around its pitch (the filter's Q) in place of all
   * that lies under it: the pitch of the air is heard, and heard to move. */
  band?: number;
  /** The loudness comes up from nothing and goes down to nothing on straight lines, as
   * a thing turned up and turned down does: half of it is left at half its length. */
  even?: boolean;
  /** A second note after the first, for a chime. */
  then?: Effect;
  /** A voice that sounds together with it, from the same moment. */
  under?: Effect;
}

/** The three steps (D132), tuned against the owner's sample of light footsteps,
 * art/raw/sounds/ (a reference only, never shipped): its taps last about 50 to 120 ms
 * to 30 dB below their peak, their brightness about 1100 to 2700 Hz, every other one
 * lower. The wizard's lasts about 46 ms so measured, brightest and quietest; a
 * child's about 56 ms; a grown-up's about 62 ms, the lowest. */
const STEP_WIZARD: Effect = { wave: 'noise', from: 2600, to: 900, seconds: 0.09, volume: 0.05, attack: 0.003 };
const STEP_CHILD: Effect = { wave: 'noise', from: 2200, to: 800, seconds: 0.11, volume: 0.06, attack: 0.003 };
const STEP_ADULT: Effect = { wave: 'noise', from: 1300, to: 450, seconds: 0.14, volume: 0.08, attack: 0.004 };

/** How much lower every other step is, its filter's frequencies times this, so that a
 * walk does not tick like a clock (D132). */
export const STEP_LOWER = 0.85;

/** The steps, by the figure's kind. */
export const STEPS = ['step', 'step_child', 'step_adult'] as const;
export type StepName = (typeof STEPS)[number];

export const EFFECTS = {
  // Every figure's steps are heard (D132): a short tap of filtered noise, never a
  // tone; the wizard's its own, the children's (the friends, Eldra) alike, the
  // grown-ups' (the teachers, Baro) lower and a little longer, all quiet.
  step: STEP_WIZARD,
  step_child: STEP_CHILD,
  step_adult: STEP_ADULT,
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
  // The wizard's lift (D244): air that rises, noise whose band sweeps up; it comes up
  // over its first fifth and dies away.
  lift: { wave: 'noise', from: 300, to: 1100, seconds: 0.6, volume: 0.12, attack: 0.12 },
  // The landing (D253): a thing that is switched off. A hum glides down more than two
  // octaves while it is turned down evenly to nothing, over twice the lift's length, and
  // under it the broom's air, a narrow band of noise, falls with it an octave above. It
  // comes up over 0.1 s, softly, so that nothing in it is struck.
  set_down: {
    wave: 'triangle',
    from: 520,
    to: 90,
    seconds: 1.2,
    volume: 0.02,
    attack: 0.1,
    even: true,
    under: { wave: 'noise', from: 1040, to: 180, seconds: 1.2, volume: 0.14, attack: 0.1, band: 5, even: true },
  },
} satisfies Record<string, Effect>;

export type EffectName = keyof typeof EFFECTS;

let context: AudioContext | null = null;
let muted = false;

/** How long the context stays awake after the last sound's end, in seconds (D231). */
export const AWAKE_AFTER = 3;
/** What keeps the context awake for as long as it lasts: the music while a theme plays
 * or fades, the wind while it blows. */
const keepers = new Set<object>();
/** When the last sound scheduled ends, on the page's clock, in milliseconds. */
let soundsEnd = 0;
let sleeper: ReturnType<typeof setTimeout> | null = null;
let hidden = false;
let said = false;
/** The last effect played, for the tests: the page's data-sound says it. */
let played: (name: EffectName) => void = () => {};

export function setMuted(value: boolean): void {
  muted = value;
}

export function onPlayed(listener: (name: EffectName) => void): void {
  played = listener;
}

/** Whether the sounds are off, for a sound that goes on (sound.ts). */
export function isMuted(): boolean {
  return muted;
}

/** The page's one audio context, made the first time a sound asks for it; null
 * where the browser has none. */
export function audio(): AudioContext | null {
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

function say(state: 'asleep' | 'awake'): void {
  said = true;
  const root = globalThis.document?.documentElement;
  if (root) root.dataset.audio = state;
}

/** The context put to sleep once nothing keeps it awake and the last sound's end is
 * AWAKE_AFTER seconds behind; the timer is set again by every sound. */
function settle(): void {
  if (sleeper) clearTimeout(sleeper);
  sleeper = null;
  if (!context || keepers.size > 0) return;
  const wait = soundsEnd + AWAKE_AFTER * 1000 - Date.now();
  sleeper = setTimeout(
    () => {
      sleeper = null;
      if (!context || keepers.size > 0) return;
      if (Date.now() < soundsEnd + AWAKE_AFTER * 1000) {
        settle();
        return;
      }
      if (context.state === 'running') void context.suspend();
      say('asleep');
    },
    Math.max(0, wait),
  );
}

/** The context woken before something sounds on it, for `seconds` at least: nothing
 * wakes it while the page is hidden. */
export function wake(ctx: AudioContext, seconds = 0): void {
  soundsEnd = Math.max(soundsEnd, Date.now() + seconds * 1000);
  if (!hidden) {
    if (ctx.state === 'suspended') void ctx.resume();
    say('awake');
  }
  settle();
}

/** Something that sounds for as long as it lasts keeps the context awake, or lets it
 * go: the music, the wind. */
export function keepAwake(who: object, awake: boolean): void {
  if (awake) keepers.add(who);
  else keepers.delete(who);
  if (awake && context) wake(context);
  else settle();
}

/** The page hidden or shown: hidden, the context is suspended; shown, it wakes only if
 * something is to sound, a keeper or a sound not yet ended. */
export function setHidden(value: boolean): void {
  hidden = value;
  if (!context) return;
  if (hidden) {
    if (context.state === 'running') void context.suspend();
    if (said) say('asleep');
  } else if (keepers.size > 0 || Date.now() < soundsEnd) {
    wake(context);
  }
}

/** How long an effect lasts, its notes after it with it, and the voice under it if
 * that one is longer, in seconds. */
export function lasts(effect: Effect): number {
  const own = effect.seconds + (effect.then ? lasts(effect.then) : 0);
  return effect.under ? Math.max(own, lasts(effect.under)) : own;
}

export function noise(ctx: AudioContext, seconds: number): AudioBufferSourceNode {
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
  const top = at + (effect.attack ?? 0.01);
  if (effect.even) {
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(effect.volume, top);
    gain.gain.linearRampToValueAtTime(0, at + effect.seconds);
  } else {
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(effect.volume, top);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + effect.seconds);
  }
  gain.connect(ctx.destination);
  if (effect.wave === 'noise') {
    const source = noise(ctx, effect.seconds);
    const filter = ctx.createBiquadFilter();
    filter.type = effect.band ? 'bandpass' : 'lowpass';
    if (effect.band) filter.Q.setValueAtTime(effect.band, at);
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
  if (effect.under) sound(ctx, effect.under, at);
}

/** An effect with its pitch, or its filter, `pitch` times as high: a step's lower
 * variant. */
export function pitched(effect: Effect, pitch: number): Effect {
  const under = effect.under ? { under: pitched(effect.under, pitch) } : {};
  return { ...effect, from: effect.from * pitch, to: effect.to * pitch, ...under };
}

/** Plays an effect, unless the sound is off; `pitch` makes it higher or lower. */
export function play(name: EffectName, pitch = 1): void {
  played(name);
  if (muted) return;
  const ctx = audio();
  if (!ctx) return;
  const effect = pitch === 1 ? EFFECTS[name] : pitched(EFFECTS[name], pitch);
  wake(ctx, lasts(effect));
  sound(ctx, effect, ctx.currentTime);
}
