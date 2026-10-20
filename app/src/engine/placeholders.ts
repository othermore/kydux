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

/** The wizard facing one way, in a frame of WIZARD_WIDTH by WIZARD_HEIGHT at x. */
function drawWizard(ctx: CanvasRenderingContext2D, x: number, facing: Facing): void {
  const cx = x + WIZARD_WIDTH / 2;
  // The robe.
  ctx.fillStyle = '#3b5bdb';
  ctx.beginPath();
  ctx.moveTo(cx - 13, 42);
  ctx.lineTo(cx + 13, 42);
  ctx.lineTo(cx + 8, 20);
  ctx.lineTo(cx - 8, 20);
  ctx.closePath();
  ctx.fill();
  // The face, or the back of the head.
  ctx.fillStyle = facing === 'up' ? '#6b4a2b' : '#f2c9a0';
  ctx.beginPath();
  ctx.arc(cx, 18, 7, 0, Math.PI * 2);
  ctx.fill();
  if (facing !== 'up') {
    ctx.fillStyle = '#1f2330';
    const eyes = facing === 'down' ? [-3, 3] : facing === 'left' ? [-4] : [4];
    for (const dx of eyes) ctx.fillRect(cx + dx - 1, 17, 2, 2);
  }
  // The hat: its brim, then its point, leaning the way the wizard faces.
  const lean = facing === 'left' ? -4 : facing === 'right' ? 4 : 0;
  ctx.fillStyle = '#2b3fa8';
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
}
