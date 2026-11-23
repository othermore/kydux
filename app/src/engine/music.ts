// The music (D192): every chapter has a theme of its own, written as notes and played by
// the page with Web Audio, as the effects are (sfx.ts): no sound file is loaded. A theme
// is content/music/<id>.json: its tempo, its metre, its voices, each of a kind the page
// knows how to sound (a celesta's bell, a bowed string pad, a plucked string, a harp, a
// flute, a piano's struck tone, a horn, a soft drum, a march's snare), and its sections
// of notes, which follow one another and loop without a seam. A theme has one set of
// voices (D210): a story and the map play every one at its written loudness, a lesson
// and a level every one, lower. The bowed pad is the body under the other voices (D203):
// low in the mix, and one unbroken sound, each of its lines sliding from a note to the
// next without a breath between them. The notes are scheduled a little ahead on the
// audio clock, through a reverb made of decaying noise, under the music's volume in the
// settings; a change of loudness or of theme fades over two seconds. The music starts at
// the first gesture on the page, as a browser asks, and is still while the tab is
// hidden. A voice's volume may be set by hand while its theme plays (D203), and the
// theme taken to any moment of its loop (D312). While a theme plays or fades, the music
// keeps the sound context awake (D231, sfx.ts).
//
// The root element says what plays, for the tests: data-music (`waiting` for the
// first gesture, `playing`, `off` with the volume at none), data-music-theme and
// data-music-heard (`story` or `level`).

import { audio, keepAwake, noise, setHidden as setAudioHidden, wake } from './sfx';
import { contentUrl } from '../content/address';

/** The kinds of voice the page sounds. */
export const VOICE_KINDS = [
  'celesta',
  'strings',
  'pluck',
  'harp',
  'flute',
  'piano',
  'brass',
  'drum',
  'snare',
] as const;
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

/** Where a theme is heard (D210): in a story, on the map and the start screen, at its
 * written loudness; in a lesson and a level, every voice lower. */
export type Heard = 'story' | 'level';

