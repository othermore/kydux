// The course: chapters of stories, lessons and levels, in order (D32, D56, D74),
// read from content/course.json, which pack-world writes from content/chapters/.
// An item is `story:<id>`, `lesson:<id>` or `level:<id>`.

import type { Progress } from '../progress/store';
import { contentUrl } from './address';

export interface Chapter {
  id: string;
  items: string[];
  /** The chapter's theme, content/music/<id>.json (D192). */
  music?: string;
}

/** An item's kind, its number within its chapter and kind (D56), and its chapter's
 * number (D78): Chapter 1 · Lesson 3. */
export interface ItemNumber {
  kind: string;
  n: number;
  chapter?: number;
}

export interface Course {
  chapters: Chapter[];
  /** The number of each lesson and level; a story has none. */
  numbers?: Record<string, ItemNumber>;
  /** For each level, the concepts the lessons before it taught (D60). */
  concepts?: Record<string, string[]>;
  /** For each level of the course, every name taught by it and by the levels
   * before it (D40). */
  known?: Record<string, string[]>;
  /** For each level of the course, every spell and every word (password) named by
   * it and by the levels before it (D80). */
  spells_known?: Record<string, string[]>;
  words_known?: Record<string, string[]>;
  /** The themes in content/music/, by id, for the page that plays any of them (D192). */
  themes?: string[];
  /** Each item's title, and each chapter's as `chapter:<id>`, by language (12.6). */
  titles?: Record<string, Record<string, string>>;
  /** The game's opening, chapter 1's first story, before the creator (D61, D78). */
  opening?: string | null;
  /** The scene each level and each story is played on, by item, so that the page knows
   * a screen's scene before it fetches it (D221); a story's first. */
  scenes?: Record<string, string>;
  /** The theme each story that names its own opens to, by item (D314), so that the page
   * plays it before it fetches the story. */
  music?: Record<string, string>;
}

export type ItemKind = 'story' | 'lesson' | 'level';
export type StopState = 'done' | 'open' | 'locked';

export function parseItem(item: string): { kind: ItemKind; id: string } | null {
  const match = /^(story|lesson|level):([a-z0-9][a-z0-9-]*)$/.exec(item);
  return match ? { kind: match[1] as ItemKind, id: match[2] ?? '' } : null;
}

/** The theme of the chapter that holds `item` (D192), or the first chapter's when no
 * chapter holds it or names a theme: what the map, the start screen, a lesson and a level
 * play. */
export function chapterThemeOf(course: Course, item: string | null | undefined): string | undefined {
  const chapter = item ? course.chapters.find((one) => one.items.includes(item)) : undefined;
  return chapter?.music ?? course.chapters[0]?.music;
}

/** The theme an item opens to: a story's own where it names one (D314), else its
 * chapter's. */
export function themeOf(course: Course, item: string | null | undefined): string | undefined {
  return (item ? course.music?.[item] : undefined) ?? chapterThemeOf(course, item);
}

/** The address that opens an item. */
export function itemHash(item: string): string {
  const parsed = parseItem(item);
  return parsed ? `#${parsed.kind}/${parsed.id}` : '#map';
}

async function fetchCourse(): Promise<Course> {
  const response = await fetch(contentUrl('course.json'));
  if (!response.ok || !response.headers.get('content-type')?.includes('json')) {
    return { chapters: [] };
  }
  const course = (await response.json()) as Course;
  return Array.isArray(course.chapters) ? course : { chapters: [] };
}

/** The course file on its way: those who ask for it meanwhile share the one request. */
let fetching: Promise<Course> | null = null;

/** The course file, fetched once for all who ask at the same moment (D341). */
export function loadCourse(): Promise<Course> {
  fetching ??= fetchCourse().finally(() => {
    fetching = null;
  });
  return fetching;
}

/** Every item of the course, in order. */
export function items(course: Course): string[] {
  return course.chapters.flatMap((chapter) => chapter.items);
}

/** Where the course starts for a child who has made a wizard: its first item that is
 * not the opening (D78). */
export function courseStart(course: Course): string {
  return items(course).find((item) => item !== course.opening) ?? '';
}

/** The item after `item` in the course, or null after the last. */
export function next(course: Course, item: string): string | null {
  const all = items(course);
  const index = all.indexOf(item);
  return index >= 0 && index + 1 < all.length ? (all[index + 1] ?? null) : null;
}

/** The level a lesson's code runs in: the first level after it in the course, past any
 * lesson between them, or null (D142). */
export function levelAfter(course: Course, item: string): string | null {
  const all = items(course);
  const index = all.indexOf(item);
  if (index < 0) return null;
  const later = all.slice(index + 1).find((other) => parseItem(other)?.kind === 'level');
  return later ? (parseItem(later)?.id ?? null) : null;
}

