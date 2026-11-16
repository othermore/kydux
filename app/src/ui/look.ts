// The settings that change how the game looks (D35): the scene's share of the
// level screen's width, and the editor's text size, its letter Inconsolata (D238). Each
// is a CSS variable on the page's root, so that a screen drawn later finds it already
// set.

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
