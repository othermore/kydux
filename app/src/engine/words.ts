// The words the scene shows, in the child's language: why an action could not
// be done (D28). The engine asks here and nowhere else for i18n, so that the
// rest of it stays free of the player's language.

import { t } from '../i18n';

/** A thing's kind said with its article: "the door", "la puerta". Every kind the
 * world has is in i18n/<lang>.json as things.<kind>, which tools/i18n_check.py holds
 * to kydux_world.level.THING_KINDS. */
function thingWords(kind: string): string {
  return t(`things.${kind}`);
}

/** Why an action could not be done, from a `blocked` event's reason, its thing's
 * kind, and for a spell not known, the spell's name. */
export function blockedText(reason: string, kind: string | null, spell = ''): string {
  const thing = kind ? thingWords(kind) : '';
  switch (reason) {
    case 'no_wand':
      return t('blocked.no_wand');
    case 'unknown_spell':
      return t('blocked.unknown_spell', { spell });
    case 'sealed':
      return t('blocked.sealed', { thing });
    case 'password':
      return t('blocked.password', { thing });
    case 'far':
      return t('blocked.far', { thing });
    case 'locked':
      return t('blocked.locked', { thing });
    case 'open':
      return t('blocked.open', { thing });
    case 'nothing':
      return t('blocked.nothing');
    default:
      return t('blocked.unknown_action');
  }
}
