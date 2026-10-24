// The settings: the language, the playback speed, the editor's text size and
// whether the game's sounds play.
// Each change is saved in the progress document and applies at once; Back
// returns to the screen the child came from.

import type { Speed } from '../engine/playback';
import { setMuted } from '../engine/sfx';
import { currentLanguage, languages, setLanguage, t } from '../i18n';
import * as progress from '../progress/progress';
import { element } from './dom';
import { applyLook, FONT_SIZES } from './look';
import type { Screen } from './screen';

const SPEEDS: Speed[] = [1, 2, 4];
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

export function settingsScreen(parts: SettingsScreenParts): Screen {
  const node = element('div', { className: 'settings-screen' });
  const draw = () => {
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
