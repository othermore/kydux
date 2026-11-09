// Loading a lesson: lesson.json and its Markdown in the player's language, from
// content/lessons/<id>/ (D33, D56). Pages are separated by a line of `---`; a
// fenced block marked `python try`, on any page, is code the child runs and changes
// on the page itself (D142); the one on the last page is the lesson's example: the
// level after it starts with its own program, never with it (D63).

import { fallbackLanguage, forWizard, type Language } from '../i18n';

export interface Lesson {
  id: string;
  /** The names the lesson explains, which the level after it teaches. */
  teaches: string[];
  title: string;
  /** Each page's Markdown. */
  pages: string[];
  /** The last page's block, the example, or null when the lesson has none. */
  tryCode: string | null;
  /** Who teaches the lesson: a character of story.md (D67). */
  speaker?: string;
}

export class LessonNotFound extends Error {
  constructor(readonly id: string) {
    super(`no lesson ${id}`);
  }
}

const TRY_BLOCK = /```python try\n([\s\S]*?)```/;

/** A lesson's Markdown taken apart: its title, its pages, the last page's block. */
export function readLesson(markdown: string): Pick<Lesson, 'title' | 'pages' | 'tryCode'> {
  const pages = markdown
    .split(/^---$/m)
    .map((page) => page.trim())
    .filter((page) => page !== '');
  const tried = TRY_BLOCK.exec(pages[pages.length - 1] ?? '');
  const tryCode = tried ? (tried[1] ?? '') : null;
  const title = /^#\s+(.+)$/m.exec(pages[0] ?? '')?.[1]?.trim() ?? '';
  return { title, pages, tryCode };
}

/** A page cut at its blocks: its Markdown, and the code the child runs, in their order. */
export function pageParts(page: string): ({ markdown: string } | { code: string })[] {
  const parts = page.split(/```python try\n([\s\S]*?)```/);
  return parts.flatMap((part, index): ({ markdown: string } | { code: string })[] => {
    if (index % 2 === 1) return [{ code: part }];
    return part.trim() === '' ? [] : [{ markdown: part }];
  });
}

async function fetched(url: string, kind: 'json' | 'text'): Promise<string | null> {
  const response = await fetch(url);
  const type = response.headers.get('content-type') ?? '';
  // A missing file comes back as the page itself, in HTML.
  if (!response.ok || type.includes('html')) return null;
  if (kind === 'json' && !type.includes('json')) return null;
  return response.text();
}

export async function loadLesson(id: string, lang: Language): Promise<Lesson> {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new LessonNotFound(id);
  const lessonUrl = (file: string) => `${import.meta.env.BASE_URL}content/lessons/${id}/${file}`;
  const about = await fetched(lessonUrl('lesson.json'), 'json');
  if (!about) throw new LessonNotFound(id);
  const markdown =
    (await fetched(lessonUrl(`${lang}.md`), 'text')) ?? (await fetched(lessonUrl(`${fallbackLanguage}.md`), 'text'));
  if (markdown === null) throw new LessonNotFound(id);
  const { teaches, speaker } = JSON.parse(about) as { teaches?: string[]; speaker?: string };
  // The wizard's words go in before the pages are cut (D37).
  return {
    id,
    teaches: teaches ?? [],
    ...readLesson(forWizard(markdown)),
    ...(typeof speaker === 'string' ? { speaker } : {}),
  };
}
