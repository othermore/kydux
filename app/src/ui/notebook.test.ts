import { describe, expect, it } from 'vitest';
import {
  type ApiTable,
  allows,
  familiarsListed,
  familiarVar,
  heldObjects,
  keptObjects,
  notebookEntries,
  notebookTabs,
  ownMethod,
  PYTHON,
  pythonBlocks,
  spellsAndWords,
  toFindParts,
} from './notebook';
import { readVariables } from '../editor/variables';
import { initLanguage } from '../i18n';
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
  it("holds the wizard, then the level's doors, each with its role, and no thing to be found (D344)", () => {
    expect(heldObjects(ROOMS, TABLE)).toEqual([
      { name: 'wizard', role: 'wizard' },
      { name: 'left_door', role: 'door' },
    ]);
  });

  it('holds no door that says it is no variable, nor one of a kind to find (D344)', () => {
    const doors = [
      { kind: 'door', id: 'door', variable: false },
      { kind: 'door', id: 'left_door' },
      { kind: 'bed', id: 'bed' },
      { kind: 'hole', id: 'hole' },
    ];
    expect(heldObjects({ id: 'one', things: doors }, TABLE).map((one) => one.name)).toEqual([
      'wizard',
      'left_door',
      'bed',
      'hole',
    ]);
    expect(heldObjects({ id: 'one', things: doors, to_find: ['door'] }, TABLE).map((one) => one.name)).toEqual([
      'wizard',
      'bed',
      'hole',
    ]);
  });

  it('shows only what the level teaches, each example with the object\'s own name', () => {
    const entries = notebookEntries(ROOMS, TABLE).map((e) => `${e.object}: ${e.example}`);
    expect(entries).toEqual(['wizard: wizard.move_right(3)', 'left_door: left_door.position', 'left_door: left_door.open()']);
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

  it("shows a plate with its position alone, once a level teaches it, and none before (D299)", () => {
    const table: ApiTable = {
      ...TABLE,
      roles: { ...TABLE.roles, plate: [{ name: 'position', kind: 'attribute', example: 'key.position' }] },
    };
    const things = ['moon', 'sun', 'star'].map((id) => ({ kind: 'plate', id }));
    const hall = { id: 'hall', things, api: ['thing.position', 'wizard.move_right'] };
    expect(heldObjects(hall, table).slice(1)).toEqual(things.map(({ id }) => ({ name: id, role: 'plate' })));
    expect(notebookEntries(hall, table).map((e) => e.object)).toEqual(['wizard']);
    const taught = notebookEntries({ ...hall, api: [...hall.api, 'plate.position'] }, table);
    expect(taught.filter((e) => e.role === 'plate').map((e) => e.example)).toEqual([
      'moon.position',
      'sun.position',
      'star.position',
    ]);
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
    expect(pythonBlocks()).toHaveLength(14);
    expect(pythonBlocks().flat()).toHaveLength(19);
    // A class and an object stand side by side once the class is taught, `__init__` and
    // `self` once `__init__` is (D272).
    expect(shown(['class', 'attributes', 'init'])).toEqual([['class', 'class'], ['attributes'], ['init', 'init']]);
    expect(pythonBlocks({ knownWords: [], concepts: ['class'] }).flat().map((entry) => entry.key ?? entry.concept)).toEqual([
      'class',
      'object',
    ]);
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
      expect(Object.keys(page)).toEqual(PYTHON.flatMap((block) => block.entries.map((entry) => entry.key ?? entry.concept)));
      for (const entry of Object.values(page)) {
        expect(entry.does?.trim()).toBeTruthy();
        expect(entry.example?.trim()).toBeTruthy();
      }
    }
  });
});

describe("the familiar's page of the notebook (D266, D269)", () => {
  const source = [
    'class Fox(Familiar):',
    '    def __init__(self, name, color):',
    '        self.name = name',
    '        self.color = color',
    '',
    '    def go_to(self, x, y):',
    '        if x < self.position.x:',
    '            self.move_left(self.position.x - x)',
    '',
  ].join('\n');
  const table: ApiTable = {
    roles: { wizard: [], thing: [], familiar: [{ name: 'position', kind: 'attribute', example: 'pimu.position' }] },
    thing_roles: ['thing'],
  };

  it("names the familiar as the child's code does, and shows its own go_to as written", () => {
    const level = {
      api: ['familiar.position'],
      familiar: { stage: 'living', from: 'learned', living: { name: 'Nabi', source: 'x', learned: source } },
    };
    expect(familiarVar(level)).toBe('nabi');
    expect(ownMethod(level, 'go_to')).toBe(
      ['def go_to(self, x, y):', '    if x < self.position.x:', '        self.move_left(self.position.x - x)'].join('\n'),
    );
    const entries = notebookEntries(level, table);
    expect(entries.map((entry) => entry.example)).toEqual(['nabi.position', 'nabi.go_to(13, 4)']);
    expect(entries[1]?.source).toContain('def go_to');
  });

  it("has no go_to before the living familiar's class has one, and no one else's familiar", () => {
    const level = {
      api: ['familiar.position'],
      actors: [{ id: 'mate_familiar', kind: 'familiar' }],
      familiar: { stage: 'trial', draft: { kind: 'Fox' } },
    };
    expect(heldObjects(level, table).map((one) => one.name)).toEqual(['wizard', 'pimu']);
    expect(ownMethod(level, 'go_to')).toBeNull();
  });
});

