// A child's progress: one JSON document behind one interface (D31). The local
// store keeps it in the browser's localStorage; a remote one can come later
// behind the same interface. Nothing else in the game keeps progress anywhere.

import type { KeptFamiliar } from '../content/familiar';
import { isLook } from '../engine/looks';

/** The document's shape this version of the game writes. A document of another
 * version, or none, is read as the defaults. */
export const PROGRESS_VERSION = 1;

export interface Settings {
  speed: 1 | 2 | 4;
  /** The editor's text size, in pixels: one of FONT_SIZES. */
  fontSize: number;
  /** The scene's share of the level screen's width, from 0.35 to 0.75. */
  split: number;
  /** Whether the game's sounds play. */
  sound: boolean;
  /** How loud the music plays, from 0 (none) to 1 (D192). */
  music: number;
}

export interface LevelProgress {
  won?: boolean;
  /** The most stars a run of the level has earned. */
  stars?: number;
  /** A program an older saved game kept for the level: read, so that such a game
   * loads, and never shown, since a level opens on its starting code (D131). */
  code?: string;
  /** How many hints have been shown. */
  hints?: number;
  /** Whether the level has been played without winning, so hints are offered. */
  tried?: boolean;
  /** How many runs the child has started in the level, for the first-try star (D57). */
  runs?: number;
}

/** The wizard the child made (D36). `gender` chooses the words, nothing else;
 * `look` is the id of one of the looks the game offers. */
export interface Wizard {
  name: string;
  gender: 'girl' | 'boy';
  look: string;
}

export interface Progress {
  version: number;
  /** The language chosen, or null for the browser's. */
  language: string | null;
  /** Null until the child has made one. */
  wizard: Wizard | null;
  settings: Settings;
  lessons: Record<string, { read?: boolean }>;
  /** The stories read to their end (D56, D74). */
  stories: Record<string, { read?: boolean }>;
  /** Whether the screen's guide has been shown, done or skipped (D68). */
  guided: boolean;
  levels: Record<string, LevelProgress>;
  /** The item of the course last opened: `level:<id>` or `lesson:<id>`. */
  current: string | null;
  /** The familiar (D265): the draft of the last trial while none lives, and the one
   * that lives, for good; absent in a game with no familiar yet. */
  familiar?: KeptFamiliar;
}

/** The scene's share of the width, at least and at most (D35). */
export const SPLIT_MIN = 0.35;
export const SPLIT_MAX = 0.75;

/** The editor's text sizes offered, in pixels (D223). */
export const FONT_SIZES = [14, 16, 20, 24] as const;

export const DEFAULT_SETTINGS: Settings = {
  speed: 1,
  // A new child's editor is at 16, its letter Inconsolata (D238).
  fontSize: 16,
  split: 0.6,
  sound: true,
  music: 0.6,
};
/** The most stars a level gives; the map draws that many. */
export const MAX_STARS = 3;
/** An item of the course that can be the one last opened: a lesson, a level or a
 * story (D122). */
const ITEM = /^(lesson|level|story):[a-z0-9][a-z0-9-]*$/;

function isCount(value: unknown, most = Number.POSITIVE_INFINITY): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= most;
}

export function defaultProgress(): Progress {
  return {
    version: PROGRESS_VERSION,
    language: null,
    wizard: null,
    settings: { ...DEFAULT_SETTINGS },
    lessons: {},
    stories: {},
    guided: false,
    levels: {},
    current: null,
  };
}

/** The longest name a wizard may have, in characters. */
export const NAME_MAX = 20;
/** A name's characters: letters of any alphabet with their accents, digits,
 * spaces, hyphens and apostrophes. */
