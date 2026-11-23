import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initLanguage, speakOf, speakOfFamiliar } from '../i18n';
import { blockedText, bookText, bumpText, raceVerdict, ringWayText, toldText } from './words';

const english = { languages: ['en'], storage: null };
const spanish = { languages: ['es'], storage: null };

afterEach(() => {
  initLanguage(english);
  speakOf(null);
  speakOfFamiliar(null);
});

describe('blockedText', () => {
  it('says an open door\'s leaf is in the way, in both languages (D125)', () => {
    initLanguage(english);
    expect(blockedText('door_leaf', 'door')).toBe("The open door's leaf is in the way.");
    initLanguage(spanish);
    expect(blockedText('door_leaf', 'door')).toBe('La hoja de la puerta abierta está delante.');
  });

  it('says where the tale lets the wizard go no farther yet, in the owner\'s words (D171)', () => {
    initLanguage(english);
    expect(blockedText('not_inside_yet', null)).toBe(
      'Do not go in yet: stay on the threshold, past the door.',
    );
    initLanguage(spanish);
    expect(blockedText('not_inside_yet', null)).toBe(
      'No entres todavía: quédate en el umbral, pasada la puerta.',
    );
  });

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

  it('says why a spell or a door would not do (D42, D43)', () => {
    initLanguage(english);
    expect(blockedText('no_wand', null)).toBe('I do not know this action yet.');
    expect(blockedText('unknown_spell', null, { spell: 'abra' })).toBe('I do not know a spell called “abra”.');
    expect(blockedText('which_one', null, { things: ['book', 'key'] })).toBe(
      'There are several things here: book, key. Say which, like wizard.pick_up(book).',
    );
    expect(blockedText('sealed', 'door')).toBe(
      'I cannot open the door by hand: it is sealed, and needs a spell.',
    );
    initLanguage(spanish);
    expect(blockedText('password', 'door')).toBe(
      'No puedo abrir la puerta con la mano: quiere una palabra.',
    );
  });

  it('says why a pull or a gift would not do (D47, D48)', () => {
    initLanguage(english);
    expect(blockedText('nothing_near', null)).toBe('There is nothing near enough for the spell to bring.');
    expect(blockedText('not_carried', 'book')).toBe('I cannot give the book: I am not carrying it.');
    initLanguage(spanish);
    expect(blockedText('nobody', null)).toBe('No hay nadie a mi lado para dárselo.');
  });
});

describe('what a flight cannot cross, and a walk what a flight can (D186, D187)', () => {
  it('names the low cell a walk is refused on, and the high one a flight bumps on', () => {
    initLanguage({ languages: ['es'], storage: null });
    expect(blockedText('no_walk', null, { kind: 'water' })).toBe('El agua no se pisa: por aquí solo se pasa volando.');
    expect(blockedText('no_walk', null, { kind: 'lava' })).toBe('Por aquí no se anda: solo se pasa volando.');
    expect(bumpText('high', 'tree')).toBe('Las copas de los árboles no se pasan: hay que rodearlas.');
    expect(bumpText('high', null)).toBe('Por ahí no se pasa, ni volando.');
    expect(bumpText('ring', null)).toMatch(/^¡He chocado con el aro!/);
    // A ring flown against its way (D219).
    expect(ringWayText('up')).toBe('Este aro se cruza hacia arriba, desde abajo. ¡Así no cuenta!');
    expect(ringWayText('down')).toBe('Este aro se cruza hacia abajo, desde arriba. ¡Así no cuenta!');
    expect(blockedText('too_far', 'broom')).toBe('Para quitarle el nudo a la escoba tengo que estar de pie sobre ella.');
    expect(blockedText('no_knot', 'broom')).toBe('Esta escoba no tiene nudo: no hay nada que desatar.');
    // drevo cast over the water (D215).
    expect(blockedText('no_landing', null, { kind: 'water' })).toBe('No hay dónde posar la escoba.');
    // A turn inside a ring rubs its rim: the owner's words (D226).
    expect(blockedText('ring_rim', 'ring')).toBe('Oh, giré demasiado pronto y rocé el aro.');
    initLanguage({ languages: ['en'], storage: null });
  });
});

