import { describe, expect, it } from 'vitest';
import { codeParts, italicParts } from './words';

describe('a level\'s words show their code as code (D140)', () => {
  it('cuts a text at its backquotes', () => {
    expect(codeParts('Now `rest = 5 - steps` walks the rest.')).toEqual([
      { text: 'Now ', code: false },
      { text: 'rest = 5 - steps', code: true },
      { text: ' walks the rest.', code: false },
    ]);
  });

  it('leaves a text with none as it is, and shows no backquote', () => {
    expect(codeParts('No code here.')).toEqual([{ text: 'No code here.', code: false }]);
    expect(codeParts('`wait`').map((part) => part.text).join('')).not.toContain('`');
  });

  it('shows a spell\'s word in italics, with no asterisk', () => {
    expect(italicParts('Cast *kirra* first.')).toEqual([
      { text: 'Cast ', italic: false },
      { text: 'kirra', italic: true },
      { text: ' first.', italic: false },
    ]);
    expect(italicParts('Two * three')).toEqual([{ text: 'Two * three', italic: false }]);
  });
});
