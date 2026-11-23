// The familiar of the game (D260, D265, D266): the first year's table, read from
// familiars.json, which scripts/pack-world.mjs writes from kydux_world/familiars.py;
// the rules the page and the world share (a name's check, the room-mate's colour, the
// friends' names), held to the same cases as the world's tests
// (world/tests/familiar_cases.json); what the game keeps of its familiar, written into
// a level before the world reads it; and the words a text says of it.

import type { LevelJson, WorldResult } from '../runtime/protocol';

/** The first year's table (familiars.py's `table()`). */
export interface FamiliarTable {
  kinds: Record<string, string[]>;
  kept: Record<string, string>;
  sheets: Record<string, string[]>;
  height: number;
  friend: { kind: string; name: string; color: string };
  mate_name: string;
  alternates: Record<string, string>;
  default: { kind: string; name: string; color: string };
  longest: number;
  reserved: string[];
  methods: string[];
  /** Python's keywords and builtins' names, in small letters, as Python has them. */
  python: string[];
}

/** A familiar as it is described: its kind, and its name and colour when given. */
export interface Described {
  kind: string;
  name?: string;
  color?: string;
}

/** The familiar that lives, kept for good (D265): its kind, name and colour, the class
 * it was born of, and the class with what it learned after. */
export interface Living {
  kind: string;
  name: string;
  color: string;
  source: string;
  learned?: string;
}

/** What the game keeps of its familiar: the draft of the last trial while none lives,
 * and the familiar once one does. */
export interface KeptFamiliar {
  draft?: Described;
  living?: Living;
}

/** Why the book does not take a familiar's name, or null (D261): letters only, at most
 * the table's longest, and, in small letters, no word of Python's and no name of the
 * game's. */
export function nameProblem(name: unknown, table: FamiliarTable): string | null {
  if (typeof name !== 'string' || name.length === 0 || !/^\p{L}+$/u.test(name)) return 'name_letters';
  if ([...name].length > table.longest) return 'name_long';
  const low = name.toLowerCase();
  if (table.python.includes(low) || table.reserved.includes(low)) return 'name_taken';
  return null;
}

/** The room-mate's copy's colour (D266): the kind's first colour that is not the
 * child's; null for a kind no first-year describes. */
export function mateColour(kind: string, color: string | null | undefined, table: FamiliarTable): string | null {
  const colours = table.kinds[kind];
  if (!colours) return null;
  return colours.find((colour) => colour !== color) ?? colours[0] ?? null;
}

/** The friend's and the room-mate's familiars' names beside the child's (D266). */
export function friendsNames(name: unknown, table: FamiliarTable): { friend: string; mate: string } {
  const low = typeof name === 'string' ? name.toLowerCase() : '';
  const friend = table.friend.name;
  const mate = table.mate_name;
  return {
    friend: low === friend.toLowerCase() ? (table.alternates[friend] ?? friend) : friend,
    mate: low === mate.toLowerCase() ? (table.alternates[mate] ?? mate) : mate,
  };
}

/** The sheet a creature of a kind and a colour is drawn from (D273). */
export function sheetOf(kind: string, color: string): string {
  return `familiar-${kind.toLowerCase()}-${color}`;
}

/** The kind's first sheet, which a trial with no colour is drawn from (D263). */
export function firstSheet(kind: string, table: FamiliarTable | null): string | null {
  const colour = table?.sheets[kind]?.[0];
  return colour ? sheetOf(kind, colour) : null;
}

/** A familiar described, with what the table lacks taken from the default: a kind of
 * the table, its name, and one of its kind's colours. */
export function filledIn(described: Described | undefined, table: FamiliarTable): Required<Described> {
  const fallback = table.default;
  const kind = described && table.kinds[described.kind] ? described.kind : fallback.kind;
  const colours = table.kinds[kind] ?? [];
  const color =
    described?.color && colours.includes(described.color) ? described.color : kind === fallback.kind ? fallback.color : (colours[0] ?? fallback.color);
  const name = described?.name && nameProblem(described.name, table) === null ? described.name : fallback.name;
  return { kind, name, color };
}

/** A kept familiar checked against the table (D265): a kind and a colour of the table, a
 * name the book takes, its classes as text; anything else is dropped, as a game with no
 * familiar yet. */
