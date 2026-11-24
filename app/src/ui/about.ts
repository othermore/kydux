// The welcome page, #about (D193): what Kydux is, for whom, how it is played (the game,
// its story and its lessons, each with a picture of the game), that it is free software
// of the Kidux family, and a big button to play. Its hero is a painting of Arvelia on its
// hill above the lake at dusk, with three of the school's people standing before it, and
// others stand beside its sections (D294). Its button begins the story for a child who
// has never played (D61) and goes back to the start screen for one who has.

import { currentLanguage, t } from '../i18n';
import { group } from './decor';
import { element } from './dom';
import type { Screen } from './screen';

/** The languages the pictures of the game were taken in; another reads the English ones. */
const PICTURED = ['en', 'es'];
const PARTS = ['level', 'story', 'lesson'] as const;

function picture(name: string): string {
  return `${import.meta.env.BASE_URL}about/${name}`;
}

/** A section of words on a panel, with some of the school's people standing at its side
 * (D294): at its right looking at the words, or at its left, mirrored. */
function sectionWith(id: string, words: Node[], people: string[], side: 'left' | 'right'): HTMLElement {
  return element('section', { className: `about-section panel with-figures figures-${side}`, id }, [
    element('div', { className: 'about-words' }, words),
    group('about-figures', people, side === 'left'),
  ]);
}

export interface AboutScreenParts {
  /** Where its button goes: the opening story for a newcomer, the start screen else. */
  play: string;
  /** Whether the child has never played: the button says Start playing. */
  newcomer: boolean;
}

export function aboutScreen(parts: AboutScreenParts): Screen {
  const node = element('div', { className: 'about-screen' });
  const playWords = () => (parts.newcomer ? t('about.start') : t('about.play'));
  const draw = () => {
    document.title = t('about.page_title');
    const lang = PICTURED.includes(currentLanguage()) ? currentLanguage() : 'en';
    const hero = element('img', {
      className: 'about-hero-picture',
      src: picture('welcome-castle.webp'),
      alt: t('about.hero_alt'),
    });
    node.replaceChildren(
      element('section', { className: 'about-hero' }, [
        hero,
        group('about-hero-figures', ['ilda', 'nuri', 'teku']),
        element('div', { className: 'about-hero-words' }, [
          element('h2', {}, [t('about.hero_title')]),
          element('p', {}, [t('about.hero_text')]),
          element('a', { className: 'big-button', id: 'about-play', href: parts.play }, [playWords()]),
        ]),
      ]),
      sectionWith(
        'about-what',
        [element('h3', {}, [t('about.what_title')]), element('p', {}, [t('about.what_text')])],
        ['orla', 'bimo'],
        'right',
      ),
      sectionWith(
        'about-who',
        [element('h3', {}, [t('about.who_title')]), element('p', {}, [t('about.who_text')])],
        ['zarek', 'rinlo'],
        'left',
      ),
      element('section', { className: 'about-section', id: 'about-how' }, [
        element('h3', {}, [t('about.how_title')]),
        element(
          'div',
          { className: 'about-pictures' },
          PARTS.map((part) =>
            element('figure', { className: 'about-picture panel' }, [
              element('img', {
                src: picture(`${lang}/${part}.webp`),
                alt: t(`about.${part}_alt`),
                loading: 'lazy',
              }),
              element('figcaption', {}, [
                element('strong', {}, [t(`about.${part}_name`)]),
                ' ',
                t(`about.${part}_text`),
              ]),
            ]),
          ),
        ),
      ]),
      sectionWith(
        'about-free',
        [
          element('h3', {}, [t('about.free_title')]),
          element('p', {}, [
            t('about.free_text'),
            ' ',
            element('a', { href: t('app.kidux_url'), target: '_blank', rel: 'noopener' }, [
              t('about.kidux_link'),
            ]),
          ]),
        ],
        ['baro', 'wenna', 'dask'],
        'right',
      ),
      element('p', { className: 'about-end' }, [
        element('a', { className: 'big-button', id: 'about-play-end', href: parts.play }, [playWords()]),
      ]),
    );
  };
  draw();
  return { node, relabel: draw, destroy: () => {} };
}
