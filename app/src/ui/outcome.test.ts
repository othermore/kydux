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
      '`wizard` does not know an action called `mvoe_right`. Did you mean `move_right`? (line 2)',
    );
  });

  it('is said in Spanish', () => {
    initLanguage(spanish);
    expect(outcomeText({ kind: 'error', error: misspelt })).toBe(
      '`wizard` no conoce ninguna acción llamada `mvoe_right`. ¿Querías decir `move_right`? (línea 2)',
    );
  });

  it('falls back to Python\'s words for a kind it does not know', () => {
    initLanguage(english);
    expect(
      explanationText({ kind: 'riddle', params: { type: 'ValueError', message: 'bad' } }),
    ).toBe('Python says: ValueError: bad');
  });

  it('names the way a card speaks of, and says a win is every way (D51)', () => {
    initLanguage({ languages: ['en'], storage: null });
    const name = (id: string) => (id === 'away' ? 'Dask looks away' : id);
    expect(outcomeText({ kind: 'caught', way: 'away' }, name)).toBe(
      'In the way “Dask looks away”: The teacher saw you! Try again, and watch which way they look.',
    );
    expect(outcomeText({ kind: 'won', way: 'away' }, name)).toBe('You did it, Kydux! In every way!');
    expect(outcomeText({ kind: 'way_won', way: 'away' }, name)).toContain('Not every way yet');
  });
});
