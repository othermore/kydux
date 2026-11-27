import { python } from '@codemirror/lang-python';
import { EditorState } from '@codemirror/state';
import { beforeAll, describe, expect, it } from 'vitest';
import { initLanguage } from '../i18n';
import { offered } from './complete';
import type { ApiTable } from './notebook';

const TABLE: ApiTable = {
  roles: {
    wizard: [
      { name: 'move_left', kind: 'action', example: 'wizard.move_left(3)' },
      { name: 'find_nearest', kind: 'action', example: 'wizard.find_nearest("key")' },
    ],
    thing: [
      { name: 'reveal', kind: 'action', example: 'key.reveal()' },
      { name: 'position', kind: 'attribute', example: 'key.position' },
    ],
    broom: [
      { name: 'reveal', kind: 'action', example: 'key.reveal()' },
      { name: 'untie', kind: 'action', example: 'broom.untie()' },
    ],
    door: [{ name: 'open', kind: 'action', example: 'door.open()' }],
  },
  thing_roles: ['thing', 'broom', 'door'],
};

/** The fallen book's world: a book to find, its door no variable. */
const FALLEN = {
  id: 'the-fallen-book',
  things: [
    { kind: 'door', id: 'door', variable: false },
    { kind: 'book', id: 'fallen_book' },
  ],
  to_find: ['book'],
  api: ['wizard.move_left', 'wizard.find_nearest', 'thing.reveal'],
};

/** What the editor offers at the end of `code`, by label. */
function at(code: string, level: Record<string, unknown> = FALLEN): string[] | null {
  const state = EditorState.create({ doc: code, extensions: [python()] });
  return offered(state, code.length, level, TABLE)?.options.map((option) => option.label) ?? null;
}

beforeAll(() => initLanguage({ languages: ['es'], storage: null }));

describe('what the editor offers after a dot (D348)', () => {
  it("offers a kept find the members the level teaches of its kind, with the notebook's words", () => {
    expect(at('tesoro = wizard.find_nearest("book")\ntesoro.')).toEqual(['reveal']);
    const state = EditorState.create({ doc: 'tesoro = wizard.find_nearest("book")\ntesoro.re', extensions: [python()] });
    const found = offered(state, state.doc.length, FALLEN, TABLE);
    expect(found?.from).toBe(state.doc.length - 2);
    expect(found?.options[0]?.type).toBe('method');
  });

  it('offers what the level gives as before', () => {
    expect(at('wizard.')).toEqual(['move_left', 'find_nearest']);
  });

  it("offers a loop's variable and one taken from a list their kind's members, and a list nothing", () => {
    const shed = {
      id: 'shed',
      things: [{ kind: 'broom', id: 'broom_0' }],
      to_find: ['broom'],
      api: ['broom.untie', 'thing.reveal'],
    };
    expect(at('escobas = wizard.find_all("broom")\nfor escoba in escobas:\n    escoba.', shed)).toEqual(['reveal', 'untie']);
    expect(at('escobas = wizard.find_all("broom")\nprimera = escobas[0]\nprimera.', shed)).toEqual(['reveal', 'untie']);
    expect(at('escobas = wizard.find_all("broom")\nescobas.', shed)).toBeNull();
  });

  it('offers nothing for a search word with nothing found, a name alone, before a dot, or inside quotes', () => {
    expect(at('book.')).toBeNull();
    expect(at('pasos = 2\npasos.')).toBeNull();
    expect(at('tesoro = wizard.find_nearest("book")\ntes')).toBeNull();
    expect(at('tesoro = wizard.find_nearest("book")\nwizard.find_nearest("tesoro.')).toBeNull();
    expect(at('tesoro = wizard.find_nearest("book")\n# tesoro.')).toBeNull();
  });

  it('offers the door no member where it is no variable', () => {
    expect(at('door.')).toBeNull();
  });
});
