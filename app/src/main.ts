import { version } from '../package.json';
import {
  type Course,
  conceptsAt,
  courseStart,
  items,
  itemHash,
  knownApi,
  knownSpells,
  knownWords,
  levelAfter,
  loadCourse,
  next,
  parseItem,
  themeOf,
} from './content/course';
import { loadGuideText } from './content/guide';
import { LessonNotFound, loadLesson } from './content/lessons';
import { loadStory, StoryNotFound } from './content/stories';
import { isLevelId, LevelNotFound, loadApiTable, loadLevel, loadLevelText } from './content/levels';
import { currentLanguage, fallbackLanguage, forWizard, initLanguage, keepLanguageIn, languages, setLanguage, speakOf, t } from './i18n';
import { startPlayTime } from './progress/playtime';
import * as progress from './progress/progress';
import type { LevelJson } from './runtime/protocol';
import { Runtime } from './runtime/runtime';
import { element } from './ui/dom';
import { handheldNote } from './ui/handheld';
import { markSvg } from './ui/mark';
import type { LessonRunner } from './ui/lessonrun';
import type { MapScreenParts } from './ui/map';
import { aboutScreen } from './ui/about';
import type { Screen } from './ui/screen';
import { debugging } from './engine/debugging';
import { lookOf } from './engine/looks';
import { listenForMusic, music } from './engine/music';
import { setMuted } from './engine/sfx';
import { applyLook } from './ui/look';
import { settingsScreen } from './ui/settings';
import { startScreen } from './ui/start';
import { themesScreen } from './ui/themes';
import { wizardScreen } from './ui/wizard';

const runtime = new Runtime();
let screen: Screen | null = null;
/** The address of the screen shown, so that a hash change to it again is ignored. */
let shownRoute: string | null = null;
/** Where the screen shown is, for a stale world's message to take its place. */
let shownContent: HTMLElement | null = null;

// The page's world, and the world running once it has loaded, on the root element
// for the `?debug` corner (debug.ts); a world that is not the page's runs no level:
// the level shown gives way to the message to reload.
document.documentElement.dataset.pageStamp = __WORLD_STAMP__;
runtime.onStatus((status) => {
  const running = runtime.info?.worldStamp;
  if (running !== undefined) document.documentElement.dataset.worldStamp = running || 'none';
  if (status === 'stale' && shownContent && shownRoute?.startsWith('level/')) stale(shownContent);
});
/** The last address shown that was not the settings, where their Back goes. */
let beforeSettings = '#start';

type Route =
  | { name: 'start' }
  | { name: 'map' }
  | { name: 'settings' }
  | { name: 'wizard' }
  | { name: 'music' }
  | { name: 'about' }
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
  if (hash === '#music' && debugging()) return { name: 'music' };
  if (hash === '#about') return { name: 'about' };
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

/** How a lesson's code runs on its page (D142): in the level after it, at its start. */
function lessonRunner(
  course: Course,
  id: string,
  createEditor: LessonRunner['createEditor'],
): { runner?: LessonRunner } {
  const tried = levelAfter(course, `lesson:${id}`);
  if (!tried) return {};
  let world: Promise<LevelJson> | null = null;
  return {
    runner: {
      runtime,
      level: () => (world ??= loadLevel(tried, currentLanguage()).then((loaded) => loaded.level)),
      createEditor,
      openPlan: async (level, onClose) => {
        const [{ layout }, { loadArt, planPictures }, { openPlan }] = await Promise.all([
          import('./engine/layout'),
          import('./engine/painted'),
          import('./ui/plan'),
        ]);
        const map = layout(level);
        const art = await loadArt(level);
        const figures = [
          { id: 'wizard', kind: 'wizard', tile: map.start, facing: 'down' },
          ...map.actors
            .filter((actor) => !actor.hidden)
            .map(({ id: actor, kind, tile, facing }) => ({ id: actor, kind, tile, facing: facing as string })),
        ];
        const things = map.things
          .filter((thing) => !thing.carried)
          .map(({ id: thing, kind, tile, open, art: painted }) => ({
            id: thing,
            kind,
            tile,
            open,
            ...(painted ? { art: painted } : {}),
          }));
        const wizard = progress.wizard();
        const look = lookOf(wizard?.look);
        return openPlan(
          {
            rows: map.rows,
            enchanted: map.enchanted,
            figures,
            things,
            marks: map.reaches,
            ...(art
              ? { pictures: planPictures(art, things, figures, look) }
              : {}),
          },
          onClose,
        );
      },
    },
  };
}

