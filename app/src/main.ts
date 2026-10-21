import { version } from '../package.json';
import {
  isLevelId,
  LevelNotFound,
  loadApiTable,
  loadLevel,
  loadLevelOrder,
  loadLevelText,
  nextLevel,
} from './content/levels';
import { currentLanguage, initLanguage, keepLanguageIn, languages, setLanguage, t } from './i18n';
import * as progress from './progress/progress';
import { Runtime } from './runtime/runtime';
import { element } from './ui/dom';
import type { Screen } from './ui/screen';
import { startScreen } from './ui/start';

const runtime = new Runtime();
let screen: Screen | null = null;
/** The address of the screen shown, so that a hash change to it again is ignored. */
let shownRoute: string | null = null;

type Route = { name: 'start' } | { name: 'level'; id: string };

/** The screen the address names; the start screen for an address that names none. */
function parseRoute(hash: string): Route {
  const level = /^#level\/(.+)$/.exec(hash);
  if (level) return { name: 'level', id: decodeURIComponent(level[1] ?? '') };
  return { name: 'start' };
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
async function continueTarget(): Promise<{ hash: string; title: string }> {
  const order = await loadLevelOrder();
  const current = progress.load().current;
  const id = current?.startsWith('level:') ? current.slice('level:'.length) : (order[0] ?? '');
  const text = await loadLevelText(id, currentLanguage()).catch(() => null);
  return { hash: `#level/${id}`, title: text?.title ?? id };
}

async function showStart(content: HTMLElement): Promise<void> {
  document.title = t('app.title');
  const continueTo = await continueTarget();
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
    const [loaded, order, table, { levelScreen }, { createEditor }, { startScene }] =
      await Promise.all([
        loadLevel(id, currentLanguage()),
        loadLevelOrder(),
        loadApiTable(),
        import('./ui/level'),
        import('./editor/editor'),
        import('./engine/scene'),
      ]);
    if (shownRoute !== key) return;
    show(
      content,
      levelScreen({ runtime, loaded, next: nextLevel(order, id), table, createEditor, startScene }),
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
  const next = parseRoute(location.hash);
  const key = next.name === 'level' ? `level/${next.id}` : next.name;
  if (key === shownRoute && screen) return;
  shownRoute = key;
  screen?.destroy();
  screen = null;
  const content = element('main', { className: 'content' }, [
    element('p', { className: 'status' }, [t('level.loading')]),
  ]);
  chrome(root, content);
  const shown = next.name === 'level' ? showLevel(content, next.id, key) : showStart(content);
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
  window.addEventListener('hashchange', route);
  document.addEventListener('kydux:language', () => {
    // The header and footer are drawn again; the screen keeps what it holds and
    // only says its words again.
    const content = page.querySelector<HTMLElement>('main.content');
    if (content) chrome(page, content);
    if (shownRoute === 'start') {
      // The start screen names a title it loaded in the language before.
      shownRoute = null;
      route();
      return;
    }
    void screen?.relabel();
  });
  route();
}
