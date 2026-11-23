// The start screen: where the game opens. Before the child has made a wizard,
// its big button begins the story; after, Continue goes to the item of the
// course last opened, and a line under the greeting says which game is being
// played, by its name (D290). The saved games (D70) are listed under Load a game
// by their names, each played or deleted from there; New game begins the story
// again for a new wizard; a game can be kept as a file and given back as one more
// game, whose name is asked before it is added (D291).

import { t } from '../i18n';
import * as progress from '../progress/progress';
import type { SavedGame } from '../progress/games';
import {
  exportProgress,
  GAME_NAME_MAX,
  importProgress,
  isNameCharacter,
  type Progress,
  sameName,
  type Wizard,
} from '../progress/store';
import { welcomeSection } from './about';
import { element } from './dom';
import { portrait } from './portraits';
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

/** The saved games, each by its name, its wizard's under it when they differ, where
 * it is, how long it has been played and when, and Play and Delete (D70, D290).
 * Hidden until Load a game opens it. */
function gamesList(saved: SavedGame[], parts: StartScreenParts, redraw: () => void): HTMLElement {
  const current = progress.currentGame();
  const rows = saved.map((game) => {
    const wizard = game.progress.wizard as Wizard;
    const name = game.name ?? wizard.name;
    const figure = portrait(`wizard-${wizard.look}`, 'small');
    const play = element('button', { type: 'button', className: 'play' }, [t('start.play')]);
    play.addEventListener('click', () => {
      progress.chooseGame(game.id);
      parts.onChanged();
    });
    const remove = element('button', { type: 'button', className: 'quiet-button delete' }, [t('start.delete')]);
    remove.addEventListener('click', () => {
      if (!window.confirm(t('start.delete_confirm', { name }))) return;
      progress.deleteGame(game.id);
      if (game.id === current) parts.onChanged();
      else redraw();
    });
    const row = element('li', { className: 'game' }, [
      figure,
      element('div', { className: 'game-about' }, [
        element('strong', { className: 'game-name' }, [name]),
        ...(sameName(name, wizard.name) ? [] : [element('span', { className: 'game-wizard' }, [wizard.name])]),
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

/** A game read from a file and waiting for its name (D291), with the name written
 * so far. */
interface Brought {
  game: Progress;
  name: string;
}

/** The small form that asks the name of a game brought from a file, under Export
 * and Import: the name offered is the one the game takes from its wizard (D291);
 * Import it adds the game with the name written, Cancel and Escape bring nothing. */
function importForm(brought: Brought, onAdded: () => void, onClosed: () => void): HTMLElement {
  const field = element('input', {
    id: 'import-name',
    type: 'text',
    value: brought.name,
    maxLength: GAME_NAME_MAX,
    autocomplete: 'off',
    spellcheck: false,
  });
  const rule = element('p', { id: 'import-name-rule', className: 'wizard-rule', hidden: true }, [
    t('wizard.game_name_rule'),
  ]);
  const taken = element('p', { id: 'import-name-taken', className: 'wizard-rule', hidden: true }, [
    t('wizard.game_name_taken'),
  ]);
  const done = element('button', { id: 'import-done', type: 'button', className: 'quiet-button' }, [
    t('start.import_done'),
  ]);
  const cancel = element('button', { id: 'import-cancel', type: 'button', className: 'quiet-button' }, [
    t('start.import_cancel'),
  ]);
  const ready = () => {
    const named = progress.checkNewGameName(brought.name);
    taken.hidden = named !== 'taken';
    done.disabled = named !== 'ok';
  };
  const add = () => {
    if (progress.addGame(brought.game, brought.name)) onAdded();
  };
  field.addEventListener('input', () => {
    // A character the rule refuses is taken out as it is typed, and the rule said.
    const typed = field.value;
    const allowed = [...typed].filter(isNameCharacter).join('');
    rule.hidden = allowed === typed;
    if (allowed !== typed) field.value = allowed;
    brought.name = allowed;
    ready();
  });
  done.addEventListener('click', add);
  cancel.addEventListener('click', onClosed);
  const form = element('div', { id: 'import-form', className: 'import-form' }, [
    element('label', { className: 'wizard-field', htmlFor: 'import-name' }, [t('start.import_name')]),
    field,
    rule,
    taken,
    element('div', { className: 'start-actions' }, [done, cancel]),
  ]);
  form.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target === field) {
      event.preventDefault();
      if (!done.disabled) add();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClosed();
    }
  });
  ready();
  return form;
}

export function startScreen(parts: StartScreenParts): Screen {
  const node = element('div', { className: 'start-screen' });
  const message = element('p', { id: 'start-message', className: 'start-message', hidden: true });
  // A game brought from a file, while its name is asked.
  let brought: Brought | null = null;

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
      picker.value = '';
      if (!file) return;
      let game: Progress;
      try {
        game = importProgress(await file.text());
      } catch {
        message.textContent = t('start.import_failed');
        message.hidden = false;
        return;
      }
      message.hidden = true;
      // The language the child chose stays as it is now: the file brings a game.
      const now = progress.load();
      game.language = now.language;
      game.settings = now.settings;
      // A file from before the wizard was made keeps the one made since.
      game.wizard ??= now.wizard;
      // A game with no wizard at all is added with no name: the creator names it.
      if (!game.wizard) {
        progress.addGame(game);
        parts.onChanged();
        return;
      }
      brought = { game, name: progress.offeredGameName(game.wizard.name, false) };
      draw();
      node.querySelector<HTMLInputElement>('#import-name')?.focus();
    });
    const hello = element('h2', {}, [wizard ? t('start.hello') : t('start.welcome')]);
    const greeting: HTMLElement[] = [hello];
    if (wizard) {
      const shown = portrait(`wizard-${wizard.look}`, 'medium');
      shown.id = 'start-figure';
      // Which game is being played, under the hello (D290).
      const name = progress.currentGameName();
      const told = name
        ? [element('p', { id: 'current-game', className: 'current-game' }, [t('start.current_game', { name })])]
        : [];
      greeting.splice(0, 1, shown, element('div', { className: 'start-hello' }, [hello, ...told]));
    }
    const asking = brought
      ? [
          importForm(
            brought,
            () => {
              brought = null;
              parts.onChanged();
            },
            () => {
              brought = null;
              draw();
              node.querySelector<HTMLElement>('#import')?.focus();
            },
          ),
        ]
      : [];
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
        ...asking,
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
