import { afterEach, describe, expect, it } from 'vitest';
import { initLanguage } from '../i18n';
import { explanationText, outcomeText } from './outcome';

const english = { languages: ['en'], storage: null };
const spanish = { languages: ['es'], storage: null };

afterEach(() => initLanguage(english));

describe('outcomeText', () => {
  it('says each outcome in English', () => {
    initLanguage(english);
    expect(outcomeText({ kind: 'won' })).toBe('You did it, Kydux!');
    expect(outcomeText({ kind: 'incomplete', met: 0, total: 1 })).toBe(
      'Not yet: 0 of 1 goals met. Try again.',
    );
    expect(outcomeText({ kind: 'incomplete', met: 0, total: 1, walkedOver: true })).toBe(
      'Not yet: 0 of 1 goals met. Try again.\nThe wizard walked right over the mark without stopping! The program needs to end with the wizard standing exactly on it.',
    );
    expect(outcomeText({ kind: 'too_many_ticks', limit: 100 })).toBe(
      'Your program has taken more than 100 steps and the wizard is tired. Is there a loop that never ends?',
    );
    expect(outcomeText({ kind: 'interrupted', seconds: 5 })).toBe(
      'Your program was stopped: it ran for more than 5 seconds without doing anything.',
    );
  });

  it('gives Python its words, with the line when there is one', () => {
    initLanguage(english);
    const error = { type: 'NameError', message: "name 'wizrd' is not defined" };
    expect(outcomeText({ kind: 'error', error: { ...error, line: 1 } })).toBe(
      "Python says: NameError: name 'wizrd' is not defined (line 1)",
    );
    expect(outcomeText({ kind: 'error', error: { ...error, line: null } })).toBe(
      "Python says: NameError: name 'wizrd' is not defined",
    );
  });

  it('says it in Spanish', () => {
    initLanguage(spanish);
    expect(outcomeText({ kind: 'won' })).toBe('¡Lo has conseguido, Kydux!');
    expect(outcomeText({ kind: 'incomplete', met: 1, total: 2 })).toBe(
      'Todavía no: 1 de 2 objetivos cumplidos. Inténtalo otra vez.',
    );
  });
});

describe('an error explained', () => {
  const misspelt = {
    type: 'AttributeError',
    message: "'Wizard' object has no attribute 'mvoe_right'",
    line: 2,
    explanation: {
      kind: 'unknown_action',
      params: { object: 'wizard', name: 'mvoe_right', suggestion: 'move_right' },
    },
  };

  it('is said in the child\'s words, with a suggestion and the line', () => {
    initLanguage(english);
    expect(outcomeText({ kind: 'error', error: misspelt })).toBe(
      '`wizard` has no method called `mvoe_right`. Did you mean `move_right`? (line 2)',
    );
  });

  it('is said in Spanish', () => {
    initLanguage(spanish);
    expect(outcomeText({ kind: 'error', error: misspelt })).toBe(
      '`wizard` no tiene ningún método llamado `mvoe_right`. ¿Querías decir `move_right`? (línea 2)',
    );
  });

  it('falls back to Python\'s words for a kind it does not know', () => {
    initLanguage(english);
    expect(
      explanationText({ kind: 'riddle', params: { type: 'ValueError', message: 'bad' } }),
    ).toBe('Python says: ValueError: bad');
  });

  it('says first, on its own line, what is different this time when the way changed, and names no way (D204)', () => {
    initLanguage({ languages: ['en'], storage: null });
    const caught = 'The teacher saw you! Try again, and watch which way they look.';
    const different = 'This time, Dask starts in another place.';
    expect(outcomeText({ kind: 'caught', changed: true }, different)).toBe(`${different}\n${caught}`);
    expect(outcomeText({ kind: 'caught' }, different)).toBe(caught);
    expect(outcomeText({ kind: 'caught', changed: true })).toBe(caught);
    expect(outcomeText({ kind: 'won' })).toBe('You did it, Kydux!');
    // Only ?debug's select shows a way won while another is not.
    expect(outcomeText({ kind: 'way_won' })).toContain('Not every way yet');
  });
});

describe('what the world explains, in the child\'s words', () => {
  it('explains a broom with no knot in the child\'s words (D183)', () => {
    initLanguage(spanish);
    expect(explanationText({ kind: 'no_knot', params: { thing: 'broom_1' } })).toMatch(/^Esta escoba no tiene nudo/);
    // drevo cast in the air over a cell no one walks on (D215).
    expect(explanationText({ kind: 'no_landing', params: { thing: 'wizard' } })).toMatch(
      /^Aquí no hay dónde posar la escoba, así que el programa se para aquí, todavía en el aire\./,
    );
    // A turn inside a ring, which rubs its rim (D226).
    expect(explanationText({ kind: 'ring_rim', params: { thing: 'ring_1' } })).toMatch(
      /^La escoba giró mientras todavía estaba dentro del aro y rozó el borde/,
    );
    // A list asked for one it has not (D198).
    expect(explanationText({ kind: 'index_range', params: { count: 3, asked: 4 } })).toBe(
      'La lista no tiene tantos: tiene 3, y pediste el 4.º',
    );
  });
});

describe("a first variable's mistakes (D349)", () => {
  it('says the advice under the outcome, in Spanish', () => {
    initLanguage(spanish);
    expect(
      outcomeText({
        kind: 'incomplete',
        met: 1,
        total: 2,
        advice: { kind: 'variable_not_own', params: { name: 'book' } },
      }),
    ).toBe(
      'Todavía no: 1 de 2 objetivos cumplidos. Inténtalo otra vez.\n' +
        'Has guardado el libro en `book`. Funciona, pero hoy Wenna te pide una variable con un nombre inventado por ti: cámbialo en todas las líneas donde la usas.',
    );
  });

  it('says a find kept in no variable under an error, with its line', () => {
    initLanguage(english);
    const error = {
      type: 'NameError',
      message: "name 'book' is not defined",
      line: 2,
      explanation: { kind: 'search_word', params: { name: 'book' } },
    };
    expect(outcomeText({ kind: 'error', error, advice: { kind: 'found_not_kept', params: { line: 1 } } })).toBe(
      'There is nothing called `book` here. "book", in quotes, is the word to search with: find the thing first and keep it in a variable with a name you choose. (line 2)\n' +
        'On line 1 you found something, but you did not keep it. Put a variable and `=` before it to keep it.',
    );
  });

  it('says whose method reveal and open are, with no suggestion', () => {
    initLanguage(spanish);
    const said = (kind: string, params: Record<string, string> = {}) =>
      outcomeText({ kind: 'error', error: { type: 'AttributeError', message: '', line: 2, explanation: { kind, params } } });
    expect(said('reveal_of_wizard_kept', { variable: 'tesoro' })).toBe(
      '`reveal` no es un método de `wizard`: es un método de la cosa que quieres hacer brillar. Escribe delante del punto la variable donde la guardaste, como en `tesoro.reveal()`. (línea 2)',
    );
    expect(said('open_of_wizard')).toBe(
      '`open` no es un método de `wizard`: es un método de la puerta. Escribe delante del punto la variable de la puerta. (línea 2)',
    );
    expect(said('search_word_kept', { name: 'book', variable: 'tesoro' })).toBe(
      'Aquí no hay nada que se llame `book`. Lo que encontraste con la palabra "book" lo guardaste en `tesoro`: usa esa variable. (línea 2)',
    );
  });
});
