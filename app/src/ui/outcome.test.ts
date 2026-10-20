import { afterEach, describe, expect, it } from 'vitest';
import { initLanguage } from '../i18n';
import { outcomeText } from './outcome';

const english = { languages: ['en'], storage: null };
const spanish = { languages: ['es'], storage: null };

afterEach(() => initLanguage(english));

describe('outcomeText', () => {
  it('says each outcome in English', () => {
    initLanguage(english);
    expect(outcomeText({ kind: 'won' })).toBe('You did it!');
    expect(outcomeText({ kind: 'incomplete', met: 0, total: 1 })).toBe(
      'Not yet: 0 of 1 goals met. Try again.',
    );
    expect(outcomeText({ kind: 'too_many_ticks', limit: 100 })).toContain('more than 100 steps');
    expect(outcomeText({ kind: 'interrupted', seconds: 5 })).toContain('more than 5 seconds');
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
    expect(outcomeText({ kind: 'won' })).toBe('¡Lo has conseguido!');
    expect(outcomeText({ kind: 'incomplete', met: 1, total: 2 })).toBe(
      'Todavía no: 1 de 2 objetivos cumplidos. Inténtalo otra vez.',
    );
  });
});
