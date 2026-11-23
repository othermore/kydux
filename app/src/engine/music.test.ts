import { describe, expect, it } from 'vitest';
import {
  bowed,
  cueOf,
  frequency,
  lineAfter,
  lineFor,
  loopOf,
  loopSeconds,
  notesBetween,
  pianoRing,
  placed,
  readTheme,
  runBeat,
  runNotes,
  runOf,
  sectionAt,
  sound,
  type Theme,
  timed,
  timedRun,
  voiceLevels,
} from './music';

/** A theme of two sections of one bar of 3/4 each, the second played twice. */
function waltz(tempo: number): Theme {
  return readTheme({
    id: 'test',
    tempo,
    metre: [3, 4],
    voices: {
      tune: { kind: 'celesta', volume: 0.8 },
      bass: { kind: 'pluck', volume: 0.5 },
    },
    sections: [
      { id: 'a', bars: 1, notes: { tune: [[72, 0, 1, 0.6], [74, 1, 1, 0.6], [76, 2, 1, 0.6]], bass: [[41, 0, 3, 0.5]] } },
      { id: 'b', bars: 1, notes: { tune: [[77, 0, 3, 0.6]] } },
    ],
    order: ['a', 'b', 'b'],
  });
}

describe('the music (D192)', () => {
  it('lays a theme out as one loop, its sections in their order', () => {
    const loop = loopOf(waltz(120));
    expect(loop.beats).toBe(9);
    expect(loop.notes.map((note) => [note.voice, note.pitch, note.beat])).toEqual([
      ['bass', 41, 0],
      ['tune', 72, 0],
      ['tune', 74, 1],
      ['tune', 76, 2],
      ['tune', 77, 3],
      ['tune', 77, 6],
    ]);
  });

  it('finds the notes of a stretch of beats, round the loop again without a seam', () => {
    const loop = loopOf(waltz(120));
    expect(notesBetween(loop, 8, 10).map((note) => [note.pitch, note.beat])).toEqual([
      [41, 9],
      [72, 9],
    ]);
    expect(notesBetween(loop, 0, 27)).toHaveLength(18);
  });

  it("sets a bar's notes at their beats on the audio clock, at the tempo of the file", () => {
    for (const [tempo, beat] of [
      [120, 0.5],
      [60, 1],
    ] as const) {
      const theme = waltz(tempo);
      const notes = timed(theme, loopOf(theme), 10, 10, 10 + 3 * beat).filter((note) => note.voice === 'tune');
      expect(notes.map((note) => note.at)).toEqual([10, 10 + beat, 10 + 2 * beat]);
      expect(notes.map((note) => note.seconds)).toEqual([beat, beat, beat]);
    }
  });

  it('plays every voice a story plays in a level too, each at 0.4 of its loudness (D210)', () => {
    const theme = waltz(120);
    const story = voiceLevels(theme, 'story');
    expect(story).toEqual({ tune: 0.8, bass: 0.5 });
    const level = voiceLevels(theme, 'level');
    expect(Object.keys(level)).toEqual(Object.keys(story));
    for (const [name, loudness] of Object.entries(story)) expect(level[name]).toBeCloseTo(loudness * 0.4);
  });

  it('gives a voice set by hand its volume, none to silence it (D203)', () => {
    const theme = waltz(120);
    expect(voiceLevels(theme, 'story', { tune: 0.2 })).toEqual({ tune: 0.2, bass: 0.5 });
    expect(voiceLevels(theme, 'story', { bass: 0 })).toEqual({ tune: 0.8, bass: 0 });
    expect(voiceLevels(theme, 'level', { tune: 0.5 }).tune).toBeCloseTo(0.2);
  });

  it('refuses a theme with arrangements: a theme has one set of voices (D210)', () => {
    expect(() => readTheme({ ...waltz(120), arrangements: { full: ['tune'], quiet: [] } })).toThrow(/one set of voices/);
  });

  it("ends a piano's note by itself, however long it is written, a low one later (D209)", () => {
    const ctx = fakeContext();
    const out = ctx.createGain() as unknown as AudioNode;
    const short = sound(ctx, 'piano', 60, 1, 0.25, 0.5, out);
    const long = sound(ctx, 'piano', 60, 1, 8, 0.5, out);
    expect(short).toBe(long);
    expect(short - 1).toBeCloseTo(0.003 + pianoRing(60));
    expect(short - 1).toBeLessThan(8);
    expect(pianoRing(48)).toBeGreaterThan(pianoRing(72));
    // A celesta's bell rings as long as its note is written, when that is longer.
    expect(sound(ctx, 'celesta', 60, 1, 8, 0.5, out)).toBeGreaterThan(sound(ctx, 'celesta', 60, 1, 0.25, 0.5, out));
  });

  it("holds a horn's note for its length, and ends a snare's tap at once (D213)", () => {
    const ctx = fakeContext();
    const out = ctx.createGain() as unknown as AudioNode;
    const held = sound(ctx, 'brass', 52, 1, 3, 0.5, out);
    expect(held - 1).toBeGreaterThan(3);
    expect(held - 1).toBeLessThan(3.5);
    expect(sound(ctx, 'brass', 52, 1, 0.5, 0.5, out)).toBeLessThan(held);
    // A cymbal rings for its note's length, a crash or a tick, up to three seconds.
    expect(sound(ctx, 'cymbal', 60, 1, 2, 0.5, out)).toBeCloseTo(3.002);
    expect(sound(ctx, 'cymbal', 60, 1, 0.1, 0.5, out)).toBeCloseTo(1.102);
    expect(sound(ctx, 'cymbal', 60, 1, 9, 0.5, out)).toBeCloseTo(4.002);
    // A snare has no pitch and no length of its own to write: a tap is a tap.
    const tap = sound(ctx, 'snare', 60, 1, 0.25, 0.5, out);
    expect(tap).toBe(sound(ctx, 'snare', 72, 1, 4, 0.5, out));
    expect(tap - 1).toBeLessThan(0.2);
  });

  it("leads a pad's note onto the line whose note is over, the nearest in pitch (D203)", () => {
    const lines = [
      { until: 4, pitch: 53 },
      { until: 4, pitch: 57 },
      { until: 6, pitch: 60 },
    ];
    expect(lineFor(lines, 4, 58)).toBe(1);
    expect(lineFor(lines, 4, 52)).toBe(0);
    // The third line's note still sounds at 4: a note there takes another line.
    expect(lineFor(lines, 4, 60)).toBe(1);
    expect(lineFor(lines, 6, 60)).toBe(2);
    expect(lineFor(lines, 3, 55)).toBe(-1);
    expect(lineFor([], 0, 60)).toBe(-1);
  });

  it("starts a pad's line from silence, and takes back the dying away only of a line that sounded", () => {
    const { ctx, gains } = toldContext();
    const out = ctx.createGain() as unknown as AudioNode;
    const lines: Parameters<typeof bowed>[1] = [];
    bowed(ctx, lines, 60, 2, 1, 0.5, out);
    expect(lines).toHaveLength(1);
    // A line just made is silent until its note swells: nothing takes its silence back.
    expect(gains[1]).toEqual([
      ['set', 0, 2],
      ['target', 0.5 * 0.07, 2],
      ['target', 0, 3],
    ]);
    // The note that follows sounds on the same line, whose dying away is taken back.
    bowed(ctx, lines, 62, 3, 1, 0.5, out);
    expect(lines).toHaveLength(1);
    expect(gains[1]?.slice(3)).toEqual([
      ['cancel', 3 - 0.02],
      ['target', 0.5 * 0.07, 3],
      ['target', 0, 4],
    ]);
    // A note while that line still sounds starts a line of its own, from silence too.
    bowed(ctx, lines, 67, 3.5, 1, 0.5, out);
    expect(lines).toHaveLength(2);
    expect(gains[2]?.[0]).toEqual(['set', 0, 3.5]);
    expect(gains[2]?.some(([call]) => call === 'cancel')).toBe(false);
  });

  it("says how long a theme's loop lasts, and the section of each of its moments (D312)", () => {
    // Three bars of three beats, half a second a beat: a, then b twice.
    const theme = waltz(120);
    expect(loopSeconds(theme)).toBe(4.5);
    expect(sectionAt(theme, 0)).toBe('a');
    expect(sectionAt(theme, 1.4)).toBe('a');
    expect(sectionAt(theme, 1.5)).toBe('b');
    expect(sectionAt(theme, 4.4)).toBe('b');
    expect(sectionAt(theme, 4.5)).toBe('b');
  });

  it('lays a section of a tempo of its own out at its pace, the loop in beats of the theme (D315)', () => {
    // The second section twice as fast as the theme: its bar takes half the beats.
    const base = waltz(120);
    const theme = readTheme({
      ...base,
      sections: base.sections.map((section) => (section.id === 'b' ? { ...section, tempo: 240 } : section)),
    });
    const loop = loopOf(theme);
    expect(loop.beats).toBe(6);
    expect(loop.notes.filter((note) => note.pitch === 77).map((note) => [note.beat, note.length])).toEqual([
      [3, 1.5],
      [4.5, 1.5],
    ]);
    expect(loopSeconds(theme)).toBe(3);
    expect(sectionAt(theme, 1.4)).toBe('a');
    expect(sectionAt(theme, 1.5)).toBe('b');
    const [first, second] = timed(theme, loop, 0, 1.5, 3).filter((note) => note.pitch === 77);
    expect([first?.at, first?.seconds, second?.at]).toEqual([1.5, 0.75, 2.25]);
    // A section at the theme's tempo keeps its beats to the last digit.
    expect(placed(base, base.sections[0]!, 0.3333)).toBe(0.3333);
  });

  it('speeds a section up evenly from a tempo to another, each beat shorter than the one before (D315)', () => {
    const base = waltz(60);
    const section = { ...base.sections[0]!, bars: 2, tempo: [60, 120] as [number, number] };
    const theme = readTheme({ ...base, sections: [section], order: ['a'] });
    const at = [0, 1, 2, 3, 4, 5, 6].map((beat) => placed(theme, section, beat));
    expect(at[0]).toBe(0);
    const lengths = at.slice(1).map((value, index) => value - at[index]!);
    for (const [index, length] of lengths.entries()) {
      if (index > 0) expect(length).toBeLessThan(lengths[index - 1]!);
    }
    // The first beat a little shorter than a beat at 60, the last a little longer than one at 120.
    expect(lengths[0]).toBeLessThan(1);
    expect(lengths[0]).toBeGreaterThan(0.9);
    expect(lengths[5]).toBeGreaterThan(0.5);
    expect(lengths[5]).toBeLessThan(0.55);
    // Six beats whose tempo doubles evenly last as long as six times the logarithm of two at the first tempo.
    expect(at[6]).toBeCloseTo(6 * Math.log(2));
    expect(loopSeconds(theme)).toBeCloseTo(6 * Math.log(2));
    expect(loopOf(theme).beats).toBeCloseTo(6 * Math.log(2));
    // Slowing down is the same the other way round.
    const slowing = { ...section, tempo: [120, 60] as [number, number] };
    expect(placed(theme, slowing, 6)).toBeCloseTo(3 * Math.log(2) * 2);
    expect(placed(theme, slowing, 1)).toBeLessThan(placed(theme, slowing, 6) - placed(theme, slowing, 5));
  });

  it("refuses a section's tempo that is neither one nor a pair (D315)", () => {
    const base = waltz(120);
    const withTempo = (tempo: unknown) => ({
      ...base,
      sections: base.sections.map((section) => ({ ...section, tempo })),
    });
    expect(() => readTheme(withTempo(0))).toThrow(/tempo/);
    expect(() => readTheme(withTempo([90]))).toThrow(/tempo/);
    expect(() => readTheme(withTempo([90, -1]))).toThrow(/tempo/);
    expect(() => readTheme(withTempo([90, 120]))).not.toThrow();
  });

  it("holds an organ's and a cello's note for its length (D315)", () => {
    const ctx = fakeContext();
    const out = ctx.createGain() as unknown as AudioNode;
    for (const kind of ['organ', 'cello'] as const) {
      const held = sound(ctx, kind, 50, 1, 3, 0.5, out);
      expect(held - 1).toBeGreaterThan(3);
      expect(held - 1).toBeLessThan(3.5);
      expect(sound(ctx, kind, 50, 1, 0.5, 0.5, out)).toBeLessThan(held);
    }
  });

  it('refuses a theme with a voice of no kind it sounds', () => {
    expect(() => readTheme({ ...waltz(120), voices: { tune: { kind: 'kazoo', volume: 1 } } })).toThrow(/no kind/);
  });

  it('tunes the A above the middle C to 440 hertz', () => {
    expect(frequency(69)).toBe(440);
    expect(frequency(81)).toBe(880);
  });
});

