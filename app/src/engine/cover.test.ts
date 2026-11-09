import { describe, expect, it } from 'vitest';
import { coveredShare, inFront, type Placed, ringCoveredShare, type Solid } from './cover';
import { MARK_DEPTH, markDepthIn, rowDepth, thingDepth } from './depth';

/** A texture `width`×`height`, solid where `solid` says. */
function texture(width: number, height: number, solid: (x: number, y: number) => boolean): Solid {
  const pixels = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) pixels[y * width + x] = solid(x, y) ? 1 : 0;
  return { width, solid: pixels };
}

function placed(key: string, x: number, y: number, width: number, height: number, scale = 1): Placed {
  return {
    x,
    y,
    scaleX: scale,
    scaleY: scale,
    displayOriginX: 0,
    displayOriginY: 0,
    texture: { key },
    frame: { cutX: 0, cutY: 0, cutWidth: width, cutHeight: height },
  };
}

// A figure wholly solid, 20×40, standing at 100,100.
const textures: Record<string, Solid> = {
  figure: texture(20, 40, () => true),
  wall: texture(100, 100, () => true),
  // Solid only in its top half: a crown over an empty trunk.
  crown: texture(100, 100, (_x, y) => y < 50),
};
const solidOf = (key: string) => textures[key] ?? null;
const figure = placed('figure', 100, 100, 20, 40);

describe('coveredShare', () => {
  it('is 0 with nothing in front, or with what is in front elsewhere', () => {
    expect(coveredShare(figure, [], solidOf)).toBe(0);
    expect(coveredShare(figure, [placed('wall', 300, 300, 100, 100)], solidOf)).toBe(0);
  });

  it('is 1 when an image in front covers the whole figure', () => {
    expect(coveredShare(figure, [placed('wall', 50, 50, 100, 100)], solidOf)).toBe(1);
  });

  it('counts only where the image in front is solid', () => {
    // The crown's solid half ends at y = 120: the figure's top half, from 100 to 120.
    expect(coveredShare(figure, [placed('crown', 70, 70, 100, 100)], solidOf)).toBeCloseTo(0.5, 1);
  });

  it('reads an image at its scale', () => {
    // The wall at half its size spans 100..150 each way: it covers the figure,
    // 100..120 across and 100..140 down.
    expect(coveredShare(figure, [placed('wall', 100, 100, 100, 100, 0.5)], solidOf)).toBe(1);
    // At a tenth it spans 100..110: a quarter of the figure's height, half its width.
    expect(coveredShare(figure, [placed('wall', 100, 100, 100, 100, 0.1)], solidOf)).toBeCloseTo(0.125, 2);
  });
});

describe('inFront (D107)', () => {
  it('counts only the images seen and drawn over the figure', () => {
    const doorway = { name: 'open doorway', depth: 1, visible: true, alpha: 1 };
    const wall = { name: 'wall', depth: 3.17, visible: true, alpha: 1 };
    const hidden = { name: 'gone', depth: 3.2, visible: false, alpha: 1 };
    const faded = { name: 'faded', depth: 3.2, visible: true, alpha: 0 };
    const behind = { name: 'row above', depth: 3.15, visible: true, alpha: 1 };
    expect(inFront({ depth: 3.158 }, [doorway, wall, hidden, faded, behind]).map((image) => image.name)).toEqual([
      'wall',
    ]);
  });
});


describe('ringCoveredShare (D160)', () => {
  // A mark of radius 10 lying at 100,100: its ring from 90 to 110 each way.
  it('is none where nothing is drawn over the ring', () => {
    expect(ringCoveredShare([100, 100], 10, [], solidOf)).toBe(0);
    expect(ringCoveredShare([100, 100], 10, [placed('wall', 200, 200, 100, 100)], solidOf)).toBe(0);
  });

  it('is the share of the ring an image covers: an arch over its top half', () => {
    // A wall from 0 to 100 down: the ring's top half, with its two side points.
    const share = ringCoveredShare([100, 100], 10, [placed('wall', 50, 0, 100, 100)], solidOf);
    expect(share).toBeGreaterThan(0.45);
    expect(share).toBeLessThan(0.6);
  });

  it('counts a figure standing on it by its own pixels', () => {
    // A figure drawn 10 wide over the ring's middle covers its top and its bottom only:
    // a third of it.
    const share = ringCoveredShare([100, 100], 10, [placed('figure', 95, 90, 20, 40, 0.5)], solidOf);
    expect(share).toBeGreaterThan(0.3);
    expect(share).toBeLessThan(0.4);
    // A crown solid only in its top half covers nothing below it.
    expect(ringCoveredShare([100, 100], 10, [placed('crown', 50, 5, 100, 100)], solidOf)).toBe(0);
  });
});

describe('the covering of a mark in a doorway (D172)', () => {
  // A door on row 6 whose picture, shut or open, is solid all over the mark's ring: the shut
  // leaf, or the doorway's floor seen through it.
  const door = (open: boolean) => ({
    ...placed('wall', 50, 50, 100, 100),
    depth: thingDepth(6, { under: true, open }),
    visible: true,
    alpha: 1,
  });

  it('is the shut door\'s while it is shut, the mark on the ground under it', () => {
    const over = inFront({ depth: MARK_DEPTH }, [door(false)]);
    expect(ringCoveredShare([100, 100], 10, over, solidOf)).toBe(1);
  });

  it('is none of the door\'s once it opens, the mark lying over its open picture', () => {
    const open = door(true);
    const over = inFront({ depth: markDepthIn(open.depth) }, [open]);
    expect(over).toEqual([]);
    expect(ringCoveredShare([100, 100], 10, over, solidOf)).toBe(0);
  });

  it('is still what stands before the doorway: the next row\'s things cover it', () => {
    const open = door(true);
    const before = { ...placed('crown', 50, 50, 100, 100), depth: rowDepth(7), visible: true, alpha: 1 };
    const over = inFront({ depth: markDepthIn(open.depth) }, [open, before]);
    expect(over).toEqual([before]);
    expect(ringCoveredShare([100, 100], 10, over, solidOf)).toBeGreaterThan(0.4);
  });
});
