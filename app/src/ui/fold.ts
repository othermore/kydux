// A box's fold (D363): the button at the top right corner of the hints' box and of the
// answer, which folds the box to one line and unfolds it. Its picture is a chevron that
// points down while the box is unfolded, turned by the style to point right while it is
// folded; its label and its title say what a press does, in the language of the moment.
// Nothing folds by itself: the fold is the child's.

import { element } from './dom';
import { foldIcon } from './icons';

export interface Fold {
  node: HTMLButtonElement;
  /** Says the box folded or unfolded, in the language of the moment. */
  show(folded: boolean): void;
}

/** The button `id`; `words` say what folding and unfolding do, and a press calls
 * `onPress`. */
export function foldButton(
  id: string,
  words: { fold: () => string; unfold: () => string },
  onPress: () => void,
): Fold {
  const node = element('button', { id, type: 'button', className: 'fold' }, [foldIcon()]);
  node.addEventListener('click', onPress);
  return {
    node,
    show(folded) {
      const said = folded ? words.unfold() : words.fold();
      node.setAttribute('aria-expanded', String(!folded));
      node.setAttribute('aria-label', said);
      node.title = said;
    },
  };
}
