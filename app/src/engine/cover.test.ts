import { describe, expect, it } from 'vitest';
import { coveredShare, type Placed, type Solid } from './cover';

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