describe("the first year's familiars in the notebook (D298)", () => {
  const table = {
    kinds: { Fox: ['red', 'white', 'black'], Crow: ['black', 'white'], Bat: ['black', 'white'], Hare: ['brown', 'white'], Mouse: ['brown', 'white'], Frog: ['green', 'red'] },
    friend: { kind: 'Hare', name: 'Tolu', color: 'grey' },
  } as unknown as Parameters<typeof familiarsListed>[1];

  it('lists the six kinds where a familiar is described, with no colour before colours are taught', () => {
    const circle = { id: 'the-circle', familiar: { stage: 'trial' }, api: ['wizard.cast'] };
    expect(familiarsListed(circle, table)).toEqual(
      ['Fox', 'Crow', 'Bat', 'Hare', 'Mouse', 'Frog'].map((kind) => ({ kind, colours: [] })),
    );
    expect(familiarsListed({ ...circle, familiar: { stage: 'birth' } }, table)).toHaveLength(6);
  });

  it("gives each kind its colours once familiar.color is taught, and never the friend's grey", () => {
    const named = { id: 'the-name-and-the-colour', familiar: { stage: 'trial' }, api: ['familiar.color'] };
    const listed = familiarsListed(named, table) ?? [];
    expect(listed.find((entry) => entry.kind === 'Hare')?.colours).toEqual(['brown', 'white']);
    expect(listed.flatMap((entry) => entry.colours)).not.toContain('grey');
  });

  it('lists none in a living level, outside the chapter, or with no table', () => {
    expect(familiarsListed({ id: 'orlas-orders', familiar: { stage: 'living' } }, table)).toBeNull();
    expect(familiarsListed({ id: 'the-gate' }, table)).toBeNull();
    expect(familiarsListed({ id: 'the-circle', familiar: { stage: 'trial' } }, null)).toBeNull();
  });
});


describe("the notebook's two parts (D347)", () => {
  const table: ApiTable = {
    ...TABLE,
    roles: {
      ...TABLE.roles,
      thing: [
        { name: 'reveal', kind: 'action', example: 'key.reveal()' },
        { name: 'position', kind: 'attribute', example: 'key.position' },
      ],
    },
  };
  const fallen = {
    id: 'the-fallen-book',
    things: [
      { kind: 'door', id: 'door', variable: false },
      { kind: 'book', id: 'fallen_book' },
    ],
    to_find: ['book'],
    api: ['wizard.move_right', 'thing.reveal', 'thing.position'],
  };

  it('gives what is to find its line and its methods with a variable of your own, while nothing keeps it', () => {
    initLanguage({ languages: ['es'], storage: null });
    const parts = toFindParts(fallen, table, undefined, readVariables('', fallen));
    expect(parts).toHaveLength(1);
    expect(parts[0]).toMatchObject({ kind: 'book', feminine: false, line: 'tu_variable = wizard.find_nearest("book")' });
    expect(parts[0]?.methods.map((entry) => entry.example)).toEqual(['tu_variable.reveal()']);
  });

  it("puts the book's page under the child's variable once the code keeps it, and nothing is left to find", () => {
    initLanguage({ languages: ['es'], storage: null });
    const program = readVariables('tesoro = wizard.find_nearest("book")', fallen);
    expect(toFindParts(fallen, table, undefined, program)).toEqual([]);
    expect(keptObjects(fallen, table, program)).toEqual([{ name: 'tesoro', role: 'thing', kind: 'book' }]);
    const entries = notebookEntries(fallen, table, undefined, program).filter((entry) => entry.object === 'tesoro');
    expect(entries.map((entry) => entry.example)).toEqual(['tesoro.reveal()', 'tesoro.position']);
  });

  it('gives a level with nothing to find no part of what is to find', () => {
    expect(toFindParts({ id: 'room', things: [] }, table)).toEqual([]);
  });

  it('writes the line of a kind only carried with find_item, and a key, a broom, a door in the feminine', () => {
    initLanguage({ languages: ['en'], storage: null });
    const returned = { id: 'returned', carrying: [{ kind: 'book', art: 'old_book' }], to_find: ['book'], api: [] };
    expect(toFindParts(returned, table)[0]?.line).toBe('your_variable = wizard.find_item("book")');
    const keys = { id: 'keys', things: [{ kind: 'key', id: 'key' }], to_find: ['key'], api: [] };
    expect(toFindParts(keys, table)[0]?.feminine).toBe(true);
  });

  it("names a thing given or counted to by the child's variable, never by a word to search with (D345)", () => {
    initLanguage({ languages: ['es'], storage: null });
    const giving: ApiTable = {
      ...table,
      roles: { ...table.roles, wizard: [{ name: 'give', kind: 'action', example: 'wizard.give(eldras_book)' }] },
    };
    const level = { id: 'returned', carrying: ['book'], to_find: ['book'], api: ['wizard.give'] };
    const examples = (code: string) =>
      notebookEntries(level, giving, undefined, readVariables(code, level)).map((entry) => entry.example);
    expect(examples('')).toEqual(['wizard.give(tu_variable)']);
    expect(examples('libro_de_eldra = wizard.find_item("book")')).toEqual(['wizard.give(libro_de_eldra)']);
  });
});

describe('every kind a level asks to find has its words in the notebook (D347)', () => {
  it('in each language', () => {
    for (const catalog of [en, es]) {
      for (const kind of ['book', 'key', 'broom', 'door', 'thread']) {
        expect((catalog.notebook as unknown as { find: Record<string, string> }).find[kind]).toBeTruthy();
      }
    }
  });
});
