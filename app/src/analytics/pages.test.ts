import { describe, expect, it } from 'vitest';
import { goatUrl, LevelVisit, pageOf } from './pages';
import { published, SITE } from './site';

describe('the page a screen is counted as (D328)', () => {
  it('names a level, a lesson and a story by their id', () => {
    expect(pageOf('#level/the-gate')).toEqual({ path: '/level/the-gate', title: 'level the-gate', level: 'the-gate' });
    expect(pageOf('#lesson/names')).toEqual({ path: '/lesson/names', title: 'lesson names' });
    expect(pageOf('#story/the-letter')).toEqual({ path: '/story/the-letter', title: 'story the-letter' });
  });

  it('counts a lesson read again from a level as the lesson', () => {
    expect(pageOf('#lesson/names/from/the-gate').path).toBe('/lesson/names');
  });

  it('names the other screens, and the start for an address that names none', () => {
    expect(pageOf('#map').path).toBe('/map');
    expect(pageOf('#settings').path).toBe('/settings');
    expect(pageOf('#about').path).toBe('/about');
    expect(pageOf('').path).toBe('/start');
    expect(pageOf('#music').path).toBe('/start');
  });

  it('counts the start of a child who has never played as the welcome page', () => {
    expect(pageOf('', true)).toEqual({ path: '/about', title: 'about' });
    expect(pageOf('#start', true).path).toBe('/about');
    expect(pageOf('#map', true).path).toBe('/map');
    expect(pageOf('#level/the-gate', true).path).toBe('/level/the-gate');
  });

  it('never counts words that are not an id of the course', () => {
    expect(pageOf('#level/Marta%20la%20maga').path).toBe('/start');
    expect(pageOf('#story/<script>').path).toBe('/start');
    expect(pageOf('#map/Marta').path).toBe('/start');
  });
});

describe("GoatCounter's address for a hit (D328)", () => {
  it('puts the prefix before the path, apart from the paths of kidux.org', () => {
    const url = new URL(goatUrl(SITE, { path: '/level/the-gate', title: 'level the-gate', random: '7' }));
    expect(url.origin + url.pathname).toBe('https://kidux.goatcounter.com/count');
    expect(url.searchParams.get('p')).toBe('/kydux/level/the-gate');
    expect(url.searchParams.get('t')).toBe('level the-gate');
    expect(url.searchParams.get('rnd')).toBe('7');
    expect(url.searchParams.has('e')).toBe(false);
    expect(url.searchParams.has('r')).toBe(false);
  });

  it('says an event, the referrer and the screen when it has them', () => {
    const url = new URL(
      goatUrl(SITE, {
        path: '/won/the-gate',
        title: 'won the-gate',
        event: true,
        referrer: 'https://kidux.org/',
        screen: [1280, 720, 2],
        random: '7',
      }),
    );
    expect(url.searchParams.get('e')).toBe('true');
    expect(url.searchParams.get('r')).toBe('https://kidux.org/');
    expect(url.searchParams.get('s')).toBe('1280,720,2');
  });
});

describe('a visit to a level (D328)', () => {
  it('tells a win with its seconds, runs, hints and stars, once', () => {
    const visit = new LevelVisit('the-gate');
    visit.played(10);
    visit.ran();
    visit.played(10);
    visit.ran();
    expect(visit.won(2, 1)).toEqual({ level: 'the-gate', seconds: 20, runs: 2, hints: 1, stars: 2 });
    visit.ran();
    expect(visit.won(3, 1)).toBeNull();
    expect(visit.left()).toBeNull();
  });

  it('tells a level left without a win', () => {
    const visit = new LevelVisit('the-gate');
    visit.played(30);
    visit.ran();
    expect(visit.left()).toEqual({ level: 'the-gate', seconds: 30, runs: 1 });
    expect(visit.left()).toBeNull();
  });
});

describe('the published game (D328)', () => {
  it('is known by its host alone', () => {
    expect(published('kydux.kidux.org')).toBe(true);
    expect(published('localhost')).toBe(false);
    expect(published('127.0.0.1')).toBe(false);
    expect(published('hija.local')).toBe(false);
    expect(published('kidux.org')).toBe(false);
    expect(published('')).toBe(false);
  });
});
