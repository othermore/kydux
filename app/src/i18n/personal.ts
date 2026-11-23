// The words that follow the wizard (D37) and the friend (D77). A text for the
// player may hold a choice for the wizard, `{boy's words|girl's words}`, and the
// wizard's name, `{wizard}`; and a choice for the friend, the friend of the other
// gender who meets the wizard at the gate, `{{boy's words|girl's words}}`, and
// the friend's name, `{friend}`; and the dormitory mate's name, `{mate}`, the
// friend of the wizard's own gender (D84), whose words follow the wizard's
// choice; and the familiar's words, `{familiar}`, `{familiar_kind}` and the rest, with
// a choice by its kind's gender, `{familiar:el|la}` (D266). All are resolved here,
// from the wizard the child made and the familiar of the game; anything else in braces
// (a t() parameter, a Python set) is left as it is.

import type { FamiliarWords } from '../content/familiar';
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
/** A choice by the familiar's kind's gender (D266). Resolved before the wizard's. */
const FAMILIAR_CHOICE = /\{familiar:([^{}|\n]*)\|([^{}|\n]*)\}/g;
/** The familiar's placeholders (D266). */
const FAMILIAR = /\{(familiar(?:_[a-z_]+)?|mate_familiar|mate_var|mate_color|friend_familiar)\}/g;
const NAME = /\{wizard\}/g;
const FRIEND = /\{friend\}/g;
const MATE = /\{mate\}/g;

/** The text with its choices made and the names put in. With no wizard, the first
 * side of each wizard's choice, and `unnamed` for the name; `friendName` names the
 * friend the wizard has, and `mateName` its dormitory mate; `familiar` gives the
 * familiar's words, and with none its placeholders are left as they are. */
export function personal(
  text: string,
  wizard: Speaker | null,
  unnamed = '',
  friendName = '',
  mateName = '',
  familiar: FamiliarWords | null = null,
): string {
  if (!text.includes('{')) return text;
  const girl = wizard?.gender === 'girl';
  const friendGirl = friendOf(wizard).gender === 'girl';
  const name = wizard?.name ?? unnamed;
  const familiarGirl = familiar?.gender === 'f';
  return text
    .replace(FRIEND_CHOICE, (_whole, boy: string, girlWords: string) => (friendGirl ? girlWords : boy))
    .replace(FAMILIAR_CHOICE, (_whole, him: string, her: string) => (familiarGirl ? her : him))
    .replace(CHOICE, (_whole, boy: string, girlWords: string) => (girl ? girlWords : boy))
    .replace(NAME, () => name)
    .replace(FRIEND, () => friendName)
    .replace(MATE, () => mateName)
    // Last, so that nothing in the familiar's own class is read for a choice.
    .replace(FAMILIAR, (whole, key: string) => familiar?.values[key] ?? whole);
}
