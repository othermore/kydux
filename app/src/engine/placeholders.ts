// The tiles and the wizard drawn at run time, until the game has its art
// (plan, phase 4). Plain Canvas 2D, so that nothing is loaded from a file and
// the same drawing comes out everywhere.

import type Phaser from 'phaser';

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

/** One colour per marker letter, in the order the letters first appear. */
const MARKER_COLOURS = ['#e8a33d', '#4cb5ae', '#c65d9a', '#7aa04a', '#5b7bd6', '#d0623f'];

export function markerKey(letter: string): string {
  return `kydux-marker-${letter}`;
}

/** A thing's texture: a door has two frames, `closed` and `open`. */
export function thingKey(kind: string): string {
  return `kydux-thing-${kind}`;
}

export function actorKey(kind: string): string {
  return `kydux-actor-${kind}`;
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

interface Figure {
  robe: string;
  hat: string | null;
  hair: string;
}

const WIZARD: Figure = { robe: '#3b5bdb', hat: '#2b3fa8', hair: '#6b4a2b' };
const TEACHER: Figure = { robe: '#6c6f7d', hat: null, hair: '#c9c9c9' };

/** The wizard facing one way, in a frame of WIZARD_WIDTH by WIZARD_HEIGHT at x. */
function drawWizard(ctx: CanvasRenderingContext2D, x: number, facing: Facing): void {
  drawFigure(ctx, x, facing, WIZARD);
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
  // The face, or the back of the head.
  ctx.fillStyle = facing === 'up' ? figure.hair : '#f2c9a0';
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
  // The hat: its brim, then its point, leaning the way the wizard faces.
  const lean = facing === 'left' ? -4 : facing === 'right' ? 4 : 0;
  ctx.fillStyle = figure.hat;
  ctx.fillRect(cx - 12, 11, 24, 3);
  ctx.beginPath();
  ctx.moveTo(cx - 8, 11);
  ctx.lineTo(cx + 8, 11);
  ctx.lineTo(cx + lean, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd43b';
  ctx.fillRect(cx - 8, 9, 16, 2);
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

/** Makes every placeholder texture a level with these marker letters needs. */
export function makePlaceholders(scene: Phaser.Scene, markers: string[]): void {
  const tiles = canvas(scene, TILES_KEY, TILE * 2, TILE);
  drawFloor(tiles.ctx, FLOOR * TILE);
  drawWall(tiles.ctx, WALL * TILE);
  tiles.texture.refresh();

  markers.forEach((letter, index) => {
    const marker = canvas(scene, markerKey(letter), TILE, TILE);
    drawMarker(marker.ctx, MARKER_COLOURS[index % MARKER_COLOURS.length] ?? '#e8a33d');
    marker.texture.refresh();
  });

  const wizard = canvas(scene, WIZARD_KEY, WIZARD_WIDTH * FACINGS.length, WIZARD_HEIGHT);
  FACINGS.forEach((facing, index) => {
    drawWizard(wizard.ctx, index * WIZARD_WIDTH, facing);
    wizard.texture.add(facing, 0, index * WIZARD_WIDTH, 0, WIZARD_WIDTH, WIZARD_HEIGHT);
  });
  wizard.texture.refresh();

  const teacher = canvas(scene, actorKey('teacher'), WIZARD_WIDTH * FACINGS.length, WIZARD_HEIGHT);
  FACINGS.forEach((facing, index) => {
    drawFigure(teacher.ctx, index * WIZARD_WIDTH, facing, TEACHER);
    teacher.texture.add(facing, 0, index * WIZARD_WIDTH, 0, WIZARD_WIDTH, WIZARD_HEIGHT);
  });
  teacher.texture.refresh();

  const door = canvas(scene, thingKey('door'), TILE * 2, TILE);
  drawThing(door.ctx, 0, 'door', false);
  drawThing(door.ctx, TILE, 'door', true);
  door.texture.add('closed', 0, 0, 0, TILE, TILE);
  door.texture.add('open', 0, TILE, 0, TILE, TILE);
  door.texture.refresh();

  for (const kind of ['key', 'book', 'wand', 'potion']) {
    const thing = canvas(scene, thingKey(kind), TILE, TILE);
    drawThing(thing.ctx, 0, kind);
    thing.texture.refresh();
  }
}
