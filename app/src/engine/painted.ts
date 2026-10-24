// A scene painted in one picture (D76), drawn in Phaser: its art loaded, the
// ground and the raised things by row, each changing thing in its state, the
// figures from their sheets, the pencil grid, the goal's beating mark and the
// sealed doors' glow (D79); and what moves when a spell is cast: the wizard's
// casting frames, a door passing through its states, a seal breaking. scene.ts holds what changes as a run plays and calls
// these to draw; a scene without art is drawn by placeholders.ts.

import Phaser from 'phaser';
import type { LevelJson } from '../runtime/protocol';
import { friendOf } from '../i18n/personal';
import type { Look } from './looks';
import { type Facing, TILE } from './placeholders';
import type { Tile } from './sight';

/** A scene painted in one picture (D76): its ground, its raised things cut out by
 * the row their foot stands on, and the things that change, each in its states;
 * all at `cell` pixels a cell, from content/art/scenes/<scene>/art.json. */
export interface SceneArt {
  base: string;
  cell: number;
  size: Tile;
  ground: string;
  rows: { row: number; image: string; top: number }[];
  things: Record<string, { row: number; left: number; top: number; states: Record<string, string> }>;
}

/** The figures drawn for the characters (D76): one sheet each of four rows (down,
 * left, right, up) of three walking frames, drawn at `cell` pixels a cell, each
 * figure at its own height; `foot` is how far above a frame's bottom the feet are,
 * from content/art/figures/figures.json. */
export interface FigureArt {
  base: string;
  cell: number;
  frame: Tile;
  foot: number;
  height_cells: number;
  standing: number;
  figures: string[];
}

export interface Art {
  scene: SceneArt;
  figures: FigureArt | null;
}

/** The art of a level or a story on a painted scene, or null on a scene without. */
export async function loadArt(level: LevelJson): Promise<Art | null> {
  if (typeof level.art !== 'string') return null;
  const root = `${import.meta.env.BASE_URL}content/art/`;
  const json = async <T,>(url: string): Promise<T | null> => {
    const response = await fetch(url);
    if (!response.ok || !response.headers.get('content-type')?.includes('json')) return null;
    return (await response.json()) as T;
  };
  const base = `${root}scenes/${level.art}/`;
  const scene = await json<Omit<SceneArt, 'base'>>(`${base}art.json`);
  if (!scene) return null;
  const figures = await json<Omit<FigureArt, 'base'>>(`${root}figures/figures.json`);
  return { scene: { ...scene, base }, figures: figures ? { ...figures, base: `${root}figures/` } : null };
}

/** The rows of a figure's sheet, by the way it faces: four rows of walking frames,
 * and on the wizard's, four rows of casting frames after them, in the same order. */
export const SHEET_ROW: Record<Facing, number> = { down: 0, left: 1, right: 2, up: 3 };
const CAST_ROW = 4;
const FACING_OF_ROW: readonly Facing[] = ['down', 'left', 'right', 'up'];
/** Where a figure's feet stand in its cell on a painted scene, as a part of a cell. */
export const FOOT_IN_CELL = 0.8;

/** The depth of a painted row's things, at three quarters of its cell; a figure's
 * is at its feet, so that a row's things cover the figures above them (D76). */
export function rowDepth(row: number): number {
  return 3 + (row + 0.75) * 0.01;
}

/** How much a painted scene's pixels are scaled to the scene's tiles. */
export function artScale(art: Art): number {
  return TILE / art.scene.cell;
}

/** Loads the painting's images and the figures' sheets. */
export function preloadArt(scene: Phaser.Scene, { scene: painted, figures }: Art): void {
  scene.load.image('art-ground', painted.base + painted.ground);
  for (const row of painted.rows) scene.load.image(`art-row-${row.row}`, painted.base + row.image);
  for (const [id, thing] of Object.entries(painted.things)) {
    for (const [state, image] of Object.entries(thing.states)) {
      scene.load.image(`art-${id}-${state}`, painted.base + image);
    }
  }
  for (const name of figures?.figures ?? []) {
    scene.load.spritesheet(`fig-${name}`, `${figures?.base}${name}.webp`, {
      frameWidth: figures?.frame[0] ?? 0,
      frameHeight: figures?.frame[1] ?? 0,
    });
  }
}

