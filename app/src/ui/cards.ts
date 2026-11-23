// The cards that open and close a level. The start card shows the level's goals
// before the child begins, over the whole window (D228); the win card shows the stars
// a winning run earned and leads to the next level, over the scene.

import { t } from '../i18n';
import { MAX_STARS } from '../progress/store';
import { element } from './dom';
import { portrait } from './portraits';
import type { Verdict } from './stars';
import { withCode } from './words';

export interface Card {
  node: HTMLElement;
  /** Where the card lies: over the whole window, the start card (D228), or over the
   * scene, inside its frame. */
  readonly over: 'window' | 'scene';
  readonly open: boolean;
  close(): void;
}

/** A card's button takes the keyboard without bringing itself into view, and the card
 * shows its first line, however tall it is (D222). */
function takeKeyboard(node: HTMLElement, button: HTMLElement): void {
  queueMicrotask(() => {
    button.focus({ preventScroll: true });
    const panel = node.querySelector<HTMLElement>('.card');
    if (panel) panel.scrollTop = 0;
  });
}

/** A card over the scene, or over the whole window: a dialog the child closes with its
 * button or Escape. Over the window its dim takes no click, so that a button of the
 * page beside the card works under it (D222, D228). */
function overlay(
  className: string,
  children: (Node | string)[],
  onClose: () => void,
  over: Card['over'] = 'scene',
): Card {
  const panel = element('div', { className: `card ${className}` }, children);
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  const node = element('div', { className: over === 'window' ? 'card-overlay over-window' : 'card-overlay' }, [panel]);
  let open = true;
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') card.close();
  };
  document.addEventListener('keydown', onKey);
  const card: Card = {
    node,
    over,
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
  /** Whether the card is opened again, with ?, so that its button says Continue. */
  again?: boolean;
  /** What may differ at each run, in the child's words, when the level has ways (D204). */
  changes?: string;
  /** That the level is played as practice: the familiar is described again with one
   * living already, and nothing is kept (D265). */
  practice?: string;
  /** Plays the screen's guide again (D68): offered on the course's first level's card,
   * once the guide has been seen (D248). */
  onGuide?: () => void;
}

/** What a level's start card says of its ways (D204): what may differ at each run and
 * that the program has to work in every case; nothing for a level played one way. No count
 * of ways and no list of them. */
export function changesLines(changes: string | undefined): string[] {
  return changes ? [changes, t('level.changes_tail')] : [];
}

/** A character's words on a card (D45): the name, and what they say. */
export interface Said {
  speaker: string;
  text: string;
  /** Whose portrait is beside the name (D194), when they have one. */
  portrait?: string | null;
}

function saidBy(said: Said, id: string): HTMLElement {
  return element('p', { id, className: 'card-said' }, [
    ...(said.portrait ? [portrait(said.portrait, 'small')] : []),
    element('strong', {}, [said.speaker]),
    ' ',
    ...withCode(said.text),
  ]);
}

/** The button that plays the screen's guide again, once the card is closed. */
function showScreen(onGuide: () => void, close: () => void): HTMLElement {
  const button = element('button', { id: 'show-screen', type: 'button', className: 'quiet-button' }, [
    t('level.show_screen'),
  ]);
  button.addEventListener('click', () => {
    close();
    onGuide();
  });
  return button;
}

/** The level's title, what its speaker says, its goals, and Start. */
export function startCard(text: StartCardText, onClose: () => void = () => {}): Card {
  const start = element('button', { id: 'start', type: 'button' }, [
    text.again ? t('level.continue') : t('level.start'),
  ]);
  const list = element(
    'ul',
    { className: 'start-goals' },
    text.goals.map((goal) =>
      element('li', {}, goal.bonus ? [element('strong', {}, [t('goals.bonus')]), ' ', ...withCode(goal.text)] : withCode(goal.text)),
    ),
  );
  const card = overlay(
    'start-card',
    [
      ...(text.label ? [element('p', { id: 'card-number', className: 'item-number' }, [text.label])] : []),
      element('h3', {}, [text.title]),
      ...(text.said ? [saidBy(text.said, 'card-intro')] : []),
      ...(text.task ? [element('p', { id: 'card-task', className: 'card-task' }, [text.task])] : []),
      ...(text.practice ? [element('p', { id: 'card-practice', className: 'card-task' }, [text.practice])] : []),
      element('p', {}, [t('goals.title')]),
      list,
      ...(text.carrying ? [element('p', { id: 'card-carrying', className: 'card-carrying' }, [text.carrying])] : []),
      // What may differ at each run, and that the program has to work in every case (D204).
      ...(text.changes
        ? [
            element(
              'div',
              { id: 'card-changes', className: 'card-changes' },
              changesLines(text.changes).map((line) => element('p', {}, withCode(line))),
            ),
          ]
        : []),
      text.onGuide
        ? element('div', { className: 'card-buttons' }, [showScreen(text.onGuide, () => card.close()), start])
        : start,
    ],
    onClose,
    'window',
  );
  start.addEventListener('click', () => card.close());
  takeKeyboard(card.node, start);
  return card;
}

export interface WinCardParts {
  /** The stars earned and why (D57). */
  verdict: Verdict;
  /** The stars the level had before this win: a win never shows fewer. */
  kept: number;
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
export function winCard({ verdict, kept, next, onAgain, onNext, said, learned }: WinCardParts): Card {
  const earned = Math.max(verdict.earned, kept);
  // The stars are the card's event: big, each drawn in after the one before with a
  // little bounce; the earned ones gold, the others an outline (12.5).
  const shown = element(
    'p',
    { className: 'stars' },
    Array.from({ length: MAX_STARS }, (_, index) => {
      const star = element('span', { className: `star ${index < earned ? 'earned' : 'missed'}` }, [
        index < earned ? '★' : '☆',
      ]);
      star.style.setProperty('--star', String(index));
      return star;
    }),
  );
  shown.setAttribute('aria-label', t('level.stars', { n: earned }));
  shown.dataset.stars = String(earned);
  // A level played again keeps the stars it had, whatever this run earned.
  const keeping =
    kept > verdict.earned
      ? [element('p', { id: 'stars-kept', className: 'stars-kept' }, [t('stars.kept', { n: kept })])]
      : [];
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
      ...keeping,
      // The story's word and what was learned, smaller, under the stars and their reasons.
      ...(said || learned
        ? [
            element('div', { className: 'card-story' }, [
              ...(said ? [saidBy(said, 'card-outro')] : []),
              ...(learned ? [element('p', { id: 'card-learned', className: 'card-learned' }, withCode(learned))] : []),
            ]),
          ]
        : []),
      element('div', { className: 'card-buttons' }, [again, after]),
    ],
    () => {},
  );
  again.addEventListener('click', () => {
    card.close();
    onAgain();
  });
  if (next) after.addEventListener('click', () => onNext(next));
  takeKeyboard(card.node, next ? (after as HTMLButtonElement) : again);
  return card;
}
