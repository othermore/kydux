// A scene painted in one picture (D76), drawn in Phaser: its art loaded, the
// ground and the raised things by row, each changing thing in its state, the
// figures from their sheets, the pencil grid, the goal's beating mark and the
// sealed doors' glow (D79); and what moves when a spell is cast (D81): the
// wizard's casting frames, a door passing through its states, a seal breaking.
// scene.ts holds what changes as a run plays and calls these to draw; a scene
// without art is drawn by placeholders.ts.

import Phaser from 'phaser';
import type { LevelJson } from '../runtime/protocol';
import type { PlanPictures } from './layout';
import { dormitoryMate, friendSheet, type Look, teacherFriend } from './looks';
import { type Facing, TILE } from './placeholders';
import { coverDepth, type Lowered, type Nudged, nudgedBy, overDepth, rowDepth, thingDepth } from './depth';
import type { Dark } from './shade';
import { drawnShift, shiftBy } from './shift';
import type { Tile } from './sight';

/** A scene painted in one picture (D76): its ground, its raised things cut out by
 * the row their foot stands on, and the things that change, each in its states;
 * all at `cell` pixels a cell, from content/art/scenes/<scene>/art.json. */
export interface SceneArt {
  base: string;
  cell: number;
  size: Tile;
  ground: string;
  /** The scene's ground at other hours, by the hour: a scene painted at night has
   * its morning (D126), its sky, windows and outside taken in boxes. */
  grounds?: Record<string, string>;
  /** The scene's ground at the hours it is painted whole at, by the hour (D126):
   * every row and thing has its twin at that hour, and no light is laid over it. */
  hours?: Record<string, string>;
  /** The ground painted beyond the playable area (D83): the cells on each side
   * (left, top, right, bottom), and the playable corner in the ground's pixels. */
  margin?: [number, number, number, number];
  origin?: Tile;
  /** The raised rows, each drawn over the figures above it; a row's static things
   * (D89), the walls that never change, are an image of their own. A row's image
   * `under` is drawn over whoever stands on the row itself too, a door's arch; one
   * `over`, over every figure, a wall seen from above (D95); a bed's `cover` and
   * what `hangs` on a wall are images of their own, drawn as the row's. */
  rows: {
    row: number;
    image: string;
    top: number;
    static?: boolean;
    under?: boolean;
    over?: boolean;
    cover?: boolean;
    hangs?: boolean;
    /** The row's image at another hour, by the hour, where it holds some of what
     * the scene's ground at that hour mends (D126). */
    hours?: Record<string, string>;
  }[];
  /** Each thing that opens or is picked up: its row, its corner in the painting's
   * pixels, its states' images, and `at`, the cell it is painted on, when a level
   * may place it on another (D85). */
  things: Record<
    string,
    {
      row: number;
      left: number;
      top: number;
      states: Record<string, string>;
      rune?: string;
      at?: Tile;
      /** Drawn over whoever stands in its doorway (D95). */
      under?: boolean;
      /** The row a state is drawn among the rows by, when not the thing's: a door
       * swung open against the wall it lies on (D111). */
      rows?: Record<string, number>;
      /** The state a door is drawn in where no level or story places it (D104). */
      rest?: 'open' | 'closed';
      /** Each state's image at an hour the scene is painted whole at (D126), by the
       * hour, then the state. */
      hours?: Record<string, Record<string, string>>;
    }
  >;
  /** The cells a figure is drawn lower on, by a part of a cell, so that what stands
   * on the row below hides its legs: a keeper behind a counter (D95). Each range is
   * its first and last cell. */
  lowered?: Lowered;
  /** The cells a figure is drawn sideways on, by a part of a cell, to stand on the
   * painted strip where it is off its cells' middle (D105). */
  nudged?: Nudged;
  /** Where a pupil asleep in each bed lies (D91): its head's point on the pillow, in
   * cells; the way the pillow lies from the quilt; and the row of the quilt, a
   * static thing drawn over the sleeper. */
  beds?: Record<string, { head: [number, number]; toward: 'left' | 'right'; row: number }>;
  /** The dark passages a figure is drawn darker in, the deeper it goes (shade.ts). */
  dark?: Dark;
}

/** The figures drawn for the characters (D76): one sheet each of four rows (down,
 * left, right, up) of three walking frames, and on the wizard's four rows of
 * casting frames after them (D81), drawn at `cell` pixels a cell, each figure at
 * its own height; `foot` is how far above a frame's bottom the feet are, from
 * content/art/figures/figures.json. */
