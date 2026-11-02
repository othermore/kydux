// The words that follow the wizard (D37) and the friend (D77). A text for the
// player may hold a choice for the wizard, `{boy's words|girl's words}`, and the
// wizard's name, `{wizard}`; and a choice for the friend, the friend of the other
// gender who meets the wizard at the gate, `{{boy's words|girl's words}}`, and
// the friend's name, `{friend}`; and the dormitory mate's name, `{mate}`, the
// friend of the wizard's own gender (D84), whose words follow the wizard's
// choice. All are resolved here, from the wizard the child made; anything else
// in braces (a t() parameter, a Python set) is left as it is.

import { dormitoryMate, FRIENDS, teacherFriend } from '../engine/looks';

export type Gender = 'girl' | 'boy';

/** What the words need of the wizard. */
export interface Speaker {
  name: string;
  gender: Gender;
}

export { FRIENDS };

/** The friend who meets the wizard at the gate: the other gender's. With no wizard
 * yet, the boy's words are taken for the wizard, so the friend is Nuri. */
export function friendOf(wizard: Pick<Speaker, 'gender'> | null): { id: string; gender: Gender } {
  return teacherFriend(wizard?.gender ?? null);
}

/** The dormitory mate: the friend of the wizard's own gender (D84). */
export function mateOf(wizard: Pick<Speaker, 'gender'> | null): { id: string; gender: Gender } {
  return dormitoryMate(wizard?.gender ?? null);
}

/** The friend's choice: two braces each side, one bar. Resolved before the wizard's. */
const FRIEND_CHOICE = /\{\{([^{}|\n]*)\|([^{}|\n]*)\}\}/g;
/** A choice: two sides, on one line, with no brace or bar inside either. */
const CHOICE = /\{([^{}|\n]*)\|([^{}|\n]*)\}/g;
const NAME = /\{wizard\}/g;
const FRIEND = /\{friend\}/g;
const MATE = /\{mate\}/g;

/** The text with its choices made and the names put in. With no wizard, the first
 * side of each wizard's choice, and `unnamed` for the name; `friendName` names the
 * friend the wizard has, and `mateName` its dormitory mate. */
export function personal(
  text: string,
  wizard: Speaker | null,
  unnamed = '',
  friendName = '',
  mateName = '',
): string {
  if (!text.includes('{')) return text;
  const girl = wizard?.gender === 'girl';
  const friendGirl = friendOf(wizard).gender === 'girl';
  const name = wizard?.name ?? unnamed;
  return text
    .replace(FRIEND_CHOICE, (_whole, boy: string, girlWords: string) => (friendGirl ? girlWords : boy))
    .replace(CHOICE, (_whole, boy: string, girlWords: string) => (girl ? girlWords : boy))
    .replace(NAME, () => name)
    .replace(FRIEND, () => friendName)
    .replace(MATE, () => mateName);
}
