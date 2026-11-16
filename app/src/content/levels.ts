// Loading a level: what the world and the scene read (level.json), and its
// words in the player's language (text.<lang>.json), from content/levels/<id>/.

import { fallbackLanguage, forWizard, type Language } from '../i18n';
import type { LevelJson, CourseGiven } from '../runtime/protocol';
import type { ApiTable } from '../ui/notebook';

export interface LevelText {
  title: string;
  /** One for each of level.json's goals, in the same order. */
  goals: string[];
  starting_code: string;
  /** From the gentlest to the one that nearly says it; never the solution. */
  hints?: string[];
  /** What the level's speaker says on the start card, and on the win card (D45). */
  intro?: string;
  outro?: string;
  /** What the child now knows, said on the win card (D62). */
  learned?: string;
  /** What may differ at each run of a level with ways, in the child's words (D204). */
  changes?: string;
}

export interface LoadedLevel {
  id: string;
  level: LevelJson;
  text: LevelText;
  /** What the course gives it for the page (main.ts); none outside the course. */
  course?: CourseGiven;
}

export class LevelNotFound extends Error {
  constructor(readonly id: string) {
    super(`no level ${id}`);
  }
}

/** A level's id is its directory's name: letters, digits and hyphens. */
export function isLevelId(id: string): boolean {
  return /^[a-z0-9][a-z0-9-]*$/.test(id);
}

function levelUrl(id: string, file: string): string {
  return `${import.meta.env.BASE_URL}content/levels/${id}/${file}`;
}

async function json<T>(url: string): Promise<T | null> {
  const response = await fetch(url);
  // The servers answer a missing file with the page itself, so a level's file
  // is only what comes back as JSON.
  if (!response.ok || !response.headers.get('content-type')?.includes('json')) return null;
  return (await response.json()) as T;
}

async function source(url: string): Promise<string | null> {
  const response = await fetch(url);
  if (!response.ok || response.headers.get('content-type')?.includes('html')) return null;
  return response.text();
}

/** Every string of a level's text, the starting code too, made for the wizard (D37). */
function madeForWizard(text: LevelText): LevelText {
  return {
    ...text,
    title: forWizard(text.title),
    goals: text.goals.map(forWizard),
    starting_code: forWizard(text.starting_code),
    ...(text.hints ? { hints: text.hints.map(forWizard) } : {}),
    ...(text.intro !== undefined ? { intro: forWizard(text.intro) } : {}),
    ...(text.outro !== undefined ? { outro: forWizard(text.outro) } : {}),
    ...(text.learned !== undefined ? { learned: forWizard(text.learned) } : {}),
    ...(text.changes !== undefined ? { changes: forWizard(text.changes) } : {}),
  };
}

export async function loadLevelText(id: string, lang: Language): Promise<LevelText> {
  const text = await json<LevelText>(levelUrl(id, `text.${lang}.json`));
  if (text) return madeForWizard(text);
  console.warn(`level ${id}: no text in ${lang}, using ${fallbackLanguage}`);
  const fallback = await json<LevelText>(levelUrl(id, `text.${fallbackLanguage}.json`));
  if (!fallback) throw new LevelNotFound(id);
  return madeForWizard(fallback);
}

export async function loadLevel(id: string, lang: Language): Promise<LoadedLevel> {
  if (!isLevelId(id)) throw new LevelNotFound(id);
  const level = await json<LevelJson>(levelUrl(id, 'level.json'));
  if (!level) throw new LevelNotFound(id);
  // A level's own goals, in its goals.py, go to the world with the level.
  if (level.own_goals === true) {
    const goals = await source(levelUrl(id, 'goals.py'));
    if (goals === null) throw new Error(`level ${id}: own_goals, and no goals.py`);
    level.goals_source = goals;
  }
  return { id, level, text: await loadLevelText(id, lang) };
}

/** The table of what the child can type (api.json, written by pack-world from the world). */
export async function loadApiTable(): Promise<ApiTable> {
  const table = await json<ApiTable>(`${import.meta.env.BASE_URL}api.json`);
  return table ?? { roles: {}, thing_roles: [] };
}
