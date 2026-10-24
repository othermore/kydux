import { version } from '../package.json';
import { type Course, conceptsAt, courseStart, items, itemHash, knownApi, loadCourse, next, parseItem } from './content/course';
import { loadGuideText } from './content/guide';
import { LessonNotFound, loadLesson } from './content/lessons';
import { loadStory, StoryNotFound } from './content/stories';
import { isLevelId, LevelNotFound, loadApiTable, loadLevel, loadLevelText } from './content/levels';
import { currentLanguage, fallbackLanguage, forWizard, initLanguage, keepLanguageIn, languages, setLanguage, speakOf, t } from './i18n';
import * as progress from './progress/progress';
import { Runtime } from './runtime/runtime';
import { element } from './ui/dom';
import type { MapScreenParts } from './ui/map';
import type { Screen } from './ui/screen';
import { setMuted } from './engine/sfx';
import { applyLook } from './ui/look';
import { settingsScreen } from './ui/settings';
import { startScreen } from './ui/start';
import { wizardScreen } from './ui/wizard';

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
  | { name: 'wizard' }
  | { name: 'level'; id: string }
  | { name: 'lesson'; id: string; from?: string }
  | { name: 'story'; id: string };

/** The screen the address names; the start screen for an address that names none. */
function parseRoute(hash: string): Route {
  const level = /^#level\/(.+)$/.exec(hash);
  if (level) return { name: 'level', id: decodeURIComponent(level[1] ?? '') };
  // A lesson read again from a level, #lesson/<id>/from/<level>, goes back to it (D71).
  const lesson = /^#lesson\/([^/]+)(?:\/from\/(.+))?$/.exec(hash);
  if (lesson) {
    const id = decodeURIComponent(lesson[1] ?? '');
    return lesson[2] ? { name: 'lesson', id, from: decodeURIComponent(lesson[2]) } : { name: 'lesson', id };
  }
  const story = /^#story\/(.+)$/.exec(hash);
  if (story) return { name: 'story', id: decodeURIComponent(story[1] ?? '') };
  if (hash === '#map') return { name: 'map' };
  if (hash === '#settings') return { name: 'settings' };
  if (hash === '#wizard') return { name: 'wizard' };
  return { name: 'start' };
}

/** A title from the course, in the language now set or the fallback, made for the
 * wizard (D37); null when the course has none. */
function courseTitle(course: Course | null, key: string): string | null {
  const titles = course?.titles?.[key];
  const title = titles?.[currentLanguage()] ?? titles?.[fallbackLanguage];
  return title ? forWizard(title) : null;
}

let courseForTitles: Course | null = null;

async function chapterTitle(id: string): Promise<string> {
  const known = courseTitle(courseForTitles, `chapter:${id}`);
  if (known) return known;
  const response = await fetch(
    `${import.meta.env.BASE_URL}content/chapters/${id}/text.${currentLanguage()}.json`,
  );
  if (!response.ok || !response.headers.get('content-type')?.includes('json')) return id;
  return ((await response.json()) as { title?: string }).title ?? id;
}

/** An item's title in the language now set: from the course, else from the item. */
async function itemTitle(item: string): Promise<string> {
  courseForTitles ??= await loadCourse().catch(() => null);
  const known = courseTitle(courseForTitles, item);
  if (known) return known;
  const parsed = parseItem(item);
  if (!parsed) return item;
  if (parsed.kind === 'level') {
    const text = await loadLevelText(parsed.id, currentLanguage()).catch(() => null);
    return text?.title ?? parsed.id;
  }
  const load = parsed.kind === 'story' ? loadStory : loadLesson;
  const read = await load(parsed.id, currentLanguage()).catch(() => null);
  return read?.title ?? parsed.id;
}

/** An item's number in words, *Lesson 3* or *Practice 4* (D56), or undefined. */
function itemNumber(course: Course, item: string): string | undefined {
  const number = course.numbers?.[item];
  return number ? t(`kinds.${number.kind}`, { n: number.n }) : undefined;
}

