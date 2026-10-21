import { afterEach, describe, expect, it } from 'vitest';
import { initLanguage } from '../i18n';
import { blockedText } from './words';

const english = { languages: ['en'], storage: null };
const spanish = { languages: ['es'], storage: null };

afterEach(() => initLanguage(english));

describe('blockedText', () => {
  it('says why an action could not be done, with the thing named', () => {
    initLanguage(english);
    expect(blockedText('far', 'door')).toBe('I cannot reach the door from here.');
    expect(blockedText('locked', 'door')).toBe(
      'I cannot open the door: it is locked, and I have no key for it.',
    );
    expect(blockedText('nothing', null)).toBe('There is nothing here to pick up.');
    expect(blockedText('unknown_action', null)).toBe('I do not know this action yet.');
  });

  it('says it in Spanish, with the article the thing takes', () => {
    initLanguage(spanish);
    expect(blockedText('far', 'door')).toBe('No llego a la puerta desde aquí.');
    expect(blockedText('open', 'door')).toBe('No hace falta: la puerta ya está abierta.');
  });
});
