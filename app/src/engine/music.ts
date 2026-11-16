// The music (D192): every chapter has a theme of its own, written as notes and played
// by the page with Web Audio, as the effects are (sfx.ts): no sound file is loaded. A
// theme is content/music/<id>.json: its tempo, its metre, its voices, each of a kind
// the page knows how to sound (a celesta's bell, a bowed string pad, a plucked string,
// a harp, a flute, a soft drum), and its sections of notes, which follow one another
// and loop without a seam; its `full` arrangement plays every voice it names, its
// `quiet` one fewer, a little lower. A story and the map play `full`, a lesson and a
// level `quiet`. The bowed pad is the body under the other voices (D203): low in the
// mix, and one unbroken sound, each of its lines sliding from a note to the next
// without a breath between them. The notes are scheduled a little ahead on the audio
// clock, through a reverb made of decaying noise, under the music's volume in the
// settings; a change of arrangement or of theme fades over two seconds. The music
// starts at the first gesture on the page, as a browser asks, and is still while the
// tab is hidden. A voice's volume may be set by hand while its theme plays (D203).
//
// The root element says what plays, for the tests: data-music (`waiting` for the
// first gesture, `playing`, `off` with the volume at none), data-music-theme and
// data-music-arrangement.

import { audio, noise } from './sfx';

/** The kinds of voice the page sounds. */
export const VOICE_KINDS = ['celesta', 'strings', 'pluck', 'harp', 'flute', 'drum'] as const;
export type VoiceKind = (typeof VOICE_KINDS)[number];

/** A note: its pitch (a MIDI number, 60 the middle C), its start and its length in
 * beats from its section's start, and its loudness from 0 to 1. */
export type Note = [pitch: number, start: number, length: number, loudness: number];

export interface Voice {
  kind: VoiceKind;
  /** How loud the voice is against the others, from 0 to 1. */
  volume: number;
}

export interface Section {
  id: string;
  bars: number;
  /** Each voice's notes, by the voice's name. */
  notes: Record<string, Note[]>;
}

export type Arrangement = 'full' | 'quiet';

export interface Theme {
  id: string;
  /** Beats a minute, a beat being the metre's unit: a quarter in 3/4, an eighth in 6/8. */
  tempo: number;
  metre: [beats: number, unit: number];
  voices: Record<string, Voice>;
  /** The voices each arrangement plays. */
  arrangements: Record<Arrangement, string[]>;
  sections: Section[];
  /** The sections in the order they are played, by id; every section once, in the
   * file's order, when it is not given. */
  order?: string[];
}

/** A note of the loop, its start counted in beats from the loop's first beat. */
export interface LoopNote {
  voice: string;
  pitch: number;
  beat: number;
  length: number;
  loudness: number;
}

/** A theme laid out as one loop: its notes in order of their start, and its length. */
export interface Loop {
  beats: number;
  notes: LoopNote[];
}

/** How loud the music is at its fullest: a note of the tune about as loud as a step, the
 * effects above it (0.2 for a cast). */
const LEVEL = 0.5;
/** The quiet arrangement's share of the full one's loudness. */
const QUIET = 0.7;
/** How long a change of arrangement or of theme takes, in seconds. */
export const FADE = 2;
/** How far ahead of the audio clock the notes are scheduled, and how often, in seconds. */
const AHEAD = 0.3;
const EVERY = 0.05;
/** The reverb's length, in seconds, and its share of the sound. */
const REVERB = 2.6;
const WET = 0.32;

/** The theme's sections in their order, one after another, as one loop. */
export function loopOf(theme: Theme): Loop {
  const byId = new Map(theme.sections.map((section) => [section.id, section]));
  const order = theme.order ?? theme.sections.map((section) => section.id);
  const bar = theme.metre[0];
  const notes: LoopNote[] = [];
  let at = 0;
  for (const id of order) {
    const section = byId.get(id);
    if (!section) continue;
    for (const [voice, list] of Object.entries(section.notes)) {
      for (const [pitch, start, length, loudness] of list) {
        notes.push({ voice, pitch, beat: at + start, length, loudness });
      }
    }
    at += section.bars * bar;
  }
  notes.sort((a, b) => a.beat - b.beat || a.pitch - b.pitch);
  return { beats: at, notes };
}

