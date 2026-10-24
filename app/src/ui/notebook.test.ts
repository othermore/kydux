import { describe, expect, it } from 'vitest';
import { type ApiTable, allows, heldObjects, notebookEntries, spellsAndWords } from './notebook';

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
});
