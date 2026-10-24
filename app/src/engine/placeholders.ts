// The tiles and the wizard drawn at run time, until the game has its art
// (plan, phase 4). Plain Canvas 2D, so that nothing is loaded from a file and
// the same drawing comes out everywhere.

import type Phaser from 'phaser';
import type { DoorLock } from './layout';
import { DEFAULT_LOOK, type HairStyle, type Look } from './looks';

export const TILE = 48;
export const WIZARD_WIDTH = 36;
export const WIZARD_HEIGHT = 44;

export const TILES_KEY = 'kydux-tiles';
export const WIZARD_KEY = 'kydux-wizard';
export const FACINGS = ['down', 'left', 'right', 'up'] as const;
export type Facing = (typeof FACINGS)[number];

/** The tile indexes in the tiles texture, in the order they are drawn. */
export const FLOOR = 0;
export const WALL = 1;
export const SHELF = 2;

/** One colour per marker letter, in the order the letters first appear. */
const MARKER_COLOURS = ['#e8a33d', '#4cb5ae', '#c65d9a', '#7aa04a', '#5b7bd6', '#d0623f'];

export function markerKey(letter: string): string {
  return `kydux-marker-${letter}`;
}

/** A thing's texture. A door has a frame for each way it is closed, named as its
 * layout's lock (`none`, `key`, `spell`, `word`), and `open`. */
export function thingKey(kind: string): string {
  return `kydux-thing-${kind}`;
}

export function actorKey(kind: string): string {
  return `kydux-actor-${kind}`;
}

/** A friend's texture, one per friend: each is drawn as the character (D66). */
export function friendKey(id: string): string {
  return `kydux-friend-${id}`;
}

function canvas(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
): { ctx: CanvasRenderingContext2D; texture: Phaser.Textures.CanvasTexture } {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const texture = scene.textures.createCanvas(key, width, height);
  if (!texture) throw new Error(`could not make the texture ${key}`);
  return { ctx: texture.getContext(), texture };
}

function drawFloor(ctx: CanvasRenderingContext2D, x: number): void {
  ctx.fillStyle = '#8d8f99';
  ctx.fillRect(x, 0, TILE, TILE);
  ctx.fillStyle = '#9a9ca6';
  ctx.fillRect(x + 2, 2, TILE / 2 - 3, TILE / 2 - 3);
  ctx.fillRect(x + TILE / 2 + 1, TILE / 2 + 1, TILE / 2 - 3, TILE / 2 - 3);
  ctx.strokeStyle = '#6f717b';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, 0.5, TILE - 1, TILE - 1);
}

/** A stair seen from above: steps in place, or the gap it leaves when away. */
function drawStair(ctx: CanvasRenderingContext2D, x: number, inPlace: boolean): void {
  ctx.fillStyle = '#14151b';
  ctx.fillRect(x, 0, TILE, TILE);
  if (!inPlace) {
    ctx.strokeStyle = '#3d3f4a';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x + 4.5, 4.5, TILE - 9, TILE - 9);
    ctx.setLineDash([]);
    return;
  }
  for (let step = 0; step < 4; step += 1) {
    ctx.fillStyle = step % 2 === 0 ? '#9c6b3f' : '#7a4e2d';
    ctx.fillRect(x + 4, 4 + step * 10, TILE - 8, 10);
  }
}

/** A shelf seen from above: a wooden case with books' backs in a row (D46). */
function drawShelf(ctx: CanvasRenderingContext2D, x: number): void {
  drawFloor(ctx, x);
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(x + 3, 10, TILE - 6, TILE - 20);
  ctx.fillStyle = '#8a5a35';
  ctx.fillRect(x + 5, 12, TILE - 10, TILE - 24);
  const backs = ['#c0392b', '#2b6cb0', '#2f855a', '#b7791f', '#6b46c1'];
  backs.forEach((colour, index) => {
    ctx.fillStyle = colour;
    ctx.fillRect(x + 7 + index * 7, 14, 5, TILE - 28);
  });
}

