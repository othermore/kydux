import { beforeEach, describe, expect, it } from 'vitest';
import { GamesStore } from './games';
import * as progress from './progress';
import { defaultProgress, PROGRESS_VERSION } from './store';

function memoryStorage() {
  const kept = new Map<string, string>();
  return {
    kept,
    getItem: (key: string) => kept.get(key) ?? null,
    setItem: (key: string, value: string) => void kept.set(key, value),
    removeItem: (key: string) => void kept.delete(key),
  };
}

/** A clock that moves a minute at each reading, so that every save is later. */
function clock(): () => Date {
  let minutes = 0;
  return () => new Date(Date.UTC(2026, 9, 22, 18, minutes++));
}

const ANA = { name: 'Ana', gender: 'girl' as const, look: 'teal' };
const LEO = { name: 'Leo', gender: 'boy' as const, look: 'amber' };

describe('GamesStore (D70)', () => {
  let storage: ReturnType<typeof memoryStorage>;
  let games: GamesStore;
  beforeEach(() => {
    storage = memoryStorage();
    games = new GamesStore(storage, clock());
    progress.useGames(games);
  });

  it('begins a game at its first save, and lists it once it has a wizard', () => {
    expect(games.current()).toBeNull();
    expect(progress.load()).toEqual(defaultProgress());
    progress.markStoryRead('the-letter');
    expect(games.current()).not.toBeNull();
    expect(progress.savedGames()).toEqual([]);
    progress.setWizard(ANA);
    expect(progress.savedGames().map((g) => g.progress.wizard?.name)).toEqual(['Ana']);
  });

  it('keeps each game apart, and plays the one chosen from where it was left', () => {
    progress.setWizard(ANA);
    progress.markWon('the-gate', 3);
    const ana = games.current() as string;
    progress.newGame();
    expect(progress.wizard()).toBeNull();
    progress.setWizard(LEO);
    expect(progress.levelProgress('the-gate')).toEqual({});
    // The last played first.
    expect(progress.savedGames().map((g) => g.progress.wizard?.name)).toEqual(['Leo', 'Ana']);
    progress.chooseGame(ana);
    expect(progress.wizard()?.name).toBe('Ana');
    expect(progress.levelProgress('the-gate').stars).toBe(3);
  });

  it('drops a game left without a wizard when another begins', () => {
    progress.setWizard(ANA);
    progress.newGame();
    progress.markStoryRead('the-letter');
    expect(games.entries()).toHaveLength(2);
    progress.newGame();
    progress.markStoryRead('the-letter');
    expect(games.entries()).toHaveLength(2);
    expect([...storage.kept.keys()].filter((key) => key.startsWith('kydux.game.'))).toHaveLength(2);
  });

  it('a new game keeps the machine\'s language and settings', () => {
    progress.setWizard(ANA);
    progress.setSetting('fontSize', 22);
    progress.newGame();
    expect(progress.settings().fontSize).toBe(22);
  });

  it('counts play time to the game being played, and deletes a game', () => {
    progress.setWizard(ANA);
    progress.addPlayTime(10);
    progress.addPlayTime(10);
    const [ana] = progress.savedGames();
    expect(ana?.seconds).toBe(20);
    progress.deleteGame(ana?.id as string);
    expect(progress.savedGames()).toEqual([]);
    expect(games.current()).toBeNull();
    expect([...storage.kept.keys()].some((key) => key.startsWith('kydux.game.'))).toBe(false);
  });

  it('adds a game brought from a file, and plays it', () => {
    progress.setWizard(ANA);
    const brought = defaultProgress();
    brought.wizard = LEO;
    progress.addGame(brought);
    expect(progress.wizard()?.name).toBe('Leo');
    expect(progress.savedGames()).toHaveLength(2);
  });

  it('makes the single document of before the first game, once', () => {
    const before = memoryStorage();
    before.setItem('kydux.progress', JSON.stringify({ version: PROGRESS_VERSION, wizard: ANA }));
    const moved = new GamesStore(before, clock());
    expect(moved.games().map((g) => g.progress.wizard?.name)).toEqual(['Ana']);
    expect(moved.load().wizard?.name).toBe('Ana');
    expect(before.kept.has('kydux.progress')).toBe(false);
  });

  it('keeps the games in memory when the storage cannot be written', () => {
    const broken = { ...memoryStorage(), setItem: () => { throw new Error('full'); } };
    const kept = new GamesStore(broken, clock());
    progress.useGames(kept);
    progress.setWizard(ANA);
    expect(progress.wizard()?.name).toBe('Ana');
    expect(progress.savedGames()).toHaveLength(1);
  });
});
