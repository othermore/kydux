// On a phone or a tablet, a note under the header says the game is made for a
// computer: the editor wants a keyboard and the scene a mouse. It is on every
// screen, since a first visit opens on the welcome page and not on the start screen,
// until the child closes it; closed, it stays closed in that tab.

import { t } from '../i18n';
import { element } from './dom';

const CLOSED = 'kydux.handheld-closed';

/** Whether the device has no mouse or touchpad, only a finger: a phone or a
 * tablet. A laptop with a touch screen has a fine pointer too, and is not one. */
export function handheld(media: (query: string) => boolean = (query) => matchMedia(query).matches): boolean {
  return media('(pointer: coarse)') && !media('(any-pointer: fine)');
}

function closed(): boolean {
  try {
    return sessionStorage.getItem(CLOSED) === 'true';
  } catch {
    return false;
  }
}

/** The note, with its button to close it; none on a computer, or once closed. */
export function handheldNote(): HTMLElement[] {
  if (!handheld() || closed()) return [];
  const close = element('button', { id: 'handheld-close', type: 'button', className: 'quiet-button' }, [
    t('app.handheld_close'),
  ]);
  const note = element('p', { id: 'handheld-note', className: 'handheld-note', role: 'note' }, [
    element('span', {}, [t('app.handheld')]),
    close,
  ]);
  close.addEventListener('click', () => {
    try {
      sessionStorage.setItem(CLOSED, 'true');
    } catch {
      // Without storage it is closed until the page is drawn again.
    }
    note.remove();
  });
  return [note];
}