export interface FigureArt {
  base: string;
  cell: number;
  frame: Tile;
  foot: number;
  height_cells: number;
  standing: number;
  figures: string[];
  /** The figures that float, which sway while they stand (D120). */
  floating?: string[];
  /** The grown-ups, whose steps are heavier than the children's (D132). */
  adults?: string[];
  /** The first row of each part of a wizard's sheet, by its name: the walking, the
   * casting and the picking-up rows (four each, down, left, right and up), the
   * celebrating one, facing down, and the lying one, asleep (D91). */
  rows?: { walk: number; cast: number; pickup?: number; win?: number; sleep?: number };
  /** The rows of a sheet laid out otherwise than a wizard's, by its name: a
   * friend's walking rows and its lying one (D91). */
  sheets?: Record<string, { walk: number; sleep?: number }>;
}

/** A part of a wizard's sheet played as frames: casting or picking up the way the
 * figure faces, celebrating facing down (D81, 14.3). */
export type Played = 'cast' | 'pickup' | 'win';

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
const FACING_OF_ROW: readonly Facing[] = ['down', 'left', 'right', 'up'];
/** How much a painted scene's pixels are scaled to the scene's tiles. */
export function artScale(art: Art): number {
  return TILE / art.scene.cell;
}

/** A raised row's texture: a row's things and its static things are two images,
 * and each of them under or over the figures another (D95). */
function rowKey(row: SceneArt['rows'][number]): string {
  const kind = row.over ? '-over' : row.under ? '-under' : row.cover ? '-cover' : row.hangs ? '-hangs' : '';
  return `art-row-${row.row}${row.static ? '-static' : ''}${kind}`;
}

/** The scene's grounds at other hours, by the hour, taken in boxes or painted whole. */
function groundsOf(painted: SceneArt): Record<string, string> {
  return { ...(painted.grounds ?? {}), ...(painted.hours ?? {}) };
}

/** The hour a thing's image is drawn at in its twin's texture (D126): the key of its
 * state's image at that hour, `art-<id>-<state>-<hour>`. */
export function hourKey(key: string, hour: string): string {
  return `${key}-${hour}`;
}

/** Loads the painting's images and the figures' sheets. */
export function preloadArt(scene: Phaser.Scene, { scene: painted, figures }: Art): void {
  scene.load.image('art-ground', painted.base + painted.ground);
  for (const [hour, image] of Object.entries(groundsOf(painted))) scene.load.image(`art-ground-${hour}`, painted.base + image);
  for (const row of painted.rows) {
    scene.load.image(rowKey(row), painted.base + row.image);
    for (const [hour, image] of Object.entries(row.hours ?? {})) scene.load.image(`${rowKey(row)}-${hour}`, painted.base + image);
  }
  for (const [id, thing] of Object.entries(painted.things)) {
    for (const [state, image] of Object.entries(thing.states)) {
      scene.load.image(`art-${id}-${state}`, painted.base + image);
    }
    for (const [hour, states] of Object.entries(thing.hours ?? {})) {
      for (const [state, image] of Object.entries(states)) scene.load.image(`art-${id}-${state}-${hour}`, painted.base + image);
    }
  }
  if (!figures) return;
  for (const name of figures.figures) {
    scene.load.spritesheet(`fig-${name}`, `${figures.base}${name}.webp`, {
      frameWidth: figures.frame[0],
      frameHeight: figures.frame[1],
    });
  }
}

/** The cells a painted scene's ground reaches beyond the playable area on each
 * side (D83): left, top, right, bottom; none for a scene without art. */
export function marginOf(art: Art | null): [number, number, number, number] {
  return art?.scene.margin ?? [0, 0, 0, 0];
}

/** The painting as the ground, with its margin round the playable area, and its
 * raised things by row, returned. */
export function paintScene(scene: Phaser.Scene, art: Art): Phaser.GameObjects.Image[] {
  const scale = artScale(art);
  const [x, y] = art.scene.origin ?? [0, 0];
  scene.add.image(-x * scale, -y * scale, 'art-ground').setOrigin(0, 0).setScale(scale).setDepth(0);
  return art.scene.rows.map((row) => rowImage(scene, art, row, rowKey(row)));
}