describe('Ilda\'s verdict of a race (D234)', () => {
  // The wizard's 11 lines, and a flight of `flight` ticks; Zarek's count is 61.
  const judged = (flight: number | null, missed: number, winner: string | null) => ({
    at: [36, 8],
    lines: 11,
    flight,
    missed,
    penalty: missed * 5,
    tick: flight === null ? null : 11 + flight + missed * 5,
    racer: 'zarek',
    racer_lines: 18,
    racer_tick: 61,
    winner,
  });
  const took = (own: number) => `Kydux ha tardado ${own} ticks y Zarek ha tardado 61`;

  it('says what each one took and therefore who has won, with no penalty', () => {
    initLanguage(spanish);
    expect(raceVerdict(judged(43, 0, 'wizard'))).toBe(`${took(54)}, y por tanto ha ganado Kydux.`);
    expect(raceVerdict(judged(52, 0, 'zarek'))).toBe(`${took(63)}, y por tanto ha ganado Zarek.`);
    expect(raceVerdict(judged(50, 0, null))).toBe(`${took(61)}. ¡Es un empate! La carrera se repite.`);
    initLanguage(english);
    expect(raceVerdict(judged(43, 0, 'wizard'))).toBe(
      'Kydux took 54 ticks and Zarek took 61, and therefore Kydux has won.',
    );
  });

  it('says the penalty after what each one took, and who has won with it', () => {
    initLanguage(spanish);
    // What the wizard took is its count without the penalty.
    expect(raceVerdict(judged(35, 4, 'zarek'))).toBe(
      `${took(46)}. Pero Kydux ha tenido una penalización de 20 ticks, y por tanto ha ganado Zarek.`,
    );
    expect(raceVerdict(judged(39, 2, 'wizard'))).toBe(
      `${took(50)}. Kydux ha tenido una penalización de 10 ticks, pero aun así ha ganado.`,
    );
    expect(raceVerdict(judged(40, 2, null))).toBe(
      `${took(51)}. Pero Kydux ha tenido una penalización de 10 ticks, y con ella hay un empate. La carrera se repite.`,
    );
    // Slower before the penalty: it is one thing more, not the reason.
    expect(raceVerdict(judged(52, 1, 'zarek'))).toBe(
      `${took(63)}. Además, Kydux ha tenido una penalización de 5 ticks, y por tanto ha ganado Zarek.`,
    );
    // The same before the penalty: the penalty is the reason.
    expect(raceVerdict(judged(50, 1, 'zarek'))).toMatch(/^Kydux ha tardado 61 ticks y Zarek ha tardado 61\. Pero Kydux/);
    initLanguage(english);
    expect(raceVerdict(judged(35, 4, 'zarek'))).toBe(
      'Kydux took 46 ticks and Zarek took 61. But Kydux had a penalty of 20 ticks, and therefore Zarek has won.',
    );
  });

  it('says that the racer has won a race the wizard did not finish, with no numbers', () => {
    initLanguage(spanish);
    expect(raceVerdict(judged(null, 8, 'zarek'))).toBe('Kydux no ha cruzado la meta, y por tanto ha ganado Zarek.');
  });
});

describe("the words said in a run and the book's band (D264, D267)", () => {
  beforeEach(() => {
    initLanguage(spanish);
    speakOf({ name: 'Ana', gender: 'girl' });
    speakOfFamiliar({ gender: 'm', values: { familiar: 'Pimu', familiar_a_kind: 'un zorro', familiar_kind: 'zorro' } });
  });

  it("says the level's own words, made for the trial's kind, or the chapter's", () => {
    const own = { won: 'Es {familiar_a_kind}, sí. {wizard}.' };
    expect(toldText({ who: 'orla', key: 'won', kind: 'Hare' }, own)).toBe('Es una liebre, sí. Ana.');
    expect(toldText({ who: 'orla', key: 'won' }, own)).toBe('Es un zorro, sí. Ana.');
    expect(toldText({ who: 'orla', key: 'other_attribute', name: 'age' })).toContain('`age`');
    expect(toldText({ who: 'orla', key: 'pale_grey' })).toContain('tan buena como');
  });

  it("puts the book's line in pencil or in ink, its words when it cannot, and a kind's colours", () => {
    expect(bookText({ line: 'Fox("Pimu", "red")', ok: true, ink: false })).toEqual({
      words: 'El libro lo anota a lápiz:',
      code: 'Fox("Pimu", "red")',
      look: 'pencil',
    });
    expect(bookText({ line: 'Fox("Pimu", "red")', ok: true, ink: true }).look).toBe('ink');
    expect(bookText({ line: 'x', ok: false }).look).toBe('cannot');
    expect(bookText({ kind: 'Fox', colors: ['red', 'white', 'black'] }).code).toBe('"red"  "white"  "black"');
    expect(bookText({ line: 'pimu.go_to(13, 10)' }, true)).toEqual({ words: 'Orla manda:', code: 'pimu.go_to(13, 10)', look: 'order' });
  });
});
