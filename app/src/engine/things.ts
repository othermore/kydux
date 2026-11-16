// Things drawn from a sprite of their kind (D182): a broom lying on the floor, a
// ring standing on its post. A kind may have a picture of its own,
// content/art/things/<kind>.webp, listed in content/art/things/things.json with its
// size in cells and where its foot stands in its cell; a thing on a painted scene
// with no cut-out of its own is drawn from it at its cell, its foot there, among the
// figures by its row, scaled by the scene's cell as a figure is, the same on every
// scene. A thing hidden in the straw is drawn only once found (D184). A broom that
// hangs on a peg (D195) is drawn from its kind's hung sprite, `broom-hung`, its top on
// the peg's point and at the rack's depth, behind a figure standing under it. A ring
// is drawn from its colour's sprite, `ring-red` (D219).

import { TILE } from './placeholders';
import type { Tile } from './sight';

/** A kind's sprite, as things.json lists it: its picture, its size in cells (width,
 * height: the picture is drawn that tall, its width keeping its proportion), and
 * where in its cell its foot stands: across, from its left, and down, from its top,
 * in parts of a cell (`[0.5, 1]`, the middle of the cell's lower edge). */
export interface ThingSprite {
  image: string;
  size: [number, number];
  foot: [number, number];
  /** Where the picture's foot is in it, in parts of its width and height: the bottom
   * middle unless it says. */
  origin?: [number, number];
  /** Whether it lies flat on the floor, under whoever stands on its cell, as a broom
   * does; a thing that stands, a ring, is drawn among the figures by its row. */
  lying?: boolean;
  /** `top` for a thing that hangs from its top, a broom on a peg (D195): its origin is
   * the top middle unless it says, and `foot` is then the peg's point in the cell. */
  anchor?: 'top';
}

export type ThingSprites = Record<string, ThingSprite>;

/** The texture a kind's sprite is loaded as. */
export function spriteKey(kind: string): string {
  return `sprite-${kind}`;
}

/** What of a thing chooses its sprite: its kind, whether it hangs, its colour. */
export interface Sprited {
  kind: string;
  hung?: boolean;
  colour?: string;
}

/** The sprite a thing is drawn from, by name: its kind's; for a hung broom its kind's
 * hung one (D195), and for a ring its colour's (D219), when things.json lists it. */
export function spriteName(sprites: ThingSprites | null, { kind, hung, colour }: Sprited): string {
  const own = hung ? `${kind}-hung` : colour ? `${kind}-${colour}` : null; // i18n-ignore: things.json's names
  return own !== null && sprites !== null && own in sprites ? own : kind;
}

/** Where in its picture a sprite is held: its origin, the bottom middle unless it hangs
 * from its top or says otherwise. */
export function spriteOrigin(sprite: ThingSprite): [number, number] {
  return sprite.origin ?? (sprite.anchor === 'top' ? [0.5, 0] : [0.5, 1]);
}

/** Where a sprite's foot is drawn on a tile, in the scene's pixels. */
export function spriteFoot(sprite: ThingSprite, [x, y]: Tile): [number, number] {
  return [(x + sprite.foot[0]) * TILE, (y + sprite.foot[1]) * TILE];
}

/** How much a sprite's picture is scaled for its height in cells, from its height in
 * pixels. */
export function spriteScale(sprite: ThingSprite, pictureHeight: number): number {
  return pictureHeight > 0 ? (sprite.size[1] * TILE) / pictureHeight : 1;
}

/** The kinds a sprite is drawn for, when the scene has no cut-out of the thing:
 * those things.json lists. */
export function drawnFromSprite(sprites: ThingSprites | null, kind: string, painted: boolean): boolean {
  return !painted && sprites !== null && kind in sprites;
}
