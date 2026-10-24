// The screen's guide (D68): the screen dimmed but the parts a step shows, a card
// beside the first of them with an arrow to it, an arrow from the card to each
// other part, and Next and Skip. The first level of the course opens it the first
// time it is played, and the ? card plays it again. Its words are
// content/guide/text.<lang>.json, written by Gemini; they may hold Markdown's
// italics and code.

import { marked } from 'marked';
import { t } from '../i18n';
import { element } from './dom';

/** A step of the guide: the words' key, and the parts of the screen it shows, the
 * card beside the first; none for a step about no part (the way to learn). */
export interface GuideStep {
  key: string;
  targets: readonly string[];
}

export const GUIDE_STEPS: readonly GuideStep[] = [
  { key: 'scene', targets: ['#scene'] },
  { key: 'goals', targets: ['.goals-slot'] },
  { key: 'editor', targets: ['.editor'] },
  { key: 'run', targets: ['#run', '#restart'] },
  // The button that opens the notebook, and its panel, opened for the step.
  { key: 'notebook', targets: ['#notebook-open', '#notebook'] },
  { key: 'hint', targets: ['#hint'] },
  { key: 'about', targets: ['#about'] },
  { key: 'method', targets: [] },
];

const SVG = 'http://www.w3.org/2000/svg';

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

function middle(box: DOMRect): [number, number] {
  return [box.left + box.width / 2, box.top + box.height / 2];
}

/** Where the line from a box's middle to a point outside it leaves the box. */
function edgeToward(box: DOMRect, [x, y]: [number, number]): [number, number] {
  const [cx, cy] = middle(box);
  const [dx, dy] = [x - cx, y - cy];
  const scale = Math.min(
    dx === 0 ? Infinity : box.width / 2 / Math.abs(dx),
    dy === 0 ? Infinity : box.height / 2 / Math.abs(dy),
  );
  return scale >= 1 ? [x, y] : [cx + dx * scale, cy + dy * scale];
}

/** Opens the guide over `root`, at its first step. */
export function openGuide(root: HTMLElement, text: GuideText, hooks: GuideHooks): Guide {
  // The dim over the screen, with a hole for each part shown, and the arrows from
  // the card to the parts after the first; the parts' outlines over it.
  const shade = document.createElementNS(SVG, 'svg');
  shade.classList.add('guide-shade');
  shade.innerHTML =
    '<defs><marker id="guide-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7"' +
    ' markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>';
  const dim = document.createElementNS(SVG, 'path');
  dim.classList.add('guide-dim');
  dim.setAttribute('fill-rule', 'evenodd');
  shade.append(dim);
  const spots = element('div', { className: 'guide-spots' });
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
  const node = element('div', { className: 'guide' }, [spots, card]);
  node.prepend(shade);
  let index = 0;
  let closed = false;

  const place = () => {
    const step = GUIDE_STEPS[index];
    if (!step) return;
    const boxes = step.targets
      .map((target) => document.querySelector<HTMLElement>(target))
      .filter((target): target is HTMLElement => target !== null && !target.hidden)
      .map((target) => target.getBoundingClientRect())
      .filter((box) => box.width > 0 && box.height > 0)
      .map((box) => new DOMRect(box.left - 4, box.top - 4, box.width + 8, box.height + 8));
    node.dataset.step = step.key;
    node.dataset.shown = String(boxes.length);
    card.classList.remove('left', 'right', 'below', 'above', 'middle');
    shade.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
    dim.setAttribute(
      'd',
      `M0,0H${innerWidth}V${innerHeight}H0Z` +
        boxes.map((b) => `M${b.left},${b.top}h${b.width}v${b.height}h${-b.width}Z`).join(''),
    );
    spots.replaceChildren(
      ...boxes.map((b) => {
        const spot = element('div', { className: 'guide-spot' });
        Object.assign(spot.style, {
          left: `${b.left}px`,
          top: `${b.top}px`,
          width: `${b.width}px`,
          height: `${b.height}px`,
        });
        return spot;
      }),
    );
    shade.querySelectorAll('.guide-arrow').forEach((arrow) => arrow.remove());
    const box = boxes[0];
    if (!box) {
      // No part of the screen: the card in the middle, everything dimmed.
      card.classList.add('middle');
      card.style.left = `${Math.max(EDGE, (innerWidth - card.offsetWidth) / 2)}px`;
      card.style.top = `${Math.max(EDGE, (innerHeight - card.offsetHeight) / 2)}px`;
      return;
    }
    // Beside the part where there is room, its arrow pointing back at it: above or
    // below a part narrower than the card (a button), else to its right or left.
    const [w, h] = [card.offsetWidth, card.offsetHeight];
    const centreY = Math.min(Math.max(EDGE, box.top + box.height / 2 - h / 2), innerHeight - h - EDGE);
    const centreX = Math.min(Math.max(EDGE, box.left + box.width / 2 - w / 2), innerWidth - w - EDGE);
    type Side = 'right' | 'left' | 'below' | 'above';
    const room: Record<Side, boolean> = {
      right: box.right + GAP + w + EDGE <= innerWidth,
      left: box.left - GAP - w >= EDGE,
      below: box.bottom + GAP + h + EDGE <= innerHeight,
      above: box.top - GAP - h >= EDGE,
    };
    const order: Side[] =
      box.width < w ? ['above', 'below', 'right', 'left'] : ['right', 'left', 'below', 'above'];
    const side = order.find((way) => room[way]) ?? 'above';
    const corners: Record<Side, [number, number]> = {
      right: [box.right + GAP, centreY],
      left: [box.left - GAP - w, centreY],
      below: [centreX, box.bottom + GAP],
      above: [centreX, Math.max(EDGE, box.top - GAP - h)],
    };
    const [x, y] = corners[side];
    card.classList.add(side);
    card.style.left = `${x}px`;
    card.style.top = `${y}px`;
    // The arrow sits on the card's side towards the part, level with the part's middle.
    const along =
      side === 'right' || side === 'left'
        ? Math.min(Math.max(16, box.top + box.height / 2 - y), h - 16)
        : Math.min(Math.max(16, box.left + box.width / 2 - x), w - 16);
    card.style.setProperty('--arrow', `${along}px`);
    // An arrow from the card to each other part, along the line between their
    // middles, from the card's edge to the part's.
    const placed = new DOMRect(x, y, w, h);
    for (const other of boxes.slice(1)) {
      const [fromX, fromY] = edgeToward(placed, middle(other));
      const [toX, toY] = edgeToward(other, middle(placed));
      const arrow = document.createElementNS(SVG, 'line');
      arrow.classList.add('guide-arrow');
      arrow.setAttribute('x1', String(fromX));
      arrow.setAttribute('y1', String(fromY));
      arrow.setAttribute('x2', String(toX));
      arrow.setAttribute('y2', String(toY));
      arrow.setAttribute('marker-end', 'url(#guide-head)');
      shade.append(arrow);
    }
  };

  const show = () => {
    const step = GUIDE_STEPS[index];
    if (!step) return;
    hooks.onStep?.(step.key);
    const said = text.steps[step.key];
    title.textContent = said?.title ?? '';
    words.innerHTML = marked.parseInline(said?.text ?? '', { async: false });
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
