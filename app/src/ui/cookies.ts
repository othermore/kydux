// The notice about cookies (D328): on the published game, the first thing on the page
// until it is answered. It is one line and two buttons, to accept and to refuse.
// Refusing takes two presses: the first brings the whole of why, what the game counts
// and what it never sends, and the question whether the reader is sure; the second is
// the no, and the game opens without the cookies. A yes is for good; a no lasts a day
// and a half, and the notice asks again after it. The settings say which answer the
// browser holds, and hold the button that changes it.

import * as analytics from '../analytics/analytics';
import { accept, accepted, refuse, withdraw } from '../analytics/consent';
import { currentLanguage, languages, setLanguage, t } from '../i18n';
import { element } from './dom';

/** Shows the notice in `page` and calls `onAnswered`, once, when the cookies are
 * accepted or refused: the notice is gone by then. */
export function showCookieNotice(page: HTMLElement, onAnswered: () => void): void {
  // Whether the reader has pressed Refuse once, and reads the whole of why.
  let asked = false;
  const node = element('div', { className: 'cookie-notice', id: 'cookie-notice' });
  const close = () => {
    document.removeEventListener('kydux:language', draw);
    node.remove();
    onAnswered();
  };
  const yes = () => {
    accept();
    close();
  };
  const no = () => {
    if (asked) {
      refuse();
      analytics.goat({ path: '/cookies/refused', title: 'cookies refused' }, true);
      close();
      return;
    }
    asked = true;
    analytics.goat({ path: '/cookies/why', title: 'cookies why' }, true);
    draw();
    node.querySelector<HTMLElement>('#cookies-accept')?.focus();
  };
  function draw(): void {
    document.title = t('cookies.page_title');
    const acceptButton = element('button', { type: 'button', className: 'big-button', id: 'cookies-accept' }, [
      asked ? t('cookies.accept_them') : t('cookies.accept'),
    ]);
    acceptButton.addEventListener('click', yes);
    const refuseButton = element('button', { type: 'button', className: 'quiet-button', id: 'cookies-refuse' }, [
      asked ? t('cookies.refuse_sure') : t('cookies.refuse'),
    ]);
    refuseButton.addEventListener('click', no);
    const buttons = element('p', { className: 'cookie-buttons' }, [acceptButton, refuseButton]);
    const tongues = element(
      'p',
      { className: 'cookie-languages' },
      languages.map((lang) => {
        const button = element(
          'button',
          { type: 'button', className: 'quiet-button small', lang, disabled: lang === currentLanguage() },
          [t(`language.${lang}`)],
        );
        button.dataset.language = lang;
        button.addEventListener('click', () => setLanguage(lang));
        return button;
      }),
    );
    const words = asked
      ? [
          element('h1', { id: 'cookies-title' }, [t('cookies.why_title')]),
          element('p', {}, [t('cookies.text')]),
          element('p', {}, [t('cookies.detail')]),
          element('p', { id: 'cookies-sure', className: 'cookie-question' }, [t('cookies.sure')]),
          buttons,
        ]
      : [element('h1', { id: 'cookies-title' }, [t('cookies.title')]), buttons];
    node.dataset.step = asked ? 'why' : 'short';
    node.replaceChildren(
      element('section', { className: 'cookie-card panel' }, [
        element('img', {
          className: 'cookie-picture',
          src: `${import.meta.env.BASE_URL}about/welcome-castle.webp`,
          alt: t('about.hero_alt'),
        }),
        element('div', { className: 'cookie-words' }, words),
      ]),
      tongues,
    );
  }
  document.addEventListener('kydux:language', draw);
  draw();
  page.replaceChildren(node);
  analytics.goat({ path: '/cookies', title: 'cookies' });
}

/** The settings' words about the cookies: which answer this browser holds, and the
 * button that changes it. A yes taken back deletes the counting cookies; either way
 * the page starts again, so that the counting follows the answer from its first line. */
export function cookieSetting(): HTMLElement {
  const yes = accepted();
  const button = element(
    'button',
    { type: 'button', className: 'quiet-button', id: yes ? 'cookies-withdraw' : 'cookies-accept' },
    [yes ? t('cookies.withdraw') : t('cookies.accept_them')],
  );
  button.addEventListener('click', () => {
    if (yes) withdraw();
    else accept();
    location.reload();
  });
  return element('section', { className: 'settings-cookies', id: 'settings-cookies' }, [
    element('h3', {}, [t('cookies.settings_title')]),
    element('p', {}, [yes ? t('cookies.settings_accepted') : t('cookies.settings_refused')]),
    button,
  ]);
}