export function checkedFamiliar(kept: KeptFamiliar | null | undefined, table: FamiliarTable): KeptFamiliar {
  const found: KeptFamiliar = {};
  const living = kept?.living;
  if (
    living &&
    table.kinds[living.kind]?.includes(living.color) &&
    nameProblem(living.name, table) === null &&
    typeof living.source === 'string'
  ) {
    found.living = { ...living };
    if (typeof living.learned !== 'string') delete found.living.learned;
  }
  const draft = kept?.draft;
  if (draft && table.kinds[draft.kind]) {
    found.draft = { kind: draft.kind };
    if (draft.name && nameProblem(draft.name, table) === null) found.draft.name = draft.name;
    if (draft.color && table.kinds[draft.kind]?.includes(draft.color)) found.draft.color = draft.color;
  }
  return found;
}

/** The class a draft is written as, for a lesson that shows the child's description
 * before any is kept: level 7's solution's, with the draft's kind (D266). */
export function draftSource(kind: string): string {
  return [
    `class ${kind}(Familiar):`,
    '    def __init__(self, name, color):',
    '        self.name = name',
    '        self.color = color',
  ].join('\n');
}

/** The familiar's block of a level (D260), as the page reads and writes it. */
interface Block {
  stage?: string;
  from?: string;
  draft?: Described;
  living?: Record<string, unknown>;
  practice?: boolean;
}

/** The level's familiar block, or null. */
export function blockOf(level: LevelJson): Block | null {
  const block = level.familiar;
  return typeof block === 'object' && block !== null ? (block as Block) : null;
}

/** The game's draft and familiar written into the level's block before the world reads
 * it (D265): the draft over the level's own, and, once one lives, the living familiar
 * with the class the block's `from` names, kept where it stands. A level where the
 * familiar is described with one living already is practice (`practice`). */
export function writeIntoLevel(level: LevelJson, kept: KeptFamiliar): void {
  const block = blockOf(level);
  if (!block) return;
  if (kept.draft) block.draft = { ...kept.draft };
  const living = kept.living;
  if (!living) return;
  const own = block.living ?? {};
  block.living = {
    ...own,
    kind: living.kind,
    name: living.name,
    color: living.color,
    source: living.source,
    ...(living.learned !== undefined ? { learned: living.learned } : {}),
  };
  // Described again with a familiar alive: practice, which keeps nothing (D265).
  if (block.stage !== 'living') block.practice = true;
}

/** Whether a level is played as practice: described again with a familiar living. */
export function isPractice(level: LevelJson): boolean {
  return blockOf(level)?.practice === true;
}

/** What a run that is won keeps (D265): the draft from the trial of a describing level
 * while no familiar lives; the familiar for good when it is born, with its class as
 * written; what it learned, when the living familiar's class took a method. Null
 * where the run keeps nothing. */
export function keptAfter(
  level: LevelJson,
  result: Pick<WorldResult, 'status' | 'familiar'>,
  kept: KeptFamiliar,
): KeptFamiliar | null {
  const block = blockOf(level);
  const found = result.familiar;
  if (!block || !found || result.status !== 'won' || block.practice) return null;
  const trial = found.trial;
  if (block.stage === 'birth' && found.born && trial?.name && trial.color && found.source && !kept.living) {
    return { living: { kind: trial.kind, name: trial.name, color: trial.color, source: found.source } };
  }
  if (block.stage === 'living' && found.learned && kept.living) {
    return { ...kept, living: { ...kept.living, learned: found.learned } };
  }
  // A describing level keeps its trial as the draft (levels 3, 5 and 7); the slate is
  // the room-mate's, and keeps nothing (D265).
  if (block.stage === 'trial' && trial && !kept.living && level.kind !== 'fix') {
    const draft: Described = { kind: trial.kind };
    if (trial.name) draft.name = trial.name;
    if (trial.color) draft.color = trial.color;
    return { ...kept, draft };
  }
  return null;
}

/** A level's solution, written with the table's default familiar, made the game's own
 * for the tester's *Escribir la solución* (D265, D266): the kind, the name, its name in
 * the program and the colour of the game's familiar, else of its draft, and the
 * room-mate's copy as the slate writes it. A game with no familiar keeps it as it is. */
