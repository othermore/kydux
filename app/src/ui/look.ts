// The settings that change how the game looks (D35): the scene's share of the
// level screen's width, and the editor's text size. Both are CSS variables on
// the page's root, so that a screen drawn later finds them already set.

import { SPLIT_MAX, SPLIT_MIN, type Settings } from '../progress/store';

export { SPLIT_MAX, SPLIT_MIN };
/** The editor's text sizes offered, in pixels. */
export const FONT_SIZES = [14, 17, 20, 24] as const;

/** A share kept between SPLIT_MIN and SPLIT_MAX; anything not a number is the middle. */
export function clampSplit(value: number): number {
  if (!Number.isFinite(value)) return (SPLIT_MIN + SPLIT_MAX) / 2;
  return Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, value));
}

/** The share a pointer at `x` gives, in a box from `left` that is `width` wide. */
export function splitAt(x: number, left: number, width: number): number {
  return clampSplit(width > 0 ? (x - left) / width : Number.NaN);
}

export function applyLook(settings: Pick<Settings, 'split' | 'fontSize'>): void {
  const root = document.documentElement.style;
  root.setProperty('--split', String(clampSplit(settings.split)));
  root.setProperty('--editor-font-size', `${settings.fontSize}px`);
}