/** An audio context that takes the calls a pad's line makes and sounds nothing, with
 * what every gain it made was told, in the order it made them. */
function toldContext(): { ctx: AudioContext; gains: [call: string, ...values: number[]][][] } {
  const gains: [call: string, ...values: number[]][][] = [];
  const param = () => ({ setValueAtTime: () => undefined, setTargetAtTime: () => undefined });
  const node = () => ({ connect: (target: unknown) => target });
  const ctx = {
    createGain: () => {
      const told: [call: string, ...values: number[]][] = [];
      gains.push(told);
      return {
        ...node(),
        gain: {
          setValueAtTime: (value: number, at: number) => told.push(['set', value, at]),
          setTargetAtTime: (value: number, at: number) => told.push(['target', value, at]),
          cancelScheduledValues: (at: number) => told.push(['cancel', at]),
        },
      };
    },
    createBiquadFilter: () => ({ ...node(), type: '', frequency: param() }),
    createOscillator: () => ({ ...node(), type: '', frequency: param(), detune: param(), start: () => undefined }),
  } as unknown as AudioContext;
  return { ctx, gains };
}

/** An audio context that only takes the calls a struck note makes, and sounds nothing. */
function fakeContext(): AudioContext {
  const param = () => ({
    setValueAtTime: () => undefined,
    exponentialRampToValueAtTime: () => undefined,
    linearRampToValueAtTime: () => undefined,
    setTargetAtTime: () => undefined,
  });
  const node = () => ({ connect: (target: unknown) => target });
  return {
    sampleRate: 8000,
    createBuffer: (_channels: number, length: number) => ({ getChannelData: () => new Float32Array(length) }),
    createBufferSource: () => ({ ...node(), buffer: null, start: () => undefined, stop: () => undefined }),
    createGain: () => ({ ...node(), gain: param() }),
    createBiquadFilter: () => ({ ...node(), type: '', frequency: param(), Q: param() }),
    createOscillator: () => ({ ...node(), type: '', frequency: param(), start: () => undefined, stop: () => undefined }),
  } as unknown as AudioContext;
}

