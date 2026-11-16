import { describe, expect, it } from 'vitest';
import { takeShape } from './goals';

const box = (left: number, top: number, right: number, bottom: number) => ({ left, top, right, bottom });

describe("the goals box's shape (D227)", () => {
  // At the scene's top left: the list a narrow column, the strip a low band.
  const list = box(10, 10, 290, 160);
  const strip = box(10, 10, 700, 90);

  it('takes the list where it covers nothing of the level', () => {
    expect(takeShape(list, strip, [box(400, 300, 440, 360), box(20, 200, 60, 260)])).toMatchObject({
      shape: 'list',
      fold: false,
    });
  });

  it('takes the strip where the list covers something and the strip nothing', () => {
    // A ring under the list's bottom, below the strip.
    expect(takeShape(list, strip, [box(200, 120, 260, 200)])).toEqual({ shape: 'strip', fold: false, covers: { list: 1, strip: 0 } });
  });

  it('takes the list, to be folded, where both cover something', () => {
    expect(takeShape(list, strip, [box(100, 40, 140, 100)])).toEqual({ shape: 'list', fold: true, covers: { list: 1, strip: 1 } });
  });

  it('counts a box that only touches an edge as covered by nothing', () => {
    expect(takeShape(list, strip, [box(290, 10, 330, 60), box(10, 160, 60, 200)])).toMatchObject({
      shape: 'list',
      fold: false,
    });
  });
});
