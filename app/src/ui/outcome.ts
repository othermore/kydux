// What a run came to, said to the child: a card under the editor. Python's
// own words stay for an error until the children's words of piece 2.4.

import { t } from '../i18n';
import type { ErrorInfo, Explanation } from '../runtime/protocol';
import { element } from './dom';

export type Outcome =
  | { kind: 'won' }
  | { kind: 'incomplete'; met: number; total: number }
  | { kind: 'too_many_ticks'; limit: number }
  | { kind: 'interrupted'; seconds: number }
  | { kind: 'caught' }
  | { kind: 'error'; error: ErrorInfo }
  | { kind: 'failed' };

/** An error explained by the world, in the child's words (D22). */
export function explanationText(explanation: Explanation): string {
  const p = explanation.params;
  const said = (() => {
    switch (explanation.kind) {
      case 'unknown_spell':
        return t('error.unknown_spell', p);
      case 'unknown_name':
        return t('error.unknown_name', p);
      case 'read_only':
        return t('error.read_only', p);
      case 'not_called':
        return t('error.not_called', p);
      case 'unclosed':
        return t('error.unclosed', p);
      case 'missing_colon':
        return t('error.missing_colon', p);
      case 'indentation':
        return t('error.indentation', p);
      case 'syntax':
        return t('error.syntax', p);
      case 'arguments':
        return t('error.arguments', p);
      case 'no_such_module':
        return t('error.no_such_module', p);
      default:
        return t('error.other', p);
    }
  })();
  return 'suggestion' in p ? `${said} ${t('error.suggestion', p)}` : said;
}

export function outcomeText(outcome: Outcome): string {
  switch (outcome.kind) {
    case 'won':
      return t('outcome.won');
    case 'incomplete':
      return t('outcome.incomplete', { n: outcome.met, total: outcome.total });
    case 'too_many_ticks':
      return t('outcome.too_many_ticks', { limit: outcome.limit });
    case 'interrupted':
      return t('outcome.interrupted', { seconds: outcome.seconds });
    case 'caught':
      return t('outcome.caught');
    case 'error': {
      const { type, message, line, explanation } = outcome.error;
      if (explanation) {
        const text = explanationText(explanation);
        return line != null ? `${text}${t('error.line', { line })}` : text;
      }
      return line != null
        ? t('outcome.error', { type, message, line })
        : t('outcome.error_no_line', { type, message });
    }
    case 'failed':
      return t('level.failed');
  }
}

/** The text with what is between backticks as code: `move_right` is a name to type. */
export function withCode(said: string): (string | HTMLElement)[] {
  return said
    .split('`')
    .map((part, index) => (index % 2 === 1 ? element('code', {}, [part]) : part))
    .filter((part) => part !== '');
}

export interface OutcomeCard {
  node: HTMLElement;
  show(outcome: Outcome): void;
  hide(): void;
  /** What the card says now, or null while it is hidden. */
  readonly current: Outcome | null;
}

export function outcomeCard(): OutcomeCard {
  const text = element('p', { className: 'outcome-text' });
  // Python that could not start needs the page loaded again.
  const reload = element('button', { id: 'reload', type: 'button', hidden: true });
  reload.addEventListener('click', () => location.reload());
  const node = element('section', { className: 'outcome', hidden: true }, [text, reload]);
  node.setAttribute('role', 'status');
  let current: Outcome | null = null;
  return {
    node,
    show(outcome) {
      current = outcome;
      text.replaceChildren(...withCode(outcomeText(outcome)));
      reload.textContent = t('level.reload');
      reload.hidden = outcome.kind !== 'failed';
      node.dataset.kind = outcome.kind;
      node.hidden = false;
    },
    hide() {
      current = null;
      node.hidden = true;
      delete node.dataset.kind;
    },
    get current() {
      return current;
    },
  };
}