describe('a theme told in movements (D316)', () => {
  /** Four sections in 3/4 at 60: `still` of two bars, `rise` of one bar twice as fast,
   * `full` of two bars, `hush` of one; three movements, the second with a lead. */
  const told = (): Theme =>
    readTheme({
      id: 'told',
      tempo: 60,
      metre: [3, 4],
      voices: { tune: { kind: 'piano', volume: 0.8 } },
      sections: [
        { id: 'still', bars: 2, notes: { tune: [[60, 0, 3, 0.5], [62, 3, 3, 0.5]] } },
        { id: 'rise', bars: 1, tempo: 120, notes: { tune: [[64, 0, 1, 0.5], [65, 2, 1, 0.5]] } },
        { id: 'full', bars: 2, notes: { tune: [[67, 0, 3, 0.5], [69, 3, 3, 0.5]] } },
        { id: 'hush', bars: 1, notes: { tune: [[48, 0, 3, 0.3]] } },
      ],
      movements: [
        { id: 'first', round: ['still'] },
        { id: 'height', once: ['rise'], round: ['full'] },
        { id: 'silence', round: ['hush'], enters: 'beat' },
      ],
    });

  it('a cue names a theme, or a theme and one of its movements', () => {
    expect(cueOf('the-truth')).toEqual({ id: 'the-truth' });
    expect(cueOf('the-truth/height')).toEqual({ id: 'the-truth', movement: 'height' });
  });

  it('with no movement named, every section sounds in its order, over and over', () => {
    const run = runOf(told());
    expect(run.movement).toBeUndefined();
    expect(run.lead.beats).toBe(0);
    expect(run.round.beats).toBeCloseTo(6 + 1.5 + 6 + 3);
    expect(run.sections.map((section) => section.id)).toEqual(['still', 'rise', 'full', 'hush']);
    expect(runOf(told(), 'nowhere').movement).toBeUndefined();
  });

  it('a movement plays its lead once and then its own sections over and over', () => {
    const run = runOf(told(), 'height');
    expect(run.movement).toBe('height');
    expect(run.lead.beats).toBeCloseTo(1.5);
    expect(run.round.beats).toBe(6);
    const heard = runNotes(run, 0, 1.5 + 12).map((note) => [note.pitch, Number(note.beat.toFixed(3))]);
    expect(heard).toEqual([
      [64, 0],
      [65, 1],
      [67, 1.5],
      [69, 4.5],
      [67, 7.5],
      [69, 10.5],
    ]);
    // From a moment within the loop, only what starts from there.
    expect(runNotes(run, 5, 8).map((note) => note.pitch)).toEqual([67]);
    expect(runNotes(run, 0, 1).map((note) => note.pitch)).toEqual([64]);
  });

  it("a run's notes fall on the audio clock from the run's first beat", () => {
    const theme = told();
    const notes = timedRun(theme, runOf(theme, 'height'), 100, 100, 103);
    expect(notes.map((note) => [note.pitch, Number(note.at.toFixed(3))])).toEqual([
      [64, 100],
      [65, 101],
      [67, 101.5],
    ]);
  });

  it('where a run is, the lead once and the loop time after time', () => {
    const run = runOf(told(), 'height');
    expect(runBeat(run, 1)).toBe(1);
    expect(runBeat(run, 1.5 + 6 + 2)).toBeCloseTo(3.5);
    expect(runBeat(run, -1)).toBe(0);
  });

  it("another movement comes in at the next bar's line, or at the next beat", () => {
    const theme = told();
    const first = runOf(theme, 'first');
    expect(lineAfter(first, 3, 0.2, 'bar')).toBe(3);
    expect(lineAfter(first, 3, 3, 'bar')).toBe(3);
    expect(lineAfter(first, 3, 3.1, 'bar')).toBe(6);
    expect(lineAfter(first, 3, 13.5, 'bar')).toBe(15);
    expect(lineAfter(first, 3, 13.5, 'beat')).toBe(14);
    // A beat of a faster section is shorter, and the lead's end is a bar's line.
    const height = runOf(theme, 'height');
    expect(lineAfter(height, 3, 0.2, 'beat')).toBeCloseTo(0.5);
    expect(lineAfter(height, 3, 0.2, 'bar')).toBeCloseTo(1.5);
    expect(lineAfter(height, 3, 1.5 + 6 + 3.5, 'bar')).toBeCloseTo(1.5 + 12);
  });

  it('a movement that names no section, or one the theme has not, is refused', () => {
    const theme = told();
    expect(() => readTheme({ ...theme, movements: [{ id: 'empty', round: [] }] })).toThrow(/over and over/);
    expect(() => readTheme({ ...theme, movements: [{ id: 'lost', round: ['nowhere'] }] })).toThrow(/has not/);
    expect(() => readTheme({ ...theme, movements: [{ id: 'odd', round: ['still'], enters: 'now' }] })).toThrow(/bar/);
  });
});
