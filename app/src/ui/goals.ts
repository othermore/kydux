// The goals panel: the level's goals, each with a mark that is empty, ticked
// once met, or crossed once failed.

import { t } from '../i18n';
import { element } from './dom';

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

export function goalsPanel(goals: { text: string }[]): GoalsPanel {
  const items = goals.map((goal) => {
    const mark = element('span', { className: 'goal-mark' });
    const item = element('li', { className: 'goal' }, [mark, element('span', {}, [goal.text])]);
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
  const node = element('section', { className: 'goals' }, [
    element('h3', {}, [t('goals.title')]),
    element(
      'ul',
      {},
      items.map((entry) => entry.item),
    ),
  ]);
  node.setAttribute('aria-live', 'polite');
  return { node, set, reset };
}
