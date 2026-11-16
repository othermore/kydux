import { afterEach, describe, expect, it } from 'vitest';
import { initLanguage } from '../i18n';
import { explanationText, outcomeText, raceCount } from './outcome';

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

describe("Ilda's count after a race (D189)", () => {
  const before = (tick: number | null) => [
    { kind: 'through_in_order', params: { missed: [] } },
    {
      kind: 'before',
      params: { racer: 'zarek', lines: 11, flight: 38, penalty: 0, tick, racer_lines: 14, racer_tick: 55 },
    },
  ];

  it('says the lines, the flight and the penalty and the ticks they add up to, and the racer\'s', () => {
    initLanguage(spanish);
    expect(raceCount(before(49))).toBe(
      'La cuenta de Ilda: tus líneas (11) + tu vuelo (38) + la penalización (0) = 49 ticks. Zarek: 14 + 41 = 55 ticks.',
    );
    initLanguage(english);
    expect(raceCount(before(null))).toBe("Ilda's count: you did not cross the finish. Zarek: 14 + 41 = 55 ticks.");
  });

  it('says at equal ticks that it is a tie and the race is flown again (D220)', () => {
    initLanguage(spanish);
    const tied = [
      { kind: 'through_in_order', params: { missed: [] } },
      {
        kind: 'before',
        params: { racer: 'zarek', lines: 18, flight: 42, penalty: 0, tick: 60, racer_lines: 18, racer_tick: 60, tie: true },
      },
    ];
    expect(raceCount(tied)).toBe(
      'La cuenta de Ilda: tus líneas (18) + tu vuelo (42) + la penalización (0) = 60 ticks. Zarek: 18 + 42 = 60 ticks. ¡Es un empate! La carrera se repite.',
    );
    initLanguage(english);
    expect(raceCount(tied)).toMatch(/= 60 ticks\. It's a tie! The race is flown again\.$/);
  });

  it('says nothing for a level that is no race', () => {
    expect(raceCount([{ kind: 'reach', params: {} }])).toBeNull();
    expect(raceCount(undefined)).toBeNull();
  });

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
