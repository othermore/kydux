import { beforeEach, describe, expect, it } from 'vitest';
import * as progress from './progress';
import {
  defaultProgress,
  exportProgress,
  importProgress,
  LocalProgressStore,
  PROGRESS_VERSION,
  readProgress,
  readFamiliar,
  readWizard,
  automaticName,
  gameName,
  sameName,
  wizardName,
} from './store';

function memoryStorage() {
  const kept = new Map<string, string>();
  return {
    kept,
    getItem: (key: string) => kept.get(key) ?? null,
    setItem: (key: string, value: string) => void kept.set(key, value),
  };
}

const throwing = {
  getItem: () => {
    throw new Error('denied');
  },
  setItem: () => {
    throw new Error('denied');
  },
};

describe('LocalProgressStore', () => {
  it('gives the defaults when there is nothing kept', () => {
    expect(new LocalProgressStore(memoryStorage()).load()).toEqual(defaultProgress());
  });

  it('reads back what it saved, under one key', () => {
    const storage = memoryStorage();
    const store = new LocalProgressStore(storage);
    const saved = defaultProgress();
    saved.levels['the-long-corridor'] = { won: true, stars: 1, code: 'wizard.move_right(6)\n' };
    saved.settings.fontSize = 24;
    store.save(saved);
    expect([...storage.kept.keys()]).toEqual(['kydux.progress']);
    expect(store.load()).toEqual(saved);
  });

  it('reads a document of another version, or not JSON, as the defaults', () => {
    const storage = memoryStorage();
    storage.setItem('kydux.progress', JSON.stringify({ version: PROGRESS_VERSION + 1, levels: { x: { won: true } } }));
    expect(new LocalProgressStore(storage).load()).toEqual(defaultProgress());
    storage.setItem('kydux.progress', '{ not json');
    expect(new LocalProgressStore(storage).load()).toEqual(defaultProgress());
  });

  it('keeps only fields of the right shape', () => {
    const storage = memoryStorage();
    storage.setItem(
      'kydux.progress',
      JSON.stringify({
        version: PROGRESS_VERSION,
        settings: { speed: 3, fontSize: 'big', split: 0.5 },
        levels: { a: { won: 'yes', stars: 2 }, b: { stars: 9, hints: -1 }, c: { stars: 1.5 } },
        started: ['a', 7],
        current: 'nonsense',
      }),
    );
    const read = new LocalProgressStore(storage).load();
    expect(read.settings).toEqual({
      speed: 1,
      fontSize: 16,
      split: 0.5,
      sound: true,
      music: 0.6,
    });
    expect(read.levels.a).toEqual({ stars: 2 });
    expect(read.levels.b).toEqual({});
    expect(read.levels.c).toEqual({});
    expect(read.current).toBeNull();
  });

  it('reads a game that kept the start cards seen, and saves it back with no such list (D248)', () => {
    const storage = memoryStorage();
    storage.setItem('kydux.progress', JSON.stringify({ version: PROGRESS_VERSION, levels: { a: { won: true } }, started: ['a'] }));
    const store = new LocalProgressStore(storage);
    const read = store.load();
    expect(read.levels.a).toEqual({ won: true });
    expect('started' in read).toBe(false);
    store.save(read);
    expect(JSON.parse(storage.getItem('kydux.progress') ?? '{}')).not.toHaveProperty('started');
  });

  it("reads the editor's size, 16 where none is kept or one not offered (D238)", () => {
    const read = (settings: object) => readProgress({ version: PROGRESS_VERSION, settings })?.settings;
    expect(read({})).toMatchObject({ fontSize: 16 });
    expect(read({ fontSize: 24 })).toMatchObject({ fontSize: 24 });
    expect(read({ fontSize: 17 })).toMatchObject({ fontSize: 16 });
  });

  it('reads a game kept while another letter was tried with its editor at 16, and keeps no letter (D238)', () => {
    const read = (settings: object) => readProgress({ version: PROGRESS_VERSION, settings })?.settings;
    expect(read({ codeFont: 'noto-semi-14', fontSize: 14 })).toEqual(expect.objectContaining({ fontSize: 16 }));
    expect(read({ codeFont: 'noto-condensed-14', fontSize: 24 })).toEqual(expect.objectContaining({ fontSize: 16 }));
    expect(read({ codeFont: 'inconsolata-16', fontSize: 20 })).toEqual(expect.objectContaining({ fontSize: 20 }));
    expect(read({ codeFont: 'noto-semi-14', fontSize: 14 })).not.toHaveProperty('codeFont');
  });

  it('keeps a story as the item last opened, as a lesson and a level (D122)', () => {
    for (const item of ['story:the-morning', 'lesson:the-distance', 'level:the-gate']) {
      expect(readProgress({ version: PROGRESS_VERSION, current: item })?.current).toBe(item);
    }
  });

  it('keeps the document in memory for the visit when storage throws', () => {
    const store = new LocalProgressStore(throwing);
    const saved = defaultProgress();
    saved.current = 'level:the-locked-door';
    store.save(saved);
    expect(store.load().current).toBe('level:the-locked-door');
  });
});

