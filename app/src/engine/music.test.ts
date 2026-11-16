import { describe, expect, it } from 'vitest';
import { arranged, frequency, lineFor, loopOf, notesBetween, readTheme, type Theme, timed } from './music';

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
    arrangements: { full: ['tune', 'bass'], quiet: ['bass'] },
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

  it('plays every voice in full and the quiet ones a little lower', () => {
    const theme = waltz(120);
    expect(arranged(theme, 'full')).toEqual({ tune: 0.8, bass: 0.5 });
    const quiet = arranged(theme, 'quiet');
    expect(quiet.tune).toBe(0);
    expect(quiet.bass).toBeGreaterThan(0);
    expect(quiet.bass).toBeLessThan(0.5);
  });

  it('gives a voice set by hand its volume, whether the arrangement plays it or not (D203)', () => {
    const theme = waltz(120);
    expect(arranged(theme, 'full', { tune: 0.2 })).toEqual({ tune: 0.2, bass: 0.5 });
    expect(arranged(theme, 'full', { bass: 0 })).toEqual({ tune: 0.8, bass: 0 });
    const quiet = arranged(theme, 'quiet', { tune: 0.5 });
    expect(quiet.tune).toBeGreaterThan(0);
    expect(quiet.tune).toBeLessThan(0.5);
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

  it('refuses a theme with a voice of no kind it sounds', () => {
    expect(() => readTheme({ ...waltz(120), voices: { tune: { kind: 'organ', volume: 1 } } })).toThrow(/no kind/);
  });

  it('tunes the A above the middle C to 440 hertz', () => {
    expect(frequency(69)).toBe(440);
    expect(frequency(81)).toBe(880);
  });
});