/** An item's label on its own screen, with its chapter (D78): *Chapter 1 · Story 1*. */
function itemLabel(course: Course, item: string): string | undefined {
  const number = course.numbers?.[item];
  const short = itemNumber(course, item);
  if (!number || !short) return undefined;
  return number.chapter ? t('kinds.in_chapter', { chapter: number.chapter, item: short }) : short;
}

/** What a lesson or a story says when there is none by that id. */
function notFound(content: HTMLElement, kind: 'lesson' | 'story', id: string): void {
  document.title = t('app.title');
  content.replaceChildren(
    element('div', { className: 'not-found' }, [
      element('p', {}, [kind === 'story' ? t('story.not_found', { id }) : t('lesson.not_found', { id })]),
      element('a', { id: 'first-level', href: '#start' }, [t('level.go_start')]),
    ]),
  );
}

/** A lesson (D56): pages read one after another. */
async function showLesson(content: HTMLElement, id: string, key: string, from?: string): Promise<void> {
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
        label: itemLabel(course, `lesson:${id}`),
        next: next(course, `lesson:${id}`),
        // Read again from a level, the lesson goes back to it (D71).
        ...(from ? { backTo: `#level/${from}` } : {}),
        reload: () => loadLesson(id, currentLanguage()),
      }),
    );
  } catch (error) {
    if (shownRoute !== key) return;
    if (error instanceof LessonNotFound) notFound(content, 'lesson', id);
    else failed(content, error);
  }
}

