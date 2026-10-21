// A child's progress: one JSON document behind one interface (D31). The local
// store keeps it in the browser's localStorage; a remote one can come later
// behind the same interface. Nothing else in the game keeps progress anywhere.

/** The document's shape this version of the game writes. A document of another
 * version, or none, is read as the defaults. */
export const PROGRESS_VERSION = 1;

export interface Settings {
  speed: 1 | 2 | 4;
  /** The editor's text size, in pixels. */
  fontSize: number;
  /** The scene's share of the level screen's width, from 0.35 to 0.75. */
  split: number;
}

export interface LevelProgress {
  won?: boolean;
  /** The most stars a run of the level has earned. */
  stars?: number;
  /** The last code typed in the level. */
  code?: string;
  /** How many hints have been shown. */
  hints?: number;
  /** Whether the level has been played without winning, so hints are offered. */
  tried?: boolean;
}

export interface Progress {
  version: number;
  /** The language chosen, or null for the browser's. */
  language: string | null;
  settings: Settings;
  lessons: Record<string, { read?: boolean }>;
  levels: Record<string, LevelProgress>;
  /** The levels whose start card has been seen. */
  started: string[];
  /** The item of the course last opened: `level:<id>` or `lesson:<id>`. */
  current: string | null;
}

export const DEFAULT_SETTINGS: Settings = { speed: 1, fontSize: 17, split: 0.6 };

export function defaultProgress(): Progress {
  return {
    version: PROGRESS_VERSION,
    language: null,
    settings: { ...DEFAULT_SETTINGS },
    lessons: {},
    levels: {},
    started: [],
    current: null,
  };
}

export interface ProgressStore {
  load(): Progress;
  save(progress: Progress): void;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A document read back: its known fields, each checked, the rest the defaults'.
 * Returns null for something that is not a progress document of this version. */
export function readProgress(value: unknown): Progress | null {
  if (!isObject(value) || value.version !== PROGRESS_VERSION) return null;
  const progress = defaultProgress();
  if (typeof value.language === 'string') progress.language = value.language;
  if (isObject(value.settings)) {
    const { speed, fontSize, split } = value.settings;
    if (speed === 1 || speed === 2 || speed === 4) progress.settings.speed = speed;
    if (typeof fontSize === 'number' && fontSize >= 10 && fontSize <= 40) {
      progress.settings.fontSize = fontSize;
    }
    if (typeof split === 'number' && split >= 0.35 && split <= 0.75) progress.settings.split = split;
  }
  if (isObject(value.lessons)) {
    for (const [id, lesson] of Object.entries(value.lessons)) {
      if (isObject(lesson)) progress.lessons[id] = { read: lesson.read === true };
    }
  }
  if (isObject(value.levels)) {
    for (const [id, level] of Object.entries(value.levels)) {
      if (!isObject(level)) continue;
      const kept: LevelProgress = {};
      if (typeof level.won === 'boolean') kept.won = level.won;
      if (typeof level.stars === 'number') kept.stars = level.stars;
      if (typeof level.code === 'string') kept.code = level.code;
      if (typeof level.hints === 'number') kept.hints = level.hints;
      if (typeof level.tried === 'boolean') kept.tried = level.tried;
      progress.levels[id] = kept;
    }
  }
  if (Array.isArray(value.started)) {
    progress.started = value.started.filter((id): id is string => typeof id === 'string');
  }
  if (typeof value.current === 'string') progress.current = value.current;
  return progress;
}

/** The store in the browser's localStorage. A storage that cannot be read or
 * written leaves the document in memory for the visit. */
export class LocalProgressStore implements ProgressStore {
  static readonly KEY = 'kydux.progress';
  private memory: Progress | null = null;

  constructor(private readonly storage: Pick<Storage, 'getItem' | 'setItem'> | null) {}

  load(): Progress {
    if (this.memory) return structuredClone(this.memory);
    let text: string | null = null;
    try {
      text = this.storage?.getItem(LocalProgressStore.KEY) ?? null;
    } catch {
      text = null;
    }
    let read: Progress | null = null;
    try {
      read = text ? readProgress(JSON.parse(text)) : null;
    } catch {
      read = null;
    }
    return read ?? defaultProgress();
  }

  save(progress: Progress): void {
    try {
      if (!this.storage) throw new Error('no storage');
      this.storage.setItem(LocalProgressStore.KEY, JSON.stringify(progress));
      this.memory = null;
    } catch {
      this.memory = structuredClone(progress);
    }
  }
}

/** The document as a file to keep: the JSON, pretty. */
export function exportProgress(progress: Progress): string {
  return `${JSON.stringify(progress, null, 2)}\n`;
}

/** A file given back. Throws when it is not a progress document of this version. */
export function importProgress(text: string): Progress {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('not JSON');
  }
  const progress = readProgress(value);
  if (!progress) throw new Error('not a progress document');
  return progress;
}
