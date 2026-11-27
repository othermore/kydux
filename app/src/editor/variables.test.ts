import { describe, expect, it } from 'vitest';
import { readVariables, shownValue } from './variables';

/** A level with a book to find, a broom and a key, and a book the wizard carries. */
const LEVEL = {
  id: 'room',
  things: [
    { kind: 'door', id: 'door' },
    { kind: 'book', id: 'old_book' },
    { kind: 'broom', id: 'broom_0' },
    { kind: 'key', id: 'key' },
  ],
  carrying: ['wand', { kind: 'potion', art: 'old_potion' }],
  to_find: ['book', 'broom'],
};

const chips = (code: string) => readVariables(code, LEVEL).declared;
const toFind = (code: string) => readVariables(code, LEVEL).toFind;

describe('what the code declares, by the closed table (D346)', () => {
  it('shows a number or a string written by hand and assigned once with its value', () => {
    expect(chips('steps = 2\ngreeting = "Hola"')).toEqual([
      { name: 'steps', label: 'steps', sort: 'variable', value: '2', whole: '2' },
      { name: 'greeting', label: 'greeting', sort: 'variable', value: '"Hola"', whole: '"Hola"' },
    ]);
  });

  it('shows a name alone when it is assigned twice, or something computed', () => {
    expect(chips('steps = 2\nsteps = 3\nrest = 5 - steps\nfar = key.distance_to(wizard)')).toEqual([
      { name: 'steps', label: 'steps', sort: 'variable' },
      { name: 'rest', label: 'rest', sort: 'variable' },
      { name: 'far', label: 'far', sort: 'variable' },
    ]);
  });

  it("shows a find kept with its kind's picture, and takes its word out of what is to find", () => {
    expect(chips('mine = wizard.find_nearest("book")\nsip = wizard.find_item("potion")')).toEqual([
      { name: 'mine', label: 'mine', sort: 'variable', thing: 'book' },
      { name: 'sip', label: 'sip', sort: 'variable', thing: 'potion' },
    ]);
    expect(toFind('mine = wizard.find_nearest("book")')).toEqual(['broom']);
  });

  it("shows a find_all's list with its kind's picture in brackets", () => {
    expect(chips('brooms = wizard.find_all("broom")')).toEqual([
      { name: 'brooms', label: 'brooms', sort: 'variable', thing: 'broom', list: true },
    ]);
    expect(toFind('brooms = wizard.find_all("broom")')).toEqual(['book']);
  });

  it("gives a loop's variable over a list the kind's picture, and the loop over a find_all takes its word out", () => {
    expect(chips('brooms = wizard.find_all("broom")\nfor each in brooms:\n    each.untie()')).toEqual([
      { name: 'brooms', label: 'brooms', sort: 'variable', thing: 'broom', list: true },
      { name: 'each', label: 'each', sort: 'variable', thing: 'broom' },
    ]);
    expect(chips('for each in wizard.find_all("broom"):\n    each.untie()')).toEqual([
      { name: 'each', label: 'each', sort: 'variable', thing: 'broom' },
    ]);
    expect(toFind('for each in wizard.find_all("broom"):\n    each.untie()')).toEqual(['book']);
  });

  it('gives an element of a list, at any index, and a copy of a variable the same picture', () => {
    expect(chips('brooms = wizard.find_all("broom")\nfirst = brooms[0]\nlast = brooms[len(brooms) - 1]\nother = first')).toEqual([
      { name: 'brooms', label: 'brooms', sort: 'variable', thing: 'broom', list: true },
      { name: 'first', label: 'first', sort: 'variable', thing: 'broom' },
      { name: 'last', label: 'last', sort: 'variable', thing: 'broom' },
      { name: 'other', label: 'other', sort: 'variable', thing: 'broom' },
    ]);
  });

  it('makes one chip of a find inside a loop or an if, as outside', () => {
    expect(chips('if True:\n    mine = wizard.find_nearest("book")\nfor turn in range(2):\n    mine = wizard.find_nearest("book")')).toEqual([
      { name: 'mine', label: 'mine', sort: 'variable', thing: 'book' },
      { name: 'turn', label: 'turn', sort: 'variable' },
    ]);
    expect(toFind('if True:\n    mine = wizard.find_nearest("book")')).toEqual(['broom']);
  });

  it("shows a loop's counter, and a number assigned in a loop or an if, by its name", () => {
    expect(chips('for turn in range(3):\n    steps = 2')).toEqual([
      { name: 'turn', label: 'turn', sort: 'variable' },
      { name: 'steps', label: 'steps', sort: 'variable' },
    ]);
  });

  it('makes two chips, names only, of two names assigned together', () => {
    expect(chips('a, b = 4, 3')).toEqual([
      { name: 'a', label: 'a', sort: 'variable' },
      { name: 'b', label: 'b', sort: 'variable' },
    ]);
  });

  it('shows a function with its arguments, and no chip for a variable inside it', () => {
    expect(chips('def volver(lejos):\n    pasos = lejos\n    wizard.move_left(pasos)')).toEqual([
      { name: 'volver', label: 'volver(lejos)', sort: 'function' },
    ]);
  });

  it('shows a class, and an object made of it, which is no chip of an attribute', () => {
    const code = 'class Fox(Familiar):\n    def __init__(self, color):\n        self.color = color\n\npimu = Fox("Pimu", "red")';
    expect(chips(code)).toEqual([
      { name: 'Fox', label: 'Fox', sort: 'class' },
      { name: 'pimu', label: 'pimu', sort: 'variable', of: 'Fox' },
    ]);
  });

  it('makes no chip of a find not kept or a line half written, and leaves what is to find as it was', () => {
    expect(chips('wizard.find_nearest("book")\nmine = wizard.find_nearest(')).toEqual([]);
    expect(toFind('wizard.find_nearest("book")\nmine = wizard.find_nearest(')).toEqual(['book', 'broom']);
  });

  it('shows a word of no thing of the level by its name, with no picture, and leaves what is to find', () => {
    expect(chips('pet = wizard.find_nearest("dragon")')).toEqual([{ name: 'pet', label: 'pet', sort: 'variable' }]);
    expect(toFind('pet = wizard.find_nearest("dragon")')).toEqual(['book', 'broom']);
  });

  it('shows a variable given a found thing and, on another line, something else, by its name', () => {
    expect(chips('mine = wizard.find_nearest("book")\nmine = 3')).toEqual([{ name: 'mine', label: 'mine', sort: 'variable' }]);
  });

  it('counts a statement with a syntax error for nothing, and the statements around it', () => {
    expect(chips('steps = 2\nmine = = 3\nother = wizard.find_nearest("book")')).toEqual([
      { name: 'steps', label: 'steps', sort: 'variable', value: '2', whole: '2' },
      { name: 'other', label: 'other', sort: 'variable', thing: 'book' },
    ]);
  });

  it('shows what the level gives no chip, nothing for an attribute set, and every kind to find at the start', () => {
    expect(readVariables('', LEVEL)).toEqual({ declared: [], toFind: ['book', 'broom'] });
    expect(readVariables('door.open()', { id: 'none' })).toEqual({ declared: [], toFind: [] });
  });
});

describe('a value as a chip shows it (D346)', () => {
  it('keeps a value of twelve characters, and cuts one of thirteen', () => {
    expect(shownValue('123456789012')).toBe('123456789012');
    expect(shownValue('1234567890123')).toBe('12345678901…');
  });

  it('keeps the closing quote of a string it cuts', () => {
    expect(shownValue('"Hola, Teku y Nuri"')).toBe('"Hola, Tek…"');
    expect(chips('greeting = "Hola, Teku y Nuri"')[0]).toMatchObject({ value: '"Hola, Tek…"', whole: '"Hola, Teku y Nuri"' });
  });
});
