import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { framingAt } from '../ui/story';
import { FOOT_IN_CELL, figureDepth, shiftedBy, thingDepth } from './depth';
import { layout } from './layout';
import { TILE } from './placeholders';
import { spriteFoot, spriteName, spriteOrigin, type ThingSprites } from './things';
import { boxFrame } from './zooming';

// The shed on the page: a broom hung on a peg (D195), the zones (D196) and a story step's
// framing (D199).

const SPRITES: ThingSprites = {
  broom: { image: 'broom.webp', size: [1, 0.39], foot: [0.5, 0.82], lying: true },
  'broom-hung': { image: 'broom-hung.webp', size: [0.6, 1.3], foot: [0.5, 0.4], anchor: 'top' },
};

describe("the shed's brooms and zones", () => {
  it("hangs a broom from its peg's cell, its picture where the painted peg is (D195, D211)", () => {
    const things = JSON.parse(
      readFileSync(new URL('../../../content/art/things/things.json', import.meta.url), 'utf8'),
    ) as ThingSprites;
    const hung = things['broom-hung'] as ThingSprites[string];
    // On (x, 4), the peg's cell, its top on the painted peg's point at y 4.646.
    const [, y] = spriteFoot(hung, [6, 4]);
    expect(y / TILE).toBeCloseTo(4.646, 3);
  });

  it('draws a figure of the row under the pegs, lowered, over the broom hung above it (D211)', () => {
    const lowered = 0.25;
    expect(figureDepth(5 + FOOT_IN_CELL + lowered)).toBeGreaterThan(thingDepth(4));
  });

  it('moves a broom on a shifted cell sideways, and nowhere else (D207)', () => {
    const shifted = [{ cells: [[13, 6], [13, 6]] as [[number, number], [number, number]], by: -0.3 }];
    expect(shiftedBy(shifted, [13, 6])).toBe(-0.3);
    expect(shiftedBy(shifted, [12, 6])).toBe(0);
    expect(shiftedBy(undefined, [13, 6])).toBe(0);
  });

  it('draws a hung broom from its hung sprite, held by its top on the peg (D195)', () => {
    expect(spriteName(SPRITES, { kind: 'broom', hung: true })).toBe('broom-hung');
    expect(spriteName(SPRITES, { kind: 'broom', hung: false })).toBe('broom');
    expect(spriteName({ broom: SPRITES.broom as ThingSprites[string] }, { kind: 'broom', hung: true })).toBe('broom');
    const hung = SPRITES['broom-hung'] as ThingSprites[string];
    expect(spriteOrigin(hung)).toEqual([0.5, 0]);
    expect(spriteOrigin(SPRITES.broom as ThingSprites[string])).toEqual([0.5, 1]);
    expect(spriteFoot(hung, [6, 5])).toEqual([6.5 * TILE, 5.4 * TILE]);
  });

  it('gives the zones and a hung broom to the page (D195, D196)', () => {
    const shed = layout({
      map: ['========', '...S....'],
      zones: { wall: [[0, 1, 3, 1]], straw: [[4, 1, 7, 1]] },
      things: [{ kind: 'broom', id: 'broom_1', at: [1, 0], hung: true, zone: 'wall' }],
    });
    expect(shed.zones.map(({ name, cells }) => [name, cells.length])).toEqual([
      ['wall', 4],
      ['straw', 4],
    ]);
    expect(shed.things[0]?.hung).toBe(true);
  });
});

describe("a story step's framing (D199)", () => {
  it('shows a box of cells whole, zoomed out as far as it must and no further than 1', () => {
    expect(boxFrame([3, 3, 16, 10], [15, 9], 0.3)).toEqual({ zoom: 1, centre: [10, 7] });
    expect(boxFrame([3, 3, 16, 10], [10, 6], 0.3)).toEqual({ zoom: 10 / 14, centre: [10, 7] });
    expect(boxFrame([0, 0, 29, 3], [15, 9], 0.3).zoom).toBe(0.5);
    expect(boxFrame([0, 0, 99, 3], [15, 9], 0.3).zoom).toBe(0.3);
  });

  it('holds the last framing of the part until a step frames another', () => {
    const steps = [{}, { camera: { fit: [[3, 3], [16, 10]] } }, {}, { camera: { wide: true } }].map((step) => ({
      who: 'voice',
      do: null,
      text: '',
      ...step,
    })) as Parameters<typeof framingAt>[0];
    expect(framingAt(steps, 0, 0)).toBeNull();
    expect(framingAt(steps, 0, 2)).toEqual({ fit: [3, 3, 16, 10] });
    expect(framingAt(steps, 0, 3)).toEqual({ wide: true });
    expect(framingAt(steps, 2, 2)).toBeNull();
  });
});
