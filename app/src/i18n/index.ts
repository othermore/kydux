// Every string the player sees comes from here. The languages are the files
// in i18n/ at the repository root: adding one is adding its file, with the
// same keys as the others (tools/i18n_check.py keeps them in step).

import { friendOf, personal, type Speaker } from './personal';

export type { Gender, Speaker } from './personal';
export { FRIENDS, friendOf } from './personal';

type Messages = { [key: string]: string | Messages };

const files = import.meta.glob<Messages>('../../../i18n/*.json', {
  eager: true,
  import: 'default',
});

const catalogs: Record<string, Messages> = Object.fromEntries(
  Object.entries(files).map(([path, messages]) => [
    path.replace(/^.*\/([^/]+)\.json$/, '$1'),
    messages,
  ]),
);

export type Language = string;

export const fallbackLanguage: Language = 'en';
export const languages: readonly Language[] = Object.keys(catalogs).sort();

const storageKey = 'kydux.language';
const warned = new Set<string>();
let current: Language = fallbackLanguage;
/** The wizard the words speak of (D37); null before the child has made one. */
let speaker: Speaker | null = null;

/** Tells the words which wizard they speak of. The page calls it on every screen. */
export function speakOf(wizard: Speaker | null): void {
  speaker = wizard;
}

/** A text with its choices made for the wizard and the friend, and their names
 * put in (D37, D77). */
export function forWizard(text: string): string {
  const unnamed =
    lookup(catalogs[current], 'wizard.no_name') ?? lookup(catalogs[fallbackLanguage], 'wizard.no_name');
  return personal(text, speaker, unnamed ?? '', friendName());
}

/** The friend the wizard has (D77): Nuri for a boy wizard, Teku for a girl. */
export function friendId(): string {
  return friendOf(speaker).id;
}

function friendName(): string {
  const key = `characters.${friendId()}`;
  return lookup(catalogs[current], key) ?? lookup(catalogs[fallbackLanguage], key) ?? '';
}

/** A character's name: `friend` is the friend the wizard has (D77). */
export function characterName(id: string): string {
  return t(`characters.${id === 'friend' ? friendId() : id}`);
}

/** What detection reads, so tests can give their own. */
export interface Environment {
  languages: readonly string[];
  storage: Pick<Storage, 'getItem' | 'setItem'> | null;
}

/** Where the language chosen is kept; the browser's localStorage unless the game
 * says otherwise (it keeps it in the progress document, D31). */
let keptIn: Environment['storage'] | undefined;

export function keepLanguageIn(storage: Environment['storage']): void {
  keptIn = storage;
}

function browserEnvironment(): Environment {
  let storage: Environment['storage'] = keptIn ?? null;
  if (keptIn === undefined) {
    try {
      storage = globalThis.localStorage ?? null;
    } catch {
      storage = null;
    }
  }
  const nav = globalThis.navigator;
  return { languages: nav?.languages ?? (nav?.language ? [nav.language] : []), storage };
}

/** The saved language, else the first of the browser's we have, else English. */
export function detectLanguage(env: Environment = browserEnvironment()): Language {
  let saved: string | null = null;
  try {
    saved = env.storage?.getItem(storageKey) ?? null;
  } catch {
    saved = null;
  }
  if (saved && languages.includes(saved)) return saved;
  for (const tag of env.languages) {
    const primary = tag.toLowerCase().split('-')[0] ?? '';
    if (languages.includes(primary)) return primary;
  }
  return fallbackLanguage;
}

export function currentLanguage(): Language {
  return current;
}

/** Changes the language, remembers it, and tells the page to render again. */
export function setLanguage(lang: Language, env: Environment = browserEnvironment()): void {
  if (!languages.includes(lang)) return;
  current = lang;
  try {
    env.storage?.setItem(storageKey, lang);
  } catch {
    // A browser that refuses storage keeps the language for this visit only.
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
    document.dispatchEvent(new CustomEvent('kydux:language', { detail: lang }));
  }
}

function lookup(messages: Messages | undefined, key: string): string | undefined {
  let node: string | Messages | undefined = messages;
  for (const part of key.split('.')) {
    if (node === undefined || typeof node === 'string') return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

/** The text for `key` in the current language, made for the wizard, with `{name}`
 * replaced from `params`. The wizard's words go in first, so that a parameter's
 * value, which may be the child's own text, is never read for a choice. */
export function t(key: string, params: Record<string, string | number> = {}): string {
  const text = lookup(catalogs[current], key) ?? lookup(catalogs[fallbackLanguage], key);
  if (text === undefined) {
    if (!warned.has(key)) {
      warned.add(key);
      console.warn(`i18n: no text for "${key}"`);
    }
    return key;
  }
  return forWizard(text).replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in params ? String(params[name]) : whole,
  );
}

/** Starts with the detected language; called once by the page. */
export function initLanguage(env: Environment = browserEnvironment()): Language {
  current = detectLanguage(env);
  if (typeof document !== 'undefined') document.documentElement.lang = current;
  return current;
}
