// The naughty child's map, open (D134, D143, D151): a window over the level with the
// scene's own picture drawn in ink on parchment (greys lifted to parchment, lines
// darkened, colour taken out), the cell grid over it in ink, firm on the floor cells and
// faint over the walls, every door as the scene shows it at this tick, the figures with
// their own standing sprites and their names and cells beside them, drawn where the
// scene draws them and behind the same cut-outs, inked with the ground, every reach mark
// with the mark's picture lying on the ground under them, its thin silhouette where a
// cut-out covers it (D160, D168), and its cell written beside it, the hidden ones too,
// the dark tunnel's cells as a dotted path, the column and row numbers along the four
// edges, and a cell's own numbers where the pointer rests or a finger taps. A dark room
// is drawn as any room, with the things lying in it, the key among them, since the map
// knows the castle (D163, D169); no one in the dark tunnel is drawn (D135). The names
// and cells are written last, each where it covers no figure, no mark, no other name
// and, a mark's, no cut-out (D166).
// Its button or Escape closes it, and the playback goes on.

import { figureDepth, loweredBy, MARK_DEPTH, nudgedBy } from '../engine/depth';
import type { PlanPictures, PlanView, Tile } from '../engine/layout';
import { characterName, forWizard, t } from '../i18n';
import { element } from './dom';

export type PlanCell = 'wall' | 'floor' | 'furniture' | 'enchanted';

export interface PlanShapes {
  columns: number;
  height: number;
  /** Every cell, a dark room's as any room's (D163). */
  cells: { x: number; y: number; kind: PlanCell }[];
  doors: { id: string; x: number; y: number; open: boolean; across: boolean }[];
  /** The things on the map, a dark room's too (D169). */
  things: { id: string; x: number; y: number }[];
  figures: { id: string; kind: string; x: number; y: number; facing: string }[];
  /** Every reach mark's cell, the hidden ones too. */
  marks: { x: number; y: number }[];
}

const key = ([x, y]: Tile): string => `${x},${y}`;

/** What the plan draws for a view of the scene, apart from any canvas. */
export function planShapes(view: PlanView): PlanShapes {
  const enchanted = new Set(view.enchanted.map(key));
  const cells: PlanShapes['cells'] = [];
  view.rows.forEach((row, y) => {
    [...row].forEach((char, x) => {
      const here = `${x},${y}`;
      const kind: PlanCell = char === '#' ? 'wall' : char === '=' ? 'furniture' : enchanted.has(here) ? 'enchanted' : 'floor';
      cells.push({ x, y, kind });
    });
  });
  const isWall = (x: number, y: number) => (view.rows[y]?.[x] ?? '#') === '#';
  const doors = view.things
    .filter((thing) => thing.kind === 'door')
    .map(({ id, tile: [x, y], open }) => ({
      id,
      x,
      y,
      open: open === true,
      // Across a corridor that runs up and down, the bar lies along the row.
      across: isWall(x - 1, y) || isWall(x + 1, y),
    }));
  const things = view.things
    .filter((thing) => thing.kind !== 'door' && thing.kind !== 'bed')
    .map(({ id, tile: [x, y] }) => ({ id, x, y }));
  const figures = view.figures
    .filter((figure) => !enchanted.has(key(figure.tile)))
    .map(({ id, kind, tile: [x, y], facing }) => ({ id, kind, x, y, facing }));
  const marks = view.marks.map(([x, y]) => ({ x, y }));
  return { columns: view.rows[0]?.length ?? 0, height: view.rows.length, cells, doors, things, figures, marks };
}

/** A box on the plan, in its pixels. */
export interface PlanBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const overlaps = (one: PlanBox, other: PlanBox): boolean =>
  one.x < other.x + other.width &&
  other.x < one.x + one.width &&
  one.y < other.y + other.height &&
  other.y < one.y + one.height;

/** How far out a name is looked for, in its reach, when no place beside its owner is clear. */
const FARTHER = [1, 1.5, 2, 2.5, 3];

/** Where each name and cell is written (D166): right of its owner, left, below or above,
 * the first place inside the plan that overlaps none of `obstacles` (the figures and the
 * marks), no name written before it and nothing its own `avoid` says (a mark's, the
 * cut-outs); farther out, half a reach at a time, when none beside it is clear. */
