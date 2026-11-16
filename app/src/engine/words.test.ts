import { afterEach, describe, expect, it } from 'vitest';
import { initLanguage } from '../i18n';
import { blockedText, bumpText } from './words';

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

  it('says where the tale lets the wizard go no farther yet, in the owner\'s words (D171)', () => {
    initLanguage(english);
    expect(blockedText('not_inside_yet', null)).toBe(
      'Do not go in yet: stay on the threshold, past the door.',
    );
    initLanguage(spanish);
    expect(blockedText('not_inside_yet', null)).toBe(
      'No entres todavía: quédate en el umbral, pasada la puerta.',
    );
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

describe('what a flight cannot cross, and a walk what a flight can (D186, D187)', () => {
  it('names the low cell a walk is refused on, and the high one a flight bumps on', () => {
    initLanguage({ languages: ['es'], storage: null });
    expect(blockedText('no_walk', null, { kind: 'water' })).toBe('El agua no se pisa: por aquí solo se pasa volando.');
    expect(blockedText('no_walk', null, { kind: 'lava' })).toBe('Por aquí no se anda: solo se pasa volando.');
    expect(bumpText('high', 'tree')).toBe('Las copas de los árboles no se pasan: hay que rodearlas.');
    expect(bumpText('high', null)).toBe('Por ahí no se pasa, ni volando.');
    expect(bumpText('ring', null)).toMatch(/^¡Choco con el aro!/);
    expect(blockedText('too_far', 'broom')).toBe('Para desatar la escoba tengo que estar de pie sobre ella.');
    expect(blockedText('no_knot', 'broom')).toBe('Esta escoba no tiene nudo: no hay nada que desatar.');
    // drevo cast over the water (D215).
    expect(blockedText('no_landing', null, { kind: 'water' })).toBe('No hay dónde posar la escoba.');
    initLanguage({ languages: ['en'], storage: null });
  });
});
