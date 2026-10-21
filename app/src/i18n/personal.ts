// The words that follow the wizard (D37). A text for the player may hold a
// choice, `{boy's words|girl's words}`, and the wizard's name, `{wizard}`. Both
// are resolved here, from the wizard the child made; anything else in braces
// (a t() parameter, a Python set) is left as it is.

export type Gender = 'girl' | 'boy';

/** What the words need of the wizard. */
export interface Speaker {
  name: string;
  gender: Gender;
}

/** A choice: two sides, on one line, with no brace or bar inside either. */
const CHOICE = /\{([^{}|\n]*)\|([^{}|\n]*)\}/g;
const NAME = /\{wizard\}/g;

/** The text with its choices made and the name put in. With no wizard, the first
 * side of each choice, and `unnamed` for the name. */
export function personal(text: string, wizard: Speaker | null, unnamed = ''): string {
  if (!text.includes('{')) return text;
  const girl = wizard?.gender === 'girl';
  const name = wizard?.name ?? unnamed;
  return text
    .replace(CHOICE, (_whole, boy: string, girlWords: string) => (girl ? girlWords : boy))
    .replace(NAME, () => name);
}
