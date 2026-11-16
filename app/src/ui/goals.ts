// The goals panel: the level's goals, each with a mark that is empty, ticked
// once met, or crossed once failed. Its heading folds it, so that on a small
// screen it does not hide the scene; it stays folded for the visit (D38). It has two
// shapes, a list in the scene's top left corner and a strip along the scene's top, and
// the level takes the first that covers nothing of it once its start is drawn; where
// both cover something, the list, which the page folds three seconds after the child
// can see it, unless the child has used its heading before (D227). The scene asks where
// it is, and puts no words under it (D240).

import { t } from '../i18n';
import { element } from './dom';
import { withCode } from './words';

export type GoalMark = 'open' | 'met' | 'failed';
export type GoalsShape = 'list' | 'strip';

/** A rectangle on the page. */
export interface PageBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface GoalsPanel {
  node: HTMLElement;
  set(index: number, mark: GoalMark): void;
  reset(): void;
  /** Folds it for this level, as when both its shapes would cover something (D227). */
  fold(): void;
  /** Lays it in a shape: `data-shape` on the box. */
  shape(shape: GoalsShape): void;
  /** Its rectangle in a shape, open, measured with nothing shown to the child. */
  measure(shape: GoalsShape): PageBox;
  /** Shows it, once its shape is taken; until then it is laid out but not seen. */
  reveal(): void;
  /** Its rectangle on the page as it is drawn, open or folded; null until it is shown.
   * The scene puts no words under it (D240). */
  box(): PageBox | null;
  /** Whether the child has used its heading. */
  readonly touched: boolean;
}

function meets(a: PageBox, b: PageBox): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

/** The goals box's shape (D227): the list if it covers none of `level`'s boxes (the
 * wizard, a figure, a thing in sight, the end's mark), else the strip if it covers
 * none, else the list, to be folded; with how many of them each shape covers. */
export function takeShape(
  list: PageBox,
  strip: PageBox,
  level: PageBox[],
): { shape: GoalsShape; fold: boolean; covers: { list: number; strip: number } } {
  const covers = {
    list: level.filter((box) => meets(list, box)).length,
    strip: level.filter((box) => meets(strip, box)).length,
  };
  if (covers.list === 0) return { shape: 'list', fold: false, covers };
  if (covers.strip === 0) return { shape: 'strip', fold: false, covers };
  return { shape: 'list', fold: true, covers };
}

function label(mark: GoalMark): string {
  switch (mark) {
    case 'open':
      return t('goals.open');
    case 'met':
      return t('goals.met');
    case 'failed':
      return t('goals.failed');
  }
}

/** Whether the child has folded the panel, kept while the page is open. */
let folded = false;

export function goalsPanel(goals: { text: string; bonus?: boolean }[]): GoalsPanel {
  const items = goals.map((goal) => {
    const mark = element('span', { className: 'goal-mark' });
    const words = goal.bonus
      ? [element('strong', { className: 'goal-bonus' }, [t('goals.bonus')]), ' ', ...withCode(goal.text)]
      : withCode(goal.text);
    const item = element('li', { className: 'goal' }, [mark, element('span', {}, words)]);
    if (goal.bonus) item.dataset.bonus = 'true';
    return { item, mark };
  });
  const set = (index: number, state: GoalMark) => {
    const entry = items[index];
    if (!entry) return;
    entry.item.dataset.mark = state;
    entry.mark.setAttribute('aria-label', label(state));
    entry.mark.title = label(state);
  };
  const reset = () => items.forEach((_, index) => set(index, 'open'));
  reset();
  const list = element(
    'ul',
    { id: 'goals-list' },
    items.map((entry) => entry.item),
  );
  const toggle = element('button', { id: 'goals-toggle', type: 'button', className: 'goals-toggle' }, [
    t('goals.title'),
  ]);
  toggle.setAttribute('aria-controls', 'goals-list');
  toggle.title = t('goals.fold');
  const node = element('section', { className: 'goals' }, [element('h3', {}, [toggle]), list]);
  node.dataset.shape = 'list';
  // Laid out, not seen, until its shape is taken (D227).
  node.style.visibility = 'hidden';
  let shut = folded;
  let touched = false;
  const show = () => {
    list.hidden = shut;
    node.dataset.folded = String(shut);
    toggle.setAttribute('aria-expanded', String(!shut));
  };
  toggle.addEventListener('click', () => {
    touched = true;
    shut = !shut;
    folded = shut;
    show();
  });
  show();
  node.setAttribute('aria-live', 'polite');
  const shape = (taken: GoalsShape) => {
    node.dataset.shape = taken;
    if (node.parentElement) node.parentElement.dataset.shape = taken;
  };
  return {
    node,
    set,
    reset,
    fold() {
      shut = true;
      show();
    },
    shape,
    measure(taken) {
      const was = node.dataset.shape as GoalsShape;
      shape(taken);
      list.hidden = false;
      const { left, top, right, bottom } = node.getBoundingClientRect();
      shape(was);
      show();
      return { left, top, right, bottom };
    },
    reveal() {
      node.style.visibility = '';
      node.dataset.revealed = 'true';
    },
    box() {
      if (node.dataset.revealed !== 'true') return null;
      const { left, top, right, bottom } = node.getBoundingClientRect();
      return { left, top, right, bottom };
    },
    get touched() {
      return touched;
    },
  };
}
