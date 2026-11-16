// The welcome page, #about (D193): what Kydux is, for whom, how it is played (the game,
// its story and its lessons, each with a picture of the game), that it is free software
// of the Kidux family, and a big button to play. Its hero is a painting of Arvelia on its
// hill above the lake at dusk. A first visit opens on it, and its Start playing begins the
// story (D61); a child who has played goes back to the start screen from it. The start
// screen shows its first part to a child with no wizard yet.

import { currentLanguage, t } from '../i18n';
import { element } from './dom';
import type { Screen } from './screen';

/** The languages the pictures of the game were taken in; another reads the English ones. */
const PICTURED = ['en', 'es'];
const PARTS = ['level', 'story', 'lesson'] as const;

function picture(name: string): string {
  return `${import.meta.env.BASE_URL}about/${name}`;
}

/** The welcome's first part: what Kydux is, with a link to the rest. */
export function welcomeSection(): HTMLElement {
  return element('section', { className: 'about-section panel start-welcome', id: 'start-welcome' }, [
    element('h3', {}, [t('about.what_title')]),
    element('p', {}, [t('about.what_text')]),
    element('a', { href: '#about', id: 'start-about' }, [t('about.more')]),
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
        element('div', { className: 'about-hero-words' }, [
          element('h2', {}, [t('about.hero_title')]),
          element('p', {}, [t('about.hero_text')]),
          element('a', { className: 'big-button', id: 'about-play', href: parts.play }, [playWords()]),
        ]),
      ]),
      element('section', { className: 'about-section panel', id: 'about-what' }, [
        element('h3', {}, [t('about.what_title')]),
        element('p', {}, [t('about.what_text')]),
      ]),
      element('section', { className: 'about-section panel', id: 'about-who' }, [
        element('h3', {}, [t('about.who_title')]),
        element('p', {}, [t('about.who_text')]),
      ]),
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
      element('section', { className: 'about-section panel', id: 'about-free' }, [
        element('h3', {}, [t('about.free_title')]),
        element('p', {}, [
          t('about.free_text'),
          ' ',
          element('a', { href: t('about.kidux_url') }, [t('about.kidux_link')]),
        ]),
      ]),
      element('p', { className: 'about-end' }, [
        element('a', { className: 'big-button', id: 'about-play-end', href: parts.play }, [playWords()]),
      ]),
    );
  };
  draw();
  return { node, relabel: draw, destroy: () => {} };
}
