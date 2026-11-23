import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  checkedFamiliar,
  type Described,
  type FamiliarTable,
  familiarWords,
  friendsNames,
  keptAfter,
  mateColour,
  nameProblem,
  sheetOf,
  wordsOf,
  writeIntoLevel,
} from './familiar';

const repo = join(__dirname, '..', '..', '..');
const python = existsSync(join(repo, '.venv', 'bin', 'python')) ? join(repo, '.venv', 'bin', 'python') : 'python3';
/** The table the page reads, made by the world itself, as pack-world makes it. */
const made = spawnSync(python, ['-m', 'kydux_world.familiars'], { cwd: join(repo, 'world'), encoding: 'utf8' });
const table = JSON.parse(made.stdout) as FamiliarTable;
/** The cases the world's tests hold the same rules to (D260). */
const cases = JSON.parse(readFileSync(join(repo, 'world', 'tests', 'familiar_cases.json'), 'utf8')) as {
  names: [unknown, string | null][];
  mate_colours: [string, string | null, string | null][];
  friends: [string, string, string][];
};

const kindWords = (kind: string) =>
  kind === 'Hare'
    ? { kind: 'liebre', a_kind: 'una liebre', gender: 'f' as const }
    : { kind: kind.toLowerCase(), a_kind: `un ${kind.toLowerCase()}`, gender: 'm' as const };
const colourWord = (color: string, gender: 'm' | 'f') => `${color}-${gender}`;

describe("the familiar's rules, the page's and the world's", () => {
  it('checks a name as the world does (D261)', () => {
    for (const [name, problem] of cases.names) expect(nameProblem(name, table), String(name)).toBe(problem);
  });

  it("gives the room-mate's copy the kind's first other colour (D266)", () => {
    for (const [kind, color, mate] of cases.mate_colours) expect(mateColour(kind, color, table)).toBe(mate);
  });

  it("names the friends' familiars apart from the child's (D266)", () => {
    for (const [name, friend, mate] of cases.friends) expect(friendsNames(name, table)).toEqual({ friend, mate });
  });

  it('draws a creature from the sheet of its kind and colour (D273)', () => {
    expect(sheetOf('Fox', 'red')).toBe('familiar-fox-red');
    expect(Object.values(table.sheets).flat()).toHaveLength(14);
  });
});

describe('what the game keeps of its familiar (D265)', () => {
  const block = (stage: string, extra: Record<string, unknown> = {}) => ({
    id: 'x',
    familiar: { stage, circle: [8, 6, 11, 8], trials: [[10, 7]], ...extra },
  });

  it('drops a kept familiar that is not of the table', () => {
    expect(checkedFamiliar({ draft: { kind: 'Dragon' } }, table)).toEqual({});
    expect(checkedFamiliar({ draft: { kind: 'Fox', name: 'Pimu 2', color: 'blue' } }, table)).toEqual({
      draft: { kind: 'Fox' },
    });
    const living = { kind: 'Fox', name: 'Pimu', color: 'red', source: 'class Fox(Familiar):\n    pass' };
    expect(checkedFamiliar({ living }, table)).toEqual({ living });
  });

  it('keeps the trial of a describing level as the draft, and the familiar born for good', () => {
    const won = (trial: Described, more: { born?: boolean; source?: string } = {}) => ({
      status: 'won' as const,
      familiar: { trial, born: false, source: null as string | null, learned: null as string | null, ...more },
    });
    expect(keptAfter(block('trial'), won({ kind: 'Fox' }), {})).toEqual({
      draft: { kind: 'Fox' },
    });
    const born = won({ kind: 'Crow', name: 'Nabi', color: 'white' }, { born: true, source: 'class Crow(Familiar): ...' });
    expect(keptAfter(block('birth'), born, { draft: { kind: 'Crow' } })).toEqual({
      living: { kind: 'Crow', name: 'Nabi', color: 'white', source: 'class Crow(Familiar): ...' },
    });
    // The slate is the room-mate's: it keeps nothing.
    expect(keptAfter({ ...block('trial'), kind: 'fix' }, won({ kind: 'Fox', name: 'A', color: 'red' }), {})).toBeNull();
    // A run not won keeps nothing.
    expect(keptAfter(block('trial'), { status: 'incomplete' as const, familiar: born.familiar }, {})).toBeNull();
  });

  it('keeps nothing of a level played as practice, once a familiar lives', () => {
    const living = { kind: 'Fox', name: 'Pimu', color: 'red', source: 'class Fox(Familiar): ...' };
    const level = block('trial');
    writeIntoLevel(level, { living });
    expect((level.familiar as { practice?: boolean }).practice).toBe(true);
    expect(
      keptAfter(level, { status: 'won' as const, familiar: { trial: { kind: 'Bat' }, born: false, source: null, learned: null } }, { living }),
    ).toBeNull();
  });

  it('writes the living familiar into a living level, where it stands, and keeps what it learns', () => {
    const level: { id: string; familiar: Record<string, unknown> } = block('living', {
      living: { kind: 'Fox', name: 'Pimu', color: 'red', source: 'old', at: [10, 9] },
    });
    const living = { kind: 'Mouse', name: 'Rumi', color: 'white', source: 'class Mouse(Familiar): ...' };
    writeIntoLevel(level, { living });
    expect(level.familiar.living).toEqual({ ...living, at: [10, 9] });
    const won = { status: 'won' as const, familiar: { trial: null, born: false, source: null, learned: 'class Mouse(...): go_to' } };
    expect(keptAfter(level, won, { living })).toEqual({ living: { ...living, learned: 'class Mouse(...): go_to' } });
  });
});

describe('the familiar in the texts (D266)', () => {
  it("fills the placeholders from the game's familiar, its draft, or the default", () => {
    const none = familiarWords({}, table, kindWords, colourWord);
    expect(none.values.familiar).toBe('Pimu');
    expect(none.values.familiar_var).toBe('pimu');
    expect(none.values.mate_familiar).toBe('Kesi');
    expect(none.values.mate_color).toBe('white');
    expect(none.values.friend_familiar).toBe('Tolu');
    expect(none.values.familiar_color_word).toBe('red-m');
    const hare = familiarWords({ draft: { kind: 'Hare', name: 'Kesi' } }, table, kindWords, colourWord);
    expect(hare.values.familiar_a_kind).toBe('una liebre');
    expect(hare.values.familiar_color).toBe('brown');
    expect(hare.values.mate_familiar).toBe('Nabi');
    expect(hare.gender).toBe('f');
    expect(hare.values.familiar_source).toContain('class Hare(Familiar):');
  });

  it("takes a trial's own kind, name and colour where an event gives them (D264)", () => {
    const game = familiarWords({}, table, kindWords, colourWord);
    const trial = wordsOf(game, { kind: 'Hare', color: 'white' }, kindWords, colourWord);
    expect(trial.values.familiar_a_kind).toBe('una liebre');
    expect(trial.values.familiar_color_word).toBe('white-f');
    expect(trial.values.familiar).toBe('Pimu');
  });
});
