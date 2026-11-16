// The page under ?debug that plays any of the music's themes (D192), `#music`: each
// theme in content/music/, in its full and its quiet arrangement, to be heard alone.

import { type Arrangement, music } from '../engine/music';
import { t } from '../i18n';
import { element } from './dom';
import type { Screen } from './screen';

export function themesScreen(themes: string[]): Screen {
  const node = element('div', { className: 'themes-screen' });
  const draw = () => {
    const said = element('p', { id: 'themes-playing', className: 'status' });
    const sayPlaying = () => {
      const { theme, arrangement } = music.state;
      said.textContent = theme ? t('debug.music.playing', { theme, arrangement: arrangement ?? '' }) : '';
    };
    const play = (theme: string, arrangement: Arrangement) => {
      music.unlock();
      music.play(theme, arrangement);
      sayPlaying();
    };
    node.replaceChildren(
      element('h2', {}, [t('debug.music.title')]),
      element(
        'ul',
        { className: 'themes-list' },
        themes.map((theme) =>
          element('li', {}, [
            element('code', {}, [theme]),
            ' ',
            ...(['full', 'quiet'] as const).map((arrangement) => {
              const button = element('button', { type: 'button' }, [
                t(`debug.music.${arrangement}`),
              ]);
              button.dataset.theme = theme;
              button.dataset.arrangement = arrangement;
              button.addEventListener('click', () => play(theme, arrangement));
              return button;
            }),
          ]),
        ),
      ),
      said,
    );
    sayPlaying();
  };
  draw();
  return { node, relabel: draw, destroy: () => {} };
}
