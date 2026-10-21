// Loading a level: what the world and the scene read (level.json), and its
// words in the player's language (text.<lang>.json), from content/levels/<id>/.

import { fallbackLanguage, type Language } from '../i18n';
import type { LevelJson } from '../runtime/protocol';

export interface LevelText {
  title: string;
  /** One for each of level.json's goals, in the same order. */
  goals: string[];
  starting_code: string;
  /** From the gentlest to the one that nearly says it; never the solution. */
  hints?: string[];
}

export interface LoadedLevel {
  id: string;
  level: LevelJson;
  text: LevelText;
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

export async function loadLevelText(id: string, lang: Language): Promise<LevelText> {
  const text = await json<LevelText>(levelUrl(id, `text.${lang}.json`));
  if (text) return text;
  console.warn(`level ${id}: no text in ${lang}, using ${fallbackLanguage}`);
  const fallback = await json<LevelText>(levelUrl(id, `text.${fallbackLanguage}.json`));
  if (!fallback) throw new LevelNotFound(id);
  return fallback;
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

/** The levels in the order they are played (content/levels.json, written by pack-world). */
export async function loadLevelOrder(): Promise<string[]> {
  const order = await json<string[]>(`${import.meta.env.BASE_URL}content/levels.json`);
  return Array.isArray(order) ? order : [];
}

/** The level after `id` in `order`, or null when it is the last or not there. */
export function nextLevel(order: readonly string[], id: string): string | null {
  const index = order.indexOf(id);
  return index >= 0 && index + 1 < order.length ? (order[index + 1] ?? null) : null;
}
