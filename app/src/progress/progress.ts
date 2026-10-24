// The one progress store the game uses, the saved games' list (D70), and the small
// changes the game makes to the document of the game being played: each loads
// it, changes it, and saves it (D31).

import { GamesStore, type SavedGame } from './games';
import { type LevelProgress, type Progress, type ProgressStore, type Settings, type Wizard } from './store';

function browserStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

let games = new GamesStore(browserStorage());
let store: ProgressStore = games;

/** For tests, and for a remote store later: the store every helper uses. */
export function useStore(next: ProgressStore): void {
  store = next;
}

/** For tests: the saved games, which are the store too. */
export function useGames(next: GamesStore): void {
  games = next;
  store = next;
}

/** The saved games with a wizard, the last played first (D70). */
export function savedGames(): SavedGame[] {
  return games.games();
}

/** The id of the game being played, or null before one is begun. */
export function currentGame(): string | null {
  return games.current();
}

/** Plays a saved game, in the language and with the settings chosen now: they are
 * the machine's, not the game's. */
export function chooseGame(id: string): void {
  const { language, settings } = store.load();
  games.choose(id);
  change((progress) => {
    progress.language = language;
    progress.settings = settings;
  });
}

/** A new game: the story from the letter, a new wizard (D64); the game being
 * played stays in the list. */
export function newGame(): void {
  games.startNew();
}

export function deleteGame(id: string): void {
  games.remove(id);
}

/** A game brought from a file, added to the list and played. */
export function addGame(progress: Progress): void {
  games.add(progress);
}

/** Seconds of play, counted to the game being played. */
export function addPlayTime(seconds: number): void {
  games.addTime(seconds);
}

export function load(): Progress {
  return store.load();
}

export function save(progress: Progress): void {
  store.save(progress);
}

function change(edit: (progress: Progress) => void): Progress {
  const progress = store.load();
  edit(progress);
  store.save(progress);
  return progress;
}

export function levelProgress(id: string): LevelProgress {
  return store.load().levels[id] ?? {};
}

function editLevel(id: string, edit: (level: LevelProgress) => void): void {
  change((progress) => {
    const level = progress.levels[id] ?? {};
    edit(level);
    progress.levels[id] = level;
  });
}

/** A won run: the level won, the most stars kept, and the code that won it. */
export function markWon(id: string, stars: number, code: string): void {
  editLevel(id, (level) => {
    level.won = true;
    level.stars = Math.max(level.stars ?? 0, stars);
    level.code = code;
  });
}

/** A run that did not win: hints are offered from now on. */
export function markTried(id: string): void {
  editLevel(id, (level) => {
    level.tried = true;
  });
}

export function setCode(id: string, code: string): void {
  editLevel(id, (level) => {
    level.code = code;
  });
}

export function setHints(id: string, shown: number): void {
  editLevel(id, (level) => {
    level.hints = shown;
  });
}

export function hasStarted(id: string): boolean {
  return store.load().started.includes(id);
}

export function markStarted(id: string): void {
  change((progress) => {
    if (!progress.started.includes(id)) progress.started.push(id);
  });
}

/** A run started in a level (D57). */
export function countRun(id: string): void {
  editLevel(id, (level) => {
    level.runs = (level.runs ?? 0) + 1;
  });
}

/** A story read to its end (D56, D74). */
export function markStoryRead(storyId: string): void {
  change((progress) => {
    progress.stories[storyId] = { read: true };
  });
}

/** Whether the screen's guide has been shown (D68). */
export function guided(): boolean {
  return store.load().guided;
}

export function markGuided(): void {
  change((progress) => {
    progress.guided = true;
  });
}

export function markRead(lessonId: string): void {
  change((progress) => {
    progress.lessons[lessonId] = { ...progress.lessons[lessonId], read: true };
  });
}

export function setSetting<K extends keyof Settings>(name: K, value: Settings[K]): void {
  change((progress) => {
    progress.settings[name] = value;
  });
}

export function settings(): Settings {
  return store.load().settings;
}

export function setCurrent(item: string): void {
  change((progress) => {
    progress.current = item;
  });
}

/** The language kept in the progress document, as the storage i18n reads it from. */
export const languageStorage: Pick<Storage, 'getItem' | 'setItem'> = {
  getItem: () => store.load().language,
  setItem: (_key, value) => {
    change((progress) => {
      progress.language = value;
    });
  },
};

export function wizard(): Wizard | null {
  return store.load().wizard;
}

export function setWizard(made: Wizard): void {
  change((progress) => {
    progress.wizard = made;
  });
}