export function labelBoxes(
  anchors: { x: number; y: number; width: number; height: number; reach: number; avoid?: (box: PlanBox) => boolean }[],
  size: { width: number; height: number },
  obstacles: PlanBox[] = [],
): { x: number; y: number }[] {
  const taken: PlanBox[] = [];
  return anchors.map(({ x, y, width, height, reach, avoid }) => {
    const clear = (box: PlanBox) =>
      box.x >= 0 &&
      box.y >= 0 &&
      box.x + box.width <= size.width &&
      box.y + box.height <= size.height &&
      !taken.some((other) => overlaps(box, other)) &&
      !obstacles.some((other) => overlaps(box, other)) &&
      !avoid?.(box);
    const places = FARTHER.flatMap((far) => [
      { x: x + reach * far, y: y - height / 2 },
      { x: x - reach * far - width, y: y - height / 2 },
      { x: x - width / 2, y: y + reach * far },
      { x: x - width / 2, y: y - reach * far - height },
    ]);
    const box = places.map((place) => ({ ...place, width, height })).find(clear) ?? {
      x: Math.max(0, Math.min(places[0]?.x ?? 0, size.width - width)),
      y: Math.max(0, Math.min(places[0]?.y ?? 0, size.height - height)),
      width,
      height,
    };
    taken.push(box);
    return { x: box.x, y: box.y };
  });
}

/** What a figure covers on the plan, `cell` pixels a cell, its feet at `feet` pixels
 * down and its middle at `middle` across: its body, narrower than its frame, a cell and
 * a tenth tall above its feet (D166). */
export function figureBox(middle: number, feet: number, cell: number): PlanBox {
  return { x: middle - cell * 0.31, y: feet - cell * 1.1, width: cell * 0.62, height: cell * 1.1 };
}

/** What a mark covers on the plan: its ring, round its middle. */
export function markBox(middle: number, down: number, cell: number): PlanBox {
  const radius = cell * GOAL_RING;
  return { x: middle - radius, y: down - radius, width: radius * 2, height: radius * 2 };
}

/** Where a figure, a thing and a mark of the plan stand, `cell` pixels a cell inside a
 * gutter of `gutter`: across and down to the middle of their cell, nudged and lowered
 * as on the scene (D149, D151), and a figure's feet. */
export function planPlaces(
  cell: number,
  gutter: number,
  pictures: Pick<PlanPictures, 'lowered' | 'nudged'> | null,
): { across: (x: number, y: number) => number; down: (x: number, y: number) => number; feet: (x: number, y: number) => number } {
  const lowered = pictures?.lowered;
  const nudged = pictures?.nudged;
  return {
    across: (x, y) => gutter + x * cell + cell * (0.5 + nudgedBy(nudged, [x, y])),
    down: (x, y) => gutter + y * cell + cell * (0.5 + loweredBy(lowered, [x, y])),
    feet: (x, y) => gutter + cell * (y + FOOT_ON_THE_PLAN + loweredBy(lowered, [x, y])),
  };
}

/** Each name and cell written on the plan and where (D151, D166): the figures', the
 * things' and the marks', clear of the figures, the marks and one another, a mark's of
 * the cut-outs too (`cutOut`, whether a box of the plan touches one). */
export function planLabels(
  shapes: Pick<PlanShapes, 'figures' | 'things' | 'marks'>,
  cell: number,
  gutter: number,
  pictures: Pick<PlanPictures, 'lowered' | 'nudged'> | null,
  name: (id: string) => string,
  measure: (text: string) => number,
  size: { width: number; height: number },
  cutOut: (box: PlanBox) => boolean = () => false,
): { said: string; box: PlanBox }[] {
  const { across, down, feet } = planPlaces(cell, gutter, pictures);
  const tall = Math.max(14, cell * 0.38);
  const named = [
    ...shapes.figures.map((figure) => ({ id: figure.id, x: figure.x, y: figure.y, mark: false })),
    ...shapes.things.map((thing) => ({ id: thing.id, x: thing.x, y: thing.y, mark: false })),
    // A mark says its cell, as a figure's name does (D151).
    ...shapes.marks.map((mark) => ({ id: '', x: mark.x, y: mark.y, mark: true })),
  ];
  const says = named.map((one) => planLabel(one.id && name(one.id), one.x, one.y));
  const obstacles = [
    ...shapes.figures.map((figure) => figureBox(across(figure.x, figure.y), feet(figure.x, figure.y), cell)),
    ...shapes.marks.map((mark) => markBox(across(mark.x, mark.y), down(mark.x, mark.y), cell)),
  ];
  const places = labelBoxes(
    named.map((one, index) => ({
      x: across(one.x, one.y),
      y: down(one.x, one.y),
      width: measure(says[index] ?? '') + 8,
      height: tall,
      reach: cell * 0.5,
      ...(one.mark ? { avoid: cutOut } : {}),
    })),
    size,
    obstacles,
  );
  return named.map((_, index) => ({
    said: says[index] ?? '',
    box: { x: places[index]?.x ?? 0, y: places[index]?.y ?? 0, width: measure(says[index] ?? '') + 8, height: tall },
  }));
}