/** A row's image, `key`, where the row is drawn among the figures. */
function rowImage(scene: Phaser.Scene, art: Art, row: SceneArt['rows'][number], key: string): Phaser.GameObjects.Image {
  const rows = art.scene.size[1];
  return scene.add
    .image(0, row.top * artScale(art), key)
    .setOrigin(0, 0)
    .setScale(artScale(art))
    .setDepth(row.over ? overDepth(rows) : row.cover ? coverDepth(row.row) : rowDepth(row.row, row.under));
}

/** The scene at other hours (D126), unseen until the light shows it, by the
 * hour: its ground over the painting's own and under everything else, and each
 * row's image at that hour over the row's own. */
export function paintGrounds(scene: Phaser.Scene, art: Art): Map<string, Phaser.GameObjects.Image[]> {
  const scale = artScale(art);
  const [x, y] = art.scene.origin ?? [0, 0];
  const grounds = new Map<string, Phaser.GameObjects.Image[]>();
  for (const hour of Object.keys(groundsOf(art.scene))) {
    const ground = scene.add.image(-x * scale, -y * scale, `art-ground-${hour}`).setOrigin(0, 0).setScale(scale);
    const rows = art.scene.rows
      .filter((row) => row.hours?.[hour])
      .map((row) => rowImage(scene, art, row, `${rowKey(row)}-${hour}`));
    grounds.set(hour, [ground.setDepth(0), ...rows].map((image) => image.setAlpha(0)));
  }
  return grounds;
}

/** How many cells a painted thing is moved from where it is painted (D85): the
 * rows it is drawn among follow it so. */
export function shiftOf(art: Art, id: string, tile: Tile): Tile {
  return shiftBy(art.scene.things[id]?.at, tile);
}

/** The middle of what is drawn of each picture, in its own pixels: its solid
 * pixels' box, read once a picture. */
const middles = new Map<string, [number, number]>();

function middleOf(scene: Phaser.Scene, key: string): [number, number] {
  const known = middles.get(key);
  if (known) return known;
  const image = scene.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  let middle: [number, number] = [image.width / 2, image.height / 2];
  const canvas = document.createElement('canvas');
  [canvas.width, canvas.height] = [image.width, image.height];
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (context && image.width > 0 && image.height > 0) {
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height).data;
    let [x0, y0, x1, y1] = [image.width, image.height, -1, -1];
    for (let y = 0; y < image.height; y += 1) {
      for (let x = 0; x < image.width; x += 1) {
        if ((pixels[(y * image.width + x) * 4 + 3] ?? 0) <= 127) continue;
        [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
      }
    }
    if (x1 >= 0) middle = [(x0 + x1 + 1) / 2, (y0 + y1 + 1) / 2];
  }
  middles.set(key, middle);
  return middle;
}

/** Where a painted thing's picture is drawn for a tile, its corner in the scene's
 * pixels (D85): as painted on its own cell; on another, its middle on the tile's
 * middle, nudged as a figure on it is (D105, D109), read from the picture of the state
 * it is first painted in. */
function drawnAt(scene: Phaser.Scene, art: Art, id: string, tile: Tile): [number, number] {
  const painted = art.scene.things[id];
  if (!painted) return [0, 0];
  const scale = artScale(art);
  const first = `art-${id}-${Object.keys(painted.states)[0]}`;
  const [mx, my] = scene.textures.exists(first) ? middleOf(scene, first) : [0, 0];
  const middle: [number, number] = [((painted.left + mx) * scale) / TILE, ((painted.top + my) * scale) / TILE];
  const [dx, dy] = drawnShift(painted.at, tile, middle, nudgedBy(art.scene.nudged, tile));
  return [painted.left * scale + dx * TILE, painted.top * scale + dy * TILE];
}

/** How far the middle of what is drawn of a picture lies from an image's corner,
 * in the scene's pixels, the picture `key` drawn at the image's scale. */
export function middleOffset(image: Phaser.GameObjects.Image, key: string): [number, number] {
  const [mx, my] = middleOf(image.scene, key);
  return [mx * image.scaleX, my * image.scaleY];
}

/** Where the middle of what is drawn of a painted thing's image is, in cells, for
 * the tests (data-drawn, D109). */
