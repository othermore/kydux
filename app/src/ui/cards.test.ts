import { describe, expect, it } from 'vitest';
import type { WorldGoal, WorldResult } from '../runtime/protocol';
import { stars } from './cards';

function goal(met: boolean, bonus = false): WorldGoal {
  return { kind: 'reach', params: {}, met, met_at_tick: met ? 1 : null, failed: false, failed_at_tick: null, bonus };
}

function world(status: WorldResult['status'], goals: WorldGoal[]): WorldResult {
  return { status, events: [], goals, ticks: 1, stdout: '', error: null };
}

describe('stars', () => {
  it('gives one for winning and one for each bonus goal met, three at most', () => {
    expect(stars(world('won', [goal(true)]))).toBe(1);
    expect(stars(world('won', [goal(true), goal(true, true)]))).toBe(2);
    expect(stars(world('won', [goal(true), goal(false, true)]))).toBe(1);
    expect(stars(world('won', [goal(true), goal(true, true), goal(true, true), goal(true, true)]))).toBe(3);
  });

  it('gives none to a run that did not win', () => {
    expect(stars(world('incomplete', [goal(false), goal(true, true)]))).toBe(0);
  });
});
