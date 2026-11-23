import { describe, expect, it } from 'vitest';
import type { WorldEvent, WorldGoal, WorldResult } from '../runtime/protocol';
import { initLanguage } from '../i18n';
import { changesLines, saidParagraphs } from './cards';
import { judge } from './stars';

function goal(met: boolean, bonus = false): WorldGoal {
  return { kind: 'reach', params: {}, met, met_at_tick: met ? 1 : null, failed: false, failed_at_tick: null, bonus, walked_over: false };
}

const BUMP: WorldEvent = { tick: 1, actor: 'wizard', kind: 'bump', data: {}, line: 1 };

function world(status: WorldResult['status'], goals: WorldGoal[], events: WorldEvent[] = []): WorldResult {
  return { status, events, goals, ticks: 1, stdout: '', error: null };
}

describe('judge (D57)', () => {
  it('gives three stars to a clean win, at the first try, with no hint', () => {
    const verdict = judge({ world: world('won', [goal(true)]), hintsShown: 0, misses: 0 });
    expect(verdict.earned).toBe(3);
    expect(verdict.reasons).toEqual([
      { key: 'no_hints', kept: true },
      { key: 'clean', kept: true },
      { key: 'first_try', kept: true },
    ]);
  });

  it('takes one for a hint, one for a bump, and one for a miss before', () => {
    expect(judge({ world: world('won', [goal(true)]), hintsShown: 1, misses: 0 }).earned).toBe(2);
    expect(judge({ world: world('won', [goal(true)], [BUMP]), hintsShown: 0, misses: 0 }).earned).toBe(2);
    expect(judge({ world: world('won', [goal(true)]), hintsShown: 0, misses: 2 }).earned).toBe(2);
  });

  it('asks for the bonus instead of the first try when the level has one', () => {
    const met = judge({ world: world('won', [goal(true), goal(true, true)]), hintsShown: 0, misses: 3 });
    expect(met.earned).toBe(3);
    expect(met.reasons[2]).toEqual({ key: 'bonus', kept: true });
    expect(judge({ world: world('won', [goal(true), goal(false, true)]), hintsShown: 0, misses: 0 }).earned).toBe(2);
  });

  it('asks for every bonus goal for that one star when the level has several, and says so', () => {
    const all = judge({ world: world('won', [goal(true), goal(true, true), goal(true, true)]), hintsShown: 0, misses: 0 });
    expect(all.reasons[2]).toEqual({ key: 'bonuses', kept: true });
    const one = judge({ world: world('won', [goal(true), goal(true, true), goal(false, true)]), hintsShown: 0, misses: 0 });
    expect(one.reasons[2]).toEqual({ key: 'bonuses', kept: false });
    expect(one.earned).toBe(2);
  });

  it('gives a win one star at least, and a run that did not win none', () => {
    expect(judge({ world: world('won', [goal(true)], [BUMP]), hintsShown: 3, misses: 5 }).earned).toBe(1);
    expect(judge({ world: world('incomplete', [goal(false)]), hintsShown: 0, misses: 0 }).earned).toBe(0);
  });
});

describe("a start card's words on what may differ at each run (D204)", () => {
  it('says what may differ and that the program has to work in every case, and nothing of ways', () => {
    initLanguage({ languages: ['es'], storage: null });
    expect(changesLines('El número de escobas cambia cada vez.')).toEqual([
      'El número de escobas cambia cada vez.',
      'Tu programa tiene que funcionar en todos los casos.',
    ]);
  });

  it('says nothing for a level played one way', () => {
    expect(changesLines(undefined)).toEqual([]);
  });
});

describe("a card's words in paragraphs", () => {
  it('parts what is said at each blank line', () => {
    expect(saidParagraphs('One thing.')).toEqual(['One thing.']);
    expect(saidParagraphs('One thing.\n\nAnother, to `type`.\n \nA third.')).toEqual([
      'One thing.',
      'Another, to `type`.',
      'A third.',
    ]);
  });
});
