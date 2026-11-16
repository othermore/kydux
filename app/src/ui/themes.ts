// The page under ?debug that plays any of the music's themes (D192), `#music`: each
// theme in content/music/, as a story plays it and as a level plays it, lower (D210),
// to be heard alone.
// Over the list are the voices of the theme that plays (D203), each with a box that
// silences it or lets it sound and a slider for its volume, set by hand while the theme
// plays, and a line that says what is set apart from the theme's file, to be told to
// who writes it.
// Under the list is the broom's wind (D236): four buttons play it at rest, flying on,
// in a turn and in a whole flight, and its two voices, the air and the tones, each have
// a box and a slider from 0 to 3, with a line that says the mix, to be told to who sets
// its numbers. The mix is never kept: each voice is on and at 1 when the page loads.

import { type Heard, music, type Theme, themeNamed } from '../engine/music';
import { mixWind, Wind, type WindVoice, windMix } from '../engine/sound';
import { t } from '../i18n';
import { element } from './dom';
import type { Screen } from './screen';

/** A voice as the page has it: whether it sounds, and its volume from 0 to 1. */
interface Mixed {
  on: boolean;
  volume: number;
}

/** The theme whose voices the page shows, and where it is heard. */
interface Shown {
  theme: Theme;
  heard: Heard;
  voices: Map<string, Mixed>;
}

/** A voice as the theme's file has it: sounding, at its volume. */
function written(theme: Theme, name: string): Mixed {
  return { on: true, volume: theme.voices[name]?.volume ?? 0 };
}

/** What is set apart from the theme's file, as `strings 0.30, flute off`; '' when
 * every voice is as written. */
function mixSaid(shown: Shown, off: string): string {
  const parts: string[] = [];
  for (const [name, mixed] of shown.voices) {
    const file = written(shown.theme, name);
    if (mixed.on !== file.on) parts.push(mixed.on ? `${name} ${mixed.volume.toFixed(2)}` : `${name} ${off}`);
    else if (mixed.on && mixed.volume !== file.volume) parts.push(`${name} ${mixed.volume.toFixed(2)}`);
  }
  return parts.join(', ');
}

/** How long a flown move of the wind's samples takes, as a flown cell at speed 1 in a
 * level where the wizard flies (D225), in milliseconds. */
const MOVE_MS = 133;

/** The wind's samples: when each flown move, swell and the end come, in milliseconds
 * from the start. */
type WindSample = 'rest' | 'on' | 'turn' | 'flight';
function windPlan(sample: WindSample): { moves: number[]; swells: number[]; end: number } {
  const every = (from: number, to: number) => Array.from({ length: Math.ceil((to - from) / MOVE_MS) }, (_, i) => from + i * MOVE_MS);
  if (sample === 'rest') return { moves: [], swells: [], end: 4000 };
  if (sample === 'on') return { moves: every(0, 4000), swells: [], end: 4000 };
  if (sample === 'turn') return { moves: every(0, 4000), swells: [1500], end: 4000 };
  // A lift, twelve moves, a turn, eight moves, a turn, twelve moves, a landing.
  const moves = every(0, 32 * MOVE_MS);
  return { moves, swells: [0, 12 * MOVE_MS, 20 * MOVE_MS], end: 32 * MOVE_MS };
}

/** What the wind's mix is apart from its own, as `air 1.40, tones off`; '' when both
 * voices are as written. */
function windSaid(off: string): string {
  return (Object.keys(windMix) as WindVoice[])
    .flatMap((voice) => {
      const { on, volume } = windMix[voice];
      if (!on) return [`${voice} ${off}`];
      return volume === 1 ? [] : [`${voice} ${volume.toFixed(2)}`];
    })
    .join(', ');
}

/** The broom's wind, its four samples and its mixer (D236): drawn again in a new
 * language, and silent once the page is left. */
