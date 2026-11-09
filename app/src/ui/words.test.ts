import { describe, expect, it } from 'vitest';
import { codeParts } from './words';

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
});