/** A story told on its scene (D74). */
async function showStory(content: HTMLElement, id: string, key: string): Promise<void> {
  try {
    const [story, course, { storyScreen }, { startScene }] = await Promise.all([
      loadStory(id, currentLanguage()),
      loadCourse(),
      import('./ui/story'),
      import('./engine/scene'),
    ]);
    if (shownRoute !== key) return;
    show(
      content,
      storyScreen({
        story,
        next: next(course, `story:${id}`),
        // The game's opening goes on to the creator, or, with a wizard made, to the
        // course's first item (D61).
        // The opening goes on to the creator, or, with a wizard made, to what follows it.
        ...(story.opening
          ? { onward: progress.wizard() ? itemHash(next(course, `story:${id}`) ?? courseStart(course)) : '#wizard' }
          : {}),
        label: itemLabel(course, `story:${id}`),
        startScene,
        reload: () => loadStory(id, currentLanguage()),
      }),
    );
  } catch (error) {
    if (shownRoute !== key) return;
    if (error instanceof StoryNotFound) notFound(content, 'story', id);
    else failed(content, error);
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
  // Continue never leads back to the opening (D78).
  const item = current && current !== course.opening && items(course).includes(current) ? current : courseStart(course);
  return { hash: itemHash(item), title: await itemTitle(item) };
}

/** What the map shows: the course, the progress, and every item's and chapter's
 * title and number in the language now set. */
async function mapParts(): Promise<MapScreenParts> {
  const course = await loadCourse();
  const all = items(course);
  const [titles, chapterTitles] = await Promise.all([
    Promise.all(all.map(async (item) => [item, await itemTitle(item)] as const)),
    Promise.all(course.chapters.map(async (c) => [c.id, await chapterTitle(c.id)] as const)),
  ]);
  return {
    course,
    progress: progress.load(),
    titles: new Map(titles),
    numbers: new Map(
      all.flatMap((item) => {
        const number = itemNumber(course, item);
        return number ? [[item, number] as const] : [];
      }),
    ),
    chapterTitles: new Map(chapterTitles),
  };
}

async function showMap(content: HTMLElement): Promise<void> {
  document.title = t('map.title_page');
  const [parts, { mapScreen }] = await Promise.all([mapParts(), import('./ui/map')]);
  if (shownRoute !== 'map') return;
  show(content, mapScreen(parts));
}

/** The last lesson before a level in the course, which the level offers to read again. */
function lessonBefore(course: Course, levelId: string): string | null {
  const all = items(course);
  for (let index = all.indexOf(`level:${levelId}`) - 1; index >= 0; index -= 1) {
    const parsed = parseItem(all[index] ?? '');
    if (parsed?.kind === 'lesson') return parsed.id;
  }
  return null;
}

/** How often play time is counted, in seconds. */
const PLAY_TICK_S = 10;

/** The story the game opens with, before the creator (D61). */
const OPENING = '#story/the-letter';

async function showStart(content: HTMLElement): Promise<void> {
  // A first visit, with no wizard, no saved game and no address, opens on the
  // story (D61); with saved games, the start screen offers them (D70).
  if (!progress.wizard() && progress.savedGames().length === 0 && location.hash === '') {
    location.replace(OPENING);
    return;
  }
  document.title = t('app.title');
  const course = await loadCourse();
  const continueTo = await continueTarget(course);
  // Where each saved game is: its item's number and title, or the course's start.
  const places = new Map(
    await Promise.all(
      items(course).map(async (item) => {
        const number = itemNumber(course, item);
        const title = await itemTitle(item);
        return [item, number ? `${number}: ${title}` : title] as const;
      }),
    ),
  );
  if (shownRoute !== 'start') return;
  show(
    content,
    startScreen({
      continueTo,
      wizard: progress.wizard(),
      opening: OPENING,
      placeOf: (item) => (item ? places.get(item) : undefined) ?? places.get(courseStart(course)) ?? '',
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
    // The world, the notebook and the editor's completion all read the level's
    // api: what the course has taught up to here, not only this level (D40).
    loaded.level.api = knownApi(course, id, (loaded.level.api as string[] | undefined) ?? []);
    // The concepts the course has taught up to here, which the notebook follows (D60);
    // a level outside the course is shown as one that knows them all.
    if (course.concepts?.[id]) loaded.level.concepts = conceptsAt(course, id);
    show(
      content,
      levelScreen({
        runtime,
        loaded,
        next: next(course, `level:${id}`),
        label: itemLabel(course, `level:${id}`),
        table,
        createEditor,
        startScene,
        loadGuide: () => loadGuideText(currentLanguage()),
        openMap: async () => {
          const [parts, { mapScreen }] = await Promise.all([mapParts(), import('./ui/map')]);
          return (overlay) => mapScreen({ ...parts, here: `level:${id}`, overlay });
        },
        lesson: (() => {
          const before = lessonBefore(course, id);
          return before ? `#lesson/${before}/from/${id}` : undefined;
        })(),
        guideFirst: items(course).find((item) => item.startsWith('level:')) === `level:${id}`,
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
    wanted.name === 'level' || wanted.name === 'lesson' || wanted.name === 'story'
      ? `${wanted.name}/${wanted.id}${wanted.name === 'lesson' && wanted.from ? `/from/${wanted.from}` : ''}`
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
  if (wanted.name === 'wizard') {
    show(
      content,
      wizardScreen({
        // The wizard made, the course goes on where the child was, or begins.
        onDone: () => {
          void loadCourse()
            .then(continueTarget)
            .then((target) => {
              location.hash = target.hash;
            });
        },
      }),
    );
    return;
  }
  const shown =
    wanted.name === 'level'
      ? showLevel(content, wanted.id, key)
      : wanted.name === 'lesson'
        ? showLesson(content, wanted.id, key, wanted.from)
        : wanted.name === 'story'
          ? showStory(content, wanted.id, key)
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
  setMuted(!progress.settings().sound);
  window.addEventListener('hashchange', route);
  // Play time (D70): the seconds a level, a lesson or a story is on screen,
  // with the tab in sight, counted to the game being played.
  setInterval(() => {
    if (document.visibilityState === 'visible' && /^(level|lesson|story)\//.test(shownRoute ?? '')) {
      progress.addPlayTime(PLAY_TICK_S);
    }
  }, PLAY_TICK_S * 1000);
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