function windPanel(): { node: HTMLElement; draw: () => void; destroy: () => void } {
  const node = element('section', { className: 'themes-wind' });
  const wind = new Wind();
  let timers: ReturnType<typeof setTimeout>[] = [];
  const play = (sample: WindSample) => {
    for (const timer of timers) clearTimeout(timer);
    wind.stop(0.02);
    const { moves, swells, end } = windPlan(sample);
    wind.start();
    timers = [
      ...moves.map((at) => setTimeout(() => wind.fly(MOVE_MS / 1000), at)),
      ...swells.map((at) => setTimeout(() => wind.swell(), at)),
      setTimeout(() => wind.stop(0.6), end),
    ];
  };
  const draw = () => {
    const told = element('p', { id: 'wind-mix', className: 'status' });
    const tell = () => {
      told.textContent = `${t('debug.music.wind_title')}: ${windSaid(t('debug.music.off')) || t('debug.music.wind_unchanged')}`;
    };
    const rows = (Object.keys(windMix) as WindVoice[]).map((voice) => {
      const mixed = windMix[voice];
      const box = element('input', { type: 'checkbox', checked: mixed.on });
      box.dataset.windVoice = voice;
      const slider = element('input', { type: 'range', min: '0', max: '3', step: '0.1', value: String(mixed.volume) });
      slider.dataset.windVoice = voice;
      const volume = element('span', { className: 'themes-volume' }, [mixed.volume.toFixed(2)]);
      const change = () => {
        mixWind(voice, box.checked, Number(slider.value));
        volume.textContent = Number(slider.value).toFixed(2);
        tell();
      };
      box.addEventListener('change', change);
      slider.addEventListener('input', change);
      return element('li', {}, [
        element('label', {}, [box, ' ', element('code', {}, [voice]), ` (${t(`debug.music.wind_${voice}`)})`]),
        slider,
        volume,
      ]);
    });
    const reset = element('button', { type: 'button', id: 'wind-reset' }, [t('debug.music.reset')]);
    reset.addEventListener('click', () => {
      for (const voice of Object.keys(windMix) as WindVoice[]) mixWind(voice, true, 1);
      draw();
    });
    const buttons = (['rest', 'on', 'turn', 'flight'] as const).map((sample) => {
      const button = element('button', { type: 'button' }, [t(`debug.music.wind_${sample}`)]);
      button.dataset.wind = sample;
      button.addEventListener('click', () => play(sample));
      return button;
    });
    tell();
    node.replaceChildren(
      element('h3', {}, [t('debug.music.wind_title')]),
      element('p', { className: 'themes-wind-samples' }, buttons),
      element('ul', { className: 'wind-mixer' }, rows),
      reset,
      told,
    );
  };
  draw();
  return {
    node,
    draw,
    destroy: () => {
      for (const timer of timers) clearTimeout(timer);
      wind.stop(0.02);
    },
  };
}

export function themesScreen(themes: string[]): Screen {
  const node = element('div', { className: 'themes-screen' });
  let shown: Shown | null = null;
  let asked = 0;
  const wind = windPanel();

  const draw = () => {
    const said = element('p', { id: 'themes-playing', className: 'status' });
    const { theme: playing, heard } = music.state;
    said.textContent = playing ? t('debug.music.playing', { theme: playing, heard: heard ? t(`debug.music.${heard}`) : '' }) : '';
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
            ...(['story', 'level'] as const).map((each) => {
              const button = element('button', { type: 'button' }, [t(`debug.music.${each}`)]);
              button.dataset.theme = theme;
              button.dataset.heard = each;
              button.addEventListener('click', () => play(theme, each));
              return button;
            }),
          ]),
        ),
      ),
      wind.node,
    );
  };

  const play = (theme: string, heard: Heard) => {
    music.unlock();
    music.unmix();
    music.play(theme, heard);
    shown = null;
    draw();
    const mine = (asked += 1);
    void themeNamed(theme)
      .then((found) => {
        if (mine !== asked) return;
        const voices = new Map(Object.keys(found.voices).map((name) => [name, written(found, name)]));
        shown = { theme: found, heard, voices };
        draw();
      })
      .catch(() => {});
  };

  /** The voices of the theme that plays, each with its box and its slider. */
  const mixer = (now: Shown): HTMLElement[] => {
    const told = element('p', { id: 'themes-mix', className: 'status' });
    const tell = () => {
      const mix = mixSaid(now, t('debug.music.off')) || t('debug.music.unchanged');
      told.textContent = `${now.theme.id}: ${mix}`;
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
        const file = written(now.theme, name);
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
    reset.addEventListener('click', () => play(now.theme.id, now.heard));
    tell();
    return [
      element('h3', {}, [t('debug.music.voices')]),
      element('ul', { className: 'themes-mixer' }, rows),
      reset,
      told,
    ];
  };

  draw();
  return {
    node,
    relabel: () => {
      wind.draw();
      draw();
    },
    destroy: wind.destroy,
  };
}
