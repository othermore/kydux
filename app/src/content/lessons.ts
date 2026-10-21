// Loading a lesson: lesson.json and its Markdown in the player's language, from
// content/lessons/<id>/ (D33). Pages are separated by a line of `---`; a fenced
// block marked `python try` on the last page is the lesson's Try it, which goes
// into the next level's editor, and is not shown as a page's code.

import { fallbackLanguage, forWizard, type Language } from '../i18n';

export interface Lesson {
  id: string;
  /** The names the lesson explains, which the level after it teaches. */
  teaches: string[];
  title: string;
  /** Each page's Markdown. */
  pages: string[];
  /** The Try it example, or null when the lesson has none. */
  tryCode: string | null;
}

export class LessonNotFound extends Error {
  constructor(readonly id: string) {
    super(`no lesson ${id}`);
  }
}

const TRY_BLOCK = /```python try\n([\s\S]*?)```/;

/** A lesson's Markdown taken apart: its title, its pages, its Try it. */
export function readLesson(markdown: string): Pick<Lesson, 'title' | 'pages' | 'tryCode'> {
  const tried = TRY_BLOCK.exec(markdown);
  const tryCode = tried ? (tried[1] ?? '') : null;
  // The Try it is shown on its page as code, without the word that marks it.
  const shown = markdown.replace(TRY_BLOCK, (_whole, code: string) => `\`\`\`python\n${code}\`\`\``);
  const pages = shown
    .split(/^---$/m)
    .map((page) => page.trim())
    .filter((page) => page !== '');
  const title = /^#\s+(.+)$/m.exec(pages[0] ?? '')?.[1]?.trim() ?? '';
  return { title, pages, tryCode };
}

function lessonUrl(id: string, file: string): string {
  return `${import.meta.env.BASE_URL}content/lessons/${id}/${file}`;
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
  const about = await fetched(lessonUrl(id, 'lesson.json'), 'json');
  if (!about) throw new LessonNotFound(id);
  const markdown =
    (await fetched(lessonUrl(id, `${lang}.md`), 'text')) ??
    (await fetched(lessonUrl(id, `${fallbackLanguage}.md`), 'text'));
  if (markdown === null) throw new LessonNotFound(id);
  const { teaches } = JSON.parse(about) as { teaches?: string[] };
  // The wizard's words go in before the pages are cut (D37).
  return { id, teaches: teaches ?? [], ...readLesson(forWizard(markdown)) };
}
