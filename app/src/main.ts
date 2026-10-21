import { version } from '../package.json';
import { type Course, items, itemHash, loadCourse, next, parseItem } from './content/course';
import { LessonNotFound, loadLesson } from './content/lessons';
import { isLevelId, LevelNotFound, loadApiTable, loadLevel, loadLevelText } from './content/levels';
import { currentLanguage, initLanguage, keepLanguageIn, languages, setLanguage, speakOf, t } from './i18n';
import * as progress from './progress/progress';
import { Runtime } from './runtime/runtime';
import { element } from './ui/dom';
import type { Screen } from './ui/screen';
import { applyLook } from './ui/look';
import { settingsScreen } from './ui/settings';
import { startScreen } from './ui/start';

const runtime = new Runtime();
let screen: Screen | null = null;
/** The address of the screen shown, so that a hash change to it again is ignored. */
let shownRoute: string | null = null;
/** The last address shown that was not the settings, where their Back goes. */
let beforeSettings = '#start';

type Route =
  | { name: 'start' }
  | { name: 'map' }
  | { name: 'settings' }
  | { name: 'level'; id: string }
  | { name: 'lesson'; id: string };

/** The screen the address names; the start screen for an address that names none. */
function parseRoute(hash: string): Route {
  const level = /^#level\/(.+)$/.exec(hash);
  if (level) return { name: 'level', id: decodeURIComponent(level[1] ?? '') };
  const lesson = /^#lesson\/(.+)$/.exec(hash);
  if (lesson) return { name: 'lesson', id: decodeURIComponent(lesson[1] ?? '') };
  if (hash === '#map') return { name: 'map' };
  if (hash === '#settings') return { name: 'settings' };
  return { name: 'start' };
}

async function chapterTitle(id: string): Promise<string> {
  const response = await fetch(
    `${import.meta.env.BASE_URL}content/chapters/${id}/text.${currentLanguage()}.json`,
  );
  if (!response.ok || !response.headers.get('content-type')?.includes('json')) return id;
  return ((await response.json()) as { title?: string }).title ?? id;
}

/** An item's title in the language now set. */
async function itemTitle(item: string): Promise<string> {
  const parsed = parseItem(item);
  if (!parsed) return item;
  if (parsed.kind === 'level') {
    const text = await loadLevelText(parsed.id, currentLanguage()).catch(() => null);
    return text?.title ?? parsed.id;
  }
  const lesson = await loadLesson(parsed.id, currentLanguage()).catch(() => null);
  return lesson?.title ?? parsed.id;
}

async function showLesson(content: HTMLElement, id: string, key: string): Promise<void> {
  try {
    const [lesson, course, { lessonScreen }] = await Promise.all([
      loadLesson(id, currentLanguage()),
      loadCourse(),
      import('./ui/lesson'),
    ]);
    if (shownRoute !== key) return;
    show(
      content,
      lessonScreen({
        lesson,
        next: next(course, `lesson:${id}`),
        reload: () => loadLesson(id, currentLanguage()),
      }),
    );
  } catch (error) {
    if (shownRoute !== key) return;
    if (!(error instanceof LessonNotFound)) {
      failed(content, error);
      return;
    }
    document.title = t('app.title');
    content.replaceChildren(
      element('div', { className: 'not-found' }, [
        element('p', {}, [t('lesson.not_found', { id })]),
        element('a', { id: 'first-level', href: '#start' }, [t('level.go_start')]),
      ]),
    );
  }
}

function languagePicker(): HTMLElement {
  const select = element('select', { id: 'language' });
  for (const lang of languages) {
    select.append(
      element('option', { value: lang, selected: lang === currentLanguage() }, [
        t(`language.${lang}`),
      ]),
    );
  }
  select.addEventListener('change', () => setLanguage(select.value));
  return element('label', { className: 'language' }, [t('app.language'), ' ', select]);
}

function chrome(root: HTMLElement, content: HTMLElement): void {
  root.replaceChildren(
    element('header', { className: 'top' }, [
      element('div', { className: 'brand' }, [
        element('h1', {}, [element('a', { href: '#start', id: 'home' }, [t('app.title')])]),
        element('span', { className: 'tagline' }, [t('app.tagline')]),
      ]),
      languagePicker(),
    ]),
    content,
    element('footer', {}, [element('span', {}, [t('app.version', { version })])]),
  );
}

/** Puts a screen in the page in place of the one before. */
function show(content: HTMLElement, next: Screen): void {
  screen?.destroy();
  screen = next;
  content.replaceChildren(next.node);
  next.mount?.();
}

function failed(content: HTMLElement, error: unknown): void {
  // The network, or a part of the game that did not arrive.
  console.error(error);
  const reload = element('button', { id: 'reload', type: 'button' }, [t('level.reload')]);
  reload.addEventListener('click', () => location.reload());
  content.replaceChildren(
    element('div', { className: 'not-found' }, [element('p', {}, [t('level.load_failed')]), reload]),
  );
}

