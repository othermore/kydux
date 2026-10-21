// The words the scene shows, in the child's language: why an action could not
// be done (D28). The engine asks here and nowhere else for i18n, so that the
// rest of it stays free of the player's language.

import { t } from '../i18n';

/** A thing's kind said with its article: "the door", "la puerta". */
function thingWords(kind: string): string {
  switch (kind) {
    case 'door':
      return t('things.door');
    case 'key':
      return t('things.key');
    case 'book':
      return t('things.book');
    case 'wand':
      return t('things.wand');
    case 'potion':
      return t('things.potion');
    default:
      return kind;
  }
}

/** Why an action could not be done, from a `blocked` event's reason and its thing's kind. */
export function blockedText(reason: string, kind: string | null): string {
  const thing = kind ? thingWords(kind) : '';
  switch (reason) {
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
