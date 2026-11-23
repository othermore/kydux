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
    progress.setSetting('fontSize', 20);
    progress.newGame();
    expect(progress.settings()).toMatchObject({ fontSize: 20 });
  });

  it('brings a game kept with another letter over to Inconsolata at 16, once, and keeps the size of any other (D238)', () => {
    progress.setWizard(ANA);
    const key = `kydux.game.${games.current()}`;
    const kept = (settings: object) => {
      const document = JSON.parse(storage.getItem(key) ?? '{}');
      storage.setItem(key, JSON.stringify({ ...document, settings: { ...document.settings, ...settings } }));
    };
    kept({ codeFont: 'noto-semi-14', fontSize: 14 });
    expect(games.load().settings.fontSize).toBe(16);
    // Saved again, the game keeps no letter: the next read finds none.
    games.save(games.load());
    expect(JSON.parse(storage.getItem(key) ?? '{}').settings).not.toHaveProperty('codeFont');
    expect(games.load().settings.fontSize).toBe(16);
    kept({ codeFont: 'inconsolata-16', fontSize: 20 });
    expect(games.load().settings.fontSize).toBe(20);
    storage.setItem(key, JSON.stringify({ ...JSON.parse(storage.getItem(key) ?? '{}'), settings: { fontSize: 24 } }));
    expect(games.load().settings.fontSize).toBe(24);
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

  it('makes the single document of before a game named by its wizard (D291)', () => {
    const before = memoryStorage();
    before.setItem('kydux.progress', JSON.stringify({ version: PROGRESS_VERSION, wizard: ANA }));
    expect(new GamesStore(before, clock()).entries().map((entry) => entry.name)).toEqual(['Ana']);
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

describe("a game's name (D290, D291)", () => {
  const MARTA = { name: 'Marta', gender: 'girl' as const, look: 'teal' };

  /** A storage with the list of before: entries with no name, and each game's
   * document, begun a day apart in the order given. */
  function listOfBefore(wizards: ({ name: string; gender: 'girl' | 'boy'; look: string } | null)[], extra = {}) {
    const storage = memoryStorage();
    const entries = wizards.map((wizard, index) => {
      const id = `g${index}`;
      storage.setItem(`kydux.game.${id}`, JSON.stringify({ version: PROGRESS_VERSION, wizard }));
      const day = `2026-10-${String(10 + index).padStart(2, '0')}T10:00:00.000Z`;
      return { id, created: day, played: `2026-11-${String(20 - index).padStart(2, '0')}T10:00:00.000Z`, seconds: 0, ...extra };
    });
    storage.setItem('kydux.games', JSON.stringify(entries));
    return storage;
  }

  const namesById = (games: GamesStore) =>
    Object.fromEntries(games.entries().map((entry) => [entry.id, entry.name]));

  it('names a list of before by its wizards, the game begun first taking its name first', () => {
    const storage = listOfBefore([MARTA, LEO, { ...MARTA, look: 'sky' }, { ...MARTA, name: 'marta' }]);
    const games = new GamesStore(storage, clock());
    expect(namesById(games)).toEqual({ g0: 'Marta', g1: 'Leo', g2: 'Marta 2', g3: 'marta 3' });
    expect(games.games().map((game) => game.name)).toEqual(['Marta', 'Leo', 'Marta 2', 'marta 3']);
  });

  it('a second opening of the list changes nothing, and writes nothing', () => {
    const storage = listOfBefore([MARTA, MARTA]);
    new GamesStore(storage, clock());
    const kept = storage.getItem('kydux.games');
    let writes = 0;
    const counted = { ...storage, setItem: (key: string, value: string) => { writes += 1; storage.setItem(key, value); } };
    expect(namesById(new GamesStore(counted, clock()))).toEqual({ g0: 'Marta', g1: 'Marta 2' });
    expect(writes).toBe(0);
    expect(storage.getItem('kydux.games')).toBe(kept);
  });

  it('a game named keeps its name; one with no wizard is left with none', () => {
    const storage = listOfBefore([MARTA, MARTA, null]);
    const list = JSON.parse(storage.getItem('kydux.games') ?? '[]');
    list[1].name = 'Marta';
    storage.setItem('kydux.games', JSON.stringify(list));
    // The game begun second keeps its name, and the first is numbered round it.
    expect(namesById(new GamesStore(storage, clock()))).toEqual({ g0: 'Marta 2', g1: 'Marta', g2: undefined });
  });

  it('reads an entry with a name that breaks the rule, or another\'s, with none, and names it', () => {
    const storage = listOfBefore([MARTA, LEO]);
    const list = JSON.parse(storage.getItem('kydux.games') ?? '[]');
    list[0].name = '<b>';
    list[1].name = 'x'.repeat(31);
    storage.setItem('kydux.games', JSON.stringify(list));
    expect(namesById(new GamesStore(storage, clock()))).toEqual({ g0: 'Marta', g1: 'Leo' });
    const twice = listOfBefore([MARTA, LEO], { name: 'Same' });
    expect(namesById(new GamesStore(twice, clock()))).toEqual({ g0: 'Same', g1: 'Leo' });
  });

  it('adds a game with the name given, and refuses a name taken or against the rule', () => {
    const games = new GamesStore(memoryStorage(), clock());
    progress.useGames(games);
    progress.keepWizard(MARTA, 'Marta');
    const brought = defaultProgress();
    brought.wizard = MARTA;
    expect(progress.offeredGameName('Marta', false)).toBe('Marta 2');
    expect(progress.addGame(brought, 'MARTA ')).toBe(false);
    expect(progress.addGame(brought, 'Marta?')).toBe(false);
    expect(games.entries()).toHaveLength(1);
    expect(progress.addGame(brought, ' The second ')).toBe(true);
    expect(progress.currentGameName()).toBe('The second');
    // A file's game with no name given takes the automatic one; one with no wizard, none.
    expect(progress.addGame(brought)).toBe(true);
    expect(progress.currentGameName()).toBe('Marta 2');
    expect(progress.addGame(defaultProgress())).toBe(true);
    expect(progress.currentGameName()).toBeNull();
  });

  it("keeps a made wizard's gender and look, whatever setWizard is given (D292)", () => {
    progress.useGames(new GamesStore(memoryStorage(), clock()));
    progress.setWizard(MARTA);
    progress.setWizard({ name: 'Mar', gender: 'boy', look: 'amber' });
    expect(progress.wizard()).toEqual({ name: 'Mar', gender: 'girl', look: 'teal' });
    expect(progress.keepWizard({ name: 'Leo', gender: 'boy', look: 'amber' }, 'Leo')).toBe(true);
    expect(progress.wizard()).toEqual({ name: 'Leo', gender: 'girl', look: 'teal' });
    // A new game begins with no wizard, and there all is chosen (D64).
    progress.newGame();
    progress.setWizard(LEO);
    expect(progress.wizard()).toEqual(LEO);
  });

  it('naming refuses another game\'s name in any case of letters, and takes the game\'s own', () => {
    const games = new GamesStore(memoryStorage(), clock());
    progress.useGames(games);
    expect(progress.keepWizard(MARTA, 'marta')).toBe(true);
    progress.newGame();
    expect(progress.offeredGameName('Marta')).toBe('Marta 2');
    expect(progress.checkGameName('MARTA')).toBe('taken');
    expect(progress.keepWizard(LEO, 'Marta')).toBe(false);
    expect(progress.wizard()).toBeNull();
    expect(progress.checkGameName('  ')).toBe('invalid');
    expect(progress.keepWizard(LEO, 'Leo')).toBe(true);
    const leo = games.current() as string;
    const marta = games.entries().find((entry) => entry.id !== leo)?.id as string;
    expect(games.rename(leo, 'mArTa')).toBe('taken');
    progress.chooseGame(marta);
    // Its own name, in other letters, is the game's to take.
    expect(progress.checkGameName('Marta')).toBe('ok');
    expect(progress.offeredGameName('Marta')).toBe('Marta');
    expect(progress.keepWizard(MARTA, 'Marta')).toBe(true);
    expect(progress.currentGameName()).toBe('Marta');
    expect(games.rename(marta, 'Leo')).toBe('taken');
  });
});
