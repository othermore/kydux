// The screen's guide (D68): the screen dimmed but one part at a time, a card
// beside that part with an arrow to it, and Next and Skip. The first level of
// the course opens it the first time it is played, and the ? card plays it
// again. Its words are content/guide/text.<lang>.json, written by Gemini.

import { t } from '../i18n';
import { element } from './dom';

/** A step of the guide: the words' key, and the part of the screen it shows, or
 * null for a step about no part (the way to learn). */
export interface GuideStep {
  key: string;
  target: string | null;
}

export const GUIDE_STEPS: readonly GuideStep[] = [
  { key: 'scene', target: '#scene' },
  { key: 'goals', target: '.goals-slot' },
  { key: 'editor', target: '.editor' },
  { key: 'run', target: '#run' },
  { key: 'notebook', target: '#notebook' },
  { key: 'hint', target: '#hint' },
  { key: 'method', target: null },
];

export interface GuideText {
  steps: Record<string, { title: string; text: string }>;
}

export interface GuideHooks {
  /** A step is shown: the level opens what it needs open (the notebook). */
  onStep?: (key: string) => void;
  /** The guide is done or skipped. */
  onClose: () => void;
}

export interface Guide {
  node: HTMLElement;
  close(): void;
}

/** How far the card keeps from the part it points at, and from the window's edges. */
const GAP = 16;
const EDGE = 8;

/** Opens the guide over `root`, at its first step. */
export function openGuide(root: HTMLElement, text: GuideText, hooks: GuideHooks): Guide {
  const spot = element('div', { className: 'guide-spot' });
  const title = element('h3', { id: 'guide-title' });
  const words = element('p', { id: 'guide-text' });
  const count = element('p', { id: 'guide-count', className: 'guide-count' });
  const skip = element('button', { id: 'guide-skip', type: 'button', className: 'quiet-button' }, [
    t('guide.skip'),
  ]);
  const next = element('button', { id: 'guide-next', type: 'button', className: 'big-button' });
  const card = element('div', { className: 'guide-card', role: 'dialog' }, [
    count,
    title,
    words,
    element('div', { className: 'card-buttons' }, [skip, next]),
  ]);
  card.setAttribute('aria-labelledby', 'guide-title');
  const node = element('div', { className: 'guide' }, [spot, card]);
  let index = 0;
  let closed = false;

  const place = () => {
    const step = GUIDE_STEPS[index];
    if (!step) return;
    const target = step.target ? document.querySelector<HTMLElement>(step.target) : null;
    const box = target && !target.hidden ? target.getBoundingClientRect() : null;
    node.dataset.step = step.key;
    card.classList.remove('left', 'right', 'below', 'above', 'middle');
    if (!box) {
      // No part of the screen: the card in the middle, everything dimmed.
      spot.hidden = true;
      card.classList.add('middle');
      card.style.left = `${Math.max(EDGE, (innerWidth - card.offsetWidth) / 2)}px`;
      card.style.top = `${Math.max(EDGE, (innerHeight - card.offsetHeight) / 2)}px`;
      return;
    }
    spot.hidden = false;
    Object.assign(spot.style, {
      left: `${box.left - 4}px`,
      top: `${box.top - 4}px`,
      width: `${box.width + 8}px`,
      height: `${box.height + 8}px`,
    });
    // Beside the part where there is room, its arrow pointing back at it.
    const [w, h] = [card.offsetWidth, card.offsetHeight];
    const centreY = Math.min(Math.max(EDGE, box.top + box.height / 2 - h / 2), innerHeight - h - EDGE);
    const centreX = Math.min(Math.max(EDGE, box.left + box.width / 2 - w / 2), innerWidth - w - EDGE);
    let side: 'right' | 'left' | 'below' | 'above';
    let [x, y] = [0, 0];
    if (box.right + GAP + w + EDGE <= innerWidth) [side, x, y] = ['right', box.right + GAP, centreY];
    else if (box.left - GAP - w >= EDGE) [side, x, y] = ['left', box.left - GAP - w, centreY];
    else if (box.bottom + GAP + h + EDGE <= innerHeight) [side, x, y] = ['below', centreX, box.bottom + GAP];
    else [side, x, y] = ['above', centreX, Math.max(EDGE, box.top - GAP - h)];
    card.classList.add(side);
    card.style.left = `${x}px`;
    card.style.top = `${y}px`;
    // The arrow sits on the card's side towards the part, level with the part's middle.
    const along =
      side === 'right' || side === 'left'
        ? Math.min(Math.max(16, box.top + box.height / 2 - y), h - 16)
        : Math.min(Math.max(16, box.left + box.width / 2 - x), w - 16);
    card.style.setProperty('--arrow', `${along}px`);
  };

  const show = () => {
    const step = GUIDE_STEPS[index];
    if (!step) return;
    hooks.onStep?.(step.key);
    const said = text.steps[step.key];
    title.textContent = said?.title ?? '';
    words.textContent = said?.text ?? '';
    count.textContent = t('guide.count', { n: index + 1, total: GUIDE_STEPS.length });
    next.textContent = index === GUIDE_STEPS.length - 1 ? t('guide.done') : t('guide.next');
    // Placed once the step's part is open and the card has its size.
    requestAnimationFrame(place);
    next.focus();
  };

  const close = () => {
    if (closed) return;
    closed = true;
    removeEventListener('resize', place);
    removeEventListener('keydown', onKey);
    node.remove();
    hooks.onClose();
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') close();
  };

  next.addEventListener('click', () => {
    if (index === GUIDE_STEPS.length - 1) close();
    else {
      index += 1;
      show();
    }
  });
  skip.addEventListener('click', close);
  addEventListener('resize', place);
  addEventListener('keydown', onKey);
  root.append(node);
  show();
  return { node, close };
}
