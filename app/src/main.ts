import { version } from '../package.json';
import { currentLanguage, initLanguage, languages, setLanguage, t } from './i18n';
import { Runtime } from './runtime/runtime';
import { element } from './ui/dom';
import { newPlaygroundState, playground, type Rendered } from './ui/playground';

const runtime = new Runtime();
const playgroundState = newPlaygroundState();
let shown: Rendered | null = null;

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
  shown = playground(runtime, playgroundState);
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
    element('footer', {}, [t('app.version', { version })]),
  );
}

const root = document.querySelector<HTMLElement>('#app');
if (root) {
  initLanguage();
  render(root);
  document.addEventListener('kydux:language', () => render(root));
}