describe('export and import', () => {
  it('give back the same document', () => {
    const saved = defaultProgress();
    saved.lessons['what-a-program-is'] = { read: true };
    expect(importProgress(exportProgress(saved))).toEqual(saved);
  });

  it('refuse a file that is not a progress document', () => {
    expect(() => importProgress('hello')).toThrow();
    expect(() => importProgress('{"version": 99}')).toThrow();
  });
});

describe('the helpers', () => {
  beforeEach(() => progress.useStore(new LocalProgressStore(memoryStorage())));

  it('keep the most stars a level has earned, and no program of the level (D351)', () => {
    progress.markWon('a', 2);
    progress.markWon('a', 1);
    expect(progress.levelProgress('a')).toEqual({ won: true, stars: 2 });
  });

  it('keep one program, the last level changed, dropped on its starting code (D351)', () => {
    progress.keepProgram('a', 'wizard.move_right(6)\n', '# Walk\n');
    expect(progress.keptProgram('a')).toBe('wizard.move_right(6)\n');
    expect(progress.keptProgram('b')).toBeNull();
    // Another level's code takes its place.
    progress.keepProgram('b', 'wizard.move_up()\n', '');
    expect(progress.keptProgram('a')).toBeNull();
    expect(progress.load().program).toEqual({ level: 'b', code: 'wizard.move_up()\n' });
    // A level's starting code is no program: another level's kept program stays.
    progress.keepProgram('a', '# Walk\n', '# Walk\n');
    expect(progress.keptProgram('b')).toBe('wizard.move_up()\n');
    // Its own is dropped.
    progress.keepProgram('b', '', '');
    expect(progress.load().program).toBeUndefined();
    // Winning drops nothing; Original drops it.
    progress.keepProgram('a', 'wizard.move_right(6)\n', '# Walk\n');
    progress.markWon('a', 3);
    expect(progress.keptProgram('a')).toBe('wizard.move_right(6)\n');
    progress.dropProgram('b');
    expect(progress.keptProgram('a')).toBe('wizard.move_right(6)\n');
    progress.dropProgram('a');
    expect(progress.keptProgram('a')).toBeNull();
  });

  it('read a saved game with no kept program as before, and carry one in the exported file (D351)', () => {
    const saved = defaultProgress();
    expect(readProgress(JSON.parse(exportProgress(saved)))).toEqual(saved);
    saved.program = { level: 'the-lost-book', code: 'mine = wizard.find_nearest("book")\n' };
    expect(importProgress(exportProgress(saved)).program).toEqual(saved.program);
    expect(readProgress({ ...saved, program: { level: 'Not a level', code: 'x' } })?.program).toBeUndefined();
  });

  it("keep a lesson's pages whose test is done, whatever is read after, in an older saved game too (D354)", () => {
    progress.markTested('a-name-for-a-value', 1);
    progress.markTested('a-name-for-a-value', 0);
    progress.markTested('a-name-for-a-value', 1);
    expect(progress.testedPages('a-name-for-a-value')).toEqual([0, 1]);
    progress.markRead('a-name-for-a-value');
    expect(progress.load().lessons['a-name-for-a-value']).toEqual({ read: true, tested: [0, 1] });
    expect(readProgress({ version: PROGRESS_VERSION, lessons: { old: { read: true } } })?.lessons.old).toEqual({
      read: true,
    });
    expect(readProgress({ version: PROGRESS_VERSION, lessons: { old: { tested: [-1] } } })?.lessons.old).toEqual({
      read: false,
    });
  });

  it('leave a program an older saved game kept as it was, and add none (D351)', () => {
    const saved = defaultProgress();
    saved.levels.a = { won: true, stars: 1, code: 'wizard.move_right(6)\n' };
    progress.save(saved);
    progress.markWon('a', 3);
    expect(progress.levelProgress('a')).toEqual({ won: true, stars: 3, code: 'wizard.move_right(6)\n' });
  });

  it('remember the hints shown and the settings', () => {
    progress.setHints('a', 2);
    progress.markTried('a');
    expect(progress.levelProgress('a')).toEqual({ hints: 2, tried: true });
    progress.setSetting('speed', 4);
    expect(progress.settings().speed).toBe(4);
  });

  it('keep the language for i18n', () => {
    progress.languageStorage.setItem('kydux.language', 'es');
    expect(progress.languageStorage.getItem('kydux.language')).toBe('es');
    expect(progress.load().language).toBe('es');
  });
});

