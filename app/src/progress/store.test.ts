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

  it('keep the most stars a level has earned, and no program (D131)', () => {
    progress.markWon('a', 2);
    progress.markWon('a', 1);
    expect(progress.levelProgress('a')).toEqual({ won: true, stars: 2 });
  });

  it('leave a program an older saved game kept as it was, and add none (D131)', () => {
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
