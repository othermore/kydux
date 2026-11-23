// The words the scene shows, in the child's language: why an action could not
// be done (D28). The engine asks here and nowhere else for i18n, so that the
// rest of it stays free of the player's language.

import { type FamiliarWords, wordsOf } from '../content/familiar';
import { characterName, colourWord, familiarSpoken, forFamiliar, kindWords, rawText, t } from '../i18n';

/** A thing's kind said with its article: "the door", "la puerta". Every kind the
 * world has is in i18n/<lang>.json as things.<kind>, which tools/i18n_check.py holds
 * to kydux_world.level.THING_KINDS. */
function thingWords(kind: string): string {
  return t(`things.${kind}`);
}

/** What a `blocked` event says besides its reason: the spell not known, or the
 * things in reach when the wizard must say which (D58). */
export interface BlockedDetail {
  spell?: string;
  things?: string[];
  /** The kind of a cell's terrain no one walks on, water or a hedge (D186). */
  kind?: string;
}

/** The terrains a walk is refused on that the wizard names (D186); any other is a low
 * cell, said as such. */
const LOW_KINDS = ['water', 'reeds', 'hedge', 'fence', 'bench', 'chest', 'stand', 'hay'];
/** The terrains a flight bumps on that the wizard names (D186). */
const HIGH_KINDS = ['tree', 'wall', 'shed', 'rock', 'pole', 'gate'];

/** Why the wizard bumped while flying (D186, D187): a ring flown into from its side,
 * or a tree's crown, a wall, a pole in the flight's way, by its kind. */
export function bumpText(by: string, kind: string | null): string {
  if (by === 'ring') return t('blocked.ring');
  return t(`blocked.high.${kind && HIGH_KINDS.includes(kind) ? kind : 'other'}`);
}

/** What the wizard thinks of a ring flown against its way (D219): the way it is
 * flown. */
export function ringWayText(way: string): string {
  return way === 'down' ? t('blocked.ring_way.down') : t('blocked.ring_way.up');
}

/** Why an action could not be done, from a `blocked` event's reason, its thing's
 * kind, and its detail. */
/** The wizard's thought while asleep, in the night (D124). */
export function sleepingText(): string {
  return t('level.sleeping');
}

/** A word of the debug view's panel and legend (debug.ts), for a tester. */
export function debugWord(key: string): string {
  return t(`debug.${key}`);
}

export function blockedText(reason: string, kind: string | null, detail: BlockedDetail = {}): string {
  const thing = kind ? thingWords(kind) : '';
  const spell = detail.spell ?? '';
  switch (reason) {
    case 'which_one': {
      const things = detail.things ?? [];
      return t('blocked.which_one', { things: things.join(', '), first: things[0] ?? '' });
    }
    case 'no_wand':
      return t('blocked.no_wand');
    case 'no_map':
      return t('blocked.no_map');
    case 'unknown_spell':
      return t('blocked.unknown_spell', { spell });
    case 'sealed':
      return t('blocked.sealed', { thing });
    case 'password':
      return t('blocked.password', { thing });
    case 'unheard':
      return t('blocked.unheard', { thing });
    case 'nothing_near':
      return t('blocked.nothing_near');
    case 'not_carried':
      return t('blocked.not_carried', { thing });
    case 'nobody':
      return t('blocked.nobody');
    case 'far':
      return t('blocked.far', { thing });
    case 'too_high':
      return t('blocked.too_high', { thing });
    case 'out_of_reach':
      return t('blocked.out_of_reach', { thing });
    case 'locked':
      return t('blocked.locked', { thing });
    case 'open':
      return t('blocked.open', { thing });
    case 'nothing':
      return t('blocked.nothing');
    case 'not_my_dormitory':
      return t('blocked.not_my_dormitory');
    case 'door_leaf':
      return t('blocked.door_leaf');
    case 'not_now_outside':
      return t('blocked.not_now_outside');
    case 'not_inside_yet':
      return t('blocked.not_inside_yet');
    case 'stay_by_the_brooms':
      return t('blocked.stay_by_the_brooms');
    case 'no_bed':
      return t('blocked.no_bed');
    case 'bed_taken':
      return t('blocked.bed_taken');
    case 'not_here':
      return t('blocked.not_here', { thing });
    case 'no_walk':
      return t(`blocked.no_walk.${detail.kind && LOW_KINDS.includes(detail.kind) ? detail.kind : 'low'}`);
    case 'too_far':
      return t('blocked.too_far', { thing });
    case 'no_broom':
      return t('blocked.no_broom');
    case 'no_knot':
      return t('blocked.no_knot');
    case 'no_landing':
      return t('blocked.no_landing');
    case 'ring_rim':
      return t('blocked.ring_rim');
    // A familiar called twice, or a second one with one living (D262, D265).
    case 'already_here':
      return t('blocked.already_here');
    case 'already_living':
      return t('blocked.already_living');
    // A familiar moved before minka calls it, and one that finds no way back (D262, D270).
    case 'not_called':
      return t('blocked.not_called');
    case 'no_way':
      return t('blocked.no_way');
    default:
      return t('blocked.unknown_action');
  }
}

