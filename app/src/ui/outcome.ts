// What a run came to, said to the child: a card under the editor. An outcome
// is data; the card says it in the language of the moment. The card folds to its first
// words by a button at its corner, and the answer of another run comes unfolded (D363).

import { blockedText, toldText, toldWhole } from '../engine/words';
import { t } from '../i18n';
import type { ErrorInfo, Explanation } from '../runtime/protocol';
import { element } from './dom';
import { foldButton } from './fold';
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
) & {
  changed?: boolean;
  /** The game's advice for a run that did not win, said under the outcome's words
   * (D349): a find kept in no variable, a variable named by a word the level refuses. */
  advice?: Explanation;
};

/** An error explained by the world, in the child's words (D22); `own`, the level's own
 * words for what someone says (D264). */
export function explanationText(explanation: Explanation, own: Record<string, string> = {}): string {
  const p = explanation.params;
  const said = (() => {
    switch (explanation.kind) {
      case 'unknown_action':
        return t('error.unknown_action', p);
      case 'unknown_name':
        return t('error.unknown_name', p);
      // A first variable's mistakes, in the child's words (D349).
      case 'reveal_of_wizard_kept':
        return t('error.reveal_of_wizard_kept', p);
      case 'reveal_of_wizard':
        return t('error.reveal_of_wizard', p);
      case 'open_of_wizard':
        return t('error.open_of_wizard', p);
      case 'search_word_kept':
        return t('error.search_word_kept', p);
      case 'search_word':
        return t('error.search_word', p);
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
      case 'no_landing':
        return t('error.no_landing', p);
      case 'ring_rim':
        return t('error.ring_rim', p);
      case 'index_range':
        return t('error.index_range', p);
      case 'index_range_unknown':
        return t('error.index_range_unknown', p);
      case 'no_such_module':
        return t('error.no_such_module', p);
      // A class of the child's, its objects and its methods (D271).
      case 'missing_self':
        return p.name === '__init__' ? t('error.missing_self', p) : t('error.missing_self_method', p);
      case 'no_attribute':
        return t('error.no_attribute', p);
      case 'object_arguments':
        return /^[A-Z]/.test(String(p.name)) ? t('error.object_arguments', p) : t('error.method_arguments', p);
      case 'no_such_method':
        return t('error.no_such_method', p);
      // What the first year does not allow, in Orla's or the book's words (D261).
      case 'other_attribute':
      case 'other_method':
      case 'other_name':
      case 'go_to_not_yet':
      case 'not_a_familiar':
      case 'class_changed':
      case 'kind_kept':
      case 'name_letters':
      case 'name_long':
      case 'name_taken':
      case 'one_familiar':
      case 'two_familiars':
      case 'one_class':
      case 'too_soon':
        // Said in pieces on the scene, read whole on the card (D274).
        return toldWhole(toldText({ ...p, key: explanation.kind }, own));
      default:
        return t('error.other', p);
    }
  })();
  return 'suggestion' in p ? `${said} ${t('error.suggestion', p)}` : said;
}

/** The game's advice in the child's words (D349). */
export function adviceText(advice: Explanation): string {
  switch (advice.kind) {
    case 'found_not_kept':
      return t('error.found_not_kept', advice.params);
    case 'variable_not_own':
      return t('outcome.variable_not_own', advice.params);
    default:
      return '';
  }
}

/** What the card says: first, when the run's way is not the one on the screen before
 * it, the level's words for what is different this time, on a line of their own
 * (D204); last, on a line of its own, the game's advice (D349). */
export function outcomeText(outcome: Outcome, different?: string, own: Record<string, string> = {}): string {
  const said = outcomeWords(outcome, own);
  const advised = outcome.advice ? adviceText(outcome.advice) : '';
  const words = advised ? `${said}\n${advised}` : said;
  return outcome.changed && different ? `${different}\n${words}` : words;
}

function outcomeWords(outcome: Outcome, own: Record<string, string> = {}): string {
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
        const text = explanationText(explanation, own);
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

export interface OutcomeCard {
  node: HTMLElement;
  /** Says what the run came to, and what the child's code printed, if anything. Another
   * outcome than the one shown comes unfolded; the same one, drawn again in another
   * language, keeps its fold (D363). */
  show(outcome: Outcome, printed?: string): void;
  hide(): void;
  /** What the card says now, or null while it is hidden. */
  readonly current: Outcome | null;
  /** Whether the card is folded to its first words (D363). */
  readonly folded: boolean;
}

/** The card; `different` gives the level's words for what is different this time, in
 * the language of the moment (D204). */
export function outcomeCard(
  different: () => string | undefined = () => undefined,
  own: () => Record<string, string> = () => ({}),
): OutcomeCard {
  const text = element('p', { className: 'outcome-text' });
  // Python that could not start needs the page loaded again.
  const reload = element('button', { id: 'reload', type: 'button', hidden: true });
  reload.addEventListener('click', () => location.reload());
  const printedLabel = element('p', { className: 'printed-label' });
  const printedText = element('pre', { className: 'printed' });
  const printedBox = element('div', { className: 'outcome-printed', hidden: true }, [printedLabel, printedText]);
  // Folded, the card is its words on one line, cut with an ellipsis, and what the code
  // printed is not shown (D363).
  let folded = false;
  const fold = foldButton(
    'outcome-fold',
    { fold: () => t('level.answer_fold'), unfold: () => t('level.answer_unfold') },
    () => setFolded(!folded),
  );
  const node = element('section', { className: 'outcome', hidden: true }, [
    text,
    printedBox,
    reload,
    fold.node,
  ]);
  const setFolded = (to: boolean) => {
    folded = to;
    node.classList.toggle('folded', to);
    fold.show(to);
  };
  // A click on the folded card, anywhere on it, unfolds it; on the unfolded card only its
  // button folds it, so that its words can be selected.
  node.addEventListener('click', (event) => {
    if (folded && !(event.target instanceof Element && event.target.closest('.fold'))) setFolded(false);
  });
  let lastPrinted = '';
  node.setAttribute('role', 'status');
  let current: Outcome | null = null;
  return {
    node,
    show(outcome, printed = lastPrinted) {
      // Python that could not start does not fold: its button to load the page again
      // stays in sight.
      const foldable = outcome.kind !== 'failed';
      if (outcome !== current || !foldable) folded = false;
      current = outcome;
      lastPrinted = printed;
      text.replaceChildren(...withCode(outcomeText(outcome, different(), own())));
      printedLabel.textContent = t('outcome.printed');
      printedText.textContent = printed.replace(/\n$/, '');
      printedBox.hidden = printed === '';
      reload.textContent = t('level.reload');
      reload.hidden = outcome.kind !== 'failed';
      fold.node.hidden = !foldable;
      setFolded(folded);
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
    get folded() {
      return folded;
    },
  };
}
