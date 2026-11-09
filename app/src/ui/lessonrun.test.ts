import { describe, expect, it } from 'vitest';
import type { RunResult, WorldResult } from '../runtime/protocol';
import { runSaid } from './lessonrun';

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

const move = (to: [number, number]) => ({
  tick: 1,
  actor: 'wizard',
  kind: 'move',
  data: { from: [0, 0], to, facing: 'right' },
  line: 1,
});

describe('what a block of a lesson says when it runs (D142)', () => {
  it('says what was printed and no cell when the wizard did not move', () => {
    expect(runSaid(ran(world({ stdout: 'up\n' })), {}, () => null)).toEqual({
      printed: 'up\n',
      ended: null,
      note: null,
    });
  });

  it('says the cell the wizard ended on when it moved', () => {
    const said = runSaid(ran(world({ events: [move([3, 5]), move([4, 5])] })), {}, () => null);
    expect(said.ended).toEqual([4, 5]);
    expect(said.note).toBeNull();
  });

  it('speaks of the first way of a level played in several (D51)', () => {
    const second = { ...world({ stdout: 'down\n' }), id: 'looking_down' };
    const first = { ...world({ stdout: 'up\n' }), id: 'looking_up' };
    const said = runSaid(ran(world({ stdout: 'down\n', ways: [first, second] })), {}, () => null);
    expect(said.printed).toBe('up\n');
  });

  it('says it when Dask sees the wizard', () => {
    const said = runSaid(ran(world({ status: 'caught', events: [move([1, 1])] })), {}, () => null);
    expect(said.ended).toEqual([1, 1]);
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
