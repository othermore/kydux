// The settings: the language, the playback speed, the editor's text size (its letter
// is Inconsolata, D238), whether the game's sounds play, and how loud the music is
// (D192); on the published game, the answer given to the cookies and the button that
// changes it (D328).
// Each change is saved in the progress document and applies at once; Back
// returns to the screen the child came from.

import type { Speed } from '../engine/playback';
import { music } from '../engine/music';
import { setMuted } from '../engine/sfx';
import { currentLanguage, languages, setLanguage, t } from '../i18n';
import { published } from '../analytics/site';
import * as progress from '../progress/progress';
import { cookieSetting } from './cookies';
import { element } from './dom';
import { applyLook, FONT_SIZES } from './look';
import type { Screen } from './screen';

const SPEEDS: Speed[] = [1, 2, 4];
/** The music's volume moves in five steps from none to full. */
const MUSIC_STEPS = 5;
/** The keys the game answers to, each with its words in settings.key.<name>. */
const KEYS = ['run', 'notebook', 'indent', 'leave', 'close', 'split'] as const;

export interface SettingsScreenParts {
  /** The address Back goes to. */
  back: string;
}

/** A labelled select whose options are `[value, words]`. */
function choice(
  id: string,
  label: string,
  options: [string, string][],
  value: string,
  onChange: (value: string) => void,
): HTMLElement {
  const select = element('select', { id });
  for (const [optionValue, words] of options) {
    select.append(element('option', { value: optionValue, selected: optionValue === value }, [words]));
  }
  select.addEventListener('change', () => onChange(select.value));
  return element('label', { className: 'setting' }, [element('span', {}, [label]), select]);
}

/** The music's volume, a slider from none to full in five steps, which says its step. */
function musicSlider(volume: number): HTMLElement {
  const slider = element('input', {
    id: 'settings-music',
    type: 'range',
    min: '0',
    max: String(MUSIC_STEPS),
    step: '1',
    value: String(Math.round(volume * MUSIC_STEPS)),
  });
  const said = element('span', { className: 'setting-value', id: 'settings-music-said' });
  const say = () => {
    const step = Number(slider.value);
    said.textContent = step === 0 ? t('settings.music_none') : t('settings.music_level', { n: step });
    slider.setAttribute('aria-valuetext', said.textContent);
  };
  say();
  slider.addEventListener('input', () => {
    const value = Number(slider.value) / MUSIC_STEPS;
    progress.setSetting('music', value);
    music.setVolume(value);
    say();
  });
  return element('label', { className: 'setting setting-music' }, [
    element('span', {}, [t('settings.music')]),
    slider,
    said,
  ]);
}

export function settingsScreen(parts: SettingsScreenParts): Screen {
  const node = element('div', { className: 'settings-screen' });
  const draw = (): void => {
    document.title = t('settings.page_title');
    const now = progress.settings();
    node.replaceChildren(
      element('h2', {}, [t('settings.title')]),
      element('div', { className: 'settings-list' }, [
        choice(
          'settings-language',
          t('app.language'),
          languages.map((lang) => [lang, t(`language.${lang}`)]),
          currentLanguage(),
          (lang) => setLanguage(lang),
        ),
        choice(
          'settings-speed',
          t('level.speed'),
          SPEEDS.map((speed) => [String(speed), `${speed}×`]),
          String(now.speed),
          (speed) => progress.setSetting('speed', Number(speed) as Speed),
        ),
        choice(
          'settings-font-size',
          t('settings.font_size'),
          FONT_SIZES.map((size) => [String(size), t('settings.pixels', { n: size })]),
          String(now.fontSize),
          (size) => {
            progress.setSetting('fontSize', Number(size));
            applyLook(progress.settings());
          },
        ),
        choice(
          'settings-sound',
          t('settings.sound'),
          [
            ['on', t('settings.sound_on')],
            ['off', t('settings.sound_off')],
          ],
          now.sound ? 'on' : 'off',
          (value) => {
            progress.setSetting('sound', value === 'on');
            setMuted(value !== 'on');
          },
        ),
        musicSlider(now.music),
      ]),
      element('p', { className: 'settings-sample', id: 'settings-sample' }, ['wizard.move_right(3)']),
      element('section', { className: 'settings-keys', id: 'settings-keys' }, [
        element('h3', {}, [t('settings.keys')]),
        element(
          'dl',
          {},
          KEYS.flatMap((key) => [
            element('dt', {}, [t(`settings.key.${key}.keys`)]),
            element('dd', {}, [t(`settings.key.${key}.does`)]),
          ]),
        ),
      ]),
      // The published game alone has cookies to speak of (D328).
      ...(published() ? [cookieSetting()] : []),
      element('a', { id: 'settings-back', className: 'big-button', href: parts.back }, [t('settings.back')]),
    );
  };
  draw();
  return {
    node,
    mount: () => node.querySelector<HTMLElement>('#settings-font-size')?.focus(),
    relabel: draw,
    destroy: () => {},
  };
}