/** The parchment and the ink, as colours and as their channels. */
const PARCHMENT: Rgb = [236, 220, 180];
const INK: Rgb = [63, 44, 26];
type Rgb = [number, number, number];
const css = ([r, g, b]: Rgb, alpha = 1): string => `rgb(${r} ${g} ${b} / ${alpha})`;
/** The gutter round the plan, for its numbers, in pixels at the least and in cells. */
const GUTTER_LEAST = 28;
const GUTTER = 0.72;
/** The numbers along the plan's edges, in pixels. */
const EDGE_NUMBER = 18;
/** How strong the grid's ink is over the walls and on the floor cells' edges (D151). */
const GRID_OVER_WALLS = 0.13;
const GRID_ON_FLOOR = 0.62;
/** How far round a pixel the ink filter takes the mean, in cells; how much of the
 * difference from it is a line; how light the darkest tone of the picture is drawn, and
 * how far toward the ink a line goes. */
const INK_REACH = 0.14;
const INK_LINES = 7;
const INK_FLOOR = 0.58;
const INK_LINE = 0.92;

/** A square mean of `values`, `reach` pixels each way, by rows and then by columns. */
function meaned(values: Float32Array, width: number, height: number, reach: number): Float32Array {
  const through = (source: Float32Array, length: number, lines: number, at: (line: number, i: number) => number) => {
    const out = new Float32Array(source.length);
    for (let line = 0; line < lines; line += 1) {
      let sum = 0;
      for (let i = -reach; i <= reach; i += 1) sum += source[at(line, Math.max(0, Math.min(length - 1, i)))] ?? 0;
      for (let i = 0; i < length; i += 1) {
        out[at(line, i)] = sum / (reach * 2 + 1);
        sum += (source[at(line, Math.min(length - 1, i + reach + 1))] ?? 0) - (source[at(line, Math.max(0, i - reach))] ?? 0);
      }
    }
    return out;
  };
  const across = through(values, width, height, (line, i) => line * width + i);
  return through(across, height, width, (line, i) => i * width + line);
}

/** A picture's RGBA pixels drawn in ink on parchment, in place (D143): its tones from
 * the mean round each pixel, stretched between the picture's darkest and lightest so
 * that a scene at night reads as well as one by day, its lines darkened from what is
 * darker than that mean, and its colour taken out. */
export function inked(pixels: Uint8ClampedArray, width: number, height: number, cell: number): void {
  const light = new Float32Array(width * height);
  for (let i = 0; i < light.length; i += 1) {
    const r = pixels[i * 4] ?? 0;
    const g = pixels[i * 4 + 1] ?? 0;
    const b = pixels[i * 4 + 2] ?? 0;
    light[i] = (0.3 * r + 0.59 * g + 0.11 * b) / 255;
  }
  const mean = meaned(light, width, height, Math.max(1, Math.round(cell * INK_REACH)));
  const sorted = Float32Array.from(mean).sort();
  const low = sorted[Math.floor(sorted.length * 0.03)] ?? 0;
  const high = sorted[Math.floor(sorted.length * 0.97)] ?? 1;
  const span = Math.max(1e-3, high - low);
  for (let i = 0; i < light.length; i += 1) {
    const here = mean[i] ?? 0;
    const line = (light[i] ?? 0) - here;
    const tone = Math.min(1, Math.max(0, (here - low) / span));
    const dark = Math.min(1, Math.max(0, -line * INK_LINES));
    const glow = Math.min(0.08, Math.max(0, line * 1.2));
    const value = Math.min(1, (INK_FLOOR + (1 - INK_FLOOR) * tone) * (1 - dark * INK_LINE) + glow);
    for (const channel of [0, 1, 2] as const) {
      pixels[i * 4 + channel] = (INK[channel] ?? 0) + ((PARCHMENT[channel] ?? 0) - (INK[channel] ?? 0)) * value;
    }
    pixels[i * 4 + 3] = 255;
  }
}

/** Where an image of the scene is drawn on the plan, `cell` pixels a cell (D159): at its
 * painted box, `left` and `top` in the scene's own pixels, `pictureCell` of them a cell,
 * as the scene draws it, never from the cell a thing stands on. */
export function paintedBox(
  left: number,
  top: number,
  width: number,
  height: number,
  pictureCell: number,
  cell: number,
): [number, number, number, number] {
  const scale = cell / pictureCell;
  return [left * scale, top * scale, width * scale, height * scale];
}

/** The pictures the plan is drawn from, once loaded. */
export interface PlanLoaded {
  ground: HTMLImageElement;
  doors: { image: HTMLImageElement; left: number; top: number; depth: number }[];
  rows: { image: HTMLImageElement; top: number; depth: number }[];
  things: Map<string, { image: HTMLImageElement; left: number; top: number; scale?: number; centre?: [number, number] }>;
  figures: Map<string, HTMLImageElement>;
}

/** The scene's picture with its doors as they are, in ink, at `cell` pixels a cell; a
 * dark room drawn as any room (D163). */
