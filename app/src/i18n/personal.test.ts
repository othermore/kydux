import { describe, expect, it } from 'vitest';
import { personal } from './personal';

const marta = { name: 'Marta', gender: 'girl' as const };
const pablo = { name: 'Pablo', gender: 'boy' as const };

describe('personal', () => {
  it('takes the side of a choice the wizard is', () => {
    expect(personal('{El mago|La maga} avanza.', marta)).toBe('La maga avanza.');
    expect(personal('{El mago|La maga} avanza.', pablo)).toBe('El mago avanza.');
  });

  it('lets a side be empty, so an ending can vary', () => {
    expect(personal('está cansad{o|a}', marta)).toBe('está cansada');
    expect(personal('{|ella }llega', pablo)).toBe('llega');
  });

  it('puts the name in', () => {
    expect(personal('Hola, {wizard}. {wizard}!', marta)).toBe('Hola, Marta. Marta!');
  });

  it('takes the first side, and the word given, when there is no wizard', () => {
    expect(personal('Hola, {wizard}: {el mago|la maga}', null, 'aprendiz')).toBe('Hola, aprendiz: el mago');
  });

  it('leaves a parameter and a Python set as they are', () => {
    expect(personal('There is nothing called `{name}` here.', marta)).toBe(
      'There is nothing called `{name}` here.',
    );
    expect(personal('s = {1, 2}', marta)).toBe('s = {1, 2}');
    expect(personal('{a|b|c}', marta)).toBe('{a|b|c}');
  });
});
