// Loading a lesson: lesson.json and its Markdown in the player's language, from
// content/lessons/<id>/ (D33, D56). Pages are separated by a line of `---`; a
// fenced block marked `python try`, on any page, is code the child runs and changes
// on the page itself (D142); the one on the last page is the lesson's example: the
// level after it starts with its own program, never with it (D63). The fence says the
// page's test (D354): `python try`, the block run; `python try change`, a code other
// than the given one run; `python try rename`, the given variable renamed in a run with
// no error; `python try rename error`, that and a run ended on an unknown name. A fence
// with other words is plain code.

import { fallbackLanguage, forWizard, type Language } from '../i18n';
import { contentUrl } from './address';

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

/** What a page asks of its block before the page is left (D354): a run, a change, a
 * rename, a rename and the error of a name the program has not. */
export type LessonTest = 'try' | 'change' | 'rename' | 'rename_error';

/** A block to try, under any of its four fences: the fence's words and the code. */
const TRY_BLOCK = /```python try( change| rename| rename error)?\n([\s\S]*?)```/;
const TRY_BLOCKS = new RegExp(TRY_BLOCK.source, 'g');

/** The test a fence's words after `python try` say. */
function testOf(words: string | undefined): LessonTest {
  switch (words) {
    case ' change':
      return 'change';
    case ' rename':
      return 'rename';
    case ' rename error':
      return 'rename_error';
    default:
      return 'try';
  }
}

/** A lesson's Markdown taken apart: its title, its pages, the last page's block. */
export function readLesson(markdown: string): Pick<Lesson, 'title' | 'pages' | 'tryCode'> {
  const pages = markdown
    .split(/^---$/m)
    .map((page) => page.trim())
    .filter((page) => page !== '');
  const tried = TRY_BLOCK.exec(pages[pages.length - 1] ?? '');
  const tryCode = tried ? (tried[2] ?? '') : null;
  const title = /^#\s+(.+)$/m.exec(pages[0] ?? '')?.[1]?.trim() ?? '';
  return { title, pages, tryCode };
}

/** A part of a page: its Markdown, or a block the child runs, with the page's test. */
export type PagePart = { markdown: string } | { code: string; test: LessonTest };

/** A page cut at its blocks: its Markdown, and the code the child runs with the test its
 * fence says, in their order. */
export function pageParts(page: string): PagePart[] {
  const parts: PagePart[] = [];
  let from = 0;
  const words = (text: string) => (text.trim() === '' ? [] : [{ markdown: text }]);
  for (const found of page.matchAll(TRY_BLOCKS)) {
    parts.push(...words(page.slice(from, found.index)));
    parts.push({ code: found[2] ?? '', test: testOf(found[1]) });
    from = found.index + found[0].length;
  }
  parts.push(...words(page.slice(from)));
  return parts;
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
  const lessonUrl = (file: string) => contentUrl(`lessons/${id}/${file}`);
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
