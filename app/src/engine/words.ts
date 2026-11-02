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
    case 'no_bed':
      return t('blocked.no_bed');
    case 'bed_taken':
      return t('blocked.bed_taken');
    case 'not_here':
      return t('blocked.not_here', { thing });
    default:
      return t('blocked.unknown_action');
  }
}

/** Who stands in the wizard's way: a friend, by the name the story gives them (D66, D77). */
export function friendText(id: string): string {
  return t('blocked.friend', { name: characterName(id) });
}