export function withFamiliar(code: string, kept: KeptFamiliar, table: FamiliarTable): string {
  const given = kept.living ?? kept.draft;
  if (!given) return code;
  const own = filledIn(given, table);
  const fallback = table.default;
  const others = friendsNames(own.name, table);
  const theirs = friendsNames(fallback.name, table);
  const word = (text: string) => new RegExp(`\\b${text}\\b`, 'g');
  // The room-mate's copy is set aside first, so that the child's names and colour never
  // write over it, nor it over them.
  const mateData = '\u0000mate-data\u0000';
  const mateVar = '\u0000mate-var\u0000';
  return code
    .replaceAll(`"${theirs.mate}", "${mateColour(fallback.kind, fallback.color, table) ?? ''}"`, mateData)
    .replace(word(theirs.mate.toLowerCase()), mateVar)
    .replace(word(fallback.kind), own.kind)
    .replaceAll(`"${fallback.name}"`, `"${own.name}"`)
    .replace(word(fallback.name.toLowerCase()), own.name.toLowerCase())
    .replaceAll(`"${fallback.color}"`, `"${own.color}"`)
    .replaceAll(mateData, `"${others.mate}", "${mateColour(own.kind, own.color, table) ?? ''}"`)
    .replaceAll(mateVar, others.mate.toLowerCase());
}

/** The words of i18n's `familiars`, for a kind and a colour (D266). */
export interface KindWords {
  /** The kind in a word, `zorro`; with its article, `un zorro`; its gender, `m` or `f`. */
  kind: string;
  a_kind: string;
  gender: 'm' | 'f';
}

/** What a text says of the familiar (D266): every placeholder's value, and the gender a
 * choice `{familiar:el|la}` takes. */
export interface FamiliarWords {
  values: Record<string, string>;
  gender: 'm' | 'f';
}

/** The familiar's placeholders from the game's familiar, else its draft, else the
 * level's defaults: `kindWords` gives a kind's words and `colourWord` a colour's for a
 * gender, from i18n. */
export function familiarWords(
  kept: KeptFamiliar,
  table: FamiliarTable,
  kindWords: (kind: string) => KindWords,
  colourWord: (color: string, gender: 'm' | 'f') => string,
  levelDraft?: Described,
): FamiliarWords {
  const living = kept.living;
  const described = filledIn(living ?? kept.draft ?? levelDraft, table);
  const words = kindWords(described.kind);
  const others = friendsNames(described.name, table);
  const mate = mateColour(described.kind, described.color, table) ?? '';
  const source = living ? (living.learned ?? living.source) : draftSource(described.kind);
  return {
    gender: words.gender,
    values: {
      familiar: described.name,
      familiar_var: described.name.toLowerCase(),
      familiar_class: described.kind,
      familiar_color: described.color,
      familiar_kind: words.kind,
      familiar_a_kind: words.a_kind,
      familiar_color_word: colourWord(described.color, words.gender),
      familiar_source: source.replace(/\n+$/, ''),
      mate_familiar: others.mate,
      mate_var: others.mate.toLowerCase(),
      mate_color: mate,
      friend_familiar: others.friend,
    },
  };
}

/** The words of a familiar that is not the game's (D264): a trial whose kind, name and
 * colour an event gives, over the game's own words. */
export function wordsOf(
  over: FamiliarWords,
  given: { kind?: unknown; name?: unknown; color?: unknown },
  kindWords: (kind: string) => KindWords,
  colourWord: (color: string, gender: 'm' | 'f') => string,
): FamiliarWords {
  const values = { ...over.values };
  let gender = over.gender;
  if (typeof given.kind === 'string') {
    const words = kindWords(given.kind);
    gender = words.gender;
    values.familiar_class = given.kind;
    values.familiar_kind = words.kind;
    values.familiar_a_kind = words.a_kind;
  }
  if (typeof given.name === 'string') {
    values.familiar = given.name;
    values.familiar_var = given.name.toLowerCase();
  }
  if (typeof given.color === 'string') {
    values.familiar_color = given.color;
    values.familiar_color_word = colourWord(given.color, gender);
  }
  return { values, gender };
}

let loaded: Promise<FamiliarTable | null> | null = null;
let table: FamiliarTable | null = null;

/** The first year's table, fetched once (familiars.json); null where it is not there. */
export function loadFamiliars(base = import.meta.env.BASE_URL): Promise<FamiliarTable | null> {
  loaded ??= fetch(`${base}familiars.json`)
    .then(async (response) =>
      response.ok && response.headers.get('content-type')?.includes('json') ? ((await response.json()) as FamiliarTable) : null,
    )
    .catch(() => null)
    .then((found) => {
      table = found;
      return found;
    });
  return loaded;
}

/** The table once loaded, or null. */
export function familiarTable(): FamiliarTable | null {
  return table;
}

/** For tests: the table as given. */
export function useFamiliarTable(given: FamiliarTable | null): void {
  table = given;
  loaded = Promise.resolve(given);
}