function drawWall(ctx: CanvasRenderingContext2D, x: number): void {
  ctx.fillStyle = '#3d3f4a';
  ctx.fillRect(x, 0, TILE, TILE);
  ctx.fillStyle = '#585b69';
  ctx.fillRect(x, 0, TILE, 8);
  ctx.strokeStyle = '#2b2c34';
  ctx.lineWidth = 2;
  for (const y of [20, 34]) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + TILE, y);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(x + TILE / 2, 8);
  ctx.lineTo(x + TILE / 2, 20);
  ctx.moveTo(x + TILE / 4, 20);
  ctx.lineTo(x + TILE / 4, 34);
  ctx.moveTo(x + (3 * TILE) / 4, 34);
  ctx.lineTo(x + (3 * TILE) / 4, TILE);
  ctx.stroke();
}

function drawMarker(ctx: CanvasRenderingContext2D, colour: string): void {
  ctx.strokeStyle = colour;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(TILE / 2, TILE / 2, TILE / 2 - 7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = `${colour}55`;
  ctx.fill();
}

export interface Figure {
  robe: string;
  /** The hat and its band, or null for a figure without one. */
  hat: { colour: string; band: string } | null;
  hair: string;
  hairStyle: HairStyle;
  skin: string;
}

const TEACHER: Figure = {
  robe: '#6c6f7d',
  hat: null,
  hair: '#c9c9c9',
  hairStyle: 'short',
  skin: '#f2c9a0',
};

const GHOST: Figure = {
  robe: '#dfe7f2',
  hat: null,
  hair: '#c3cfe0',
  hairStyle: 'short',
  skin: '#eef3fa',
};

/** The friends who teach, each in their own colours (D66): Nuri, a pupil with
 * a hat like the wizard's and the wizard's gender (D37); Wenna, the librarian.
 * A friend the game has no figure for is drawn as a teacher. */
export function friendFigure(id: string, gender: 'girl' | 'boy'): Figure {
  if (id === 'nuri') {
    return {
      robe: '#3f8f5a',
      hat: { colour: '#2f6b44', band: '#e8c547' },
      hair: '#4a2c1a',
      hairStyle: gender === 'girl' ? 'long' : 'short',
      skin: '#c98e5f',
    };
  }
  if (id === 'wenna') {
    return { robe: '#5a4a8f', hat: null, hair: '#2b2b2b', hairStyle: 'long', skin: '#f0c8a0' };
  }
  return TEACHER;
}

/** The cat, facing one way: a body, a head with ears, a tail. */
function drawCat(ctx: CanvasRenderingContext2D, x: number, facing: Facing): void {
  const cx = x + WIZARD_WIDTH / 2;
  const side = facing === 'left' ? -1 : 1;
  ctx.fillStyle = '#3a3a44';
  ctx.beginPath();
  ctx.ellipse(cx, 34, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  const head = facing === 'left' || facing === 'right' ? cx + side * 9 : cx;
  const headY = facing === 'up' ? 27 : 29;
  ctx.beginPath();
  ctx.arc(head, headY, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(head - 5, headY - 3);
  ctx.lineTo(head - 3, headY - 9);
  ctx.lineTo(head - 1, headY - 4);
  ctx.moveTo(head + 5, headY - 3);
  ctx.lineTo(head + 3, headY - 9);
  ctx.lineTo(head + 1, headY - 4);
  ctx.fill();
  ctx.strokeStyle = '#3a3a44';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - side * 9, 34);
  ctx.quadraticCurveTo(cx - side * 16, 30, cx - side * 13, 22);
  ctx.stroke();
  if (facing !== 'up') {
    ctx.fillStyle = '#ffd43b';
    ctx.fillRect(head - 3, headY - 1, 2, 2);
    ctx.fillRect(head + 1, headY - 1, 2, 2);
  }
}

function wizardFigure(look: Look): Figure {
  return {
    robe: look.robe,
    hat: { colour: look.hat, band: look.band },
    hair: look.hair,
    hairStyle: look.hairStyle,
    skin: look.skin,
  };
}

/** The wizard facing one way, in a frame of WIZARD_WIDTH by WIZARD_HEIGHT at x. */
function drawWizard(ctx: CanvasRenderingContext2D, x: number, facing: Facing, look: Look): void {
  drawFigure(ctx, x, facing, wizardFigure(look));
}

/** A look's wizard facing the viewer, on a canvas of its own: for a screen
 * outside the scene, like the creator. The canvas is WIZARD_WIDTH by
 * WIZARD_HEIGHT; CSS makes it bigger, pixelated. */
export function drawLookPreview(target: HTMLCanvasElement, look: Look): void {
  target.width = WIZARD_WIDTH;
  target.height = WIZARD_HEIGHT;
  const ctx = target.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, WIZARD_WIDTH, WIZARD_HEIGHT);
  drawWizard(ctx, 0, 'down', look);
}

/** A figure facing the viewer, on a canvas of its own: a character beside a
 * lesson (D67). The canvas is WIZARD_WIDTH by WIZARD_HEIGHT; CSS makes it
 * bigger, pixelated. */
export function drawFigurePreview(target: HTMLCanvasElement, figure: Figure): void {
  target.width = WIZARD_WIDTH;
  target.height = WIZARD_HEIGHT;
  const ctx = target.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, WIZARD_WIDTH, WIZARD_HEIGHT);
  drawFigure(ctx, 0, 'down', figure);
}

