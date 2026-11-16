// What a run came to, said to the child: a card under the editor. An outcome
// is data; the card says it in the language of the moment.

import { blockedText } from '../engine/words';
import { characterName, t } from '../i18n';
import type { ErrorInfo, Explanation } from '../runtime/protocol';
import { element } from './dom';
import { withCode } from './words';

/** What a run came to. For a level played in several ways (D51), `won` is every way
 * won, and `way_won` a way won while another is not, which only ?debug's way shows;
 * `changed` says the run's way is not the one on the screen before it (D204). */
export type Outcome = (
  | { kind: 'won' }
  | { kind: 'way_won' }
  | {
      kind: 'incomplete';
      met: number;
      total: number;
      /** The first action that could not be done: its line, its reason, its thing's
       * kind, and for a spell not known, the spell. */
      blocked?: { line: number; reason: string; thing: string | null; spell?: string; things?: string[] };
      /** The wizard walked over a tile it had to stop on. */
      walkedOver?: boolean;
    }
  | { kind: 'too_many_ticks'; limit: number }
  | { kind: 'interrupted'; seconds: number }
  | { kind: 'caught' }
  | { kind: 'error'; error: ErrorInfo }
  | { kind: 'failed' }
) & { changed?: boolean };

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
      case 'no_knot':
        return t('error.no_knot', p);
      case 'index_range':
        return t('error.index_range', p);
      case 'index_range_unknown':
        return t('error.index_range_unknown', p);
      case 'no_such_module':
        return t('error.no_such_module', p);
      default:
        return t('error.other', p);
    }
  })();
  return 'suggestion' in p ? `${said} ${t('error.suggestion', p)}` : said;
}

/** What the card says: first, when the run's way is not the one on the screen before
 * it, that this time it was different (D204). */
export function outcomeText(outcome: Outcome): string {
  const said = outcomeWords(outcome);
  return outcome.changed ? `${t('outcome.changed')} ${said}` : said;
}

function outcomeWords(outcome: Outcome): string {
  switch (outcome.kind) {
    case 'won':
      return t('outcome.won');
    case 'way_won':
      return t('outcome.way_won');
    case 'incomplete': {
      const lines = [t('outcome.incomplete', { n: outcome.met, total: outcome.total })];
      // A goal is stopped at, not walked over.
      if (outcome.walkedOver) lines.push(t('outcome.walked_over'));
      // Why something could not be done, the first time it happened (D28).
      if (outcome.blocked) {
        const { line, reason, thing, spell, things } = outcome.blocked;
        const why = blockedText(reason, thing, { spell, things });
        lines.push(t('outcome.blocked', { line, reason: why }));
      }
      return lines.join('\n');
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

/** Ilda's count after a race (D189), from the `before` goal's params: the wizard's
 * lines, flight and penalty to the tick it crossed at, and the racer's; null for a
 * level that is no race. */
export function raceCount(goals: { kind: string; params: Record<string, unknown> }[] | undefined): string | null {
  const before = goals?.find((goal) => goal.kind === 'before');
  if (!before) return null;
  const p = before.params;
  const said = {
    lines: Number(p.lines),
    flight: Number(p.flight),
    penalty: Number(p.penalty),
    tick: Number(p.tick),
    name: characterName(String(p.racer)),
    racer_lines: Number(p.racer_lines),
    racer_flight: Number(p.racer_tick) - Number(p.racer_lines),
    racer_tick: Number(p.racer_tick),
  };
  return p.tick === null || p.tick === undefined ? t('race.count_unfinished', said) : t('race.count', said);
}

export interface OutcomeCard {
  node: HTMLElement;
  /** Says what the run came to, and what the child's code printed, if anything; in a
   * race, Ilda's count under it (D189). */
  show(outcome: Outcome, printed?: string, race?: string | null): void;
  hide(): void;
  /** What the card says now, or null while it is hidden. */
  readonly current: Outcome | null;
}

export function outcomeCard(): OutcomeCard {
  const text = element('p', { className: 'outcome-text' });
  // Python that could not start needs the page loaded again.
  const reload = element('button', { id: 'reload', type: 'button', hidden: true });
  reload.addEventListener('click', () => location.reload());
  const raced = element('p', { id: 'outcome-race', className: 'card-race', hidden: true });
  const printedLabel = element('p', { className: 'printed-label' });
  const printedText = element('pre', { className: 'printed' });
  const printedBox = element('div', { hidden: true }, [printedLabel, printedText]);
  const node = element('section', { className: 'outcome', hidden: true }, [
    text,
    raced,
    printedBox,
    reload,
  ]);
  let lastPrinted = '';
  node.setAttribute('role', 'status');
  let current: Outcome | null = null;
  return {
    node,
    show(outcome, printed = lastPrinted, race = null) {
      current = outcome;
      lastPrinted = printed;
      text.replaceChildren(...withCode(outcomeText(outcome)));
      raced.textContent = race ?? '';
      raced.hidden = !race;
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
