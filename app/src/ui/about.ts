// The welcome page, #about (D193): what Kydux is, for whom, how it is played (a story, a
// lesson and a level, each with a picture of the game), that it is free software of the
// Kidux family, and Play. Its hero is a painting of Arvelia on its hill above the lake at
// dusk. The start screen shows its first part to a child with no wizard yet.

import { currentLanguage, t } from '../i18n';
import { element } from './dom';
import type { Screen } from './screen';

/** The languages the pictures of the game were taken in; another reads the English ones. */
const PICTURED = ['en', 'es'];
const PARTS = ['story', 'lesson', 'level'] as const;

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

export function aboutScreen(): Screen {
  const node = element('div', { className: 'about-screen' });
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
          element('a', { className: 'big-button', id: 'about-play', href: '#start' }, [t('about.play')]),
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
        element('a', { className: 'big-button', href: '#start' }, [t('about.play')]),
      ]),
    );
  };
  draw();
  return { node, relabel: draw, destroy: () => {} };
}
