// The start screen: where the game opens, one screen with or without a wizard (D293).
// Before the child has made one, its big button, Start game, begins the story; after,
// Continue game goes to the item of the course last opened and The map opens the map.
// Beside the hello, over the name of the game being played (D290), a pencil opens the
// wizard to change the names.
// The saved games (D70) are listed in a box as soon as there is one, each by its
// name, the one being played marked as the open one, the others played from
// there, each kept as a file or deleted; in the box's corner, New game begins the
// story again for a new wizard and Import gives a file back as one more game,
// whose name is asked before it is added (D291).

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
import { backdrop } from './decor';
import { element } from './dom';
import { pencilIcon } from './icons';
import { portrait } from './portraits';
import type { Screen } from './screen';

export interface StartScreenParts {
  /** The address Continue game goes to. */
  continueTo: string;
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

/** The name of the file a game is kept as: the game's name, its spaces and
 * apostrophes as hyphens. */
function fileName(name: string): string {
  return `kydux-${name.trim().replace(/[\s'’]+/g, '-')}.json`;
}

/** The saved games' rows, each by its name, its wizard's under it when they differ,
 * where it is, how long it has been played and when (D70, D290). The game being
 * played is marked as the open one and has no Play; every game has Export, which
 * keeps it as a file, and Delete (D293). */
function gameRows(saved: SavedGame[], parts: StartScreenParts, redraw: () => void): HTMLElement[] {
  const current = progress.currentGame();
  return saved.map((game) => {
    const wizard = game.progress.wizard as Wizard;
    const name = game.name ?? wizard.name;
    const open = game.id === current;
    const figure = portrait(`wizard-${wizard.look}`, 'small');
    const play = element('button', { type: 'button', className: 'big-button play' }, [t('start.play')]);
    play.addEventListener('click', () => {
      progress.chooseGame(game.id);
      parts.onChanged();
    });
    const keep = element('button', { type: 'button', className: 'quiet-button export' }, [t('start.export')]);
    keep.addEventListener('click', () => download(fileName(name), exportProgress(game.progress)));
    const remove = element('button', { type: 'button', className: 'quiet-button delete' }, [t('start.delete')]);
    remove.addEventListener('click', () => {
      if (!window.confirm(t('start.delete_confirm', { name }))) return;
      progress.deleteGame(game.id);
      if (open) parts.onChanged();
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
      element('div', { className: 'game-buttons' }, [
        open ? element('span', { className: 'game-open' }, [t('start.open_now')]) : play,
        keep,
        remove,
      ]),
    ]);
    row.dataset.game = game.id;
    if (open) row.dataset.current = 'true';
    return row;
  });
}

/** A game read from a file and waiting for its name (D291), with the name written
 * so far. */
interface Brought {
  game: Progress;
  name: string;
}

/** The small form that asks the name of a game brought from a file, under Import:
 * the name offered is the one the game takes from its wizard (D291);
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
  // The painting behind the page and the school's people at its sides (D294).
  const decor = backdrop();
  const message = element('p', { id: 'start-message', className: 'start-message', hidden: true });
  // A game brought from a file, while its name is asked.
  let brought: Brought | null = null;

  const draw = () => {
    const { wizard } = parts;
    const go = wizard
      ? element('a', { id: 'continue', className: 'big-button', href: parts.continueTo }, [t('start.continue')])
      : element('a', { id: 'continue', className: 'big-button', href: parts.opening }, [t('start.begin')]);
    const map = element('a', { id: 'map-link', className: 'quiet-button', href: '#map' }, [t('start.map')]);
    const fresh = element('button', { id: 'new', type: 'button', className: 'quiet-button' }, [
      t('start.new'),
    ]);
    fresh.addEventListener('click', () => {
      // A new game begins with the story again; the game being played stays saved.
      progress.newGame();
      location.hash = parts.opening;
    });
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
      // The pencil beside the wizard's name opens the wizard, where the two names are changed.
      const change = element('a', { id: 'change-wizard', className: 'icon-button', href: '#wizard' }, [pencilIcon()]);
      change.setAttribute('aria-label', t('start.change_wizard'));
      change.title = t('start.change_wizard');
      const named = element('div', { className: 'start-name' }, [hello, change]);
      greeting.splice(0, 1, shown, element('div', { className: 'start-hello' }, [named, ...told]));
    }
    // The name asked of a game brought from a file, and the word of a file refused.
    const bringing = [
      ...(brought
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
        : []),
      message,
    ];
    const saved = progress.savedGames();
    // The box of the saved games, once there is one; before, Import stands beside the
    // big button, for a game kept as a file in another browser.
    const games =
      saved.length > 0
        ? [
            element('section', { id: 'games', className: 'games' }, [
              element('div', { className: 'games-top' }, [
                element('h3', {}, [t('start.games')]),
                element('div', { className: 'games-actions' }, [fresh, imported, picker]),
              ]),
              element('p', { id: 'saved-note', className: 'saved-note' }, [t('start.saved')]),
              ...bringing,
              element('ul', {}, gameRows(saved, parts, () => draw())),
            ]),
          ]
        : bringing;
    node.replaceChildren(
      element('div', { className: 'start-greeting' }, greeting),
      element('div', { className: 'start-actions' }, [
        go,
        ...(wizard ? [map] : []),
        ...(saved.length > 0 ? [] : [imported, picker]),
      ]),
      ...games,
      decor,
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