const NAME_CHARACTER = /^[\p{L}\p{M}\p{N} '’-]$/u;

/** Whether a character may be in a name. */
export function isNameCharacter(character: string): boolean {
  return NAME_CHARACTER.test(character);
}

/** A name as it is kept: trimmed, and null when it breaks the rule, `most`
 * characters at most. */
function keptName(value: unknown, most: number): string | null {
  if (typeof value !== 'string') return null;
  const name = value.trim();
  const characters = [...name];
  if (characters.length === 0 || characters.length > most) return null;
  return characters.every(isNameCharacter) ? name : null;
}

/** A wizard's name as it is kept: trimmed, and null when it breaks the rule. */
export function wizardName(value: unknown): string | null {
  return keptName(value, NAME_MAX);
}

/** The longest name a saved game may have, in characters (D290). */
export const GAME_NAME_MAX = 30;

/** A game's name as it is kept (D290): trimmed, of a wizard's name's characters, 30
 * at most, and null when it breaks the rule. */
export function gameName(value: unknown): string | null {
  return keptName(value, GAME_NAME_MAX);
}

/** Whether two names are the same game's: equal trimmed, without regard to case
 * (D290). */
export function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** The name a game takes from its wizard's (D291): the wizard's name when no name
 * `taken` is the same; else the wizard's name, a space and the first number from 2
 * that makes it free. */
export function automaticName(wizard: string, taken: Iterable<string>): string {
  const names = [...taken];
  const free = (name: string) => !names.some((other) => sameName(other, name));
  const name = wizard.trim();
  if (free(name)) return name;
  let number = 2;
  while (!free(`${name} ${number}`)) number += 1;
  return `${name} ${number}`;
}

/** A wizard read back, or null when any of its fields is not of its shape.
 * `isLook` says which looks the game has. */
export function readWizard(value: unknown, isLook: (id: string) => boolean = () => true): Wizard | null {
  if (!isObject(value)) return null;
  const name = wizardName(value.name);
  const { gender, look } = value;
  if (name === null || (gender !== 'girl' && gender !== 'boy')) return null;
  if (typeof look !== 'string' || !isLook(look)) return null;
  return { name, gender, look };
}

export interface ProgressStore {
  load(): Progress;
  save(progress: Progress): void;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A document read back: its known fields, each checked, the rest the defaults'.
 * Returns null for something that is not a progress document of this version. */
export function readProgress(value: unknown): Progress | null {
  if (!isObject(value) || value.version !== PROGRESS_VERSION) return null;
  const progress = defaultProgress();
  if (typeof value.language === 'string') progress.language = value.language;
  progress.wizard = readWizard(value.wizard, isLook);
  if (isObject(value.settings)) {
    const { speed, fontSize, codeFont, split, sound, music } = value.settings;
    if (typeof sound === 'boolean') progress.settings.sound = sound;
    if (typeof music === 'number' && music >= 0 && music <= 1) progress.settings.music = music;
    if (speed === 1 || speed === 2 || speed === 4) progress.settings.speed = speed;
    if ((FONT_SIZES as readonly unknown[]).includes(fontSize)) progress.settings.fontSize = fontSize as number;
    // A game kept while one of the other letters was tried under ?debug (D223) is read
    // with its editor at 16, the size of the one letter (D238); the field is not
    // written back, so the next read finds none.
    if (typeof codeFont === 'string' && codeFont.startsWith('noto-')) progress.settings.fontSize = 16;
    if (typeof split === 'number' && split >= SPLIT_MIN && split <= SPLIT_MAX) {
      progress.settings.split = split;
    }
  }
  for (const key of ['lessons', 'stories'] as const) {
    const read = value[key];
    if (!isObject(read)) continue;
    for (const [id, item] of Object.entries(read)) {
      if (isObject(item)) progress[key][id] = { read: item.read === true };
    }
  }
  if (isObject(value.levels)) {
    for (const [id, level] of Object.entries(value.levels)) {
      if (!isObject(level)) continue;
      const kept: LevelProgress = {};
      if (typeof level.won === 'boolean') kept.won = level.won;
      if (isCount(level.stars, MAX_STARS)) kept.stars = level.stars;
      if (typeof level.code === 'string') kept.code = level.code;
      if (isCount(level.hints)) kept.hints = level.hints;
      if (typeof level.tried === 'boolean') kept.tried = level.tried;
      if (isCount(level.runs)) kept.runs = level.runs;
      progress.levels[id] = kept;
    }
  }
  if (typeof value.current === 'string' && ITEM.test(value.current)) progress.current = value.current;
  progress.guided = value.guided === true;
  const familiar = readFamiliar(value.familiar);
  if (familiar) progress.familiar = familiar;
  return progress;
}

/** A word of the first year's familiars: a kind, a colour or a name, letters only. */
const FAMILIAR_WORD = /^\p{L}{1,24}$/u;

function familiarWord(value: unknown): value is string {
  return typeof value === 'string' && FAMILIAR_WORD.test(value);
}

/** The familiar kept read back (D265): a draft's kind, and its name and colour when
 * given, and a living familiar's kind, name, colour and classes, each of its shape; the
 * table's own check of kinds, colours and names is made where the game uses it
 * (content/familiar.ts, checkedFamiliar). Null for none. */
export function readFamiliar(value: unknown): KeptFamiliar | null {
  if (!isObject(value)) return null;
  const found: KeptFamiliar = {};
  const draft = value.draft;
  if (isObject(draft) && familiarWord(draft.kind)) {
    found.draft = { kind: draft.kind };
    if (familiarWord(draft.name)) found.draft.name = draft.name;
    if (familiarWord(draft.color)) found.draft.color = draft.color;
  }
  const living = value.living;
  if (
    isObject(living) &&
    familiarWord(living.kind) &&
    familiarWord(living.name) &&
    familiarWord(living.color) &&
    typeof living.source === 'string'
  ) {
    found.living = { kind: living.kind, name: living.name, color: living.color, source: living.source };
    if (typeof living.learned === 'string') found.living.learned = living.learned;
  }
  return found.draft || found.living ? found : null;
}

/** The store in the browser's localStorage. A storage that cannot be read or
 * written leaves the document in memory for the visit. */
export class LocalProgressStore implements ProgressStore {
  static readonly KEY = 'kydux.progress';
  private memory: Progress | null = null;

  constructor(private readonly storage: Pick<Storage, 'getItem' | 'setItem'> | null) {}

  load(): Progress {
    if (this.memory) return structuredClone(this.memory);
    let text: string | null = null;
    try {
      text = this.storage?.getItem(LocalProgressStore.KEY) ?? null;
    } catch {
      text = null;
    }
    let read: Progress | null = null;
    try {
      read = text ? readProgress(JSON.parse(text)) : null;
    } catch {
      read = null;
    }
    return read ?? defaultProgress();
  }

  save(progress: Progress): void {
    try {
      if (!this.storage) throw new Error('no storage');
      this.storage.setItem(LocalProgressStore.KEY, JSON.stringify(progress));
      this.memory = null;
    } catch {
      this.memory = structuredClone(progress);
    }
  }
}

/** The document as a file to keep: the JSON, pretty. */
export function exportProgress(progress: Progress): string {
  return `${JSON.stringify(progress, null, 2)}\n`;
}

/** A file given back. Throws when it is not a progress document of this version. */
export function importProgress(text: string): Progress {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('not JSON');
  }
  const progress = readProgress(value);
  if (!progress) throw new Error('not a progress document');
  return progress;
}
