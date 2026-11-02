import { beforeEach, describe, expect, it } from 'vitest';
import * as progress from './progress';
import {
  defaultProgress,
  exportProgress,
  importProgress,
  LocalProgressStore,
  PROGRESS_VERSION,
  readProgress,
  readWizard,
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
    expect(read.settings).toEqual({ speed: 1, fontSize: 17, split: 0.5, sound: true });
    expect(read.levels.a).toEqual({ stars: 2 });
    expect(read.levels.b).toEqual({});
    expect(read.levels.c).toEqual({});
    expect(read.started).toEqual(['a']);
    expect(read.current).toBeNull();
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

  it('keep the most stars a level has earned, and its winning code', () => {
    progress.markWon('a', 2, 'two');
    progress.markWon('a', 1, 'one');
    expect(progress.levelProgress('a')).toEqual({ won: true, stars: 2, code: 'one' });
  });

  it('remember the start cards seen, the hints shown and the settings', () => {
    expect(progress.hasStarted('a')).toBe(false);
    progress.markStarted('a');
    progress.markStarted('a');
    expect(progress.load().started).toEqual(['a']);
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
