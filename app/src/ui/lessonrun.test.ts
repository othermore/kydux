import { afterEach, describe, expect, it } from 'vitest';
import { initLanguage, speakOf } from '../i18n';
import type { RunResult, WorldResult } from '../runtime/protocol';
import { runSaid, saidLine, walkText } from './lessonrun';
import { codeParts } from './words';

const english = { languages: ['en'], storage: null };
const spanish = { languages: ['es'], storage: null };

afterEach(() => {
  initLanguage(english);
  speakOf(null);
});

const world = (over: Partial<WorldResult>): WorldResult => ({
  status: 'incomplete',
  events: [],
  goals: [],
  ticks: 0,
  stdout: '',
  error: null,
  ...over,
});

const ran = (shown: WorldResult): RunResult => ({
  status: 'ok',
  stdout: '',
  stderr: '',
  durationMs: 1,
  error: null,
  world: shown,
});

const move = (from: [number, number], to: [number, number]) => ({
  tick: 1,
  actor: 'wizard',
  kind: 'move',
  data: { from, to, facing: 'right' },
  line: 1,
});

/** The wizard's steps, one cell each, from `start` along `path`. */
const walk = (start: [number, number], ...path: [number, number][]) =>
  path.map((to, index) => move(index === 0 ? start : path[index - 1]!, to));

describe('what a block of a lesson says when it runs (D142)', () => {
  it('says what was printed and no walk when the wizard did not move', () => {
    expect(runSaid(ran(world({ stdout: 'up\n' })), {}, () => null)).toEqual({
      printed: 'up\n',
      moved: null,
      note: null,
    });
  });

  it('says three steps to the right, never the cell (D180)', () => {
    const said = runSaid(ran(world({ events: walk([3, 5], [4, 5], [5, 5], [6, 5]) })), {}, () => null);
    expect(said.moved).toEqual({ right: 3, down: 0 });
    expect(said.note).toBeNull();
    expect(walkText(said.moved!)).toBe('The wizard has moved 3 steps to the right.');
    initLanguage(spanish);
    speakOf({ name: 'Marta', gender: 'girl' });
    expect(walkText(said.moved!)).toBe('La maga se ha movido 3 pasos a la derecha.');
    speakOf({ name: 'Pablo', gender: 'boy' });
    expect(walkText(said.moved!)).toBe('El mago se ha movido 3 pasos a la derecha.');
  });

  it('says two steps down and one to the left, the steps down first', () => {
    const said = runSaid(ran(world({ events: walk([4, 4], [3, 4], [3, 5], [3, 6]) })), {}, () => null);
    expect(said.moved).toEqual({ right: -1, down: 2 });
    expect(walkText(said.moved!)).toBe('The wizard has moved 2 steps down and 1 to the left.');
    initLanguage(spanish);
    expect(walkText(said.moved!)).toBe('El mago se ha movido 2 pasos hacia abajo y 1 a la izquierda.');
  });

  it('says one step with the one-step form, up and to the left alike', () => {
    expect(walkText({ right: 1, down: 0 })).toBe('The wizard has moved 1 step to the right.');
    expect(walkText({ right: 0, down: -1 })).toBe('The wizard has moved 1 step up.');
    expect(walkText({ right: -2, down: -1 })).toBe('The wizard has moved 1 step up and 2 to the left.');
    initLanguage(spanish);
    expect(walkText({ right: 1, down: 0 })).toBe('El mago se ha movido 1 paso a la derecha.');
    expect(walkText({ right: 0, down: -1 })).toBe('El mago se ha movido 1 paso hacia arriba.');
    expect(walkText({ right: -4, down: 0 })).toBe('El mago se ha movido 4 pasos a la izquierda.');
  });

  it('says the wizard came back when the walk ends where it began', () => {
    const said = runSaid(ran(world({ events: walk([2, 2], [3, 2], [2, 2]) })), {}, () => null);
    expect(said.moved).toEqual({ right: 0, down: 0 });
    expect(said.note).toBeNull();
    expect(walkText(said.moved!)).toBe('The wizard has come back to the start.');
    initLanguage(spanish);
    speakOf({ name: 'Marta', gender: 'girl' });
    expect(walkText(said.moved!)).toBe('La maga ha vuelto a donde empezó.');
  });

  it('says what was printed, and no walk, when the program printed and did not move', () => {
    const said = runSaid(ran(world({ stdout: '(5, 7)\n' })), {}, () => null);
    expect(said).toEqual({ printed: '(5, 7)\n', moved: null, note: null });
  });

  it('says a refused step with its reason, and no walk when nothing moved', () => {
    const blocked = {
      tick: 1,
      actor: 'wizard',
      kind: 'blocked',
      data: { at: [8, 6], by: 'wizard', reason: 'not_inside_yet', tried: false, facing: 'up' },
      line: 1,
    };
    const said = runSaid(ran(world({ events: [blocked] })), {}, () => null);
    expect(said.moved).toBeNull();
    expect(said.note).toContain('line 1');
    expect(said.note).toContain('Do not go in yet');
  });

  it('counts a door shoving the wizard as a move', () => {
    const shoved = {
      tick: 2,
      actor: 'door',
      kind: 'shoved',
      data: { id: 'wizard', from: [5, 6], to: [5, 7], by: 'door' },
      line: null,
    };
    const said = runSaid(ran(world({ events: [...walk([5, 5], [5, 6]), shoved] })), {}, () => null);
    expect(said.moved).toEqual({ right: 0, down: 2 });
  });

  it('speaks of the first way of a level played in several (D51)', () => {
    const second = { ...world({ stdout: 'down\n' }), id: 'looking_down' };
    const first = { ...world({ stdout: 'up\n' }), id: 'looking_up' };
    const said = runSaid(ran(world({ stdout: 'down\n', ways: [first, second] })), {}, () => null);
    expect(said.printed).toBe('up\n');
  });

  it('says it when Dask sees the wizard', () => {
    const said = runSaid(ran(world({ status: 'caught', events: walk([0, 1], [1, 1]) })), {}, () => null);
    expect(said.moved).toEqual({ right: 1, down: 0 });
    expect(said.note).toContain('teacher');
  });

  it('says an error in the child\'s words', () => {
    const error = {
      type: 'NameError',
      message: "name 'dak' is not defined",
      line: 1,
      explanation: { kind: 'unknown_name', params: { name: 'dak' } },
    };
    const said = runSaid(ran(world({ status: 'error', error })), {}, () => null);
    expect(said.note).toContain('dak');
  });

  it('says that it ended when it printed nothing and moved no one', () => {
    expect(runSaid(ran(world({})), {}, () => null).note).toBeTruthy();
  });
});

describe("the line under a block's result shows code as code", () => {
  it('cuts an explanation at its backquotes, the name in them code and no backquote left', () => {
    const line = saidLine({ moved: null, note: 'Este objeto no tiene nada que se llame `name`.' });
    const parts = codeParts(line);
    expect(parts).toEqual([
      { text: 'Este objeto no tiene nada que se llame ', code: false },
      { text: 'name', code: true },
      { text: '.', code: false },
    ]);
    expect(saidLine({ moved: null, note: null })).toBe('');
  });
});
