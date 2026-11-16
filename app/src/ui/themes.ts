// The page under ?debug that plays any of the music's themes (D192), `#music`: each
// theme in content/music/, as a story plays it and as a level plays it, lower (D210),
// to be heard alone.
// Over the list are the voices of the theme that plays (D203), each with a box that
// silences it or lets it sound and a slider for its volume, set by hand while the theme
// plays, and a line that says what is set apart from the theme's file, to be told to
// who writes it.
// Under the list is the broom's wind (D243): six buttons play a one-cell move, a move of
// eight cells, a zigzag, a lift, a landing and a whole flight, and its three voices, the
// air, the whistle and the rest, each have a box and a slider from 0 to 3, with a line
// that says the mix, to be told to who sets its numbers. The whole flight hovers a while
// between two of its moves, where the rest is heard when its box is on. The mix is never
// kept: each voice is as written when the page loads.

import { type Heard, music, type Theme, themeNamed } from '../engine/music';
import { play as playEffect } from '../engine/sfx';
import { LAND_NEAR, mixWind, WIND_WRITTEN, Wind, type WindVoice, windMix } from '../engine/sound';
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

/** How long a flown cell of the wind's samples takes, as a flown cell at speed 1 in a
 * level where the wizard flies (D225), in milliseconds; and how long a lift or a
 * landing takes (D244). */
const MOVE_MS = 133;
const LIFT_PAUSE_MS = 300;
/** How long the whole flight hovers before its last move, in milliseconds: the gust
 * before it has fallen in 0.7 seconds at most, and the rest is heard after it. */
const HOVER_MS = 2200;

/** The wind's samples (D243): a one-cell move, a move of eight cells, a zigzag of eight
 * one-cell moves, a lift, a landing, and a whole flight. */
type WindSample = 'one' | 'eight' | 'zigzag' | 'lift' | 'landing' | 'flight';
const WIND_SAMPLES: readonly WindSample[] = ['one', 'eight', 'zigzag', 'lift', 'landing', 'flight'];

/** What a sample plays, in order: gusts of so many cells, the lift's sound, the rest
 * asked for, the landing's approach of so many seconds and the landing, the wind switched
 * off (D255), and when each comes, in milliseconds from the start. */
type Played =
  | { at: number; cells: number }
  | { at: number; effect: 'lift' }
  | { at: number; wind: 'rest' | 'land' }
  | { at: number; near: number };
function windPlan(sample: WindSample): Played[] {
  if (sample === 'one') return [{ at: 0, cells: 1 }];
  if (sample === 'eight') return [{ at: 0, cells: 8 }];
  if (sample === 'zigzag') return Array.from({ length: 8 }, (_, i) => ({ at: i * MOVE_MS, cells: 1 }));
  if (sample === 'lift') return [{ at: 0, effect: 'lift' }];
  // The rest asked for, its approach of LAND_NEAR, and the landing.
  if (sample === 'landing') {
    return [
      { at: 0, wind: 'rest' },
      { at: 0, near: LAND_NEAR },
      { at: LAND_NEAR * 1000, wind: 'land' },
    ];
  }
  // A lift, the rest asked for while in the air, a move of one, the four moves of a pair
  // of rings, a hover, a move of eight, the approach over the last LAND_NEAR and the
  // landing.
  const played: Played[] = [
    { at: 0, effect: 'lift' },
    { at: 0, wind: 'rest' },
  ];
  let at = LIFT_PAUSE_MS;
  for (const cells of [1, 2, 2, 2, 2, 8]) {
    if (cells === 8) at += HOVER_MS;
    played.push({ at, cells });
    at += cells * MOVE_MS;
  }
  const near = Math.min(LAND_NEAR * 1000, at);
  played.push({ at: at - near, near: near / 1000 }, { at, wind: 'land' });
  return played.sort((one, other) => one.at - other.at);
}

/** What the wind's mix is apart from as it is written, as `air 1.40, whistle off, rest
 * 1.00`; '' when every voice is as written. */
function windSaid(off: string): string {
  return (Object.keys(windMix) as WindVoice[])
    .flatMap((voice) => {
      const { on, volume } = windMix[voice];
      const written = WIND_WRITTEN[voice];
      if (!on) return written.on ? [`${voice} ${off}`] : [];
      return on !== written.on || volume !== written.volume ? [`${voice} ${volume.toFixed(2)}`] : [];
    })
    .join(', ');
}

/** The broom's wind, its six samples and its mixer of three voices (D243): drawn again
 * in a new language, and silent once the page is left. */
function windPanel(): { node: HTMLElement; draw: () => void; destroy: () => void } {
  const node = element('section', { className: 'themes-wind' });
  const wind = new Wind();
  let timers: ReturnType<typeof setTimeout>[] = [];
  const play = (sample: WindSample) => {
    for (const timer of timers) clearTimeout(timer);
    wind.stop(0.02, true);
    timers = windPlan(sample).map((played) =>
      setTimeout(() => {
        if ('effect' in played) playEffect(played.effect);
        else if ('cells' in played) wind.gust((played.cells * MOVE_MS) / 1000);
        else if ('near' in played) wind.near(played.near);
        // The whole flight is in the air from its lift to its landing, as a level's
        // wizard is: the rest is asked for meanwhile, and the landing switches it off.
        else if (played.wind === 'rest') wind.rest(true);
        else wind.land();
      }, played.at),
    );
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
      for (const voice of Object.keys(windMix) as WindVoice[]) mixWind(voice, WIND_WRITTEN[voice].on, WIND_WRITTEN[voice].volume);
      draw();
    });
    const buttons = WIND_SAMPLES.map((sample) => {
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
      wind.stop(0.02, true);
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
