// The code's letter (D223): three candidates, each a face, a width and the editor's
// size a new child gets, tried in the page under ?debug. The faces are bundled with the
// game (src/fonts/, one @font-face each in style.css). The one in use where nothing is
// chosen is DEFAULT_CODE_FONT.

// The faces are CSS families, not words for people.
export const CODE_FONTS = {
  'inconsolata-16': { face: "'Inconsolata'", stretch: '100%', size: 16 },
  'noto-semi-14': { face: "'Noto Sans Mono'", stretch: '87.5%', size: 14 }, // i18n-ignore
  'noto-condensed-14': { face: "'Noto Sans Mono'", stretch: '75%', size: 14 }, // i18n-ignore
} as const;

export type CodeFont = keyof typeof CODE_FONTS;

export const DEFAULT_CODE_FONT: CodeFont = 'inconsolata-16';

/** The candidates, in the order the settings offer them. */
export const CODE_FONT_NAMES = Object.keys(CODE_FONTS) as CodeFont[];

export function isCodeFont(value: unknown): value is CodeFont {
  return typeof value === 'string' && Object.hasOwn(CODE_FONTS, value);
}
