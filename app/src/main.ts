import { version } from '../package.json';
import { currentLanguage, initLanguage, languages, setLanguage, t } from './i18n';

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
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
  root.replaceChildren(
    element('header', {}, [
      element('h1', {}, [t('app.title')]),
      languagePicker(),
    ]),
    element('p', { className: 'tagline' }, [t('app.tagline')]),
    element('p', { id: 'isolation', className: isolated ? 'ok' : 'warning' }, [
      t(isolated ? 'app.isolated_yes' : 'app.isolated_no'),
    ]),
    element('footer', {}, [t('app.version', { version })]),
  );
}

const root = document.querySelector<HTMLElement>('#app');
if (root) {
  initLanguage();
  render(root);
  document.addEventListener('kydux:language', () => render(root));
}
