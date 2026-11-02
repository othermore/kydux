import { afterEach, describe, expect, it } from 'vitest';
import { initLanguage } from '../i18n';
import { blockedText } from './words';

const english = { languages: ['en'], storage: null };
const spanish = { languages: ['es'], storage: null };

afterEach(() => initLanguage(english));

describe('blockedText', () => {
  it('says an open door\'s leaf is in the way, in both languages (D125)', () => {
    initLanguage(english);
    expect(blockedText('door_leaf', 'door')).toBe("The open door's leaf is in the way.");
    initLanguage(spanish);
    expect(blockedText('door_leaf', 'door')).toBe('La hoja de la puerta abierta está delante.');
  });

  it('says why an action could not be done, with the thing named', () => {
    initLanguage(english);
    expect(blockedText('far', 'door')).toBe('I cannot reach the door from here.');
    expect(blockedText('locked', 'door')).toBe(
      'I cannot open the door: it is locked, and I have no key for it.',
    );
    expect(blockedText('nothing', null)).toBe('There is nothing here to pick up.');
    expect(blockedText('unknown_action', null)).toBe('I do not know this action yet.');
  });

  it('says it in Spanish, with the article the thing takes', () => {
    initLanguage(spanish);
    expect(blockedText('far', 'door')).toBe('No llego a la puerta desde aquí.');
    expect(blockedText('open', 'door')).toBe('No hace falta: la puerta ya está abierta.');
  });

  it('says why a spell or a door would not do (D42, D43)', () => {
    initLanguage(english);
    expect(blockedText('no_wand', null)).toBe('I do not know this action yet.');
    expect(blockedText('unknown_spell', null, { spell: 'abra' })).toBe('I do not know a spell called “abra”.');
    expect(blockedText('which_one', null, { things: ['book', 'key'] })).toBe(
      'There are several things here: book, key. Say which, like wizard.pick_up(book).',
    );
    expect(blockedText('sealed', 'door')).toBe(
      'I cannot open the door by hand: it is sealed, and needs a spell.',
    );
    initLanguage(spanish);
    expect(blockedText('password', 'door')).toBe(
      'No puedo abrir la puerta con la mano: quiere una palabra.',
    );
  });

  it('says why a pull or a gift would not do (D47, D48)', () => {
    initLanguage(english);
    expect(blockedText('nothing_near', null)).toBe('There is nothing near enough for the spell to bring.');
    expect(blockedText('not_carried', 'book')).toBe('I cannot give the book: I am not carrying it.');
    initLanguage(spanish);
    expect(blockedText('nobody', null)).toBe('No hay nadie a mi lado para dárselo.');
  });
});
