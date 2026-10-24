// How many stars a win earns, and why (D57): three for a clean win, one lost
// for each of a hint shown, a bump into a wall or a door in the winning run,
// and a bonus goal unmet, or, in a level with no bonus, a run before this one
// that did not win. A win is always at least one star.

import { MAX_STARS } from '../progress/store';
import type { WorldResult } from '../runtime/protocol';

/** One of the three things a star is for, and whether the win kept it. */
export interface StarReason {
  key: 'no_hints' | 'clean' | 'bonus' | 'first_try';
  kept: boolean;
}

export interface Verdict {
  earned: number;
  reasons: StarReason[];
}

export interface StarsInput {
  /** The winning run's world. */
  world: WorldResult;
  /** How many hints the child has shown in this level. */
  hintsShown: number;
  /** How many runs before this one did not win. */
  misses: number;
}

export function judge({ world, hintsShown, misses }: StarsInput): Verdict {
  if (world.status !== 'won') return { earned: 0, reasons: [] };
  const bonus = world.goals.filter((goal) => goal.bonus);
  const bumped = world.events.some((event) => event.actor === 'wizard' && event.kind === 'bump');
  const reasons: StarReason[] = [
    { key: 'no_hints', kept: hintsShown === 0 },
    { key: 'clean', kept: !bumped },
    bonus.length > 0
      ? { key: 'bonus', kept: bonus.every((goal) => goal.met) }
      : { key: 'first_try', kept: misses === 0 },
  ];
  const lost = reasons.filter((reason) => !reason.kept).length;
  return { earned: Math.max(1, MAX_STARS - lost), reasons };
}