/** The painting as the ground, and its raised things by row. */
export function paintScene(scene: Phaser.Scene, art: Art): void {
  const scale = artScale(art);
  scene.add.image(0, 0, 'art-ground').setOrigin(0, 0).setScale(scale).setDepth(0);
  for (const row of art.scene.rows) {
    scene.add
      .image(0, row.top * scale, `art-row-${row.row}`)
      .setOrigin(0, 0)
      .setScale(scale)
      .setDepth(rowDepth(row.row));
  }
}

/** A painted thing in its state, among the rows by its foot (D76), or null when the
 * painting has no such thing. */
export function paintThing(
  scene: Phaser.Scene,
  art: Art,
  thing: { id: string; kind: string; open?: boolean },
): Phaser.GameObjects.Image | null {
  const painted = art.scene.things[thing.id];
  if (!painted) return null;
  const state = thing.kind === 'door' ? (thing.open ? 'open' : 'closed') : Object.keys(painted.states)[0];
  const scale = artScale(art);
  return scene.add
    .image(painted.left * scale, painted.top * scale, `art-${thing.id}-${state}`)
    .setOrigin(0, 0)
    .setScale(scale)
    .setDepth(rowDepth(painted.row) + 0.001);
}

/** The sheet a character is drawn from: the friend is the one of the wizard's other
 * gender (D77), and the wizard is drawn in the look the child chose. */
export function figureName(id: string, look: Look): string {
  if (id === 'friend') return friendOf({ gender: look.gender }).id;
  return id === 'wizard' ? `wizard-${look.id}` : id;
}

/** A character drawn from its sheet, standing at a point, facing a way. */
export function drawFigure(
  scene: Phaser.Scene,
  figures: FigureArt,
  name: string,
  [x, y]: [number, number],
  facing: Facing,
): Phaser.GameObjects.Sprite {
  const sprite = scene.add.sprite(x, y, `fig-${name}`, SHEET_ROW[facing] * 3 + figures.standing);
  sprite.setOrigin(0.5, 1 - figures.foot / figures.frame[1]);
  sprite.setScale(TILE / figures.cell);
  return sprite;
}

/** The way a figure drawn from its sheet faces, read from the frame it shows. */
export function facingOf(sprite: Phaser.GameObjects.Sprite): Facing {
  const frame = Number(sprite.frame.name);
  return FACING_OF_ROW[Math.floor((Number.isFinite(frame) ? frame : 0) / 3) % 4] ?? 'down';
}

/** The wizard casting: its three casting frames the way it faces, the wand raised,
 * pointed and lowered, then standing again; false for a sheet without them. */
export function playCast(
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Sprite,
  standing: number,
  duration: number,
): boolean {
  // A sheet's frames, and Phaser's whole-image frame besides them.
  if (!sprite.texture.key.startsWith('fig-') || sprite.texture.frameTotal - 1 < (CAST_ROW + 4) * 3) return false;
  const facing = facingOf(sprite);
  const frame = (step: number) => (CAST_ROW + SHEET_ROW[facing]) * 3 + step;
  sprite.setFrame(frame(0));
  scene.time.delayedCall(duration * 0.25, () => sprite.setFrame(frame(1)));
  scene.time.delayedCall(duration * 0.7, () => sprite.setFrame(frame(2)));
  scene.time.delayedCall(duration, () => sprite.setFrame(SHEET_ROW[facing] * 3 + standing));
  return true;
}

/** A thing passing from one painted state to the next: the new state shown at once
 * under a copy of the old one, which fades out. */
export function crossfade(
  scene: Phaser.Scene,
  image: Phaser.GameObjects.Image,
  key: string,
  duration: number,
): void {
  const old = scene.add
    .image(image.x, image.y, image.texture.key)
    .setOrigin(image.originX, image.originY)
    .setScale(image.scaleX, image.scaleY)
    .setDepth(image.depth + 0.0001);
  image.setTexture(key);
  scene.tweens.add({ targets: old, alpha: 0, duration, onComplete: () => old.destroy() });
}

/** A seal broken (D79): its glow goes at once, a flare of it grows and fades in its
 * place, and sparks of its light fly out and fade; the glow itself is left as it
 * was, hidden, for the level to start again with. */