export interface Theme {
  id: string;
  /** Beats a minute, a beat being the metre's unit: a quarter in 3/4, an eighth in 6/8. */
  tempo: number;
  metre: [beats: number, unit: number];
  voices: Record<string, Voice>;
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
/** A lesson's and a level's share of a story's loudness (D210). */
const LOWER = 0.4;
/** How long a change of loudness or of theme takes, in seconds. */
export const FADE = 2;
/** How long the cut to another moment of the theme takes, in seconds (D312). */
const CUT = 0.05;
/** How far ahead of the audio clock the notes are scheduled, and how often, in seconds. */
const AHEAD = 0.3;
const EVERY = 0.05;
/** The reverb's length, in seconds, and its share of the sound. */
const REVERB = 2.6;
const WET = 0.32;

/** The theme's sections in the order they are played. */
function played(theme: Theme): Section[] {
  const byId = new Map(theme.sections.map((section) => [section.id, section]));
  const order = theme.order ?? theme.sections.map((section) => section.id);
  return order.flatMap((id) => byId.get(id) ?? []);
}

/** The theme's sections in their order, one after another, as one loop. */
export function loopOf(theme: Theme): Loop {
  const bar = theme.metre[0];
  const notes: LoopNote[] = [];
  let at = 0;
  for (const section of played(theme)) {
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

/** How long the theme's loop lasts, once round, in seconds. */
export function loopSeconds(theme: Theme): number {
  const bars = played(theme).reduce((sum, section) => sum + section.bars, 0);
  return bars * theme.metre[0] * secondsPerBeat(theme);
}

/** The section that sounds `seconds` into the theme's loop, by its id; '' in a theme
 * of no section. */
export function sectionAt(theme: Theme, seconds: number): string {
  const bar = theme.metre[0] * secondsPerBeat(theme);
  const sections = played(theme);
  let end = 0;
  for (const section of sections) {
    end += section.bars * bar;
    if (seconds < end) return section.id;
  }
  return sections.at(-1)?.id ?? '';
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

/** Each voice's loudness where the theme is heard: its own in a story, every one lower
 * in a lesson and a level (D210). A voice in `mixed` has the volume given there in the
 * place of its own, none to silence it: the page of themes sets it by hand (D203). */
export function voiceLevels(
  theme: Theme,
  heard: Heard,
  mixed: Readonly<Record<string, number>> = {},
): Record<string, number> {
  const share = heard === 'level' ? LOWER : 1;
  return Object.fromEntries(
    Object.entries(theme.voices).map(([name, voice]) => [name, (mixed[name] ?? voice.volume) * share]),
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
  if ('arrangements' in theme) throw new Error(`${theme.id}: a theme has one set of voices, no arrangements (D210)`);
  if (!Array.isArray(theme.sections) || theme.sections.length === 0) throw new Error(`${theme.id}: it has sections`);
  return theme;
}

/** A theme's file, fetched once. */
const themes = new Map<string, Promise<Theme>>();
export function themeNamed(id: string): Promise<Theme> {
  let found = themes.get(id);
  if (!found) {
    found = fetch(contentUrl(`music/${id}.json`))
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
 * breath between the two; a line dies away only where no note follows its own. A note
 * that finds no line free starts one of its own, from silence. */
export function bowed(ctx: AudioContext, lines: Line[], pitch: number, at: number, seconds: number, loudness: number, out: AudioNode): void {
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
  } else {
    // The dying away set at the end of the note before is taken back: this note follows.
    // A line just made has nothing to take back, and keeps the silence it starts from.
    line.gain.gain.cancelScheduledValues(at - JOIN);
  }
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

/** How long a piano's note rings, in seconds, by its pitch alone: a struck tone dies
 * away by itself, however long the note is written (D209); a low one rings longer. */
export function pianoRing(pitch: number): number {
  return Math.min(3.2, Math.max(0.8, 2 * 2 ** ((60 - pitch) / 24)));
}

/** One note of a voice that is struck, plucked or blown, from `at` for `seconds`, into
 * `out`; the time its sound ends. */
export function sound(
  ctx: AudioContext,
  kind: Exclude<VoiceKind, 'strings'>,
  pitch: number,
  at: number,
  seconds: number,
  loudness: number,
  out: AudioNode,
): number {
  const hertz = frequency(pitch);
  const gain = ctx.createGain();
  gain.connect(out);
  let ends = at;
  switch (kind) {
    case 'celesta': {
      // A bell: a pure tone and its fourth partial, struck and dying away.
      const end = envelope(gain, at, loudness * 0.5, 0.004, 0, Math.max(1.4, seconds));
      ends = end;
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
      ends = end;
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
      ends = end;
      break;
    }
    case 'piano': {
      // A piano: a struck tone, bright at the hammer's blow and mellowing as it dies
      // away by itself, its second partial a little out of tune with the first.
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(9000, hertz * 9), at);
      filter.frequency.exponentialRampToValueAtTime(Math.min(4000, hertz * 2.5), at + 0.4);
      filter.connect(gain);
      const end = envelope(gain, at, loudness * 0.42, 0.003, 0, pianoRing(pitch));
      oscillator(ctx, 'triangle', hertz, at, end).connect(filter);
      const second = ctx.createGain();
      second.gain.setValueAtTime(0.22, at);
      second.gain.exponentialRampToValueAtTime(0.001, at + Math.min(1, pianoRing(pitch)));
      oscillator(ctx, 'sine', hertz * 2.003, at, end).connect(second).connect(filter);
      ends = end;
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
      ends = end;
      break;
    }
    case 'brass': {
      // A horn: a saw whose filter opens as the note is blown and settles, held for
      // the note's length; a soft tone an octave under it gives it its body.
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(hertz * 1.2, at);
      filter.frequency.exponentialRampToValueAtTime(Math.min(5000, hertz * 4.5), at + 0.07);
      filter.frequency.exponentialRampToValueAtTime(Math.min(3500, hertz * 3), at + 0.3);
      filter.connect(gain);
      const end = envelope(gain, at, loudness * 0.22, 0.045, Math.max(0, seconds - 0.12), 0.16);
      oscillator(ctx, 'sawtooth', hertz, at, end).connect(filter);
      const body = ctx.createGain();
      body.gain.setValueAtTime(0.35, at);
      oscillator(ctx, 'triangle', hertz / 2, at, end).connect(body).connect(filter);
      ends = end;
      break;
    }
    case 'snare': {
      // A march's snare, played softly: a short rattle of noise, and the skin under it.
      const length = 0.12;
      const end = envelope(gain, at, loudness * 0.55, 0.002, 0, length);
      const rattle = noise(ctx, length);
      const band = ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.setValueAtTime(2400, at);
      band.Q.setValueAtTime(0.7, at);
      rattle.connect(band).connect(gain);
      rattle.start(at);
      rattle.stop(at + length);
      const skin = ctx.createGain();
      skin.gain.setValueAtTime(0.5, at);
      skin.gain.exponentialRampToValueAtTime(0.001, at + 0.06);
      const tone = oscillator(ctx, 'triangle', 220, at, end);
      tone.frequency.exponentialRampToValueAtTime(160, at + 0.05);
      tone.connect(skin).connect(gain);
      ends = end;
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
      ends = end;
      break;
    }
  }
  return ends;
}

/** A theme as it plays: where its beat 0 lies on the audio clock, how far its notes
 * are scheduled, and each voice's gain, under the theme's own. */
interface Playing {
  theme: Theme;
  loop: Loop;
  zero: number;
  /** The audio clock's time up to which the notes are scheduled. */
  scheduled: number;
  heard: Heard;
  out: GainNode;
  voices: Map<string, GainNode>;
  /** The lines of each bowed pad, by the voice's name. */
  lines: Map<string, Line[]>;
}

/** The page's music: the theme it is asked for, played once a gesture lets it. */
class Music {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  /** The music's way to the speakers, its reverb with it: taken off while no theme
   * plays, so that the audio thread does not work on silence while a sound effect keeps
   * the context awake. */
  private chain: AudioNode[] = [];
  private connected = false;
  private playing: Playing | null = null;
  private wanted: { id: string; heard: Heard } | null = null;
  private volume = 0.6;
  private unlocked = false;
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

  /** The theme to play, heard as a story or a level hears it: from now, or from the
   * first gesture. Another theme, or the same heard elsewhere, plays as its file says,
   * with no voice set by hand. */
  play(id: string, heard: Heard): void {
    if (this.wanted?.id !== id || this.wanted.heard !== heard) this.mixed = {};
    this.wanted = { id, heard };
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
    const level = voiceLevels(playing.theme, playing.heard, this.mixed)[voice];
    playing.voices.get(voice)?.gain.setTargetAtTime(level ?? 0, this.ctx.currentTime, 0.05);
  }

  /** Every voice as the theme's file says, none set by hand. */
  unmix(): void {
    for (const voice of Object.keys(this.mixed)) this.mix(voice, null);
  }

  /** Where the theme that plays is in its loop and how long the loop lasts, in seconds,
   * for the page of themes (D312); null while none plays. */
  get position(): { at: number; length: number } | null {
    const playing = this.playing;
    if (!playing || !this.ctx) return null;
    const length = loopSeconds(playing.theme);
    if (length <= 0) return null;
    return { at: Math.max(0, this.ctx.currentTime - playing.zero) % length, length };
  }

  /** The theme that plays taken to a moment of its loop, in seconds from its start, for
   * the page of themes (D312): what sounds is cut short, and the theme sounds on from
   * there, its voices as they are set. */
  seek(seconds: number): void {
    const ctx = this.ctx;
    const playing = this.playing;
    if (!ctx || !playing) return;
    const length = loopSeconds(playing.theme);
    const from = length > 0 ? Math.min(Math.max(0, seconds), length) % length : 0;
    this.fadeOut(playing, CUT);
    this.playing = this.begin(ctx, playing.theme, playing.heard, from, CUT);
  }

  /** What the page asked to play, and whether it plays. */
  get state(): { music: string; theme?: string; heard?: Heard } {
    const music = this.volume === 0 ? 'off' : !this.unlocked ? 'waiting' : this.playing ? 'playing' : 'still';
    return { music, theme: this.wanted?.id, heard: this.wanted?.heard };
  }

  /** The first gesture on the page: the browser lets sound start. */
  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
    void this.start();
    this.publish();
  }

  /** The tab hidden or shown: the music waits while no one sees the page, and the
   * context wakes when it shows only if something is to sound (sfx.ts). */
  setHidden(hidden: boolean): void {
    setAudioHidden(hidden);
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
    wake(ctx);
    if (this.playing?.theme.id === wanted.id) {
      if (this.playing.heard !== wanted.heard) this.hear(this.playing, wanted.heard);
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
    this.connect();
    this.playing = this.begin(ctx, theme, wanted.heard);
    this.ticking(true);
    keepAwake(this, true);
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
    this.master = master;
    this.chain = [master, reverb, wet];
    this.connect();
  }

  /** The timer that schedules the next moments' notes: it runs while a theme plays or
   * fades, and is stopped with the context's sleep (D231). */
  private ticking(on: boolean): void {
    if (on && !this.timer) this.timer = setInterval(() => this.schedule(), EVERY * 1000);
    if (!on && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** A theme set to play from `from` seconds into its loop, heard within `fade`
   * seconds. */
  private begin(ctx: AudioContext, theme: Theme, heard: Heard, from = 0, fade = FADE): Playing {
    const out = ctx.createGain();
    const now = ctx.currentTime;
    out.gain.setValueAtTime(0.0001, now);
    out.gain.exponentialRampToValueAtTime(1, now + fade);
    out.connect(this.master as GainNode);
    const levels = voiceLevels(theme, heard, this.mixed);
    const voices = new Map<string, GainNode>();
    for (const name of Object.keys(theme.voices)) {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(levels[name] ?? 0, now);
      gain.connect(out);
      voices.set(name, gain);
    }
    const first = now + 0.1;
    return { theme, loop: loopOf(theme), zero: first - from, scheduled: first, heard, out, voices, lines: new Map() };
  }

  /** The theme that plays heard elsewhere: every voice fades to its loudness there. */
  private hear(playing: Playing, heard: Heard): void {
    const ctx = this.ctx as AudioContext;
    const levels = voiceLevels(playing.theme, heard, this.mixed);
    for (const [name, gain] of playing.voices) {
      gain.gain.setTargetAtTime(levels[name] ?? 0, ctx.currentTime, FADE / 4);
    }
    playing.heard = heard;
    this.publish();
  }

  private fadeOut(playing: Playing | null, fade = FADE): void {
    if (!playing || !this.ctx) return;
    const now = this.ctx.currentTime;
    playing.out.gain.cancelScheduledValues(now);
    playing.out.gain.setValueAtTime(Math.max(playing.out.gain.value, 0.0002), now);
    playing.out.gain.exponentialRampToValueAtTime(0.0001, now + fade);
    const silent = now + fade + AHEAD + 1;
    for (const lines of playing.lines.values()) {
      for (const line of lines) for (const saw of line.saws) saw.stop(silent);
    }
    setTimeout(() => playing.out.disconnect(), (fade + AHEAD + 1.5) * 1000);
  }

  private stop(): void {
    this.fadeOut(this.playing);
    this.playing = null;
    // Once the fade has ended and nothing plays, the way to the speakers is taken off,
    // and the music lets the context sleep.
    setTimeout(() => {
      if (this.playing) return;
      this.disconnect();
      this.ticking(false);
      keepAwake(this, false);
    }, (FADE + AHEAD + 2) * 1000);
  }

  /** The music's way to the speakers: the master, dry and through the reverb. */
  private connect(): void {
    const [master, reverb, wet] = this.chain;
    if (this.connected || !this.ctx || !master || !reverb || !wet) return;
    master.connect(this.ctx.destination);
    master.connect(reverb).connect(wet).connect(this.ctx.destination);
    this.connected = true;
  }

  private disconnect(): void {
    if (!this.connected) return;
    for (const node of this.chain) node.disconnect();
    this.connected = false;
  }

  /** The notes of the next moments, on the audio clock: a voice silenced by hand is
   * scheduled too, so that it sounds again at once when it is let. */
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
    const { music, theme, heard } = this.state;
    root.music = music;
    if (theme) root.musicTheme = theme;
    if (heard) root.musicHeard = heard;
  }

  /** For the tests: the timer stopped. */
  dispose(): void {
    this.ticking(false);
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