/** A lesson (D56): pages read one after another. */
async function showLesson(content: HTMLElement, id: string, key: string, from?: string): Promise<void> {
  try {
    const [lesson, course, { lessonScreen }, { createEditor }] = await Promise.all([
      loadLesson(id, currentLanguage()),
      loadCourse(),
      import('./ui/lesson'),
      import('./editor/editor'),
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
        ...lessonRunner(course, id, createEditor),
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
        // The game's opening goes on to the creator, or, with a wizard made, to what
        // follows it (D61).
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
        element('h1', {}, [element('a', { href: '#start', id: 'home' }, [markSvg(), t('app.title')])]),
        element('span', { className: 'tagline' }, [t('app.tagline')]),
      ]),
      element('div', { className: 'top-links' }, [
        element('a', { href: '#about', id: 'about-link' }, [t('about.link')]),
        languagePicker(),
      ]),
    ]),
    ...handheldNote(),
    content,
    element('footer', {}, [
      element('span', {}, [t('app.version', { version })]),
      element('span', { id: 'build', className: 'build' }, [__BUILD__]),
    ]),
  );
}

/** Puts a screen in the page in place of the one before. */
function show(content: HTMLElement, next: Screen): void {
  screen?.destroy();
  screen = next;
  content.replaceChildren(next.node);
  next.mount?.();
}

/** The world running is not the page's: the page must be reloaded (stamp.ts). */
function stale(content: HTMLElement): void {
  screen?.destroy();
  screen = null;
  const reload = element('button', { id: 'reload', type: 'button' }, [t('level.reload')]);
  reload.addEventListener('click', () => location.reload());
  content.replaceChildren(
    element('div', { className: 'not-found', id: 'stale-world' }, [element('p', {}, [t('level.stale_world')]), reload]),
  );
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
  // Opened by itself, the map opens at the item last opened, marked (D122).
  show(content, mapScreen({ ...parts, here: parts.progress.current ?? undefined }));
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

/** The story the game opens with, before the creator (D61). */
const OPENING = '#story/the-letter';

async function showStart(content: HTMLElement): Promise<void> {
  // A first visit, with no wizard, no saved game and no address, opens on the
  // welcome page, whose Start playing begins the story (D61, D193); with saved
  // games, the start screen offers them (D70).
  if (!progress.wizard() && progress.savedGames().length === 0 && location.hash === '') {
    location.replace('#about');
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
    if (runtime.status === 'stale') {
      stale(content);
      return;
    }
    // The world, the notebook and the editor's completion all read the level's
    // api: what the course has taught up to here, not only this level (D40).
    loaded.level.api = knownApi(course, id, (loaded.level.api as string[] | undefined) ?? []);
    // So do the spells (D80).
    loaded.level.spells = knownSpells(course, id, (loaded.level.spells as string[] | undefined) ?? []);
    // What the course gives the page alone: the words given so far, and the concepts
    // taught up to here (CourseGiven).
    loaded.course = {
      knownWords: knownWords(course, id, (loaded.level.words as string[] | undefined) ?? []),
      ...(course.concepts?.[id] ? { concepts: conceptsAt(course, id) } : {}),
    };
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

/** The music a screen plays (D192): a story, the map and the start screen their
 * chapter's theme at its loudness, a lesson and a level every voice of it lower (D210);
 * the map and the start screen are in the chapter the child is in. The settings, the
 * creator and the page of themes leave the music as it is, or start the first
 * chapter's. */
function playMusicFor(wanted: Route): void {
  if (wanted.name === 'music') return;
  if ((wanted.name === 'settings' || wanted.name === 'wizard') && music.state.theme) return;
  const item =
    wanted.name === 'level' || wanted.name === 'lesson' || wanted.name === 'story'
      ? `${wanted.name}:${wanted.id}`
      : progress.load().current;
  const heard = wanted.name === 'level' || wanted.name === 'lesson' ? 'level' : 'story';
  void loadCourse()
    .then((course) => {
      const theme = themeOf(course, item);
      if (theme) music.play(theme, heard);
    })
    .catch(() => {});
}

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
  playMusicFor(wanted);
  screen?.destroy();
  screen = null;
  const content = element('main', { className: 'content' }, [
    element('p', { className: 'status' }, [t('level.loading')]),
  ]);
  chrome(root, content);
  shownContent = content;
  if (wanted.name === 'settings') {
    show(content, settingsScreen({ back: beforeSettings }));
    return;
  }
  if (wanted.name === 'music') {
    void loadCourse().then((course) => show(content, themesScreen(course.themes ?? [])));
    return;
  }
  if (wanted.name === 'about') {
    // A child who has never played starts the story from it; one who has goes back
    // to the start screen and its Continue.
    const newcomer = !progress.wizard() && progress.savedGames().length === 0;
    show(content, aboutScreen({ play: newcomer ? OPENING : '#start', newcomer }));
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
  music.setVolume(progress.settings().music);
  listenForMusic();
  window.addEventListener('hashchange', route);
  // Play time (D70, playtime.ts): counted while a level, a lesson or a story is
  // on screen and the child is at the page.
  startPlayTime({
    playing: () => /^(level|lesson|story)\//.test(shownRoute ?? ''),
    visible: () => document.visibilityState === 'visible',
    add: (seconds) => progress.addPlayTime(seconds),
  });
  // A screen opened again where it is, a level from its own stop on the map (D131).
  document.addEventListener('kydux:reopen', () => {
    shownRoute = null;
    route();
  });
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
