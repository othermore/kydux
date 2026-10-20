import { version } from '../package.json';
import { isLevelId, LevelNotFound, loadLevel } from './content/levels';
import { currentLanguage, initLanguage, languages, setLanguage, t } from './i18n';
import { Runtime } from './runtime/runtime';
import { element } from './ui/dom';
import type { LevelScreen } from './ui/level';

const FIRST_LEVEL = '01-the-corridor';

const runtime = new Runtime();
let screen: LevelScreen | null = null;
let shownLevel: string | null = null;

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
  const isolated = globalThis.crossOriginIsolated === true;
  root.replaceChildren(
    element('header', { className: 'top' }, [
      element('div', { className: 'brand' }, [
        element('h1', {}, [t('app.title')]),
        element('span', { className: 'tagline' }, [t('app.tagline')]),
      ]),
      languagePicker(),
    ]),
    content,
    element('footer', {}, [
      element('span', { id: 'isolation', className: isolated ? 'ok' : 'warning' }, [
        isolated ? t('app.isolated_yes') : t('app.isolated_no'),
      ]),
      element('span', {}, [t('app.version', { version })]),
    ]),
  );
}

/** The level the address names, as #level/<id>; null when it names none. */
function levelFromHash(): string | null {
  const match = /^#level\/(.+)$/.exec(location.hash);
  return match ? decodeURIComponent(match[1] ?? '') : null;
}

async function showLevel(root: HTMLElement, id: string): Promise<void> {
  screen?.destroy();
  screen = null;
  shownLevel = id;
  const content = element('main', { className: 'content' }, [
    element('p', { className: 'status' }, [t('level.loading')]),
  ]);
  chrome(root, content);
  try {
    if (!isLevelId(id)) throw new LevelNotFound(id);
    const [loaded, { levelScreen }, { createEditor }, { startScene }] = await Promise.all([
      loadLevel(id, currentLanguage()),
      import('./ui/level'),
      import('./editor/editor'),
      import('./engine/scene'),
    ]);
    if (shownLevel !== id) return;
    screen = levelScreen({ runtime, loaded, createEditor, startScene });
    content.replaceChildren(screen.node);
    screen.mount();
  } catch (error) {
    if (shownLevel !== id) return;
    document.title = t('app.title');
    if (error instanceof LevelNotFound) {
      content.replaceChildren(
        element('div', { className: 'not-found' }, [
          element('p', {}, [t('level.not_found', { id })]),
          element('a', { id: 'first-level', href: `#level/${FIRST_LEVEL}` }, [t('level.go_first')]),
        ]),
      );
      return;
    }
    // The network, or a part of the game that did not arrive.
    console.error(error);
    const reload = element('button', { id: 'reload', type: 'button' }, [t('level.reload')]);
    reload.addEventListener('click', () => location.reload());
    content.replaceChildren(
      element('div', { className: 'not-found' }, [
        element('p', {}, [t('level.load_failed')]),
        reload,
      ]),
    );
  }
}

const root = document.querySelector<HTMLElement>('#app');
if (root) {
  initLanguage();
  const route = () => {
    const id = levelFromHash();
    if (id === null) {
      location.replace(`#level/${FIRST_LEVEL}`);
      return;
    }
    if (id !== shownLevel || !screen) void showLevel(root, id);
  };
  window.addEventListener('hashchange', route);
  document.addEventListener('kydux:language', () => {
    // The header and footer are drawn again; the level screen keeps its scene
    // and editor and only says its words again.
    const content = root.querySelector<HTMLElement>('main.content');
    if (content) chrome(root, content);
    void screen?.relabel();
  });
  route();
}
