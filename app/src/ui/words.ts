// A text of a level's with its code shown as code (D140): what stands between
// backquotes is a name to type or a piece of a program, as in the lessons' pages.

import { element } from './dom';

/** A text cut at its backquotes, each part with whether it is code. */
export function codeParts(said: string): { text: string; code: boolean }[] {
  return said
    .split('`')
    .map((text, index) => ({ text, code: index % 2 === 1 }))
    .filter((part) => part.text !== '');
}

/** The text with what is between backquotes as code: `move_right` is a name to type. */
export function withCode(said: string): (string | HTMLElement)[] {
  return codeParts(said).map((part) => (part.code ? element('code', {}, [part.text]) : part.text));
}
