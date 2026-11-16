import { describe, expect, it } from 'vitest';
import { type ApiTable, allows, heldObjects, notebookEntries, notebookTabs, PYTHON, pythonBlocks, spellsAndWords } from './notebook';
import en from '../../../i18n/en.json';
import es from '../../../i18n/es.json';

const TABLE: ApiTable = {
  roles: {
    wizard: [
      { name: 'move_right', kind: 'action', example: 'wizard.move_right(3)' },
      { name: 'pick_up', kind: 'action', example: 'wizard.pick_up()' },
      { name: 'position', kind: 'attribute', example: 'wizard.position.x' },
    ],
    thing: [{ name: 'position', kind: 'attribute', example: 'key.position' }],
    door: [
      { name: 'position', kind: 'attribute', example: 'key.position' },
      { name: 'open', kind: 'action', example: 'door.open()' },
    ],
    key: [{ name: 'position', kind: 'attribute', example: 'key.position' }],
  },
  thing_roles: ['thing', 'door', 'key'],
};

const ROOMS = {
  id: 'rooms',
  things: [
    { kind: 'key', id: 'silver_key' },
    { kind: 'door', id: 'left_door' },
    { kind: 'book', id: 'book' },
  ],
  actors: [],
  api: ['wizard.move_right', 'door.open', 'thing.position'],
};

describe('the notebook', () => {
  it('holds the wizard, then the level\'s things, each with its role', () => {
    expect(heldObjects(ROOMS, TABLE)).toEqual([
      { name: 'wizard', role: 'wizard' },
      { name: 'silver_key', role: 'key' },
      { name: 'left_door', role: 'door' },
      { name: 'book', role: 'thing' },
    ]);
  });

  it('shows only what the level teaches, each example with the object\'s own name', () => {
    const entries = notebookEntries(ROOMS, TABLE).map((e) => `${e.object}: ${e.example}`);
    expect(entries).toEqual([
      'wizard: wizard.move_right(3)',
      'silver_key: silver_key.position',
      'left_door: left_door.position',
      'left_door: left_door.open()',
      'book: book.position',
    ]);
  });

  it('gives a thing\'s members to doors and keys through thing.<member>', () => {
    expect(allows(['thing.position'], TABLE, 'door', 'position')).toBe(true);
    expect(allows(['thing.position'], TABLE, 'door', 'open')).toBe(false);
    expect(allows(['thing.position'], TABLE, 'wizard', 'position')).toBe(false);
  });

  it("shows a position's two numbers under the wizard's attributes (D153)", () => {
    const table: ApiTable = {
      ...TABLE,
      roles: { ...TABLE.roles, position: [{ name: 'x', kind: 'attribute', example: 'wizard.position.x' }] },
    };
    const taught = notebookEntries({ id: 'room', api: ['position.x'] }, table);
    expect(taught.map(({ object, role, example }) => [object, role, example])).toEqual([
      ['wizard', 'position', 'wizard.position.x'],
    ]);
    expect(notebookEntries({ id: 'room', api: [] }, table)).toEqual([]);
  });

  it('is empty for a level that teaches nothing yet', () => {
    expect(notebookEntries({ id: 'none', api: [] }, TABLE)).toEqual([]);
  });

  it('lists the spells once the wizard can cast, and the words once it can speak (D80)', () => {
    const level = { id: 'gate', spells: ['zelim'] };
    const course = { knownWords: ['ambrel'] };
    expect(spellsAndWords({ ...level, api: ['wizard.cast', 'wizard.say'] }, course)).toEqual({
      spells: ['zelim'],
      words: ['ambrel'],
    });
    expect(spellsAndWords({ ...level, api: ['wizard.say'] }, course)).toEqual({ spells: [], words: ['ambrel'] });
    expect(spellsAndWords({ id: 'none', api: ['wizard.cast'] })).toEqual({ spells: [], words: [] });
  });

  it("lists Python's words a level's concepts hold, block by block in the table's order, and every one outside the course (D256)", () => {
    const shown = (concepts?: string[]) =>
      pythonBlocks(concepts && { knownWords: [], concepts }).map((block) => block.map((entry) => entry.concept));
    // A comment, a string, an argument, `print` and `len` are concepts with no entry.
    expect(shown(['comments', 'arguments', 'strings', 'print', 'len'])).toEqual([]);
    expect(shown(['def', 'lists', 'comments', 'len', 'if'])).toEqual([['if'], ['lists'], ['def']]);
    // A block's entries stand side by side once each is taught.
    expect(shown(['if', 'else', 'for_range'])).toEqual([['if', 'else'], ['for_range']]);
    expect(shown(['for_range', 'while', 'for_each', 'def', 'def_arguments'])).toEqual([
      ['for_range', 'for_each'],
      ['while'],
      ['def', 'def_arguments'],
    ]);
    // The comparisons are one entry: `==` alone, then `==`, `<` and `>` together.
    expect(pythonBlocks({ knownWords: [], concepts: ['equal', 'not'] })).toEqual([
      [{ concept: 'equal', shown: '==' }],
      [{ concept: 'not', shown: 'not' }],
    ]);
    expect(pythonBlocks({ knownWords: [], concepts: ['equal', 'not', 'less_greater'] })).toEqual([
      [{ concept: 'less_greater', shown: '==  <  >' }],
      [{ concept: 'not', shown: 'not' }],
    ]);
    expect(pythonBlocks()).toHaveLength(9);
    expect(pythonBlocks().flat()).toHaveLength(12);
  });

  it('has the tabs that have something in them, in their order (D256)', () => {
    const walking = { api: ['wizard.move_right'] };
    const casting = { api: ['wizard.move_right', 'wizard.cast'], spells: ['zelim'] };
    expect(notebookTabs(walking, { knownWords: [], concepts: [] })).toEqual(['actions']);
    expect(notebookTabs(walking, { knownWords: [], concepts: ['comments', 'strings', 'print'] })).toEqual(['actions']);
    expect(notebookTabs(walking, { knownWords: [], concepts: ['variables'] })).toEqual(['actions', 'python']);
    expect(notebookTabs(casting, { knownWords: [], concepts: [] })).toEqual(['actions', 'spells']);
    expect(notebookTabs(casting, { knownWords: [], concepts: ['variables'] })).toEqual(['actions', 'python', 'spells']);
  });

  it("has a line and an example for every word of the page, in every language (D256)", () => {
    for (const words of [en, es] as Record<string, unknown>[]) {
      const page = words.notebook_python as Record<string, { does?: string; example?: string }>;
      expect(Object.keys(page)).toEqual(PYTHON.flatMap((block) => block.entries.map((entry) => entry.concept)));
      for (const entry of Object.values(page)) {
        expect(entry.does?.trim()).toBeTruthy();
        expect(entry.example?.trim()).toBeTruthy();
      }
    }
  });
});
