// The start screen: where the game opens. Before the child has made a wizard,
// its big button begins the story; after, Continue goes to the item of the
// course last opened. The saved games (D70) are listed under Load a game, each
// played or deleted from there; New game begins the story again for a new
// wizard; a game can be kept as a file and given back as one more game.

import { lookOf } from '../engine/looks';
import { drawLookPreview } from '../engine/placeholders';
import { t } from '../i18n';
import * as progress from '../progress/progress';
import type { SavedGame } from '../progress/games';
import { exportProgress, importProgress, type Wizard } from '../progress/store';
import { welcomeSection } from './about';
import { element } from './dom';
import type { Screen } from './screen';

export interface StartScreenParts {
  /** Where Continue goes, and the title of what is there. */
  continueTo: { hash: string; title: string };
  /** The wizard the child made, or null before there is one (D36). */
  wizard: Wizard | null;
  /** The address of the game's opening story, where a new game begins (D61). */
  opening: string;
  /** Where in the course a game is, in words, from its current item. */
  placeOf: (item: string | null | undefined) => string;
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

/** A length of play in words: minutes, or hours and minutes. */
function playTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return minutes < 60
    ? t('start.minutes', { n: minutes })
    : t('start.hours', { h: Math.floor(minutes / 60), m: minutes % 60 });
}

function day(iso: string): string {
  return new Date(iso).toLocaleDateString(document.documentElement.lang || undefined);
}

/** The saved games, each with its wizard, where it is, how long it has been played
 * and when, and Play and Delete (D70). Hidden until Load a game opens it. */
function gamesList(saved: SavedGame[], parts: StartScreenParts, redraw: () => void): HTMLElement {
  const current = progress.currentGame();
  const rows = saved.map((game) => {
    const wizard = game.progress.wizard as Wizard;
    const figure = element('canvas', { className: 'figure small' });
    drawLookPreview(figure, lookOf(wizard.look));
    const play = element('button', { type: 'button', className: 'play' }, [t('start.play')]);
    play.addEventListener('click', () => {
      progress.chooseGame(game.id);
      parts.onChanged();
    });
    const remove = element('button', { type: 'button', className: 'quiet-button delete' }, [t('start.delete')]);
    remove.addEventListener('click', () => {
      if (!window.confirm(t('start.delete_confirm', { name: wizard.name }))) return;
      progress.deleteGame(game.id);
      if (game.id === current) parts.onChanged();
      else redraw();
    });
    const row = element('li', { className: 'game' }, [
      figure,
      element('div', { className: 'game-about' }, [
        element('strong', { className: 'game-name' }, [wizard.name]),
        element('span', { className: 'game-place' }, [parts.placeOf(game.progress.current)]),
        element('span', { className: 'game-time' }, [
          t('start.played', { time: playTime(game.seconds), begun: day(game.created), last: day(game.played) }),
        ]),
      ]),
      element('div', { className: 'game-buttons' }, [play, remove]),
    ]);
    row.dataset.game = game.id;
    if (game.id === current) row.dataset.current = 'true';
    return row;
  });
  return element('section', { id: 'games', className: 'games', hidden: true }, [
    element('h3', {}, [t('start.games')]),
    element('ul', {}, rows),
  ]);
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
      : element('a', { id: 'continue', className: 'big-button', href: parts.opening }, [t('start.begin')]);
    const fresh = element('button', { id: 'new', type: 'button', className: 'quiet-button' }, [
      t('start.new'),
    ]);
    fresh.addEventListener('click', () => {
      // A new game begins with the story again; the game being played stays saved.
      progress.newGame();
      location.hash = parts.opening;
    });
    const saved = progress.savedGames();
    const load = element('button', { id: 'load-game', type: 'button', className: 'quiet-button' }, [
      t('start.load'),
    ]);
    load.setAttribute('aria-expanded', 'false');
    load.setAttribute('aria-controls', 'games');
    const list = gamesList(saved, parts, () => draw());
    load.addEventListener('click', () => {
      list.hidden = !list.hidden;
      load.setAttribute('aria-expanded', String(!list.hidden));
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
        // The language the child chose stays as it is now: the file brings a game.
        const brought = importProgress(await file.text());
        const now = progress.load();
        brought.language = now.language;
        brought.settings = now.settings;
        // A file from before the wizard was made keeps the one made since.
        brought.wizard ??= now.wizard;
        progress.addGame(brought);
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
    const actions: HTMLElement[] = [go, ...(wizard ? [map] : []), ...(saved.length > 0 ? [load] : []), fresh, settings];
    if (wizard) {
      actions.push(
        element('a', { id: 'change-wizard', className: 'quiet-button', href: '#wizard' }, [
          t('start.change_wizard'),
        ]),
      );
    }
    node.replaceChildren(
      element('div', { className: 'start-greeting' }, greeting),
      // Before a wizard is made, what Kydux is, with a link to the welcome page (D193).
      ...(wizard ? [] : [welcomeSection()]),
      element('p', { className: 'start-intro' }, [t('start.intro')]),
      element('div', { className: 'start-actions' }, actions),
      ...(wizard ? [element('p', { id: 'saved-note', className: 'saved-note' }, [t('start.saved')])] : []),
      list,
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
