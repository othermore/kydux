// The goals panel: the level's goals, each with a mark that is empty, ticked
// once met, or crossed once failed. Its heading folds it, so that on a small
// screen it does not hide the scene; it stays folded for the visit (D38).

import { t } from '../i18n';
import { element } from './dom';
import { withCode } from './words';

export type GoalMark = 'open' | 'met' | 'failed';

export interface GoalsPanel {
  node: HTMLElement;
  set(index: number, mark: GoalMark): void;
  reset(): void;
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
  const show = () => {
    list.hidden = folded;
    node.dataset.folded = String(folded);
    toggle.setAttribute('aria-expanded', String(!folded));
  };
  toggle.addEventListener('click', () => {
    folded = !folded;
    show();
  });
  show();
  node.setAttribute('aria-live', 'polite');
  return { node, set, reset };
}
