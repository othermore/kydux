import { describe, expect, it } from 'vitest';
import { leadingColumns } from './editor';

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
