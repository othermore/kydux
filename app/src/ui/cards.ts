// The cards that open and close a level, over its scene. The start card shows
// the level's goals before the child begins; the win card shows the stars a
// winning run earned and leads to the next level.

import { t } from '../i18n';
import { MAX_STARS } from '../progress/store';
import { element } from './dom';
import type { Verdict } from './stars';

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
  /** The level's number in its chapter, in words, and what a fix or improve level
   * asks to be done (D56). */
  label?: string;
  task?: string;
  goals: { text: string; bonus?: boolean }[];
  /** What a character of the story says before the level, with the character's name. */
  said?: Said;
  /** What the wizard carries from the start, in words (D49). */
  carrying?: string;
  /** The words for each way the level is played, when it has ways (D51). */
  ways?: string[];
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
      ...(text.label ? [element('p', { id: 'card-number', className: 'item-number' }, [text.label])] : []),
      element('h3', {}, [text.title]),
      ...(text.said ? [saidBy(text.said, 'card-intro')] : []),
      ...(text.task ? [element('p', { id: 'card-task', className: 'card-task' }, [text.task])] : []),
      element('p', {}, [t('goals.title')]),
      list,
      ...(text.carrying ? [element('p', { id: 'card-carrying', className: 'card-carrying' }, [text.carrying])] : []),
      ...(text.ways && text.ways.length > 0
        ? [
            element('div', { id: 'card-ways', className: 'card-ways' }, [
              element('p', {}, [t('level.ways', { n: text.ways.length })]),
              element(
                'ul',
                {},
                text.ways.map((words) => element('li', {}, [words])),
              ),
            ]),
          ]
        : []),
      start,
    ],
    onClose,
  );
  start.addEventListener('click', () => card.close());
  queueMicrotask(() => start.focus());
  return card;
}

export interface WinCardParts {
  /** The stars earned and why (D57). */
  verdict: Verdict;
  /** The address of what comes next, or null after the course's last item. */
  next: string | null;
  onAgain: () => void;
  onNext: (hash: string) => void;
  /** What the level's speaker says after it (D45), and what the child now knows (D62). */
  said?: Said;
  learned?: string;
}

/** You did it, the stars and why, what the speaker says, what the child learned,
 * Play again, and Next; after the course's last item, the word that there is no
 * next yet and the way to the map. */
export function winCard({ verdict, next, onAgain, onNext, said, learned }: WinCardParts): Card {
  const { earned } = verdict;
  const shown = element('p', { className: 'stars' }, [
    '★'.repeat(earned) + '☆'.repeat(MAX_STARS - earned),
  ]);
  shown.setAttribute('aria-label', t('level.stars', { n: earned }));
  shown.dataset.stars = String(earned);
  // Each star's reason, kept or lost, so that the child knows what to try again for.
  const reasons = element(
    'ul',
    { id: 'star-reasons', className: 'star-reasons' },
    verdict.reasons.map((reason) => {
      const item = element('li', {}, [t(`stars.${reason.key}`)]);
      item.dataset.kept = String(reason.kept);
      return item;
    }),
  );
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
      reasons,
      ...(said ? [saidBy(said, 'card-outro')] : []),
      ...(learned ? [element('p', { id: 'card-learned', className: 'card-learned' }, [learned])] : []),
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
