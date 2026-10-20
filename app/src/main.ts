import { version } from '../package.json';
import { currentLanguage, initLanguage, languages, setLanguage, t } from './i18n';
import type { SceneHandle } from './engine/scene';
import type { RunResult } from './runtime/protocol';
import { Runtime } from './runtime/runtime';
import { element } from './ui/dom';
import { newPlaygroundState, playground, type Rendered } from './ui/playground';

const runtime = new Runtime();
const playgroundState = newPlaygroundState();
let shown: Rendered | null = null;

// The scene is mounted beside the playground until the level screen takes
// both their places (sprint 2, piece 1.6). Phaser is loaded on its own.
const sceneParent = element('div', { id: 'scene', className: 'scene' });
let scene: Promise<SceneHandle> | null = null;

function mountScene(): void {
  scene = Promise.all([
    import('./engine/scene'),
    fetch(`${import.meta.env.BASE_URL}content/levels/01-the-corridor/level.json`).then(
      (response) => response.json(),
    ),
  ]).then(([module, level]) => module.startScene(sceneParent, level));
}

function playInScene(result: RunResult): void {
  if (!result.world) return;
  void scene?.then((handle) => {
    handle.load(result.world ?? {});
    handle.playback.play();
  });
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

function render(root: HTMLElement): void {
  document.title = t('app.title');
  const isolated = globalThis.crossOriginIsolated === true;
  shown?.dispose();
  shown = playground(runtime, playgroundState, playInScene);
  root.replaceChildren(
    element('header', {}, [
      element('h1', {}, [t('app.title')]),
      languagePicker(),
    ]),
    element('p', { className: 'tagline' }, [t('app.tagline')]),
    element('p', { id: 'isolation', className: isolated ? 'ok' : 'warning' }, [
      isolated ? t('app.isolated_yes') : t('app.isolated_no'),
    ]),
    shown.node,
    sceneParent,
    element('footer', {}, [t('app.version', { version })]),
  );
}

const root = document.querySelector<HTMLElement>('#app');
if (root) {
  initLanguage();
  render(root);
  mountScene();
  document.addEventListener('kydux:language', () => render(root));
}
