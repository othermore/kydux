// The course: chapters of lessons and levels, in order (D32), read from
// content/course.json, which pack-world writes from content/chapters/. An item
// is `lesson:<id>` or `level:<id>`.

import type { Progress } from '../progress/store';

export interface Chapter {
  id: string;
  items: string[];
}

export interface Course {
  chapters: Chapter[];
  /** For each level of the course, every name taught by it and by the levels
   * before it (D40). */
  known?: Record<string, string[]>;
}

export type ItemKind = 'lesson' | 'level';
export type StopState = 'done' | 'open' | 'locked';

export function parseItem(item: string): { kind: ItemKind; id: string } | null {
  const match = /^(lesson|level):([a-z0-9][a-z0-9-]*)$/.exec(item);
  return match ? { kind: match[1] as ItemKind, id: match[2] ?? '' } : null;
}

/** The address that opens an item. */
export function itemHash(item: string): string {
  const parsed = parseItem(item);
  return parsed ? `#${parsed.kind}/${parsed.id}` : '#map';
}

export async function loadCourse(): Promise<Course> {
  const response = await fetch(`${import.meta.env.BASE_URL}content/course.json`);
  if (!response.ok || !response.headers.get('content-type')?.includes('json')) {
    return { chapters: [] };
  }
  const course = (await response.json()) as Course;
  return Array.isArray(course.chapters) ? course : { chapters: [] };
}

/** Every item of the course, in order. */
export function items(course: Course): string[] {
  return course.chapters.flatMap((chapter) => chapter.items);
}

/** The item after `item` in the course, or null after the last. */
export function next(course: Course, item: string): string | null {
  const all = items(course);
  const index = all.indexOf(item);
  return index >= 0 && index + 1 < all.length ? (all[index + 1] ?? null) : null;
}

/** What the child may use in a level: what the course has taught up to it, or,
 * for a level outside the course, the level's own `api`. */
export function knownApi(course: Course, levelId: string, own: readonly string[]): string[] {
  return course.known?.[levelId] ?? [...own];
}

export function previous(course: Course, item: string): string | null {
  const all = items(course);
  const index = all.indexOf(item);
  return index > 0 ? (all[index - 1] ?? null) : null;
}

/** Whether an item is done: a lesson read, a level won. */
export function isDone(item: string, progress: Progress): boolean {
  const parsed = parseItem(item);
  if (!parsed) return false;
  return parsed.kind === 'lesson'
    ? progress.lessons[parsed.id]?.read === true
    : progress.levels[parsed.id]?.won === true;
}

/** A stop's state on the map (D34): done; open, the first of the course or the one
 * after a done item; locked otherwise. */
export function stopState(course: Course, item: string, progress: Progress): StopState {
  if (isDone(item, progress)) return 'done';
  const before = previous(course, item);
  if (before === null || isDone(before, progress)) return 'open';
  return 'locked';
}
