import { describe, expect, it } from 'vitest';
import {
  bowed,
  frequency,
  lineFor,
  loopOf,
  notesBetween,
  pianoRing,
  readTheme,
  sound,
  type Theme,
  timed,
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

  it('refuses a theme with a voice of no kind it sounds', () => {
    expect(() => readTheme({ ...waltz(120), voices: { tune: { kind: 'organ', volume: 1 } } })).toThrow(/no kind/);
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
