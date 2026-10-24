// The one progress store the game uses, and the small changes it makes to the
// document: each loads it, changes it, and saves it (D31).

import {
  defaultProgress,
  type LevelProgress,
  LocalProgressStore,
  type Progress,
  type ProgressStore,
  type Settings,
  type Wizard,
} from './store';

function browserStorage(): Pick<Storage, 'getItem' | 'setItem'> | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

let store: ProgressStore = new LocalProgressStore(browserStorage());

/** For tests, and for a remote store later: the store every helper uses. */
export function useStore(next: ProgressStore): void {
  store = next;
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

/** A story page read to its end (D56). */
export function markStoryRead(storyId: string): void {
  change((progress) => {
    progress.stories[storyId] = { read: true };
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

/** Start from the beginning: the course's progress cleared; the language, the
 * settings and the wizard the child chose kept. */
export function reset(): void {
  const kept = store.load();
  const fresh = defaultProgress();
  fresh.language = kept.language;
  fresh.settings = kept.settings;
  fresh.wizard = kept.wizard;
  store.save(fresh);
}
