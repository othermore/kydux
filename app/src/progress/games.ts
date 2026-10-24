// The saved games (D70): several games in the browser, each a progress document
// of its own (kydux.game.<id>), listed in kydux.games with when it was begun,
// when it was last played and how long, and the one being played named in
// kydux.current. Every change saves the game being played; a game is begun by
// its first save. The single document of before, kydux.progress, becomes the
// list's first game the first time the list is read. A storage that cannot be
// read or written keeps everything in memory for the visit.

import {
  defaultProgress,
  LocalProgressStore,
  type Progress,
  type ProgressStore,
  readProgress,
} from './store';

/** A game in the list. */
export interface GameEntry {
  id: string;
  /** When it was begun and last played, as ISO dates. */
  created: string;
  played: string;
  /** How long it has been played, in seconds. */
  seconds: number;
}

/** A game as the start screen lists it: its entry and its progress. */
export interface SavedGame extends GameEntry {
  progress: Progress;
}

type Storage3 = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function isEntry(value: unknown): value is GameEntry {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === 'string' &&
    /^[a-z0-9]+$/.test(entry.id) &&
    typeof entry.created === 'string' &&
    typeof entry.played === 'string' &&
    typeof entry.seconds === 'number' &&
    entry.seconds >= 0
  );
}

export class GamesStore implements ProgressStore {
  static readonly LIST = 'kydux.games';
  static readonly CURRENT = 'kydux.current';
  static readonly GAME = 'kydux.game.';
  private readonly memory = new Map<string, string | null>();

  constructor(
    private readonly storage: Storage3 | null,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.migrate();
  }

  private get(key: string): string | null {
    if (this.memory.has(key)) return this.memory.get(key) ?? null;
    try {
      return this.storage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  private set(key: string, value: string | null): void {
    try {
      if (!this.storage) throw new Error('no storage');
      if (value === null) this.storage.removeItem(key);
      else this.storage.setItem(key, value);
      this.memory.delete(key);
    } catch {
      this.memory.set(key, value);
    }
  }

  private parsed(key: string): unknown {
    const text = this.get(key);
    try {
      return text === null ? null : JSON.parse(text);
    } catch {
      return null;
    }
  }

  /** Every game in the list, as it is kept, the last played first. */
  entries(): GameEntry[] {
    const list = this.parsed(GamesStore.LIST);
    const entries = Array.isArray(list) ? list.filter(isEntry) : [];
    return entries.sort((a, b) => b.played.localeCompare(a.played));
  }

  private keep(entries: GameEntry[]): void {
    this.set(GamesStore.LIST, JSON.stringify(entries));
  }

  /** The games with a wizard, the ones the start screen lists. */
  games(): SavedGame[] {
    return this.entries().flatMap((entry) => {
      const progress = this.game(entry.id);
      return progress?.wizard ? [{ ...entry, progress }] : [];
    });
  }

  private game(id: string): Progress | null {
    return readProgress(this.parsed(GamesStore.GAME + id));
  }

  /** The id of the game being played, or null before one is begun. */
  current(): string | null {
    const id = this.get(GamesStore.CURRENT);
    return id && this.entries().some((entry) => entry.id === id) ? id : null;
  }

  load(): Progress {
    const id = this.current();
    return (id ? this.game(id) : null) ?? this.fresh();
  }

  /** A new game's document: the machine's language and settings, from the game
   * played last, and nothing else. */
  private fresh(): Progress {
    const fresh = defaultProgress();
    const last = this.entries()[0];
    const before = last ? this.game(last.id) : null;
    if (before) {
      fresh.language = before.language;
      fresh.settings = before.settings;
    }
    return fresh;
  }

  save(progress: Progress): void {
    const id = this.current() ?? this.begin();
    this.set(GamesStore.GAME + id, JSON.stringify(progress));
    const played = this.now().toISOString();
    this.keep(this.entries().map((entry) => (entry.id === id ? { ...entry, played } : entry)));
  }

  /** A game begun: in the list, and the one being played. A game begun before and
   * left without a wizard (a creator never finished) is dropped, so that no
   * game lies forgotten in the storage. */
  private begin(): string {
    for (const entry of this.entries()) {
      if (!this.game(entry.id)?.wizard) this.remove(entry.id);
    }
    const when = this.now();
    const id = `g${when.getTime().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const stamp = when.toISOString();
    this.keep([...this.entries(), { id, created: stamp, played: stamp, seconds: 0 }]);
    this.set(GamesStore.CURRENT, id);
    return id;
  }

  /** Plays a game of the list from where it was left. */
  choose(id: string): void {
    if (this.entries().some((entry) => entry.id === id)) this.set(GamesStore.CURRENT, id);
  }

  /** The next save begins a new game; the one being played stays in the list. */
  startNew(): void {
    this.set(GamesStore.CURRENT, null);
  }

  remove(id: string): void {
    this.keep(this.entries().filter((entry) => entry.id !== id));
    this.set(GamesStore.GAME + id, null);
    if (this.get(GamesStore.CURRENT) === id) this.set(GamesStore.CURRENT, null);
  }

  /** Seconds of play added to the game being played. */
  addTime(seconds: number): void {
    const id = this.current();
    if (!id) return;
    this.keep(
      this.entries().map((entry) => (entry.id === id ? { ...entry, seconds: entry.seconds + seconds } : entry)),
    );
  }

  /** A game brought from a file: added to the list, and the one being played. */
  add(progress: Progress): string {
    this.startNew();
    this.save(progress);
    return this.current() ?? '';
  }

  /** The single document of before the list, as the list's first game. */
  private migrate(): void {
    if (this.get(GamesStore.LIST) !== null) return;
    const single = readProgress(this.parsed(LocalProgressStore.KEY));
    if (!single) return;
    this.add(single);
    this.set(LocalProgressStore.KEY, null);
  }
}
