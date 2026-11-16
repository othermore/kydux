// The words the scene shows, in the child's language: why an action could not
// be done (D28). The engine asks here and nowhere else for i18n, so that the
// rest of it stays free of the player's language.

import { characterName, t } from '../i18n';

/** A thing's kind said with its article: "the door", "la puerta". Every kind the
 * world has is in i18n/<lang>.json as things.<kind>, which tools/i18n_check.py holds
 * to kydux_world.level.THING_KINDS. */
function thingWords(kind: string): string {
  return t(`things.${kind}`);
}

/** What a `blocked` event says besides its reason: the spell not known, or the
 * things in reach when the wizard must say which (D58). */
export interface BlockedDetail {
  spell?: string;
  things?: string[];
  /** The kind of a cell's terrain no one walks on, water or a hedge (D186). */
  kind?: string;
}

/** The terrains a walk is refused on that the wizard names (D186); any other is a low
 * cell, said as such. */
const LOW_KINDS = ['water', 'reeds', 'hedge', 'fence', 'bench', 'chest', 'stand', 'hay'];
/** The terrains a flight bumps on that the wizard names (D186). */
const HIGH_KINDS = ['tree', 'wall', 'shed', 'rock', 'pole', 'gate'];

/** Why the wizard bumped while flying (D186, D187): a ring flown into from its side,
 * or a tree's crown, a wall, a pole in the flight's way, by its kind. */
export function bumpText(by: string, kind: string | null): string {
  if (by === 'ring') return t('blocked.ring');
  return t(`blocked.high.${kind && HIGH_KINDS.includes(kind) ? kind : 'other'}`);
}

/** What the wizard thinks of a ring flown against its way (D219): the way it is
 * flown. */
export function ringWayText(way: string): string {
  return way === 'down' ? t('blocked.ring_way.down') : t('blocked.ring_way.up');
}

/** Why an action could not be done, from a `blocked` event's reason, its thing's
 * kind, and its detail. */
/** The wizard's thought while asleep, in the night (D124). */
export function sleepingText(): string {
  return t('level.sleeping');
}

/** A word of the debug view's panel and legend (debug.ts), for a tester. */
export function debugWord(key: string): string {
  return t(`debug.${key}`);
}

export function blockedText(reason: string, kind: string | null, detail: BlockedDetail = {}): string {
  const thing = kind ? thingWords(kind) : '';
  const spell = detail.spell ?? '';
  switch (reason) {
    case 'which_one': {
      const things = detail.things ?? [];
      return t('blocked.which_one', { things: things.join(', '), first: things[0] ?? '' });
    }
    case 'no_wand':
      return t('blocked.no_wand');
    case 'no_map':
      return t('blocked.no_map');
    case 'unknown_spell':
      return t('blocked.unknown_spell', { spell });
    case 'sealed':
      return t('blocked.sealed', { thing });
    case 'password':
      return t('blocked.password', { thing });
    case 'unheard':
      return t('blocked.unheard', { thing });
    case 'nothing_near':
      return t('blocked.nothing_near');
    case 'not_carried':
      return t('blocked.not_carried', { thing });
    case 'nobody':
      return t('blocked.nobody');
    case 'far':
      return t('blocked.far', { thing });
    case 'too_high':
      return t('blocked.too_high', { thing });
    case 'out_of_reach':
      return t('blocked.out_of_reach', { thing });
    case 'locked':
      return t('blocked.locked', { thing });
    case 'open':
      return t('blocked.open', { thing });
    case 'nothing':
      return t('blocked.nothing');
    case 'not_my_dormitory':
      return t('blocked.not_my_dormitory');
    case 'door_leaf':
      return t('blocked.door_leaf');
    case 'not_now_outside':
      return t('blocked.not_now_outside');
    case 'not_inside_yet':
      return t('blocked.not_inside_yet');
    case 'stay_by_the_brooms':
      return t('blocked.stay_by_the_brooms');
    case 'no_bed':
      return t('blocked.no_bed');
    case 'bed_taken':
      return t('blocked.bed_taken');
    case 'not_here':
      return t('blocked.not_here', { thing });
    case 'no_walk':
      return t(`blocked.no_walk.${detail.kind && LOW_KINDS.includes(detail.kind) ? detail.kind : 'low'}`);
    case 'too_far':
      return t('blocked.too_far', { thing });
    case 'no_broom':
      return t('blocked.no_broom');
    case 'no_knot':
      return t('blocked.no_knot');
    case 'no_landing':
      return t('blocked.no_landing');
    case 'ring_rim':
      return t('blocked.ring_rim');
    default:
      return t('blocked.unknown_action');
  }
}

/** Ilda's verdict of a race, from its `judged` event (D234), in two parts. `count`:
 * the rings missed with their penalty, or that every ring was flown through, and the
 * two counts; that the finish was not crossed when it was not. `winner`: who has won,
 * or that it is a tie; empty when the finish was not crossed, which `count` says with
 * its winner. */
export function raceVerdict(data: Record<string, unknown>): { count: string; winner: string } {
  const name = characterName(String(data.racer));
  if (data.tick === null || data.tick === undefined) {
    return { count: t('race.judged_unfinished', { name }), winner: '' };
  }
  const said = {
    name,
    missed: Number(data.missed),
    penalty: Number(data.penalty),
    tick: Number(data.tick),
    racer_tick: Number(data.racer_tick),
  };
  const count = said.missed > 0 ? t('race.judged_missed', said) : t('race.judged_clean', said);
  if (data.winner === 'wizard') return { count, winner: t('race.wins_wizard') };
  if (data.winner === null || data.winner === undefined) return { count, winner: t('race.tie') };
  return { count, winner: t('race.wins_racer', { name }) };
}

/** Who stands in the wizard's way: a friend, by the name the story gives them (D66, D77). */
export function friendText(id: string): string {
  return t('blocked.friend', { name: characterName(id) });
}