/** Where Continue goes: the item last opened, else the first of the course. */
async function continueTarget(course: Course): Promise<{ hash: string; title: string }> {
  const current = progress.load().current;
  const item = current && items(course).includes(current) ? current : (items(course)[0] ?? '');
  return { hash: itemHash(item), title: await itemTitle(item) };
}

async function showMap(content: HTMLElement): Promise<void> {
  document.title = t('map.title_page');
  const course = await loadCourse();
  const all = items(course);
  const [titles, chapterTitles] = await Promise.all([
    Promise.all(all.map(async (item) => [item, await itemTitle(item)] as const)),
    Promise.all(course.chapters.map(async (c) => [c.id, await chapterTitle(c.id)] as const)),
  ]);
  if (shownRoute !== 'map') return;
  const { mapScreen } = await import('./ui/map');
  show(
    content,
    mapScreen({
      course,
      progress: progress.load(),
      titles: new Map(titles),
      chapterTitles: new Map(chapterTitles),
    }),
  );
}

async function showStart(content: HTMLElement): Promise<void> {
  document.title = t('app.title');
  const continueTo = await continueTarget(await loadCourse());
  if (shownRoute !== 'start') return;
  show(
    content,
    startScreen({
      continueTo,
      onChanged: () => {
        shownRoute = null;
        route();
      },
    }),
  );
}

async function showLevel(content: HTMLElement, id: string, key: string): Promise<void> {
  try {
    if (!isLevelId(id)) throw new LevelNotFound(id);
    const [loaded, course, table, { levelScreen }, { createEditor }, { startScene }] =
      await Promise.all([
        loadLevel(id, currentLanguage()),
        loadCourse(),
        loadApiTable(),
        import('./ui/level'),
        import('./editor/editor'),
        import('./engine/scene'),
      ]);
    if (shownRoute !== key) return;
    show(
      content,
      levelScreen({
        runtime,
        loaded,
        next: next(course, `level:${id}`),
        table,
        createEditor,
        startScene,
      }),
    );
  } catch (error) {
    if (shownRoute !== key) return;
    document.title = t('app.title');
    if (!(error instanceof LevelNotFound)) {
      failed(content, error);
      return;
    }
    screen?.destroy();
    screen = null;
    content.replaceChildren(
      element('div', { className: 'not-found' }, [
        element('p', {}, [t('level.not_found', { id })]),
        element('a', { id: 'first-level', href: '#start' }, [t('level.go_start')]),
      ]),
    );
  }
}

let root: HTMLElement | null = null;

function route(): void {
  if (!root) return;
  const wanted = parseRoute(location.hash);
  const key =
    wanted.name === 'level' || wanted.name === 'lesson'
      ? `${wanted.name}/${wanted.id}`
      : wanted.name;
  if (key === shownRoute && screen) return;
  shownRoute = key;
  // The words speak of the wizard as the progress document has it now (D37).
  speakOf(progress.wizard());
  if (wanted.name !== 'settings') beforeSettings = location.hash || '#start';
  screen?.destroy();
  screen = null;
  const content = element('main', { className: 'content' }, [
    element('p', { className: 'status' }, [t('level.loading')]),
  ]);
  chrome(root, content);
  if (wanted.name === 'settings') {
    show(content, settingsScreen({ back: beforeSettings }));
    return;
  }
  const shown =
    wanted.name === 'level'
      ? showLevel(content, wanted.id, key)
      : wanted.name === 'lesson'
        ? showLesson(content, wanted.id, key)
        : wanted.name === 'map'
          ? showMap(content)
          : showStart(content);
  shown.catch((error: unknown) => failed(content, error));
}

// Whether the page can stop a program in place is for a developer to know,
// not the child: the page says it on its root element and in the console.
const isolated = globalThis.crossOriginIsolated === true;
document.documentElement.dataset.isolated = String(isolated);
console.info(
  isolated
    ? 'Kydux: cross-origin isolated; a runaway program is stopped in place.' // i18n-ignore
    : 'Kydux: not isolated; a runaway program is stopped by starting Python again.', // i18n-ignore
);

root = document.querySelector<HTMLElement>('#app');
if (root) {
  const page = root;
  keepLanguageIn(progress.languageStorage);
  initLanguage();
  applyLook(progress.settings());
  window.addEventListener('hashchange', route);
  document.addEventListener('kydux:language', () => {
    // The header and footer are drawn again; the screen keeps what it holds and
    // only says its words again.
    const content = page.querySelector<HTMLElement>('main.content');
    if (content) chrome(page, content);
    if (shownRoute === 'start' || shownRoute === 'map') {
      // These screens name titles they loaded in the language before.
      shownRoute = null;
      route();
      return;
    }
    void screen?.relabel();
  });
  route();
}
