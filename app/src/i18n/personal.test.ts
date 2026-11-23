import { describe, expect, it } from 'vitest';
import { personal, friendOf, mateOf } from './personal';

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

  it("names the dormitory mate, the friend of the wizard's own gender (D84)", () => {
    expect(personal('{mate} y {friend}', marta, '', 'Teku', 'Nuri')).toBe('Nuri y Teku');
    expect(mateOf(marta).id).toBe('nuri');
    expect(mateOf(pablo).id).toBe('teku');
    expect(mateOf(null).id).toBe('teku');
  });

  it('puts the name in', () => {
    expect(personal('Hola, {wizard}. {wizard}!', marta)).toBe('Hola, Marta. Marta!');
  });

  it('takes the first side, and the word given, when there is no wizard', () => {
    expect(personal('Hola, {wizard}: {el mago|la maga}', null, 'Kydux')).toBe('Hola, Kydux: el mago');
  });

  it('leaves a parameter and a Python set as they are', () => {
    expect(personal('There is nothing called `{name}` here.', marta)).toBe(
      'There is nothing called `{name}` here.',
    );
    expect(personal('s = {1, 2}', marta)).toBe('s = {1, 2}');
    expect(personal('{a|b|c}', marta)).toBe('{a|b|c}');
  });
});

describe('the friend of the other gender (D77)', () => {
  const marta = { name: 'Marta', gender: 'girl' as const };
  const pablo = { name: 'Pablo', gender: 'boy' as const };

  it('is Teku for a girl wizard and Nuri for a boy, and Nuri before a wizard is made', () => {
    expect(friendOf(marta)).toEqual({ id: 'teku', gender: 'boy' });
    expect(friendOf(pablo)).toEqual({ id: 'nuri', gender: 'girl' });
    expect(friendOf(null)).toEqual({ id: 'nuri', gender: 'girl' });
  });

  it('makes the double-braced choice by the friend, the single by the wizard', () => {
    const text = '{{Un alumno|Una alumna}} saluda a {la maga|el mago}... no: {el mago|la maga} {wizard}.';
    expect(personal(text, marta, '', 'Teku')).toBe('Un alumno saluda a el mago... no: la maga Marta.');
    expect(personal('{friend} es {{nuevo|nueva}}; {wizard} está {cansado|cansada}.', pablo, '', 'Nuri')).toBe(
      'Nuri es nueva; Pablo está cansado.',
    );
  });
});

describe("the familiar's words (D266)", () => {
  const words = {
    gender: 'f' as const,
    values: { familiar: 'Lu', familiar_var: 'lu', familiar_a_kind: 'una liebre', familiar_color_word: 'blanca', familiar_source: 'x = {a|b}' },
  };

  it('fills its placeholders and the choice by its kind, and leaves them with none', () => {
    const text = 'Es {familiar_a_kind} {familiar_color_word}: {familiar:el|la} de {wizard}, {familiar}.';
    expect(personal(text, { name: 'Ana', gender: 'girl' }, '', '', '', words)).toBe(
      'Es una liebre blanca: la de Ana, Lu.',
    );
    expect(personal('{familiar} y {mate}', { name: 'Ana', gender: 'girl' }, '', '', 'Nuri')).toBe('{familiar} y Nuri');
    expect(personal('{familiar:el|la}', null)).toBe('el');
  });

  it("reads nothing of the familiar's own class for a choice", () => {
    expect(personal('{familiar_source}', null, '', '', '', words)).toBe('x = {a|b}');
  });
});