/** Ilda's verdict of a race, from its `judged` event (D234): the ticks each racer took
 * to cross the finish, the wizard's penalty when it has one, and who has won, or that
 * it is a tie and the race is flown again; that the finish was not crossed when it was
 * not. */
export function raceVerdict(data: Record<string, unknown>): string {
  const name = characterName(String(data.racer));
  if (data.tick === null || data.tick === undefined) return t('race.judged_unfinished', { name });
  const penalty = Number(data.penalty);
  // What the wizard took is its count without the penalty: its lines and its flight.
  const said = { name, own: Number(data.tick) - penalty, theirs: Number(data.racer_tick), penalty };
  const tie = data.winner === null || data.winner === undefined;
  if (penalty === 0) {
    if (data.winner === 'wizard') return t('race.judged_wizard', said);
    return tie ? t('race.judged_tie', said) : t('race.judged_racer', said);
  }
  if (data.winner === 'wizard') return t('race.judged_penalty_wizard', said);
  if (tie) return t('race.judged_penalty_tie', said);
  // Slower even before the penalty, which is then one thing more and not the reason.
  return said.own > said.theirs ? t('race.judged_slower', said) : t('race.judged_penalty_racer', said);
}

/** The words someone says while the program runs (D264), from a `told` event: the
 * level's own (`own`, its text's `told` map) or the chapter's (`told.<key>`), made for
 * the wizard and for the familiar the event speaks of, its kind, name and colour, over
 * the game's own; `{name}` and `{line}` from the event. */
export function toldText(data: Record<string, unknown>, own: Record<string, string> = {}): string {
  const key = String(data.key);
  const raw = own[key] ?? rawText(`told.${key}`) ?? key;
  const game: FamiliarWords = familiarSpoken() ?? { values: {}, gender: 'm' };
  const words = wordsOf(game, { kind: data.kind, name: data.name, color: data.color }, kindWords, colourWord);
  const params: Record<string, string> = {};
  for (const name of ['name', 'line', 'color', 'kind']) {
    if (data[name] !== undefined && data[name] !== null) params[name] = String(data[name]);
  }
  return forFamiliar(raw, words).replace(/\{(\w+)\}/g, (whole, name: string) => params[name] ?? whole);
}

/** The pieces words said while the program runs are said in (D274): a blank line in the
 * text parts them, each a bubble of its own. */
export function toldPieces(text: string): string[] {
  const pieces = text
    .split(/\n\s*\n/)
    .map((piece) => piece.trim())
    .filter((piece) => piece !== '');
  return pieces.length > 0 ? pieces : [text];
}

/** Words said in pieces as one text (D274), for a card or the book's band: the pieces
 * with a space between them, and a sentence cut in two, `…` at the end of a piece and at
 * the start of the next, whole again. */
export function toldWhole(text: string): string {
  return toldPieces(text)
    .reduce((whole, piece) => (whole.endsWith('…') && piece.startsWith('…') ? `${whole.slice(0, -1)} ${piece.slice(1).trimStart()}` : `${whole} ${piece}`));
}

/** What the book's band says (D267): the line that conjures the trial, tried by the book
 * or written in it by Orla; that the child's class cannot make the familiar; the colours
 * of a kind, as the strings to write; or the line Orla's order runs, with no words of
 * its own, the order being what she says. */
export function bookText(data: Record<string, unknown>, order = false): { words: string; code: string; look: string } {
  if (order) return { words: '', code: String(data.line ?? ''), look: 'order' };
  if (Array.isArray(data.colors)) {
    const kind = typeof data.kind === 'string' ? kindWords(data.kind).a_kind : '';
    return {
      words: t('book.colours', { kind }),
      code: data.colors.map((colour) => `"${String(colour)}"`).join('  '),
      look: 'colours',
    };
  }
  if (data.ok !== true) return { words: t('book.cannot'), code: String(data.line ?? ''), look: 'cannot' };
  return data.ink === true
    ? { words: t('book.written'), code: String(data.line ?? ''), look: 'written' }
    : { words: t('book.line'), code: String(data.line ?? ''), look: 'line' };
}

/** Who stands in the wizard's way: a friend, by the name the story gives them (D66, D77). */
export function friendText(id: string): string {
  return t('blocked.friend', { name: characterName(id) });
}
