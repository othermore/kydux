// The characters' portraits (D194): a bust of each, content/art/portraits/<id>.webp,
// painted as the figures are, and one for each of the wizard's looks,
// wizard-<look>.webp, recoloured from its gender's base bust so that it matches the
// figure. A lesson's teacher, a card's and a story's speaker, the creator's looks and
// the start screen's wizard are shown by them. `data-portrait` names the one shown.

import { friendId, mateId } from '../i18n';
import { element } from './dom';
import { contentUrl } from '../content/address';

/** The portrait of whoever speaks: a character by its id, the friend and the
 * dormitory mate as the wizard's gender makes them, the wizard by its look; none for
 * the voice, which is no one seen, nor for the cold voice, heard and never seen (D264). */
export function portraitOf(who: string, look?: string | null): string | null {
  if (who === 'voice' || who === 'cold_voice') return null;
  if (who === 'wizard') return look ? `wizard-${look}` : null;
  if (who === 'friend') return friendId();
  if (who === 'mate') return mateId();
  return who;
}

/** A portrait's picture, with no words of its own: the name is said beside it. One the
 * game has no picture of is not shown. */
export function portrait(id: string, className: string): HTMLImageElement {
  const picture = element('img', {
    className: `portrait ${className}`,
    src: contentUrl(`art/portraits/${id}.webp`),
    alt: '',
  });
  picture.dataset.portrait = id;
  picture.addEventListener('error', () => {
    picture.hidden = true;
  });
  return picture;
}