/** The notes that start at a beat from `from` up to `to`, `to` not included, of the
 * loop played over and over: each with its beat counted from the first time round. */
export function notesBetween(loop: Loop, from: number, to: number): LoopNote[] {
  if (loop.beats <= 0 || to <= from) return [];
  const found: LoopNote[] = [];
  for (let round = Math.floor(from / loop.beats); round * loop.beats < to; round += 1) {
    const offset = round * loop.beats;
    for (const note of loop.notes) {
      const beat = offset + note.beat;
      if (beat >= from && beat < to) found.push({ ...note, beat });
    }
  }
  return found;
}

/** A beat's length in seconds at the theme's tempo. */
export function secondsPerBeat(theme: Theme): number {
  return 60 / theme.tempo;
}

/** A note set on the audio clock: when it starts and how long it lasts, in seconds. */
export interface Timed extends LoopNote {
  at: number;
  seconds: number;
}

/** The notes of a theme whose beat 0 is at `zero` on the audio clock that start from
 * `from` up to `to` seconds on it, `to` not included, each with its time. */
export function timed(theme: Theme, loop: Loop, zero: number, from: number, to: number): Timed[] {
  const beat = secondsPerBeat(theme);
  return notesBetween(loop, (from - zero) / beat, (to - zero) / beat).map((note) => ({
    ...note,
    at: zero + note.beat * beat,
    seconds: note.length * beat,
  }));
}

/** A MIDI pitch's frequency in hertz. */
export function frequency(pitch: number): number {
  return 440 * 2 ** ((pitch - 69) / 12);
}

/** Each voice's loudness in an arrangement: its own where the arrangement plays it,
 * none where it does not, the quiet arrangement's a little lower. A voice in `mixed`
 * has the volume given there in the place of its own, whether the arrangement plays
 * it or not: the page of themes sets it by hand (D203). */
export function arranged(
  theme: Theme,
  arrangement: Arrangement,
  mixed: Readonly<Record<string, number>> = {},
): Record<string, number> {
  const playing = new Set(theme.arrangements[arrangement]);
  const share = arrangement === 'quiet' ? QUIET : 1;
  return Object.fromEntries(
    Object.entries(theme.voices).map(([name, voice]) => {
      const volume = mixed[name] ?? (playing.has(name) ? voice.volume : 0);
      return [name, volume * share];
    }),
  );
}

/** How near a pad's note must start to the end of the one before it, in seconds, to
 * follow it on the same line without a breath. */
const JOIN = 0.02;

/** A line of a bowed pad as the choice of a line sees it: when the note it holds ends,
 * on the audio clock, and that note's pitch. */
export interface Held {
  until: number;
  pitch: number;
}

/** The line of a bowed pad that takes a note starting at `at`: of the lines whose note
 * is over by then, the nearest to it in pitch; -1 where every line still sounds. */
export function lineFor(lines: readonly Held[], at: number, pitch: number): number {
  let found = -1;
  for (const [index, line] of lines.entries()) {
    if (line.until > at + JOIN) continue;
    const best = lines[found];
    if (!best || Math.abs(line.pitch - pitch) < Math.abs(best.pitch - pitch)) found = index;
  }
  return found;
}

/** A theme read from its file, or an error that says what is wrong with it. */
export function readTheme(value: unknown): Theme {
  const theme = value as Theme;
  if (typeof theme?.id !== 'string' || !(theme.tempo > 0)) throw new Error('a theme has an id and a tempo');
  if (!Array.isArray(theme.metre) || theme.metre.length !== 2) throw new Error(`${theme.id}: a metre is [beats, unit]`);
  for (const [name, voice] of Object.entries(theme.voices ?? {})) {
    if (!VOICE_KINDS.includes(voice.kind)) throw new Error(`${theme.id}: ${name} is of no kind the page sounds`);
  }
  for (const arrangement of ['full', 'quiet'] as const) {
    const names = theme.arrangements?.[arrangement];
    if (!Array.isArray(names) || names.some((name) => !(name in theme.voices))) {
      throw new Error(`${theme.id}: its ${arrangement} arrangement names its own voices`);
    }
  }
  if (!Array.isArray(theme.sections) || theme.sections.length === 0) throw new Error(`${theme.id}: it has sections`);
  return theme;
}

