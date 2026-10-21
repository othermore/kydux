// The start screen: where the game opens. Before the child has made a wizard,
// its big button leads to the creator; after, Continue goes to the item of the
// course last opened. Start from the beginning clears the progress, and the
// progress can be kept as a file and given back.

import { lookOf } from '../engine/looks';
import { drawLookPreview } from '../engine/placeholders';
import { t } from '../i18n';
import * as progress from '../progress/progress';
import { exportProgress, importProgress, type Wizard } from '../progress/store';
import { element } from './dom';
import type { Screen } from './screen';

export interface StartScreenParts {
  /** Where Continue goes, and the title of what is there. */
  continueTo: { hash: string; title: string };
  /** The wizard the child made, or null before there is one (D36). */
  wizard: Wizard | null;
  /** The progress changed (cleared or imported): the screen is drawn again. */
  onChanged: () => void;
}

/** Downloads text as a file of the given name. */
function download(name: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = element('a', { href: url, download: name });
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function startScreen(parts: StartScreenParts): Screen {
  const node = element('div', { className: 'start-screen' });
  const message = element('p', { id: 'start-message', className: 'start-message', hidden: true });

  const draw = () => {
    const { wizard } = parts;
    const go = wizard
      ? element('a', { id: 'continue', className: 'big-button', href: parts.continueTo.hash }, [
          t('start.continue', { title: parts.continueTo.title }),
        ])
      : element('a', { id: 'continue', className: 'big-button', href: '#wizard' }, [t('start.create')]);
    const fresh = element('button', { id: 'new', type: 'button', className: 'quiet-button' }, [
      t('start.new'),
    ]);
    fresh.addEventListener('click', () => {
      if (!window.confirm(t('start.new_confirm'))) return;
      progress.reset();
      parts.onChanged();
    });
    const settings = element('a', { id: 'settings-link', className: 'quiet-button', href: '#settings' }, [
      t('start.settings'),
    ]);
    const map = element('a', { id: 'map-link', className: 'quiet-button', href: '#map' }, [t('start.map')]);
    const exported = element('button', { id: 'export', type: 'button', className: 'quiet-button' }, [
      t('start.export'),
    ]);
    exported.addEventListener('click', () => download('kydux-progress.json', exportProgress(progress.load())));
    const picker = element('input', { id: 'import-file', type: 'file', accept: '.json,application/json', hidden: true });
    const imported = element('button', { id: 'import', type: 'button', className: 'quiet-button' }, [
      t('start.import'),
    ]);
    imported.addEventListener('click', () => picker.click());
    picker.addEventListener('change', async () => {
      const file = picker.files?.[0];
      if (!file) return;
      try {
        // The language the child chose stays as it is now: the file brings progress.
        const brought = importProgress(await file.text());
        const now = progress.load();
        brought.language = now.language;
        // A file from before the wizard was made keeps the one made since.
        brought.wizard ??= now.wizard;
        progress.save(brought);
        parts.onChanged();
      } catch {
        message.textContent = t('start.import_failed');
        message.hidden = false;
      }
    });
    const greeting: HTMLElement[] = [element('h2', {}, [wizard ? t('start.hello') : t('start.welcome')])];
    if (wizard) {
      const shown = element('canvas', { id: 'start-figure', className: 'figure medium' });
      drawLookPreview(shown, lookOf(wizard.look));
      greeting.unshift(shown);
    }
    const actions: HTMLElement[] = [go, map, fresh, settings];
    if (wizard) {
      actions.push(
        element('a', { id: 'change-wizard', className: 'quiet-button', href: '#wizard' }, [
          t('start.change_wizard'),
        ]),
      );
    }
    node.replaceChildren(
      element('div', { className: 'start-greeting' }, greeting),
      element('p', { className: 'start-intro' }, [t('start.intro')]),
      element('div', { className: 'start-actions' }, actions),
      element('section', { className: 'start-progress' }, [
        element('h3', {}, [t('start.progress')]),
        element('p', {}, [t('start.progress_about')]),
        element('div', { className: 'start-actions' }, [exported, imported, picker]),
        message,
      ]),
    );
  };
  draw();
  return {
    node,
    mount: () => node.querySelector<HTMLElement>('#continue')?.focus(),
    relabel: draw,
    destroy: () => {},
  };
}