describe('the wizard (D36)', () => {
  it('keeps a name of letters, digits, spaces, hyphens and apostrophes, trimmed', () => {
    expect(wizardName('  Marta ')).toBe('Marta');
    expect(wizardName('José-Luis O’Neill')).toBe('José-Luis O’Neill');
    expect(wizardName('Ñandú 2')).toBe('Ñandú 2');
    expect(wizardName('Алёна')).toBe('Алёна');
    expect(wizardName('')).toBeNull();
    expect(wizardName('   ')).toBeNull();
    expect(wizardName('a'.repeat(21))).toBeNull();
    expect(wizardName('a'.repeat(20))).toBe('a'.repeat(20));
    expect(wizardName('<b>')).toBeNull();
    expect(wizardName('{wizard}')).toBeNull();
  });

  it('reads a wizard only when every field is of its shape', () => {
    const looks = (id: string) => id === 'amber';
    expect(readWizard({ name: 'Marta', gender: 'girl', look: 'amber' }, looks)).toEqual({
      name: 'Marta',
      gender: 'girl',
      look: 'amber',
    });
    expect(readWizard({ name: 'Marta', gender: 'other', look: 'amber' }, looks)).toBeNull();
    expect(readWizard({ name: 'Marta', gender: 'girl', look: 'gold' }, looks)).toBeNull();
    expect(readWizard({ name: 'x'.repeat(30), gender: 'boy', look: 'amber' }, looks)).toBeNull();
    expect(readWizard('Marta', looks)).toBeNull();
  });

  it('is read as none in a document without one', () => {
    const storage = memoryStorage();
    storage.setItem('kydux.progress', JSON.stringify({ version: PROGRESS_VERSION }));
    expect(new LocalProgressStore(storage).load().wizard).toBeNull();
  });
});

describe('the familiar kept (D265)', () => {
  it('is read back with its draft and its living familiar, each of its shape', () => {
    const living = { kind: 'Fox', name: 'Pimu', color: 'red', source: 'class Fox(Familiar):\n    pass' };
    expect(readFamiliar({ draft: { kind: 'Fox', name: 'Pimu' }, living })).toEqual({
      draft: { kind: 'Fox', name: 'Pimu' },
      living,
    });
    expect(readFamiliar({ living: { ...living, learned: 'class Fox...' } })?.living?.learned).toBe('class Fox...');
    expect(readFamiliar({ draft: { kind: 'Fox', name: 'Pimu 2', color: 3 } })).toEqual({ draft: { kind: 'Fox' } });
    expect(readFamiliar({ living: { kind: 'Fox', name: 'Pimu', color: 'red' } })).toBeNull();
    expect(readFamiliar('Pimu')).toBeNull();
  });

  it('is none in a game with no familiar yet, and kept by the helpers', () => {
    const storage = memoryStorage();
    storage.setItem('kydux.progress', JSON.stringify({ version: PROGRESS_VERSION }));
    expect(new LocalProgressStore(storage).load().familiar).toBeUndefined();
    progress.useStore(new LocalProgressStore(memoryStorage()));
    expect(progress.familiar()).toEqual({});
    progress.keepFamiliar({ draft: { kind: 'Crow' } });
    expect(progress.familiar()).toEqual({ draft: { kind: 'Crow' } });
  });
});

describe("a game's name (D290, D291)", () => {
  it('has the characters of a wizard\'s name, 30 at most, trimmed', () => {
    expect(gameName('  Marta y Leo ')).toBe('Marta y Leo');
    expect(gameName('Partida de José-Luis O’Neill')).toBe('Partida de José-Luis O’Neill');
    expect(gameName('a'.repeat(30))).toBe('a'.repeat(30));
    expect(gameName('a'.repeat(31))).toBeNull();
    expect(gameName('')).toBeNull();
    expect(gameName('   ')).toBeNull();
    expect(gameName('Marta!')).toBeNull();
    expect(gameName(7)).toBeNull();
  });

  it('is the same name equal trimmed and without regard to case', () => {
    expect(sameName('Marta', ' marta ')).toBe(true);
    expect(sameName('Álvaro', 'ÁLVARO')).toBe(true);
    expect(sameName('Marta', 'Marta 2')).toBe(false);
  });

  it('is taken from the wizard, with the first number from 2 that makes it free', () => {
    expect(automaticName('Marta', [])).toBe('Marta');
    expect(automaticName('Marta', ['Leo'])).toBe('Marta');
    expect(automaticName('Marta', ['marta'])).toBe('Marta 2');
    expect(automaticName('Marta', ['Marta', 'Marta 2'])).toBe('Marta 3');
    expect(automaticName('Marta', ['Marta', 'Marta 3'])).toBe('Marta 2');
  });
});
