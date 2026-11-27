import { EditorState } from '@codemirror/state';
import { describe, expect, it } from 'vitest';
import { leadingColumns, lineScroll } from './editor';

describe("a wrapped line's hanging indent (D223)", () => {
  it("counts the line's leading spaces, a tab to the next stop of four", () => {
    expect(leadingColumns('wizard.move_up(2)')).toBe(0);
    expect(leadingColumns('    # Deberás usar move_left')).toBe(4);
    expect(leadingColumns('        broom.untie()')).toBe(8);
    expect(leadingColumns('\tx = 1')).toBe(4);
    expect(leadingColumns('  \tx = 1')).toBe(4);
    expect(leadingColumns('    ')).toBe(4);
  });
});

describe('a line brought into sight (D363, D366)', () => {
  const doc = ['wizard.move_up(3)', 'wizard.move_right(4)', 'for escoba in escobas:', '    escoba.untie()'].join('\n');
  const state = EditorState.create({ doc, selection: { anchor: 5 } });

  it('scrolls to the start of a line of the document by the least, a line of margin clear', () => {
    const scroll = lineScroll(state, 4, 22.4);
    const effects = [scroll?.effects ?? []].flat();
    expect(effects).toHaveLength(1);
    const target = effects[0]?.value as { range: { from: number; to: number }; y: string; yMargin: number };
    expect(target.range.from).toBe(state.doc.line(4).from);
    expect(target.range.to).toBe(state.doc.line(4).from);
    expect(target.y).toBe('nearest');
    expect(target.yMargin).toBe(22.4);
  });

  it('moves no selection', () => {
    const scroll = lineScroll(state, 3, 22.4);
    expect(scroll).not.toBeNull();
    expect(scroll?.selection).toBeUndefined();
    expect(state.update(scroll ?? {}).state.selection.eq(state.selection)).toBe(true);
  });

  it('does nothing for line 0 and for a line past the end', () => {
    expect(lineScroll(state, 0, 22.4)).toBeNull();
    expect(lineScroll(state, 5, 22.4)).toBeNull();
    expect(lineScroll(state, -1, 22.4)).toBeNull();
  });
});
