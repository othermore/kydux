// What a run came to, said to the child: a card under the editor. An outcome
// is data; the card says it in the language of the moment.

import { blockedText } from '../engine/words';
import { t } from '../i18n';
import type { ErrorInfo, Explanation } from '../runtime/protocol';
import { element } from './dom';

/** What a run came to. For a level played in several ways (D51), `way` is the id
 * of the way the card speaks of; `won` is every way won, and `way_won` one way won
 * while another is not. */
export type Outcome = (
  | { kind: 'won' }
  | { kind: 'way_won' }
  | {
      kind: 'incomplete';
      met: number;
      total: number;
      /** The first action that could not be done: its line, its reason, its thing's
       * kind, and for a spell not known, the spell. */
      blocked?: { line: number; reason: string; thing: string | null; spell?: string };
    }
  | { kind: 'too_many_ticks'; limit: number }
  | { kind: 'interrupted'; seconds: number }
  | { kind: 'caught' }
  | { kind: 'error'; error: ErrorInfo }
  | { kind: 'failed' }
) & { way?: string };

/** An error explained by the world, in the child's words (D22). */
export function explanationText(explanation: Explanation): string {
  const p = explanation.params;
  const said = (() => {
    switch (explanation.kind) {
      case 'unknown_action':
        return t('error.unknown_action', p);
      case 'unknown_name':
        return t('error.unknown_name', p);
      case 'read_only':
        return t('error.read_only', p);
      case 'no_new_attribute':
        return t('error.no_new_attribute', p);
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

/** What the card says; `wayName` gives a way's words, from the level's text. */
export function outcomeText(outcome: Outcome, wayName: (id: string) => string = (id) => id): string {
  const said = outcomeWords(outcome);
  if (outcome.way === undefined) return said;
  if (outcome.kind === 'won') return `${said} ${t('outcome.all_ways')}`;
  return `${t('outcome.way', { name: wayName(outcome.way) })} ${said}`;
}

function outcomeWords(outcome: Outcome): string {
  switch (outcome.kind) {
    case 'won':
      return t('outcome.won');
    case 'way_won':
      return t('outcome.way_won');
    case 'incomplete': {
      const said = t('outcome.incomplete', { n: outcome.met, total: outcome.total });
      // Why something could not be done, the first time it happened (D28).
      if (!outcome.blocked) return said;
      const { line, reason, thing, spell } = outcome.blocked;
      const why = blockedText(reason, thing, spell);
      return `${said}\n${t('outcome.blocked', { line, reason: why })}`;
    }
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
  /** Says what the run came to, and what the child's code printed, if anything;
   * `wayName` gives a way's words. */
  show(outcome: Outcome, printed?: string, wayName?: (id: string) => string): void;
  hide(): void;
  /** What the card says now, or null while it is hidden. */
  readonly current: Outcome | null;
}

export function outcomeCard(): OutcomeCard {
  const text = element('p', { className: 'outcome-text' });
  // Python that could not start needs the page loaded again.
  const reload = element('button', { id: 'reload', type: 'button', hidden: true });
  reload.addEventListener('click', () => location.reload());
  const printedLabel = element('p', { className: 'printed-label' });
  const printedText = element('pre', { className: 'printed' });
  const printedBox = element('div', { hidden: true }, [printedLabel, printedText]);
  const node = element('section', { className: 'outcome', hidden: true }, [
    text,
    printedBox,
    reload,
  ]);
  let lastPrinted = '';
  node.setAttribute('role', 'status');
  let current: Outcome | null = null;
  return {
    node,
    show(outcome, printed = lastPrinted, wayName = (id) => id) {
      current = outcome;
      lastPrinted = printed;
      text.replaceChildren(...withCode(outcomeText(outcome, wayName)));
      printedLabel.textContent = t('outcome.printed');
      printedText.textContent = printed.replace(/\n$/, '');
      printedBox.hidden = printed === '';
      reload.textContent = t('level.reload');
      reload.hidden = outcome.kind !== 'failed';
      node.dataset.kind = outcome.kind;
      node.hidden = false;
    },
    hide() {
      current = null;
      lastPrinted = '';
      node.hidden = true;
      delete node.dataset.kind;
    },
    get current() {
      return current;
    },
  };
}
