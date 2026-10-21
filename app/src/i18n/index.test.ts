import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectLanguage, initLanguage, languages, setLanguage, speakOf, t, type Environment } from '.';

function env(browser: string[], saved: string | null = null): Environment {
  const store = new Map<string, string>(saved ? [['kydux.language', saved]] : []);
  return {
    languages: browser,
    storage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => void store.set(key, value),
    },
  };
}

afterEach(() => {
  initLanguage(env(['en']));
  speakOf(null);
});

describe('languages', () => {
  it('are the files in i18n/', () => {
    expect(languages).toEqual(expect.arrayContaining(['en', 'es']));
  });
});

describe('detectLanguage', () => {
  it('prefers the saved language', () => {
    expect(detectLanguage(env(['en-US'], 'es'))).toBe('es');
  });

  it('ignores a saved language there is no file for', () => {
    expect(detectLanguage(env(['es-ES'], 'xx'))).toBe('es');
  });

  it('takes the first browser language we have, by its primary tag', () => {
    expect(detectLanguage(env(['fr-FR', 'es-AR', 'en']))).toBe('es');
  });

  it('falls back to English', () => {
    expect(detectLanguage(env(['fr', 'de']))).toBe('en');
    expect(detectLanguage({ languages: [], storage: null })).toBe('en');
  });

  it('survives storage that throws', () => {
    const throwing: Environment = {
      languages: ['es'],
      storage: {
        getItem: () => {
          throw new Error('denied');
        },
        setItem: () => {
          throw new Error('denied');
        },
      },
    };
    expect(detectLanguage(throwing)).toBe('es');
    expect(() => setLanguage('es', throwing)).not.toThrow();
  });
});

describe('t', () => {
  it('gives the text in the current language', () => {
    initLanguage(env(['es']));
    expect(t('language.es')).toBe('Español');
    expect(t('app.tagline')).toBe('Un juego para aprender Python');
    initLanguage(env(['en']));
    expect(t('app.tagline')).toBe('A game for learning Python');
  });

  it('replaces placeholders and leaves unknown ones', () => {
    initLanguage(env(['en']));
    expect(t('app.version', { version: '0.0.1' })).toBe('Version 0.0.1');
    expect(t('app.version')).toBe('Version {version}');
  });

  it('falls back to the key, warning once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(t('no.such.key')).toBe('no.such.key');
    expect(t('no.such.key')).toBe('no.such.key');
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('remembers a language that is set', () => {
    const e = env(['en']);
    setLanguage('es', e);
    expect(e.storage?.getItem('kydux.language')).toBe('es');
    expect(t('language.en')).toBe('English');
  });
});

describe('t, for the wizard (D37)', () => {
  it('speaks of a girl as a girl, and of a boy as a boy', () => {
    initLanguage(env(['es']));
    speakOf({ name: 'Marta', gender: 'girl' });
    expect(t('notebook.title')).toBe('El cuaderno de la maga');
    expect(t('outcome.too_many_ticks', { limit: 9 })).toContain('la maga está agotada');
    speakOf({ name: 'Pablo', gender: 'boy' });
    expect(t('outcome.too_many_ticks', { limit: 9 })).toContain('el mago está agotado');
  });

  it('takes the first side with no wizard', () => {
    initLanguage(env(['es']));
    expect(t('notebook.title')).toBe('El cuaderno del mago');
  });

  it('never reads a parameter for a choice', () => {
    speakOf({ name: 'Marta', gender: 'girl' });
    expect(t('error.unknown_name', { name: '{a|b}' })).toContain('`{a|b}`');
  });
});
