import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MARK_SHAPES } from './ui/mark';

// The page's look (D193): one set of tokens, and the components drawn with them.
const css = readFileSync(new URL('./style.css', import.meta.url), 'utf8');
const root = /:root\s*{([^}]*)}/.exec(css)?.[1] ?? '';

/** A rule's declarations, by its exact selector list. */
function rule(selectors: string): string {
  const at = css.indexOf(`${selectors} {`);
  expect(at, selectors).toBeGreaterThanOrEqual(0);
  return css.slice(at, css.indexOf('}', at));
}

describe("the page's look (D193)", () => {
  it('declares the palette, the shapes and the type as tokens', () => {
    for (const token of [
      'parchment',
      'paper',
      'ink',
      'moss',
      'gold',
      'sky',
      'rose',
      'radius',
      'shadow',
      'space-4',
      'font-story',
      'grain',
    ]) {
      expect(root, token).toMatch(new RegExp(`--${token}:`));
    }
  });

  it('draws a button, a card and a panel from the tokens, with no colour of their own', () => {
    const button = rule('.button,\n.buttons button,\n.card button,\n.big-button');
    expect(button).toContain('background: var(--moss)');
    expect(button).toContain('border-radius: var(--radius)');
    expect(rule('.card,\n.panel')).toContain('background: var(--paper)');
    for (const declarations of [button, rule('.card,\n.panel'), rule('.chip')]) {
      expect(declarations).not.toMatch(/#[0-9a-f]{3,6}\b/i);
    }
  });

  it('keeps the old blue out of the page', () => {
    expect(css).not.toMatch(/#3b5bdb|#3d5bd9/i);
  });

  it('draws its mark as a hat in ink and a wand of wood, with gold, the tab\'s icon the same (D254)', () => {
    const colours = new Set(MARK_SHAPES.flatMap(([, attributes]) => [attributes.fill, attributes.stroke]).filter(Boolean));
    expect([...colours].sort()).toEqual(['#2b2533', '#6b4423', '#a06c38', '#d49b2a']);
    const icon = readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8');
    for (const [tag, attributes] of MARK_SHAPES) {
      const written = Object.entries(attributes).map(([name, value]) => `${name}="${value}"`).join(' ');
      expect(icon).toContain(`<${tag} ${written}/>`);
    }
  });
});