export function drawnMiddle(image: Phaser.GameObjects.Image): [number, number] {
  const [mx, my] = middleOf(image.scene, image.texture.key);
  return [(image.x + mx * image.scaleX) / TILE, (image.y + my * image.scaleY) / TILE];
}

/** How a thing on a tile is drawn among the rows: a door as open or shut, and
 * `inside` the furniture of a cell no one walks on, under it. */
export interface ThingPlaced {
  open?: boolean;
  inside?: boolean;
}

function depthOn(art: Art, id: string, tile: Tile, { open = false, inside = false }: ThingPlaced): number {
  const painted = art.scene.things[id];
  if (!painted) return 3;
  // A door swung open lies on the wall beside its doorway, among the rows as it is (D111).
  const row = (open ? painted.rows?.open : undefined) ?? painted.row;
  return thingDepth(row + shiftOf(art, id, tile)[1], { under: painted.under, open, inside });
}

/** A painted thing in its state, among the rows by its foot (D76), drawn on the
 * level's tile (D85, D109), or null when the painting has no such thing. */
export function paintThing(
  scene: Phaser.Scene,
  art: Art,
  thing: { id: string; kind: string; open?: boolean; tile: Tile; art?: string },
  inside = false,
): Phaser.GameObjects.Image | null {
  const id = thing.art ?? thing.id;
  const painted = art.scene.things[id];
  if (!painted) return null;
  const state = thing.kind === 'door' ? (thing.open ? 'open' : 'closed') : Object.keys(painted.states)[0];
  const open = thing.kind === 'door' && thing.open === true;
  return scene.add
    .image(...drawnAt(scene, art, id, thing.tile), `art-${id}-${state}`)
    .setOrigin(0, 0)
    .setScale(artScale(art))
    .setDepth(depthOn(art, id, thing.tile, { open, inside }));
}

/** A painted thing's image put where it is drawn on a tile (D85, D109), for a
 * restart, and among the rows as it is drawn there. */
export function placeThing(image: Phaser.GameObjects.Image, art: Art, id: string, tile: Tile, placed: ThingPlaced = {}): void {
  if (!art.scene.things[id]) return;
  image.setPosition(...drawnAt(image.scene, art, id, tile));
  image.setDepth(depthOn(art, id, tile, placed));
}

/** The depth a painted thing is drawn at on a tile (depthOn), for a door opened or
 * shut and a thing a spell brings. */
export function thingDepthOn(art: Art, id: string, tile: Tile, placed: ThingPlaced = {}): number {
  return depthOn(art, id, tile, placed);
}

/** The sheet a character is drawn from: the friend is the one of the wizard's other
 * gender (D77), the dormitory mate the one of its own (D84), each in the set of
 * colours unlike the wizard's and each other's (D90), and the wizard is drawn in
 * the look the child chose. */
export function figureName(id: string, look: Look): string {
  if (id === 'friend') return friendSheet(teacherFriend(look.gender).id, look);
  if (id === 'mate') return friendSheet(dormitoryMate(look.gender).id, look);
  if (id === 'nuri' || id === 'teku') return friendSheet(id, look);
  return id === 'wizard' ? `wizard-${look.id}` : id;
}

/** The pictures the plan of the scene is drawn from (D143): its ground, each door in
 * the state it is in now, and each figure's sheet with its standing frame by the way
 * it faces. */
export function planPictures(
  art: Art,
  things: { id: string; kind: string; tile: Tile; art?: string; open?: boolean }[],
  figures: { id: string }[],
  look: Look,
): PlanPictures {
  const { scene } = art;
  const sheets = art.figures;
  const shownDoors = things
    .filter((thing) => thing.kind === 'door')
    .flatMap(({ id, art: painted, open }) => {
      const thing = scene.things[painted ?? id];
      const state = thing?.states[open ? 'open' : 'closed'];
      return thing && state ? [{ url: `${scene.base}${state}`, left: thing.left, top: thing.top }] : [];
    });
  // A key or a slab's hole in its first state, moved from the cell it is painted on.
  const shownThings = things
    .filter((thing) => thing.kind !== 'door' && thing.kind !== 'bed')
    .flatMap(({ id, tile, art: painted }) => {
      const thing = scene.things[painted ?? id];
      const state = thing ? Object.values(thing.states)[0] : undefined;
      if (!thing || !state) return [];
      const [atX, atY] = thing.at ?? tile;
      return [
        {
          id,
          url: `${scene.base}${state}`,
          left: thing.left + (tile[0] - atX) * scene.cell,
          top: thing.top + (tile[1] - atY) * scene.cell,
        },
      ];
    });
  const shownFigures = sheets
    ? figures.map(({ id }) => {
        const name = figureName(id, look);
        const walk = sheets.sheets?.[name]?.walk ?? sheets.rows?.walk ?? 0;
        return {
          id,
          url: `${sheets.base}${name}.webp`,
          frame: sheets.frame,
          cell: sheets.cell,
          foot: sheets.foot,
          column: sheets.standing,
          rows: { down: walk, left: walk + 1, right: walk + 2, up: walk + 3 },
        };
      })
    : [];
  return {
    ground: `${scene.base}${scene.ground}`,
    cell: scene.cell,
    origin: scene.origin ?? [0, 0],
    doors: shownDoors,
    things: shownThings,
    figures: shownFigures,
  };
}

