// A text of a level's with its code shown as code (D140): what stands between
// backquotes is a name to type or a piece of a program, and what stands between
// asterisks a spell's word, in italics, as in the lessons' pages.

import { element } from './dom';

/** A text cut at its backquotes, each part with whether it is code. */
export function codeParts(said: string): { text: string; code: boolean }[] {
  return said
    .split('`')
    .map((text, index) => ({ text, code: index % 2 === 1 }))
    .filter((part) => part.text !== '');
}

/** A text cut at the asterisks round a word, each part with whether it is in italics;
 * an asterisk with no word closed after it stays as it is. */
export function italicParts(said: string): { text: string; italic: boolean }[] {
  return said
    .split(/\*([^*\s][^*]*)\*/)
    .map((text, index) => ({ text, italic: index % 2 === 1 }))
    .filter((part) => part.text !== '');
}

/** The text with what is between backquotes as code, `move_right` is a name to type,
 * and what is between asterisks in italics. */
export function withCode(said: string): (string | HTMLElement)[] {
  return codeParts(said).flatMap((part) =>
    part.code
      ? [element('code', {}, [part.text])]
      : italicParts(part.text).map((piece) => (piece.italic ? element('em', {}, [piece.text]) : piece.text)),
  );
}