/** Long hair: past the hat's brim at the sides, and from behind over the robe. */
function drawLongHair(ctx: CanvasRenderingContext2D, cx: number, facing: Facing, hair: string): void {
  ctx.fillStyle = hair;
  if (facing === 'up') {
    ctx.fillRect(cx - 8, 14, 16, 14);
  } else if (facing === 'down') {
    ctx.fillRect(cx - 9, 12, 4, 15);
    ctx.fillRect(cx + 5, 12, 4, 15);
  } else {
    // Seen from a side, the hair falls behind the head.
    const back = facing === 'left' ? cx + 3 : cx - 8;
    ctx.fillRect(back, 12, 5, 15);
  }
}

/** A person facing one way: the wizard, with a hat, or the teacher, without. */
function drawFigure(ctx: CanvasRenderingContext2D, x: number, facing: Facing, figure: Figure): void {
  const cx = x + WIZARD_WIDTH / 2;
  // The robe.
  ctx.fillStyle = figure.robe;
  ctx.beginPath();
  ctx.moveTo(cx - 13, 42);
  ctx.lineTo(cx + 13, 42);
  ctx.lineTo(cx + 8, 20);
  ctx.lineTo(cx - 8, 20);
  ctx.closePath();
  ctx.fill();
  if (figure.hat && figure.hairStyle === 'long') drawLongHair(ctx, cx, facing, figure.hair);
  // The face, or the back of the head.
  ctx.fillStyle = facing === 'up' ? figure.hair : figure.skin;
  ctx.beginPath();
  ctx.arc(cx, 18, 7, 0, Math.PI * 2);
  ctx.fill();
  if (facing !== 'up') {
    ctx.fillStyle = '#1f2330';
    const eyes = facing === 'down' ? [-3, 3] : facing === 'left' ? [-4] : [4];
    for (const dx of eyes) ctx.fillRect(cx + dx - 1, 17, 2, 2);
  }
  if (!figure.hat) {
    // Hair, and glasses for whoever faces the viewer or a side.
    ctx.fillStyle = figure.hair;
    ctx.fillRect(cx - 7, 10, 14, 4);
    if (facing !== 'up') {
      ctx.strokeStyle = '#1f2330';
      ctx.lineWidth = 1;
      const lenses = facing === 'down' ? [-3, 3] : facing === 'left' ? [-4] : [4];
      for (const dx of lenses) ctx.strokeRect(cx + dx - 2, 16, 4, 3);
    }
    return;
  }
  // Short hair shows under the brim, at the sides of the face.
  if (figure.hairStyle === 'short' && facing !== 'up') {
    ctx.fillStyle = figure.hair;
    if (facing !== 'right') ctx.fillRect(cx - 8, 13, 3, 4);
    if (facing !== 'left') ctx.fillRect(cx + 5, 13, 3, 4);
  }
  // The hat: its brim, then its point, leaning the way the wizard faces.
  const lean = facing === 'left' ? -4 : facing === 'right' ? 4 : 0;
  ctx.fillStyle = figure.hat.colour;
  ctx.fillRect(cx - 12, 11, 24, 3);
  ctx.beginPath();
  ctx.moveTo(cx - 8, 11);
  ctx.lineTo(cx + 8, 11);
  ctx.lineTo(cx + lean, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = figure.hat.band;
  ctx.fillRect(cx - 8, 9, 16, 2);
}

const DOOR_LOCKS: readonly DoorLock[] = ['none', 'key', 'spell', 'word'];

/** What a closed door shows of how it opens: a keyhole, a glowing rune, a mouth. */
function drawLock(ctx: CanvasRenderingContext2D, x: number, lock: DoorLock): void {
  const c = x + TILE / 2;
  switch (lock) {
    case 'key':
      ctx.fillStyle = '#c9a227';
      ctx.fillRect(c - 6, 18, 12, 16);
      ctx.fillStyle = '#1b1c22';
      ctx.beginPath();
      ctx.arc(c, 24, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(c - 1, 25, 2, 6);
      break;
    case 'spell':
      ctx.strokeStyle = '#9be7ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(c, 24, 9, 0, Math.PI * 2);
      ctx.moveTo(c, 15);
      ctx.lineTo(c, 33);
      ctx.moveTo(c - 6, 20);
      ctx.lineTo(c + 6, 28);
      ctx.stroke();
      ctx.fillStyle = 'rgba(155, 231, 255, 0.25)';
      ctx.fill();
      break;
    case 'word':
      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.ellipse(c, 26, 9, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1b1c22';
      ctx.beginPath();
      ctx.ellipse(c, 26, 6, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'none':
      break;
  }
}

/** A thing, small on its tile, or a door filling it. */
function drawThing(ctx: CanvasRenderingContext2D, x: number, kind: string, open = false): void {
  const c = x + TILE / 2;
  switch (kind) {
    case 'door':
      if (open) {
        ctx.fillStyle = '#1b1c22';
        ctx.fillRect(x + 6, 4, TILE - 12, TILE - 4);
        ctx.fillStyle = '#7a4e2d';
        ctx.fillRect(x + 4, 4, 5, TILE - 4);
      } else {
        ctx.fillStyle = '#7a4e2d';
        ctx.fillRect(x + 4, 4, TILE - 8, TILE - 4);
        ctx.strokeStyle = '#5a3820';
        ctx.lineWidth = 2;
        for (const dx of [14, 24, 34]) {
          ctx.beginPath();
          ctx.moveTo(x + dx, 6);
          ctx.lineTo(x + dx, TILE);
          ctx.stroke();
        }
        ctx.fillStyle = '#ffd43b';
        ctx.fillRect(x + TILE - 14, 26, 4, 4);
      }
      break;
    case 'key':
      ctx.strokeStyle = '#ffd43b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(c - 7, 24, 5, 0, Math.PI * 2);
      ctx.moveTo(c - 2, 24);
      ctx.lineTo(c + 12, 24);
      ctx.moveTo(c + 8, 24);
      ctx.lineTo(c + 8, 29);
      ctx.moveTo(c + 12, 24);
      ctx.lineTo(c + 12, 29);
      ctx.stroke();
      break;
    case 'book':
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(c - 10, 15, 20, 18);
      ctx.fillStyle = '#f5e6c8';
      ctx.fillRect(c + 6, 16, 3, 16);
      break;
    case 'wand':
      ctx.strokeStyle = '#6b4a2b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(c - 10, 34);
      ctx.lineTo(c + 8, 16);
      ctx.stroke();
      ctx.fillStyle = '#fff3bf';
      ctx.fillRect(c + 7, 13, 5, 5);
      break;
    default:
      // A potion, or anything else: a round bottle.
      ctx.fillStyle = '#4cb5ae';
      ctx.beginPath();
      ctx.arc(c, 28, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(c - 3, 14, 6, 8);
  }
}

/** Makes every placeholder texture a level with these marker letters and these
 * friends needs. */
export function makePlaceholders(
  scene: Phaser.Scene,
  markers: string[],
  look: Look = DEFAULT_LOOK,
  friends: string[] = [],
): void {
  const tiles = canvas(scene, TILES_KEY, TILE * 3, TILE);
  drawFloor(tiles.ctx, FLOOR * TILE);
  drawWall(tiles.ctx, WALL * TILE);
  drawShelf(tiles.ctx, SHELF * TILE);
  tiles.texture.refresh();

  markers.forEach((letter, index) => {
    const marker = canvas(scene, markerKey(letter), TILE, TILE);
    drawMarker(marker.ctx, MARKER_COLOURS[index % MARKER_COLOURS.length] ?? '#e8a33d');
    marker.texture.refresh();
  });

  const wizard = canvas(scene, WIZARD_KEY, WIZARD_WIDTH * FACINGS.length, WIZARD_HEIGHT);
  FACINGS.forEach((facing, index) => {
    drawWizard(wizard.ctx, index * WIZARD_WIDTH, facing, look);
    wizard.texture.add(facing, 0, index * WIZARD_WIDTH, 0, WIZARD_WIDTH, WIZARD_HEIGHT);
  });
  wizard.texture.refresh();

  const teacher = canvas(scene, actorKey('teacher'), WIZARD_WIDTH * FACINGS.length, WIZARD_HEIGHT);
  FACINGS.forEach((facing, index) => {
    drawFigure(teacher.ctx, index * WIZARD_WIDTH, facing, TEACHER);
    teacher.texture.add(facing, 0, index * WIZARD_WIDTH, 0, WIZARD_WIDTH, WIZARD_HEIGHT);
  });
  teacher.texture.refresh();

  // The ghost: a pale figure, half seen through; the cat: small, on all fours.
  const ghost = canvas(scene, actorKey('ghost'), WIZARD_WIDTH * FACINGS.length, WIZARD_HEIGHT);
  ghost.ctx.globalAlpha = 0.7;
  FACINGS.forEach((facing, index) => {
    drawFigure(ghost.ctx, index * WIZARD_WIDTH, facing, GHOST);
    ghost.texture.add(facing, 0, index * WIZARD_WIDTH, 0, WIZARD_WIDTH, WIZARD_HEIGHT);
  });
  ghost.texture.refresh();
  for (const id of friends) {
    const friend = canvas(scene, friendKey(id), WIZARD_WIDTH * FACINGS.length, WIZARD_HEIGHT);
    const figure = friendFigure(id, look.gender);
    FACINGS.forEach((facing, index) => {
      drawFigure(friend.ctx, index * WIZARD_WIDTH, facing, figure);
      friend.texture.add(facing, 0, index * WIZARD_WIDTH, 0, WIZARD_WIDTH, WIZARD_HEIGHT);
    });
    friend.texture.refresh();
  }
  const cat = canvas(scene, actorKey('cat'), WIZARD_WIDTH * FACINGS.length, WIZARD_HEIGHT);
  FACINGS.forEach((facing, index) => {
    drawCat(cat.ctx, index * WIZARD_WIDTH, facing);
    cat.texture.add(facing, 0, index * WIZARD_WIDTH, 0, WIZARD_WIDTH, WIZARD_HEIGHT);
  });
  cat.texture.refresh();

  const door = canvas(scene, thingKey('door'), TILE * (DOOR_LOCKS.length + 1), TILE);
  DOOR_LOCKS.forEach((lock, index) => {
    drawThing(door.ctx, index * TILE, 'door', false);
    drawLock(door.ctx, index * TILE, lock);
    door.texture.add(lock, 0, index * TILE, 0, TILE, TILE);
  });
  drawThing(door.ctx, DOOR_LOCKS.length * TILE, 'door', true);
  door.texture.add('open', 0, DOOR_LOCKS.length * TILE, 0, TILE, TILE);
  door.texture.refresh();

  // A stair: wooden steps in place, a dark gap while it is away (D53).
  const stair = canvas(scene, thingKey('stair'), TILE * 2, TILE);
  drawStair(stair.ctx, 0, true);
  drawStair(stair.ctx, TILE, false);
  stair.texture.add('in', 0, 0, 0, TILE, TILE);
  stair.texture.add('away', 0, TILE, 0, TILE, TILE);
  stair.texture.refresh();

  for (const kind of ['key', 'book', 'wand', 'potion']) {
    const thing = canvas(scene, thingKey(kind), TILE, TILE);
    drawThing(thing.ctx, 0, kind);
    thing.texture.refresh();
  }
}