export function breakSeal(scene: Phaser.Scene, glow: Phaser.GameObjects.Ellipse, duration: number): void {
  glow.setVisible(false);
  const flare = scene.add
    .ellipse(glow.x, glow.y, glow.width, glow.height, 0x6fd6ff, 0.8)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(glow.depth);
  scene.tweens.add({
    targets: flare,
    scale: 1.8,
    alpha: 0,
    duration,
    ease: 'Quad.easeOut',
    onComplete: () => flare.destroy(),
  });
  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2;
    const spark = scene.add
      .circle(glow.x, glow.y, 3, 0xbfefff, 1)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(glow.depth + 0.0001);
    scene.tweens.add({
      targets: spark,
      x: glow.x + Math.cos(angle) * TILE * 0.9,
      y: glow.y + Math.sin(angle) * TILE * 0.9,
      alpha: 0,
      scale: 0.4,
      duration,
      ease: 'Quad.easeOut',
      onComplete: () => spark.destroy(),
    });
  }
}

/** The pencil grid over a painted scene, for counting steps (D76): thin lines a
 * little crooked, as drawn by hand, the same every time, breathing slowly. */
export function drawGrid(scene: Phaser.Scene, [columns, rows]: Tile): void {
  const grid = scene.add.graphics().setDepth(0.5);
  let seed = 11;
  const wobble = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed / 2147483647 - 0.5) * 1.6;
  };
  const width = columns * TILE;
  const height = rows * TILE;
  const line = (x0: number, y0: number, x1: number, y1: number) => {
    grid.lineStyle(1, 0x3b2f1e, 0.55 + wobble() * 0.2);
    grid.beginPath();
    grid.moveTo(x0 + wobble(), y0 + wobble());
    const steps = 6;
    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps;
      grid.lineTo(x0 + (x1 - x0) * t + wobble(), y0 + (y1 - y0) * t + wobble());
    }
    grid.strokePath();
  };
  for (let x = 0; x <= columns; x += 1) line(x * TILE, 0, x * TILE, height);
  for (let y = 0; y <= rows; y += 1) line(0, y * TILE, width, y * TILE);
  grid.setAlpha(0.18);
  scene.tweens.add({ targets: grid, alpha: 0.32, duration: 1750, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
}

/** A colour part of the way, t from 0 to 1, from one colour to another. */
function mix(from: number, to: number, t: number): number {
  const channel = (shift: number) => {
    const a = (from >> shift) & 0xff;
    const b = (to >> shift) & 0xff;
    return Math.round(a + (b - a) * t) << shift;
  };
  return channel(16) | channel(8) | channel(0);
}

/** The goal's mark (D79): a bright ring with a soft disc in it, centred on a point,
 * over the ground and under what stands in front; it beats in size, alpha and
 * colour unless `still`. */
export function drawMark(scene: Phaser.Scene, [x, y]: [number, number], still: boolean): void {
  const disc = scene.add.circle(0, 0, TILE * 0.32, 0xffe066, 0.35);
  const ring = scene.add.circle(0, 0, TILE * 0.36).setStrokeStyle(3, 0xffc61a, 1);
  const mark = scene.add.container(x, y, [disc, ring]).setDepth(2.9);
  if (still) return;
  scene.tweens.add({ targets: mark, scale: 1.18, alpha: 0.7, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  // Its colour beats too, from gold to a warm white and back, slower than its size.
  scene.tweens.addCounter({
    from: 0,
    to: 1,
    duration: 900,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
    onUpdate: (tween) => {
      const t = tween.getValue() ?? 0;
      disc.setFillStyle(mix(0xffe066, 0xfff6d8, t), 0.35 + 0.2 * t);
      ring.setStrokeStyle(3, mix(0xffc61a, 0xff8a1a, t), 1);
    },
  });
}

/** A sealed door's glow (D79), centred on a point just over the door's depth,
 * pulsing unless `still`. */
export function drawGlow(
  scene: Phaser.Scene,
  [x, y]: [number, number],
  depth: number,
  still: boolean,
): Phaser.GameObjects.Ellipse {
  const glow = scene.add
    .ellipse(x, y, TILE * 0.9, TILE * 1.1, 0x6fd6ff, 0.35)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setDepth(depth + 0.0005);
  if (!still) {
    scene.tweens.add({ targets: glow, alpha: 0.75, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  return glow;
}