function inkedScene(pictures: PlanPictures, loaded: PlanLoaded, shapes: PlanShapes, cell: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(shapes.columns * cell);
  canvas.height = Math.round(shapes.height * cell);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;
  const scale = cell / pictures.cell;
  const [ox, oy] = pictures.origin;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(loaded.ground, -ox * scale, -oy * scale, loaded.ground.width * scale, loaded.ground.height * scale);
  for (const { image, left, top } of loaded.doors) {
    ctx.drawImage(image, ...paintedBox(left, top, image.width, image.height, pictures.cell, cell));
  }
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  inked(data.data, canvas.width, canvas.height, cell);
  ctx.putImageData(data, 0, 0);
  return canvas;
}

/** The margin of the plan, in pixels, from its cell. */
function gutterOf(cell: number): number {
  return Math.max(GUTTER_LEAST, cell * GUTTER);
}

/** How far the mark's outer ink ring lies from its middle, in cells. */
const GOAL_RING = 0.39;
/** How thick a mark's silhouette is drawn, in cells: a figure's outline on the scene. */
const GOAL_LINE = 0.02;

/** The mark of a reach goal, as the scene draws it (painted.drawMark). */
function drawGoal(ctx: CanvasRenderingContext2D, cx: number, cy: number, cell: number): void {
  ctx.fillStyle = 'rgb(255 224 102 / 0.55)';
  ctx.beginPath();
  ctx.arc(cx, cy, cell * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffc61a';
  ctx.lineWidth = Math.max(2, cell * 0.06);
  ctx.beginPath();
  ctx.arc(cx, cy, cell * 0.36, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = css(INK, 0.7);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, cell * GOAL_RING, 0, Math.PI * 2);
  ctx.stroke();
}

/** A mark's silhouette (D160, D168): its ring in the outline's yellow, as thin as a
 * figure's outline on the scene, for where a cut-out drawn over the mark covers it. */
function drawGoalLine(ctx: CanvasRenderingContext2D, cx: number, cy: number, cell: number): void {
  ctx.strokeStyle = 'rgb(255 214 51)';
  ctx.lineWidth = Math.max(1, cell * GOAL_LINE);
  ctx.beginPath();
  ctx.arc(cx, cy, cell * 0.36, 0, Math.PI * 2);
  ctx.stroke();
}

/** A canvas as big as `ctx`'s, drawn with the same transform. */
function alike(ctx: CanvasRenderingContext2D): CanvasRenderingContext2D | null {
  const canvas = document.createElement('canvas');
  canvas.width = ctx.canvas.width;
  canvas.height = ctx.canvas.height;
  const other = canvas.getContext('2d');
  other?.setTransform(ctx.getTransform());
  return other;
}

/** The dark tunnel's cells: a dotted line round them and a dot in each. */
function drawTunnel(ctx: CanvasRenderingContext2D, shapes: PlanShapes, cell: number, left: (x: number) => number, top: (y: number) => number): void {
  const inside = new Set(shapes.cells.filter(({ kind }) => kind === 'enchanted').map(({ x, y }) => `${x},${y}`));
  ctx.strokeStyle = css(INK);
  ctx.lineWidth = Math.max(1.5, cell * 0.05);
  ctx.setLineDash([cell * 0.14, cell * 0.14]);
  for (const key of inside) {
    const [x = 0, y = 0] = key.split(',').map(Number);
    for (const [dx, dy, x0, y0, x1, y1] of [
      [-1, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 1],
      [0, -1, 0, 0, 1, 0],
      [0, 1, 0, 1, 1, 1],
    ] as const) {
      if (inside.has(`${x + dx},${y + dy}`)) continue;
      ctx.beginPath();
      ctx.moveTo(left(x + x0), top(y + y0));
      ctx.lineTo(left(x + x1), top(y + y1));
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);
  ctx.fillStyle = css(INK, 0.75);
  for (const key of inside) {
    const [x = 0, y = 0] = key.split(',').map(Number);
    ctx.beginPath();
    ctx.arc(left(x) + cell / 2, top(y) + cell / 2, Math.max(1.5, cell * 0.05), 0, Math.PI * 2);
    ctx.fill();
  }
}

/** The plan drawn on a canvas's context, `cell` pixels a cell; `scene`, the scene's
 * picture in ink, or none while it loads or for a scene without art. */
export function drawPlan(
  ctx: CanvasRenderingContext2D,
  shapes: PlanShapes,
  cell: number,
  words: { tunnel: string; name: (id: string) => string },
  scene: HTMLCanvasElement | null,
  pictures: PlanPictures | null,
  loaded: PlanLoaded | null,
): void {
  const gutter = gutterOf(cell);
  const width = shapes.columns * cell + gutter * 2;
  const height = shapes.height * cell + gutter * 2;
  ctx.fillStyle = css(PARCHMENT);
  ctx.fillRect(0, 0, width, height);
  const left = (x: number) => gutter + x * cell;
  const top = (y: number) => gutter + y * cell;
  if (scene) ctx.drawImage(scene, gutter, gutter, shapes.columns * cell, shapes.height * cell);
  else {
    for (const { x, y, kind } of shapes.cells) {
      if (kind !== 'wall') continue;
      ctx.fillStyle = css(INK, 0.35);
      ctx.fillRect(left(x), top(y), cell, cell);
    }
  }
  // The grid over the picture, at the scene's cells: faint over the walls, firm on every
  // floor cell's edges, so that a child counts cells without numbers in them (D151).
  ctx.lineWidth = 1;
  ctx.strokeStyle = css(INK, GRID_OVER_WALLS);
  ctx.beginPath();
  for (let x = 0; x <= shapes.columns; x += 1) {
    ctx.moveTo(left(x) + 0.5, top(0));
    ctx.lineTo(left(x) + 0.5, top(shapes.height));
  }
  for (let y = 0; y <= shapes.height; y += 1) {
    ctx.moveTo(left(0), top(y) + 0.5);
    ctx.lineTo(left(shapes.columns), top(y) + 0.5);
  }
  ctx.stroke();
  ctx.lineWidth = Math.max(1, cell * 0.025);
  ctx.strokeStyle = css(INK, GRID_ON_FLOOR);
  ctx.beginPath();
  for (const [x0, y0, x1, y1] of floorEdges(shapes)) {
    ctx.moveTo(left(x0) + 0.5, top(y0) + 0.5);
    ctx.lineTo(left(x1) + 0.5, top(y1) + 0.5);
  }
  ctx.stroke();
  // Every column along the top and the bottom, every row along the left and the right.
  ctx.fillStyle = css(INK);
  ctx.font = `bold ${EDGE_NUMBER}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let x = 0; x < shapes.columns; x += 1) {
    ctx.fillText(String(x), left(x) + cell / 2, gutter / 2);
    ctx.fillText(String(x), left(x) + cell / 2, height - gutter / 2);
  }
  for (let y = 0; y < shapes.height; y += 1) {
    ctx.fillText(String(y), gutter / 2, top(y) + cell / 2);
    ctx.fillText(String(y), width - gutter / 2, top(y) + cell / 2);
  }
  drawTunnel(ctx, shapes, cell, left, top);
  // A figure and a mark stand where the scene draws them (D149, D151).
  const { across, down, feet: feetAt } = planPlaces(cell, gutter, pictures);
  // A thing as itself, or a small square where it has no picture; a key smaller, its
  // middle on its cell's (D164).
  for (const thing of shapes.things) {
    const shown = loaded?.things.get(thing.id);
    if (shown && pictures) {
      const [ox, oy, wide, tall] = paintedBox(
        shown.left,
        shown.top,
        shown.image.width,
        shown.image.height,
        pictures.cell,
        cell,
      );
      if (shown.scale && shown.centre) {
        const [mx, my] = opaqueMiddle(shown.image);
        const scale = (cell / pictures.cell) * shown.scale;
        const [cx, cy] = shown.centre;
        ctx.drawImage(
          shown.image,
          gutter + cx * cell - mx * scale,
          gutter + cy * cell - my * scale,
          shown.image.width * scale,
          shown.image.height * scale,
        );
        continue;
      }
      ctx.drawImage(shown.image, gutter + ox, gutter + oy, wide, tall);
      continue;
    }
    ctx.fillStyle = css(INK);
    ctx.fillRect(left(thing.x) + cell * 0.37, top(thing.y) + cell * 0.37, cell * 0.26, cell * 0.26);
  }
  // The marks on the ground (D160); over them the figures as themselves, each on its
  // cell, its feet as the scene puts them, among the scene's own cut-outs in ink, each by
  // its depth (D151).
  const layers: { depth: number; mark?: boolean; figure?: boolean; draw: (target: CanvasRenderingContext2D) => void }[] =
    shapes.marks.map(({ x, y }) => ({
      depth: MARK_DEPTH,
      mark: true,
      draw: (target) => drawGoal(target, across(x, y), down(x, y), cell),
    }));
  for (const figure of shapes.figures) {
    const feet = (feetAt(figure.x, figure.y) - gutter) / cell;
    layers.push({
      depth: figureDepth(feet),
      figure: true,
      draw: (target) => {
        const sheet = loaded?.figures.get(figure.id);
        const about = pictures?.figures.find((one) => one.id === figure.id);
        const middle = across(figure.x, figure.y);
        if (sheet && about) {
          const scale = cell / about.cell;
          const [frameWidth, frameHeight] = about.frame;
          const row = about.rows[figure.facing] ?? 0;
          const [wide, tall] = [frameWidth * scale, frameHeight * scale];
          const bottom = gutter + feet * cell + about.foot * scale;
          target.drawImage(
            sheet,
            about.column * frameWidth,
            row * frameHeight,
            frameWidth,
            frameHeight,
            middle - wide / 2,
            bottom - tall,
            wide,
            tall,
          );
        } else {
          target.fillStyle = css(INK);
          target.beginPath();
          target.arc(middle, down(figure.x, figure.y), cell * 0.27, 0, Math.PI * 2);
          target.fill();
        }
      },
    });
  }
  // The cut-outs, kept to tell where a mark's name may be written (D166).
  const cutOuts: HTMLCanvasElement[] = [];
  if (scene && pictures && loaded) {
    const cutOut = (image: HTMLImageElement, x: number, y: number) => {
      const inkedHere = inkedCutOut(scene, image, x, y, pictures.cell, shapes.columns);
      cutOuts.push(inkedHere);
      return (target: CanvasRenderingContext2D) =>
        target.drawImage(inkedHere, gutter, gutter, shapes.columns * cell, shapes.height * cell);
    };
    for (const { image, top: y, depth } of loaded.rows) layers.push({ depth, draw: cutOut(image, 0, y) });
    for (const { image, left: x, top: y, depth } of loaded.doors) layers.push({ depth, draw: cutOut(image, x, y) });
  }
  const sorted = [...layers].sort((one, other) => one.depth - other.depth);
  for (const layer of sorted) layer.draw(ctx);
  // Where a cut-out drawn over a mark covers it, its ring over the cut-out, thin, and
  // never over a figure (D160, D168).
  if (shapes.marks.length > 0) {
    const over = alike(ctx);
    const figures = alike(ctx);
    const line = alike(ctx);
    if (over && figures && line) {
      for (const layer of sorted) {
        if (layer.figure) layer.draw(figures);
        else if (!layer.mark) layer.draw(over);
      }
      for (const { x, y } of shapes.marks) drawGoalLine(line, across(x, y), down(x, y), cell);
      line.save();
      line.setTransform(1, 0, 0, 1, 0, 0);
      line.globalCompositeOperation = 'destination-in';
      line.drawImage(over.canvas, 0, 0);
      line.globalCompositeOperation = 'destination-out';
      line.drawImage(figures.canvas, 0, 0);
      line.restore();
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 0.85;
      ctx.drawImage(line.canvas, 0, 0);
      ctx.restore();
    }
  }
  // The names and cells, last, over everything, each clear of the figures, the marks and
  // the others', a mark's of the cut-outs too (D166); the tunnel's name, once.
  const font = `${Math.max(11, cell * 0.3)}px Georgia, serif`;
  ctx.font = font;
  const tall = Math.max(14, cell * 0.38);
  const labels = planLabels(
    shapes,
    cell,
    gutter,
    pictures,
    words.name,
    (text) => ctx.measureText(text).width,
    { width, height },
    cutOuts.length > 0 ? touchesCutOut(cutOuts, gutter, cell, shapes.columns) : undefined,
  );
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (const { said, box } of labels) {
    if (!said) continue;
    ctx.fillStyle = css(PARCHMENT, 0.92);
    ctx.fillRect(box.x, box.y, box.width, box.height);
    ctx.fillStyle = css(INK);
    ctx.fillText(said, box.x + 4, box.y + box.height / 2);
  }
  const middle = tunnelLabelCell(shapes);
  if (middle) {
    ctx.font = `italic ${Math.max(11, cell * 0.34)}px Georgia, serif`;
    const wide = ctx.measureText(words.tunnel).width + 8;
    const x = Math.min(width - wide, Math.max(0, left(middle.x) + cell / 2 - wide / 2));
    const y = top(middle.y) + cell / 2 - tall / 2;
    ctx.fillStyle = css(PARCHMENT, 0.9);
    ctx.fillRect(x, y, wide, tall);
    ctx.fillStyle = css(INK);
    ctx.fillText(words.tunnel, x + 4, y + tall / 2);
  }
}

/** Where a figure's feet stand in its cell (depth.FOOT_IN_CELL). */
const FOOT_ON_THE_PLAN = 0.8;

/** What is written beside a figure, a thing or a mark: its name, if it has one, and its
 * cell, `(15, 3)`. */
export function planLabel(name: string, x: number, y: number): string {
  return name ? `${name} (${x}, ${y})` : `(${x}, ${y})`;
}

/** The edges of every cell that is not a wall, each once, as [x0, y0, x1, y1] in cells. */
export function floorEdges(shapes: PlanShapes): [number, number, number, number][] {
  const edges = new Map<string, [number, number, number, number]>();
  for (const { x, y, kind } of shapes.cells) {
    if (kind === 'wall') continue;
    for (const edge of [
      [x, y, x + 1, y],
      [x, y + 1, x + 1, y + 1],
      [x, y, x, y + 1],
      [x + 1, y, x + 1, y + 1],
    ] as [number, number, number, number][]) {
      edges.set(edge.join(','), edge);
    }
  }
  return [...edges.values()];
}

/** The cell the dark tunnel's name is written on: its cell farthest from every mark, so
 * that the name never lies over the mark the child looks for. */
export function tunnelLabelCell(shapes: PlanShapes): { x: number; y: number } | null {
  const tunnel = shapes.cells.filter(({ kind }) => kind === 'enchanted');
  let found: { x: number; y: number } | null = null;
  let farthest = -1;
  for (const { x, y } of tunnel) {
    const away = Math.min(99, ...shapes.marks.map((mark) => Math.abs(mark.x - x) + Math.abs(mark.y - y)));
    if (away > farthest) {
      farthest = away;
      found = { x, y };
    }
  }
  return found;
}

/** The inked scene where an image of the scene is drawn, as big as the inked scene: a
 * cut-out of it, to lay over a figure it stands in front of (D151). */
function inkedCutOut(
  scene: HTMLCanvasElement,
  image: HTMLImageElement,
  x: number,
  y: number,
  pictureCell: number,
  columns: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = scene.width;
  canvas.height = scene.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.drawImage(image, ...paintedBox(x, y, image.width, image.height, pictureCell, scene.width / columns));
  ctx.globalCompositeOperation = 'source-in';
  ctx.drawImage(scene, 0, 0);
  return canvas;
}

/** Whether a box of the plan, in its pixels, touches what a cut-out draws (D166): its
 * pixels read once, from the cut-outs' canvases, the inked scene's size each. */
function touchesCutOut(
  cutOuts: HTMLCanvasElement[],
  gutter: number,
  cell: number,
  columns: number,
): (box: PlanBox) => boolean {
  const first = cutOuts[0];
  if (!first) return () => false;
  const { width, height } = first;
  const solid = new Uint8Array(width * height);
  for (const canvas of cutOuts) {
    const pixels = canvas.getContext('2d', { willReadFrequently: true })?.getImageData(0, 0, width, height).data;
    if (!pixels) continue;
    for (let index = 0; index < solid.length; index += 1) if ((pixels[index * 4 + 3] ?? 0) > 127) solid[index] = 1;
  }
  // The inked scene's pixels a plan's pixel.
  const ratio = width / (columns * cell);
  return (box) => {
    const [x0, y0] = [Math.max(0, Math.floor((box.x - gutter) * ratio)), Math.max(0, Math.floor((box.y - gutter) * ratio))];
    const [x1, y1] = [
      Math.min(width, Math.ceil((box.x + box.width - gutter) * ratio)),
      Math.min(height, Math.ceil((box.y + box.height - gutter) * ratio)),
    ];
    for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) if (solid[y * width + x]) return true;
    return false;
  };
}

/** The middle of what a picture draws, its solid pixels', in its own pixels. */
const middles = new WeakMap<HTMLImageElement, [number, number]>();
function opaqueMiddle(image: HTMLImageElement): [number, number] {
  const known = middles.get(image);
  if (known) return known;
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
  middles.set(image, middle);
  return middle;
}

/** The cell at a point of the plan, or null beyond the scene's cells. */
export function cellAt(x: number, y: number, cell: number, columns: number, rows: number): Tile | null {
  const gutter = gutterOf(cell);
  const [column, row] = [Math.floor((x - gutter) / cell), Math.floor((y - gutter) / cell)];
  return column >= 0 && column < columns && row >= 0 && row < rows ? [column, row] : null;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`no picture ${url}`));
    image.src = url;
  });
}

/** Every picture the plan names, loaded; null when one is missing. */
async function loadPictures(pictures: PlanPictures): Promise<PlanLoaded | null> {
  try {
    const [ground, doors, rows, things, figures] = await Promise.all([
      loadImage(pictures.ground),
      Promise.all(
        pictures.doors.map(async ({ url, left, top, depth }) => ({ image: await loadImage(url), left, top, depth })),
      ),
      Promise.all(pictures.rows.map(async ({ url, top, depth }) => ({ image: await loadImage(url), top, depth }))),
      Promise.all(
        pictures.things.map(
          async ({ id, url, left, top, scale, centre }) =>
            [id, { image: await loadImage(url), left, top, ...(scale && centre ? { scale, centre } : {}) }] as const,
        ),
      ),
      Promise.all(pictures.figures.map(async ({ id, url }) => [id, await loadImage(url)] as const)),
    ]);
    return { ground, doors, rows, things: new Map(things), figures: new Map(figures) };
  } catch {
    return null;
  }
}

export interface PlanWindow {
  /** Closes it as its button does, and calls what comes after. */
  close(): void;
  /** Takes it away with nothing after: the run it opened in is over. */
  dismiss(): void;
}

/** The window, over the whole page; `onClose` when the child closes it. */
export function openPlan(view: PlanView, onClose: () => void): PlanWindow {
  const shapes = planShapes(view);
  const canvas = element('canvas', { id: 'plan-canvas', className: 'plan-canvas' });
  const close = element('button', { id: 'plan-close', type: 'button', className: 'big-button' }, [t('plan.close')]);
  // A cell's own numbers, where the pointer rests or a finger taps.
  const tip = element('div', { id: 'plan-cell', className: 'plan-cell', hidden: true });
  const place = element('div', { className: 'plan-place' }, [canvas, tip]);
  const panel = element('div', { className: 'plan-panel' }, [
    element('h3', { className: 'plan-title' }, [t('plan.title')]),
    place,
    element('p', { id: 'plan-legend', className: 'plan-legend' }, [t('plan.legend')]),
    close,
  ]);
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  const node = element('div', { id: 'plan', className: 'plan-overlay' }, [panel]);
  // What it shows, for the tests, which cannot read a canvas.
  node.dataset.figures = shapes.figures.map(({ id, x, y }) => `${id}:${x},${y}`).join(';');
  node.dataset.things = shapes.things.map(({ id, x, y }) => `${id}:${x},${y}`).join(';');
  node.dataset.doors = shapes.doors.map(({ id, open }) => `${id}:${open ? 'open' : 'shut'}`).join(';');
  node.dataset.marks = shapes.marks.map(({ x, y }) => `${x},${y}`).join(';');
  node.dataset.markLabels = shapes.marks.map(({ x, y }) => planLabel('', x, y)).join(';');
  node.dataset.floorEdges = String(floorEdges(shapes).length);
  node.dataset.floor = String(shapes.cells.filter((one) => one.kind !== 'wall').length);
  node.dataset.tunnel = String(shapes.cells.filter((one) => one.kind === 'enchanted').length);
  let loaded: PlanLoaded | null = null;
  let cell = 12;
  const draw = () => {
    const free = {
      width: Math.max(160, innerWidth - 24),
      // Its title, its legend and its button take this much.
      height: Math.max(160, innerHeight - 130),
    };
    const fits = (gutter: number) =>
      Math.min((free.width - gutter * 2) / shapes.columns, (free.height - gutter * 2) / shapes.height);
    cell = Math.max(12, Math.min(fits(GUTTER_LEAST), fits(fits(GUTTER_LEAST) * GUTTER)));
    const gutter = gutterOf(cell);
    const width = cell * shapes.columns + gutter * 2;
    const height = cell * shapes.height + gutter * 2;
    const ratio = globalThis.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${Math.round(width)}px`;
    canvas.style.height = `${Math.round(height)}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    const scene = loaded && view.pictures ? inkedScene(view.pictures, loaded, shapes, Math.round(cell * ratio)) : null;
    drawPlan(
      ctx,
      shapes,
      cell,
      {
        tunnel: t('plan.tunnel'),
        name: (id) => {
          if (id === 'wizard') return forWizard('{wizard}');
          return view.figures.some((figure) => figure.id === id) ? characterName(id) : id;
        },
      },
      scene,
      view.pictures ?? null,
      loaded,
    );
  };
  const showCell = (event: PointerEvent) => {
    const box = canvas.getBoundingClientRect();
    const [x, y] = [event.clientX - box.left, event.clientY - box.top];
    const found = cellAt(x, y, cell, shapes.columns, shapes.height);
    tip.hidden = found === null;
    if (!found) {
      delete node.dataset.cell;
      return;
    }
    const said = `(${found[0]}, ${found[1]})`;
    tip.textContent = said;
    tip.style.left = `${gutterOf(cell) + found[0] * cell + cell / 2}px`;
    tip.style.top = `${gutterOf(cell) + found[1] * cell}px`;
    node.dataset.cell = `${found[0]},${found[1]}`;
  };
  canvas.addEventListener('pointermove', showCell);
  canvas.addEventListener('pointerdown', showCell);
  canvas.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'mouse') tip.hidden = true;
  });
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    plan.close();
  };
  let open = true;
  const remove = () => {
    if (!open) return false;
    open = false;
    document.removeEventListener('keydown', onKey, true);
    removeEventListener('resize', draw);
    node.remove();
    return true;
  };
  const plan: PlanWindow = {
    close() {
      if (remove()) onClose();
    },
    dismiss() {
      remove();
    },
  };
  close.addEventListener('click', () => plan.close());
  document.addEventListener('keydown', onKey, true);
  addEventListener('resize', draw);
  document.body.append(node);
  draw();
  close.focus();
  // The picture in ink once its pictures have come (D143).
  if (view.pictures) {
    void loadPictures(view.pictures).then((pictures) => {
      if (!open) return;
      loaded = pictures;
      draw();
      node.dataset.drawn = String(pictures !== null);
    });
  }
  return plan;
}