/** A theme's file, fetched once. */
const themes = new Map<string, Promise<Theme>>();
export function themeNamed(id: string): Promise<Theme> {
  let found = themes.get(id);
  if (!found) {
    found = fetch(`${import.meta.env.BASE_URL}content/music/${id}.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`no theme ${id}`);
        return response.json();
      })
      .then(readTheme);
    found.catch(() => themes.delete(id));
    themes.set(id, found);
  }
  return found;
}

/** The reverb's impulse: two channels of noise dying away, the same every time. */
function impulse(ctx: AudioContext): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * REVERB);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    let seed = 11 + channel * 7919;
    for (let i = 0; i < length; i += 1) {
      seed = (seed * 16807) % 2147483647;
      data[i] = ((seed / 2147483647) * 2 - 1) * (1 - i / length) ** 2.4;
    }
  }
  return buffer;
}

/** An envelope on a gain: up to `peak` in `attack`, held, then down over `release`. */
function envelope(gain: GainNode, at: number, peak: number, attack: number, hold: number, release: number): number {
  const end = at + attack + hold + release;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), at + attack);
  gain.gain.setValueAtTime(Math.max(peak, 0.0002), at + attack + hold);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  return end;
}

function oscillator(ctx: AudioContext, type: OscillatorType, hertz: number, at: number, end: number): OscillatorNode {
  const node = ctx.createOscillator();
  node.type = type;
  node.frequency.setValueAtTime(hertz, at);
  node.start(at);
  node.stop(end + 0.05);
  return node;
}

/** A line of a bowed pad: two saws a little apart, softened, that sound on from one
 * note to the next. */
interface Line extends Held {
  saws: OscillatorNode[];
  filter: BiquadFilterNode;
  gain: GainNode;
}

/** A bowed pad's share of a note's loudness: the pad fills the sound under the other
 * voices, which stand well above it. */
const BOWED = 0.07;
/** The time constants, in seconds, of a line's slide to a note's pitch, of its swell
 * to a note's loudness, and of its dying away where no note follows. */
const SLIDE = 0.045;
const SWELL = 0.16;
const FALL = 0.4;

/** One note of a bowed pad, from `at` for `seconds`, on one of the voice's lines: the
 * line whose note ends as this one starts slides to its pitch and sounds on, with no
 * breath between the two; a line dies away only where no note follows its own. */
function bowed(ctx: AudioContext, lines: Line[], pitch: number, at: number, seconds: number, loudness: number, out: AudioNode): void {
  const hertz = frequency(pitch);
  let line = lines[lineFor(lines, at, pitch)];
  const follows = line !== undefined && at - line.until < JOIN;
  if (!line) {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.connect(out);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.connect(gain);
    const saws = [-7, 7].map((cents) => {
      const saw = ctx.createOscillator();
      saw.type = 'sawtooth';
      saw.detune.setValueAtTime(cents, at);
      saw.connect(filter);
      saw.start(at);
      return saw;
    });
    line = { saws, filter, gain, until: 0, pitch };
    lines.push(line);
  }
  // The dying away set at the end of the note before is taken back: this note follows.
  line.gain.gain.cancelScheduledValues(at - JOIN);
  const cutoff = Math.min(4000, hertz * 5);
  if (follows) {
    for (const saw of line.saws) saw.frequency.setTargetAtTime(hertz, at, SLIDE);
    line.filter.frequency.setTargetAtTime(cutoff, at, SLIDE);
  } else {
    for (const saw of line.saws) saw.frequency.setValueAtTime(hertz, at);
    line.filter.frequency.setValueAtTime(cutoff, at);
  }
  line.gain.gain.setTargetAtTime(loudness * BOWED, at, SWELL);
  line.gain.gain.setTargetAtTime(0, at + seconds, FALL);
  line.until = at + seconds;
  line.pitch = pitch;
}

/** One note of a voice that is struck, plucked or blown, from `at` for `seconds`, into
 * `out`. */
function sound(
  ctx: AudioContext,
  kind: Exclude<VoiceKind, 'strings'>,
  pitch: number,
  at: number,
  seconds: number,
  loudness: number,
  out: AudioNode,
): void {
  const hertz = frequency(pitch);
  const gain = ctx.createGain();
  gain.connect(out);
  switch (kind) {
    case 'celesta': {
      // A bell: a pure tone and its fourth partial, struck and dying away.
      const end = envelope(gain, at, loudness * 0.5, 0.004, 0, Math.max(1.4, seconds));
      oscillator(ctx, 'sine', hertz, at, end).connect(gain);
      const shine = ctx.createGain();
      shine.gain.setValueAtTime(0.18, at);
      shine.gain.exponentialRampToValueAtTime(0.001, at + 0.5);
      oscillator(ctx, 'sine', hertz * 4, at, end).connect(shine).connect(gain);
      break;
    }
    case 'pluck': {
      // A plucked string, pizzicato: short, bright at first.
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(hertz * 8, at);
      filter.frequency.exponentialRampToValueAtTime(hertz * 1.5, at + 0.25);
      filter.connect(gain);
      const end = envelope(gain, at, loudness * 0.45, 0.003, 0, Math.min(0.6, Math.max(0.25, seconds)));
      oscillator(ctx, 'triangle', hertz, at, end).connect(filter);
      break;
    }
    case 'harp': {
      // A harp: a plucked string that rings longer.
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(hertz * 6, at);
      filter.frequency.exponentialRampToValueAtTime(hertz * 2, at + 0.6);
      filter.connect(gain);
      const end = envelope(gain, at, loudness * 0.4, 0.004, 0, Math.max(1.6, seconds));
      oscillator(ctx, 'triangle', hertz, at, end).connect(filter);
      break;
    }
    case 'flute': {
      // A flute: a soft tone with a little breath, a vibrato once it is held.
      const end = envelope(gain, at, loudness * 0.22, 0.06, Math.max(0, seconds - 0.1), 0.14);
      const tone = oscillator(ctx, 'sine', hertz, at, end);
      const vibrato = oscillator(ctx, 'sine', 5.2, at, end);
      const depth = ctx.createGain();
      depth.gain.setValueAtTime(0, at);
      depth.gain.linearRampToValueAtTime(hertz * 0.004, at + Math.min(0.3, seconds));
      vibrato.connect(depth).connect(tone.frequency);
      tone.connect(gain);
      const breath = noise(ctx, Math.min(0.2, seconds));
      const band = ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.setValueAtTime(hertz * 2, at);
      const breathGain = ctx.createGain();
      breathGain.gain.setValueAtTime(0.25, at);
      breathGain.gain.exponentialRampToValueAtTime(0.001, at + Math.min(0.2, seconds));
      breath.connect(band).connect(breathGain).connect(gain);
      breath.start(at);
      breath.stop(at + Math.min(0.2, seconds));
      break;
    }
    case 'drum': {
      // A soft drum: a low thump falling in pitch, and a brush of noise.
      const end = envelope(gain, at, loudness * 0.5, 0.004, 0, 0.45);
      const thump = oscillator(ctx, 'sine', hertz * 2, at, end);
      thump.frequency.exponentialRampToValueAtTime(hertz, at + 0.12);
      thump.connect(gain);
      const brush = noise(ctx, 0.1);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, at);
      const brushGain = ctx.createGain();
      brushGain.gain.setValueAtTime(0.12, at);
      brushGain.gain.exponentialRampToValueAtTime(0.001, at + 0.1);
      brush.connect(filter).connect(brushGain).connect(gain);
      brush.start(at);
      brush.stop(at + 0.1);
      break;
    }
  }
}

/** A theme as it plays: where its beat 0 lies on the audio clock, how far its notes
 * are scheduled, and each voice's gain, under the theme's own. */
interface Playing {
  theme: Theme;
  loop: Loop;
  zero: number;
  /** The audio clock's time up to which the notes are scheduled. */
  scheduled: number;
  arrangement: Arrangement;
  out: GainNode;
  voices: Map<string, GainNode>;
  /** The lines of each bowed pad, by the voice's name. */
  lines: Map<string, Line[]>;
}

/** The page's music: the theme it is asked for, played once a gesture lets it. */
class Music {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private playing: Playing | null = null;
  private wanted: { id: string; arrangement: Arrangement } | null = null;
  private volume = 0.6;
  private unlocked = false;
  private hidden = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  /** The theme being fetched, so that a later wish wins over an earlier one. */
  private asking = 0;
  /** The voices' volumes set by hand on the page of themes (D203), by voice. */
  private mixed: Record<string, number> = {};

  /** The music's volume from the settings, 0 (none) to 1. */
  setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.level(), this.ctx.currentTime, 0.1);
    }
    if (this.volume === 0) this.stop();
    else void this.start();
    this.publish();
  }

  /** The theme to play, in an arrangement: from now, or from the first gesture. Another
   * theme, or another arrangement, plays as its file says, with no voice set by hand. */
  play(id: string, arrangement: Arrangement): void {
    if (this.wanted?.id !== id || this.wanted.arrangement !== arrangement) this.mixed = {};
    this.wanted = { id, arrangement };
    void this.start();
    this.publish();
  }

  /** A voice of the theme that plays set by hand, for the page of themes (D203): its
   * volume from 0 (silent) to 1 in the place of its own, or its own again with null. */
  mix(voice: string, volume: number | null): void {
    if (volume === null) delete this.mixed[voice];
    else this.mixed[voice] = Math.min(1, Math.max(0, volume));
    const playing = this.playing;
    if (!playing || !this.ctx || playing.theme.id !== this.wanted?.id) return;
    const level = arranged(playing.theme, playing.arrangement, this.mixed)[voice];
    playing.voices.get(voice)?.gain.setTargetAtTime(level ?? 0, this.ctx.currentTime, 0.05);
  }

  /** Every voice as the theme's file says, none set by hand. */
  unmix(): void {
    for (const voice of Object.keys(this.mixed)) this.mix(voice, null);
  }

  /** What the page asked to play, and whether it plays. */
  get state(): { music: string; theme?: string; arrangement?: Arrangement } {
    const music = this.volume === 0 ? 'off' : !this.unlocked ? 'waiting' : this.playing ? 'playing' : 'still';
    return { music, theme: this.wanted?.id, arrangement: this.wanted?.arrangement };
  }

  /** The first gesture on the page: the browser lets sound start. */
  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
    void this.start();
    this.publish();
  }

  /** The tab hidden or shown: the music waits while no one sees the page. */
  setHidden(hidden: boolean): void {
    this.hidden = hidden;
    if (!this.ctx) return;
    if (hidden && this.playing) void this.ctx.suspend();
    if (!hidden && this.unlocked) void this.ctx.resume();
  }

  private level(): number {
    return LEVEL * this.volume ** 1.5;
  }

  private async start(): Promise<void> {
    const wanted = this.wanted;
    if (!wanted || !this.unlocked || this.volume === 0) return;
    const ctx = this.ctx ?? audio();
    if (!ctx) return;
    this.setUp(ctx);
    if (ctx.state === 'suspended' && !this.hidden) void ctx.resume();
    if (this.playing?.theme.id === wanted.id) {
      if (this.playing.arrangement !== wanted.arrangement) this.arrange(this.playing, wanted.arrangement);
      return;
    }
    const asked = (this.asking += 1);
    let theme: Theme;
    try {
      theme = await themeNamed(wanted.id);
    } catch {
      return;
    }
    if (asked !== this.asking || this.wanted !== wanted || this.volume === 0) return;
    this.fadeOut(this.playing);
    this.playing = this.begin(ctx, theme, wanted.arrangement);
    this.publish();
  }

  private setUp(ctx: AudioContext): void {
    if (this.ctx) return;
    this.ctx = ctx;
    const master = ctx.createGain();
    master.gain.setValueAtTime(this.level(), ctx.currentTime);
    const reverb = ctx.createConvolver();
    reverb.buffer = impulse(ctx);
    const wet = ctx.createGain();
    wet.gain.setValueAtTime(WET, ctx.currentTime);
    master.connect(ctx.destination);
    master.connect(reverb).connect(wet).connect(ctx.destination);
    this.master = master;
    this.timer = setInterval(() => this.schedule(), EVERY * 1000);
  }

  private begin(ctx: AudioContext, theme: Theme, arrangement: Arrangement): Playing {
    const out = ctx.createGain();
    const now = ctx.currentTime;
    out.gain.setValueAtTime(0.0001, now);
    out.gain.exponentialRampToValueAtTime(1, now + FADE);
    out.connect(this.master as GainNode);
    const levels = arranged(theme, arrangement, this.mixed);
    const voices = new Map<string, GainNode>();
    for (const name of Object.keys(theme.voices)) {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(levels[name] ?? 0, now);
      gain.connect(out);
      voices.set(name, gain);
    }
    return { theme, loop: loopOf(theme), zero: now + 0.1, scheduled: now + 0.1, arrangement, out, voices, lines: new Map() };
  }

  private arrange(playing: Playing, arrangement: Arrangement): void {
    const ctx = this.ctx as AudioContext;
    const levels = arranged(playing.theme, arrangement, this.mixed);
    for (const [name, gain] of playing.voices) {
      gain.gain.setTargetAtTime(levels[name] ?? 0, ctx.currentTime, FADE / 4);
    }
    playing.arrangement = arrangement;
    this.publish();
  }

  private fadeOut(playing: Playing | null): void {
    if (!playing || !this.ctx) return;
    const now = this.ctx.currentTime;
    playing.out.gain.cancelScheduledValues(now);
    playing.out.gain.setValueAtTime(Math.max(playing.out.gain.value, 0.0002), now);
    playing.out.gain.exponentialRampToValueAtTime(0.0001, now + FADE);
    const silent = now + FADE + AHEAD + 1;
    for (const lines of playing.lines.values()) {
      for (const line of lines) for (const saw of line.saws) saw.stop(silent);
    }
    setTimeout(() => playing.out.disconnect(), (FADE + AHEAD + 1.5) * 1000);
  }

  private stop(): void {
    this.fadeOut(this.playing);
    this.playing = null;
  }

  /** The notes of the next moments, on the audio clock: the voices the arrangement
   * silences are scheduled too, so that a change of arrangement fades them in. */
  private schedule(): void {
    const ctx = this.ctx;
    const playing = this.playing;
    if (!ctx || !playing || ctx.state !== 'running') return;
    const until = ctx.currentTime + AHEAD;
    if (until <= playing.scheduled) return;
    // A page that slept a while starts again at the moment it wakes, not behind it.
    const from = Math.max(playing.scheduled, ctx.currentTime, playing.zero);
    for (const note of timed(playing.theme, playing.loop, playing.zero, from, until)) {
      const voice = playing.theme.voices[note.voice];
      const out = playing.voices.get(note.voice);
      if (!voice || !out) continue;
      if (voice.kind === 'strings') {
        let lines = playing.lines.get(note.voice);
        if (!lines) playing.lines.set(note.voice, (lines = []));
        bowed(ctx, lines, note.pitch, note.at, note.seconds, note.loudness, out);
      } else {
        sound(ctx, voice.kind, note.pitch, note.at, note.seconds, note.loudness, out);
      }
    }
    playing.scheduled = until;
  }

  private publish(): void {
    const root = document.documentElement.dataset;
    const { music, theme, arrangement } = this.state;
    root.music = music;
    if (theme) root.musicTheme = theme;
    if (arrangement) root.musicArrangement = arrangement;
  }

  /** For the tests: the timer stopped. */
  dispose(): void {
    if (this.timer) clearInterval(this.timer);
  }
}

export const music = new Music();

/** The music let start at the first gesture on the page, and still while the tab is
 * hidden. */
export function listenForMusic(target: Document = document): void {
  const unlock = () => {
    music.unlock();
    target.removeEventListener('pointerdown', unlock, true);
    target.removeEventListener('keydown', unlock, true);
  };
  target.addEventListener('pointerdown', unlock, true);
  target.addEventListener('keydown', unlock, true);
  target.addEventListener('visibilitychange', () => music.setHidden(target.visibilityState === 'hidden'));
}