/** What the child may use in a level: what the course has taught up to it, or,
 * for a level outside the course, the level's own `api`. */
export function knownApi(course: Course, levelId: string, own: readonly string[]): string[] {
  return course.known?.[levelId] ?? [...own];
}

/** The spells a level may cast, and the words the child has been given, up to it
 * (D80): what the course has named up to here, or, for a level outside the course,
 * the level's own. */
export function knownSpells(course: Course, levelId: string, own: readonly string[]): string[] {
  return course.spells_known?.[levelId] ?? [...own];
}

export function knownWords(course: Course, levelId: string, own: readonly string[]): string[] {
  return course.words_known?.[levelId] ?? [...own];
}

export function previous(course: Course, item: string): string | null {
  const all = items(course);
  const index = all.indexOf(item);
  return index > 0 ? (all[index - 1] ?? null) : null;
}

/** Whether an item is done: a story or a lesson read, a level won; the opening is
 * behind a child who has made a wizard, read or not (D78). */
export function isDone(item: string, progress: Progress, course?: Course): boolean {
  const parsed = parseItem(item);
  if (!parsed) return false;
  if (course?.opening === item && progress.wizard !== null) return true;
  switch (parsed.kind) {
    case 'story':
      return progress.stories[parsed.id]?.read === true;
    case 'lesson':
      return progress.lessons[parsed.id]?.read === true;
    case 'level':
      return progress.levels[parsed.id]?.won === true;
  }
}

/** The first level whose editor has the lists of what the program has and what is to
 * find over it (D346). */
export const LISTS_FROM = 'level:the-reading-room';

/** Whether a level's editor has the two lists over it (D346): every level from the
 * reading room on in the course, none before it. */
export function showsLists(course: Course, levelId: string): boolean {
  const all = items(course);
  const from = all.indexOf(LISTS_FROM);
  const at = all.indexOf(`level:${levelId}`);
  return from >= 0 && at >= from;
}

/** The concepts known on reaching a level (D60). */
export function conceptsAt(course: Course, levelId: string): string[] {
  return course.concepts?.[levelId] ?? [];
}

/** A stop's state on the map (D34): done; open, the first of the course, the one after
 * a done item, or one with a done item after it, so that a stop the course has put in
 * before the child's place is open and nothing reached closes (D356); locked otherwise. */
export function stopState(course: Course, item: string, progress: Progress): StopState {
  if (isDone(item, progress, course)) return 'done';
  const before = previous(course, item);
  if (before === null || isDone(before, progress, course)) return 'open';
  const all = items(course);
  if (all.slice(all.indexOf(item) + 1).some((later) => isDone(later, progress, course))) return 'open';
  return 'locked';
}

/** Where the game goes on (D356): the item last opened when it is a stop of the course
 * that is not locked, and never the opening (D78); else the first stop of the course not
 * done, as for an item the course no longer has; the course's start when every stop is
 * done. */
export function goOnAt(course: Course, progress: Progress): string {
  const all = items(course);
  const current = progress.current;
  if (current && current !== course.opening && all.includes(current) && stopState(course, current, progress) !== 'locked') {
    return current;
  }
  return all.find((item) => item !== course.opening && !isDone(item, progress, course)) ?? courseStart(course);
}

/** How a chapter stands on the map (D200): finished, every stop done; locked, its first
 * stop locked; the current one, the last neither finished nor locked, the chapter the
 * child has reached when the course has put stops in before it (D356), or the last not
 * locked when every reached one is finished. */
export interface ChapterStanding {
  id: string;
  finished: boolean;
  locked: boolean;
  current: boolean;
  /** Its levels' stars and the most they could hold, for a finished chapter's line. */
  stars: number;
  starsMost: number;
}

export function chapterStandings(course: Course, progress: Progress, maxStars: number): ChapterStanding[] {
  const standings = course.chapters.map((chapter) => {
    const levels = chapter.items
      .map(parseItem)
      .filter((parsed): parsed is { kind: ItemKind; id: string } => parsed?.kind === 'level');
    const first = chapter.items[0];
    return {
      id: chapter.id,
      finished: chapter.items.length > 0 && chapter.items.every((item) => isDone(item, progress, course)),
      locked: first !== undefined && stopState(course, first, progress) === 'locked',
      current: false,
      stars: levels.reduce((sum, level) => sum + (progress.levels[level.id]?.stars ?? 0), 0),
      starsMost: levels.length * maxStars,
    };
  });
  const current =
    standings.filter((standing) => !standing.finished && !standing.locked).at(-1) ??
    standings.filter((standing) => !standing.locked).at(-1);
  if (current) current.current = true;
  return standings;
}
