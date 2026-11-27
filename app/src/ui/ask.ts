// A question the game asks in its own dialog, never the browser's (D351, D364): its
// words, Yes and No, in the game's language; No has the focus, and Escape is No. Nothing
// else of the page takes a click while it is open. The game asks three: Original, before
// it puts the starting code back over what the child wrote (D351); Delete, on the start
// screen, before a saved game is deleted; and a stop chosen on the map while the level's
// program runs, before the level is left, over the map's window (D364).

import { element } from './dom';

export interface Asked {
  node: HTMLElement;
  /** Closes it as No. */
  dismiss(): void;
}

/** Asks `question` over `parent`; `onAnswer` is told yes or no once, and the dialog goes. */
export function ask(
  parent: HTMLElement,
  words: { question: string; yes: string; no: string },
  onAnswer: (yes: boolean) => void,
): Asked {
  const yes = element('button', { id: 'ask-yes', type: 'button', className: 'quiet-button danger' }, [words.yes]);
  const no = element('button', { id: 'ask-no', type: 'button', className: 'big-button' }, [words.no]);
  const question = element('p', { id: 'ask-question', className: 'ask-question' }, [words.question]);
  const box = element('div', { className: 'ask-box' }, [question, element('div', { className: 'ask-buttons' }, [yes, no])]);
  box.setAttribute('role', 'alertdialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-labelledby', 'ask-question');
  const node = element('div', { id: 'ask', className: 'ask-overlay' }, [box]);
  const before = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  let answered = false;
  const answer = (said: boolean) => {
    if (answered) return;
    answered = true;
    document.removeEventListener('keydown', onKey, true);
    node.remove();
    before?.focus();
    onAnswer(said);
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      answer(false);
    } else if (event.key === 'Tab') {
      // The focus stays on the two buttons.
      event.preventDefault();
      (document.activeElement === yes ? no : yes).focus();
    }
  };
  yes.addEventListener('click', () => answer(true));
  no.addEventListener('click', () => answer(false));
  document.addEventListener('keydown', onKey, true);
  parent.append(node);
  no.focus();
  return { node, dismiss: () => answer(false) };
}
