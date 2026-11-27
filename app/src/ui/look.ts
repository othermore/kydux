// The settings that change how the game looks (D35): the scene's share of the
// level screen's width, and the editor's text size, its letter Inconsolata (D238); and
// how much smaller a low window draws the page (D359). Each is a CSS variable on the
// page's root, so that a screen drawn later finds it already set.

import { DEFAULT_SETTINGS, FONT_SIZES, SPLIT_MAX, SPLIT_MIN, type Settings } from '../progress/store';

export { FONT_SIZES, SPLIT_MAX, SPLIT_MIN };

/** A share kept between SPLIT_MIN and SPLIT_MAX; anything not a number is the default. */
export function clampSplit(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_SETTINGS.split;
  return Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, value));
}

/** The share a pointer at `x` gives, in a box from `left` that is `width` wide. */
export function splitAt(x: number, left: number, width: number): number {
  return clampSplit(width > 0 ? (x - left) / width : Number.NaN);
}

/** Shows a share of the width, while it is dragged and once it is kept. */
export function setSplit(share: number): void {
  document.documentElement.style.setProperty('--split', String(clampSplit(share)));
}

export function applyLook(settings: Pick<Settings, 'split' | 'fontSize'>): void {
  setSplit(settings.split);
  document.documentElement.style.setProperty('--editor-font-size', `${settings.fontSize}px`);
}

/** The smallest window the game is made for (D38): it and any larger one draw the page at
 * its full size (D359). */
export const FIT_WIDTH = 1024;
export const FIT_HEIGHT = 700;
/** The smallest the page is drawn, in the lowest window. */
export const FIT_MIN = 0.8;
/** A page this narrow or narrower, a phone's or a tablet's, keeps its own layout. */
export const FIT_NARROW = 800;

/** How much smaller a window of `width` by `height` draws the page (D359): 1 from
 * FIT_WIDTH by FIT_HEIGHT up, and under it down to FIT_MIN as the window is narrower or
 * lower; a narrow page keeps its size. */
export function fitOf(width: number, height: number): number {
  if (!(width > FIT_NARROW) || !(height > 0)) return 1;
  const fit = Math.max(FIT_MIN, Math.min(1, width / FIT_WIDTH, height / FIT_HEIGHT));
  return Math.round(fit * 1000) / 1000;
}

/** Sets `--fit` from the window's size, now and whenever the window changes. */
export function applyFit(): void {
  const fit = () => document.documentElement.style.setProperty('--fit', String(fitOf(innerWidth, innerHeight)));
  fit();
  addEventListener('resize', fit);
}
