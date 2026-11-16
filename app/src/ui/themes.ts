// The page under ?debug that plays any of the music's themes (D192), `#music`: each
// theme in content/music/, in its full and its quiet arrangement, to be heard alone.
// Over the list are the voices of the theme that plays (D203), each with a box that
// silences it or lets it sound and a slider for its volume, set by hand while the theme
// plays, and a line that says what is set apart from the theme's file, to be told to
// who writes it.

import { type Arrangement, music, type Theme, themeNamed } from '../engine/music';
import { t } from '../i18n';
import { element } from './dom';
import type { Screen } from './screen';

/** A voice as the page has it: whether it sounds, and its volume from 0 to 1. */
interface Mixed {
  on: boolean;
  volume: number;
}

/** The theme whose voices the page shows, in the arrangement it plays. */
interface Shown {
  theme: Theme;
  arrangement: Arrangement;
  voices: Map<string, Mixed>;
}

/** A voice as the theme's file has it in an arrangement. */
function written(theme: Theme, arrangement: Arrangement, name: string): Mixed {
  return { on: theme.arrangements[arrangement].includes(name), volume: theme.voices[name]?.volume ?? 0 };
}

/** What is set apart from the theme's file, as `strings 0.30, flute off`; '' when
 * every voice is as written. */
function mixSaid(shown: Shown, off: string): string {
  const parts: string[] = [];
  for (const [name, mixed] of shown.voices) {
    const file = written(shown.theme, shown.arrangement, name);
    if (mixed.on !== file.on) parts.push(mixed.on ? `${name} ${mixed.volume.toFixed(2)}` : `${name} ${off}`);
    else if (mixed.on && mixed.volume !== file.volume) parts.push(`${name} ${mixed.volume.toFixed(2)}`);
  }
  return parts.join(', ');
}

export function themesScreen(themes: string[]): Screen {
  const node = element('div', { className: 'themes-screen' });
  let shown: Shown | null = null;
  let asked = 0;

  const draw = () => {
    const said = element('p', { id: 'themes-playing', className: 'status' });
    const { theme: playing, arrangement } = music.state;
    said.textContent = playing ? t('debug.music.playing', { theme: playing, arrangement: arrangement ?? '' }) : '';
    node.replaceChildren(
      element('h2', {}, [t('debug.music.title')]),
      said,
      ...(shown ? mixer(shown) : []),
      element(
        'ul',
        { className: 'themes-list' },
        themes.map((theme) =>
          element('li', {}, [
            element('code', {}, [theme]),
            ' ',
            ...(['full', 'quiet'] as const).map((each) => {
              const button = element('button', { type: 'button' }, [t(`debug.music.${each}`)]);
              button.dataset.theme = theme;
              button.dataset.arrangement = each;
              button.addEventListener('click', () => play(theme, each));
              return button;
            }),
          ]),
        ),
      ),
    );
  };

  const play = (theme: string, arrangement: Arrangement) => {
    music.unlock();
    music.unmix();
    music.play(theme, arrangement);
    shown = null;
    draw();
    const mine = (asked += 1);
    void themeNamed(theme)
      .then((found) => {
        if (mine !== asked) return;
        const voices = new Map(Object.keys(found.voices).map((name) => [name, written(found, arrangement, name)]));
        shown = { theme: found, arrangement, voices };
        draw();
      })
      .catch(() => {});
  };

  /** The voices of the theme that plays, each with its box and its slider. */
  const mixer = (now: Shown): HTMLElement[] => {
    const told = element('p', { id: 'themes-mix', className: 'status' });
    const tell = () => {
      const mix = mixSaid(now, t('debug.music.off')) || t('debug.music.unchanged');
      told.textContent = `${now.theme.id} (${t(`debug.music.${now.arrangement}`)}): ${mix}`;
    };
    const rows = [...now.voices].map(([name, mixed]) => {
      const box = element('input', { type: 'checkbox', checked: mixed.on });
      box.dataset.voice = name;
      const slider = element('input', { type: 'range', min: '0', max: '1', step: '0.05', value: String(mixed.volume) });
      slider.dataset.voice = name;
      const volume = element('span', { className: 'themes-volume' }, [mixed.volume.toFixed(2)]);
      const change = () => {
        mixed.on = box.checked;
        mixed.volume = Number(slider.value);
        volume.textContent = mixed.volume.toFixed(2);
        const file = written(now.theme, now.arrangement, name);
        const asWritten = mixed.on === file.on && (!mixed.on || mixed.volume === file.volume);
        music.mix(name, asWritten ? null : mixed.on ? mixed.volume : 0);
        tell();
      };
      box.addEventListener('change', change);
      slider.addEventListener('input', change);
      return element('li', {}, [
        element('label', {}, [box, ' ', element('code', {}, [name]), ` (${now.theme.voices[name]?.kind ?? ''})`]),
        slider,
        volume,
      ]);
    });
    const reset = element('button', { type: 'button', id: 'themes-reset' }, [t('debug.music.reset')]);
    reset.addEventListener('click', () => play(now.theme.id, now.arrangement));
    tell();
    return [
      element('h3', {}, [t('debug.music.voices')]),
      element('ul', { className: 'themes-mixer' }, rows),
      reset,
      told,
    ];
  };

  draw();
  return { node, relabel: draw, destroy: () => {} };
}
