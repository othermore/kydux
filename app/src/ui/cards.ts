// The cards that open and close a level, over its scene. The start card shows
// the level's goals before the child begins; the win card shows the stars a
// winning run earned and leads to the next level.

import { t } from '../i18n';
import { MAX_STARS } from '../progress/store';
import type { WorldResult } from '../runtime/protocol';
import { element } from './dom';

/** One star for winning, one more for each bonus goal met, three at most. */
export function stars(world: WorldResult): number {
  if (world.status !== 'won') return 0;
  const bonus = world.goals.filter((goal) => goal.bonus && goal.met).length;
  return Math.min(MAX_STARS, 1 + bonus);
}

export interface Card {
  node: HTMLElement;
  readonly open: boolean;
  close(): void;
}

/** A card over the scene: a dialog the child closes with its button or Escape. */
function overlay(className: string, children: (Node | string)[], onClose: () => void): Card {
  const panel = element('div', { className: `card ${className}` }, children);
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  const node = element('div', { className: 'card-overlay' }, [panel]);
  let open = true;
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') card.close();
  };
  document.addEventListener('keydown', onKey);
  const card: Card = {
    node,
    get open() {
      return open;
    },
    close() {
      if (!open) return;
      open = false;
      document.removeEventListener('keydown', onKey);
      node.remove();
      onClose();
    },
  };
  return card;
}

export interface StartCardText {
  title: string;
  goals: { text: string; bonus?: boolean }[];
  /** What a character of the story says before the level, with the character's name. */
  said?: Said;
  /** What the wizard carries from the start, in words (D49). */
  carrying?: string;
}

/** A character's words on a card (D45): the name, and what they say. */
export interface Said {
  speaker: string;
  text: string;
}

function saidBy(said: Said, id: string): HTMLElement {
  return element('p', { id, className: 'card-said' }, [
    element('strong', {}, [said.speaker]),
    ' ',
    said.text,
  ]);
}

/** The level's title, what its speaker says, its goals, and Start. */
export function startCard(text: StartCardText, onClose: () => void = () => {}): Card {
  const start = element('button', { id: 'start', type: 'button' }, [t('level.start')]);
  const list = element(
    'ul',
    { className: 'start-goals' },
    text.goals.map((goal) =>
      element('li', {}, goal.bonus ? [element('strong', {}, [t('goals.bonus')]), ' ', goal.text] : [goal.text]),
    ),
  );
  const card = overlay(
    'start-card',
    [
      element('h3', {}, [text.title]),
      ...(text.said ? [saidBy(text.said, 'card-intro')] : []),
      element('p', {}, [t('goals.title')]),
      list,
      ...(text.carrying ? [element('p', { id: 'card-carrying', className: 'card-carrying' }, [text.carrying])] : []),
      start,
    ],
    onClose,
  );
  start.addEventListener('click', () => card.close());
  queueMicrotask(() => start.focus());
  return card;
}

/** You did it, the stars, what the speaker says after the level, Play again, and
 * Next; after the course's last item, the word that there is no next yet and the
 * way to the map. `next` is an address. */
export function winCard(
  earned: number,
  next: string | null,
  onAgain: () => void,
  onNext: (hash: string) => void,
  said?: Said,
): Card {
  const shown = element('p', { className: 'stars' }, [
    '★'.repeat(earned) + '☆'.repeat(MAX_STARS - earned),
  ]);
  shown.setAttribute('aria-label', t('level.stars', { n: earned }));
  shown.dataset.stars = String(earned);
  const again = element('button', { id: 'again', type: 'button' }, [t('level.again')]);
  const after = next
    ? element('button', { id: 'next', type: 'button' }, [t('level.next')])
    : element('div', {}, [
        element('p', { id: 'last', className: 'last' }, [t('level.last')]),
        element('a', { id: 'to-map', className: 'quiet-button', href: '#map' }, [t('map.open_map')]),
      ]);
  const card = overlay(
    'win-card',
    [
      element('h3', {}, [t('outcome.won')]),
      shown,
      ...(said ? [saidBy(said, 'card-outro')] : []),
      element('div', { className: 'card-buttons' }, [again, after]),
    ],
    () => {},
  );
  again.addEventListener('click', () => {
    card.close();
    onAgain();
  });
  if (next) after.addEventListener('click', () => onNext(next));
  queueMicrotask(() => (next ? (after as HTMLButtonElement) : again).focus());
  return card;
}