/** The lying frame of a figure's sheet (D91), or null for a sheet without one. */
export function sleepFrame(figures: FigureArt, name: string): number | null {
  const row = figures.sheets?.[name]?.sleep ?? (name.startsWith('wizard-') ? figures.rows?.sleep : undefined);
  return row === undefined ? null : row * 3;
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

/** The wizard playing a part of its sheet, the way it faces: casting, the wand
 * raised, pointed and lowered; picking up, bending, both hands at the ground in
 * front of its feet and half up again; or, facing down, celebrating, the arms up,
 * a jump and down; then standing again, the way it faced. The middle frame lasts longest: the wand pointed while its light
 * flies, the hand at the ground while the thing goes. Gives the timers that step
 * the frames, for the scene to drop if the level starts again meanwhile; null
 * for a sheet without that part. */
export function playFrames(
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Sprite,
  figures: FigureArt,
  part: Played,
  duration: number,
): Phaser.Time.TimerEvent[] | null {
  const first = figures.rows?.[part];
  if (first === undefined || !sprite.texture.key.startsWith('fig-')) return null;
  const facing = facingOf(sprite);
  // Casting and picking up have a row for each way; celebrating, one facing down.
  const row = part === 'win' ? first : first + SHEET_ROW[facing];
  // A sheet's frames, and Phaser's whole-image frame besides them.
  if (sprite.texture.frameTotal - 1 < (row + 1) * 3) return null;
  const frame = (step: number) => row * 3 + step;
  sprite.setFrame(frame(0));
  return [
    scene.time.delayedCall(duration * 0.2, () => sprite.setFrame(frame(1))),
    scene.time.delayedCall(duration * 0.8, () => sprite.setFrame(frame(2))),
    scene.time.delayedCall(duration, () => sprite.setFrame(SHEET_ROW[facing] * 3 + figures.standing)),
  ];
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

/** A door passing from one state to the next whose pictures lie at other depths, a
 * leaf swung against the wall of another row (D111): the old picture fades out at
 * its own depth and size, a copy of it, while the image, now the new picture at
 * the new state's `depth`, fades in, so that no frame draws a picture at the other
 * state's depth. Returns the old picture's copy, gone when the fade ends. */
export function fadeBetween(
  scene: Phaser.Scene,
  image: Phaser.GameObjects.Image,
  key: string,
  depth: number,
  duration: number,
): Phaser.GameObjects.Image {
  const old = scene.add
    .image(image.x, image.y, image.texture.key)
    .setOrigin(image.originX, image.originY)
    .setScale(image.scaleX, image.scaleY)
    .setDepth(image.depth)
    .setAlpha(image.alpha);
  image.setTexture(key).setDepth(depth).setAlpha(0);
  scene.tweens.add({ targets: image, alpha: 1, duration });
  scene.tweens.add({ targets: old, alpha: 0, duration, onComplete: () => old.destroy() });
  return old;
}

/** A seal broken (D79): its glow goes at once, a flare of it grows and fades in its
 * place, and sparks of its light fly out and fade; the glow itself is left as it
 * was, hidden, for the level to start again with. */
export function breakSeal(scene: Phaser.Scene, glow: Phaser.GameObjects.Container, duration: number): void {
  glow.setVisible(false);
  const flare = scene.add
    .ellipse(glow.x, glow.y, TILE * 0.9, TILE * 1.1, 0x6fd6ff, 0.8)
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

/** The goal's mark (D79): a bright ring with a soft disc in it, centred on a point
 * at `depth`, over the ground and under what stands in front; it beats in size,
 * alpha and colour unless `still`. The mark is returned, for the page to hide it
 * and fade it in, which its beat inside does not touch. */
export function drawMark(
  scene: Phaser.Scene,
  [x, y]: [number, number],
  still: boolean,
  depth: number,
): Phaser.GameObjects.Container {
  const disc = scene.add.circle(0, 0, TILE * 0.32, 0xffe066, 0.35);
  const ring = scene.add.circle(0, 0, TILE * 0.36).setStrokeStyle(3, 0xffc61a, 1);
  const beat = scene.add.container(0, 0, [disc, ring]);
  const mark = scene.add.container(x, y, [beat]).setDepth(depth);
  if (still) return mark;
  scene.tweens.add({ targets: beat, scale: 1.18, alpha: 0.7, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
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
  return mark;
}

/** The mark of the cell to sleep from (D130): the goal's ring, as a reach goal's,
 * and in it a sign of sleep drawn by the page in the ring's colour, a crescent and
 * two "z" growing smaller up to the right, with a thin dark line under them so
 * that they read on the floor. */
export function drawSleepMark(
  scene: Phaser.Scene,
  at: [number, number],
  still: boolean,
  depth: number,
): Phaser.GameObjects.Container {
  const mark = drawMark(scene, at, still, depth);
  const sign = scene.add.graphics();
  const crescent = (width: number, colour: number, alpha: number) => {
    sign.lineStyle(width, colour, alpha);
    sign.beginPath();
    sign.arc(-TILE * 0.06, TILE * 0.04, TILE * 0.14, Phaser.Math.DegToRad(70), Phaser.Math.DegToRad(290));
    sign.strokePath();
  };
  const zed = (x: number, y: number, size: number, width: number, colour: number, alpha: number) => {
    sign.lineStyle(width, colour, alpha);
    sign.beginPath();
    sign.moveTo(x, y);
    sign.lineTo(x + size, y);
    sign.lineTo(x, y + size);
    sign.lineTo(x + size, y + size);
    sign.strokePath();
  };
  for (const [extra, colour, alpha] of [
    [2.5, 0x4a2a08, 0.55],
    [0, 0xffc61a, 1],
  ] as const) {
    crescent(TILE * 0.07 + extra, colour, alpha);
    zed(TILE * 0.08, -TILE * 0.06, TILE * 0.1, 2.5 + extra, colour, alpha);
    zed(TILE * 0.19, -TILE * 0.17, TILE * 0.07, 2 + extra, colour, alpha);
  }
  mark.add(sign);
  return mark;
}

/** A sealed door's rune (D79), centred on a point just over the door's depth: a
 * glow, and the rune's sign drawn in it unless the painting draws one; pulsing
 * unless `still`. */
export function drawGlow(
  scene: Phaser.Scene,
  [x, y]: [number, number],
  depth: number,
  still: boolean,
  sign: boolean,
): Phaser.GameObjects.Container {
  const halo = scene.add.ellipse(0, 0, TILE * 0.9, TILE * 1.1, 0x6fd6ff, 0.5).setBlendMode(Phaser.BlendModes.ADD);
  const parts: Phaser.GameObjects.GameObject[] = [halo];
  if (sign) {
    // The sign: a ring, and in it a stem with two branches, like a bare twig; drawn
    // twice, wide and faint under narrow and bright, so that it glows on dark wood.
    const r = TILE * 0.22;
    const rune = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    for (const [width, colour, alpha] of [
      [9, 0x3fc4ff, 0.45],
      [4, 0xd8f6ff, 1],
    ] as const) {
      rune.lineStyle(width, colour, alpha);
      rune.strokeCircle(0, 0, r + 8);
      rune.beginPath();
      rune.moveTo(0, r);
      rune.lineTo(0, -r);
      rune.moveTo(0, -r * 0.15);
      rune.lineTo(-r * 0.75, -r * 0.85);
      rune.moveTo(0, -r * 0.15);
      rune.lineTo(r * 0.75, -r * 0.85);
      rune.strokePath();
    }
    parts.push(rune);
  }
  const glow = scene.add.container(x, y, parts).setDepth(depth + 0.0005);
  if (!still) {
    scene.tweens.add({ targets: glow, alpha: 0.6, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  return glow;
}
