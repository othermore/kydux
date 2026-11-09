// The naughty child's map, open (D134, D143, D151): a window over the level with the
// scene's own picture drawn in ink on parchment (greys lifted to parchment, lines
// darkened, colour taken out), the cell grid over it in ink, firm on the floor cells and
// faint over the walls, every door as the scene shows it at this tick, the figures with
// their own standing sprites and their names and cells beside them, drawn where the
// scene draws them and behind the same cut-outs, inked with the ground, every reach mark
// with the mark's picture and its cell written beside it, the hidden ones too, the dark
// tunnel's cells as a dotted path, the column and row numbers along the four edges, and
// a cell's own numbers where the pointer rests or a finger taps. What lies unlit in a
// dark room stays undrawn (D52), and no one in the dark tunnel is drawn (D135). Its
// button or Escape closes it, and the playback goes on.

import { figureDepth, loweredBy, markDepth, nudgedBy } from '../engine/depth';
import type { PlanPictures, PlanView, Tile } from '../engine/layout';
import { characterName, forWizard, t } from '../i18n';
import { element } from './dom';

export type PlanCell = 'wall' | 'floor' | 'furniture' | 'enchanted' | 'unlit';

export interface PlanShapes {
  columns: number;
  height: number;
  cells: { x: number; y: number; kind: PlanCell }[];
  doors: { id: string; x: number; y: number; open: boolean; across: boolean }[];
  things: { id: string; x: number; y: number }[];
  figures: { id: string; kind: string; x: number; y: number; facing: string }[];
  /** Every reach mark's cell, the hidden ones too. */
  marks: { x: number; y: number }[];
  /** The cells of what is still dark, walls and furniture too, which stay undrawn (D52). */
  unlit: { x: number; y: number }[];
}

const key = ([x, y]: Tile): string => `${x},${y}`;

/** What the plan draws for a view of the scene, apart from any canvas. */
export function planShapes(view: PlanView): PlanShapes {
  const enchanted = new Set(view.enchanted.map(key));
  const unlit = new Set(view.unlit.map(key));
  const cells: PlanShapes['cells'] = [];
  view.rows.forEach((row, y) => {
    [...row].forEach((char, x) => {
      const here = `${x},${y}`;
      const kind: PlanCell =
        char === '#'
          ? 'wall'
          : char === '='
            ? 'furniture'
            : enchanted.has(here)
              ? 'enchanted'
              : unlit.has(here)
                ? 'unlit'
                : 'floor';
      cells.push({ x, y, kind });
    });
  });
  const isWall = (x: number, y: number) => (view.rows[y]?.[x] ?? '#') === '#';
  const [wx, wy] = view.figures.find((figure) => figure.id === 'wizard')?.tile ?? [-9, -9];
  const near = ([x, y]: Tile) => Math.abs(x - wx) <= 1 && Math.abs(y - wy) <= 1;
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
    .filter((thing) => !unlit.has(key(thing.tile)) || near(thing.tile))
    .map(({ id, tile: [x, y] }) => ({ id, x, y }));
  const figures = view.figures
    .filter((figure) => !enchanted.has(key(figure.tile)))
    .map(({ id, kind, tile: [x, y], facing }) => ({ id, kind, x, y, facing }));
  const marks = view.marks.map(([x, y]) => ({ x, y }));
  const dark = view.unlit.map(([x, y]) => ({ x, y }));
  return { columns: view.rows[0]?.length ?? 0, height: view.rows.length, cells, doors, things, figures, marks, unlit: dark };
}

/** Where a figure's or a thing's name and cell are written, each clear of those
 * written before it where one of four places is: right, left, above or below. */
export function labelBoxes(
  anchors: { x: number; y: number; width: number; height: number; reach: number }[],
  size: { width: number; height: number },
): { x: number; y: number }[] {
  const taken: { x: number; y: number; width: number; height: number }[] = [];
  const clear = (box: { x: number; y: number; width: number; height: number }) =>
    box.x >= 0 &&
    box.y >= 0 &&
    box.x + box.width <= size.width &&
    box.y + box.height <= size.height &&
    !taken.some(
      (other) =>
        box.x < other.x + other.width &&
        other.x < box.x + box.width &&
        box.y < other.y + other.height &&
        other.y < box.y + box.height,
    );
  return anchors.map(({ x, y, width, height, reach }) => {
    const places = [
      { x: x + reach, y: y - height / 2 },
      { x: x - reach - width, y: y - height / 2 },
      { x: x - width / 2, y: y - reach - height },
      { x: x - width / 2, y: y + reach },
      { x: x + reach, y: y - reach - height },
      { x: x + reach, y: y + reach },
      { x: x - reach - width, y: y - reach - height },
      { x: x - reach - width, y: y + reach },
    ];
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
  things: Map<string, { image: HTMLImageElement; left: number; top: number }>;
  figures: Map<string, HTMLImageElement>;
}

/** The scene's picture with its doors as they are, in ink, at `cell` pixels a cell;
 * what lies unlit undrawn, plain parchment. */
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
  ctx.fillStyle = css(PARCHMENT);
  for (const { x, y } of shapes.unlit) ctx.fillRect(x * cell, y * cell, cell, cell);
  return canvas;
}

/** The margin of the plan, in pixels, from its cell. */
function gutterOf(cell: number): number {
  return Math.max(GUTTER_LEAST, cell * GUTTER);
}

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
  ctx.arc(cx, cy, cell * 0.39, 0, Math.PI * 2);
  ctx.stroke();
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
  const lowered = pictures?.lowered;
  const nudged = pictures?.nudged;
  // A figure and a mark stand where the scene draws them (D149, D151).
  const across = (x: number, y: number) => left(x) + cell * (0.5 + nudgedBy(nudged, [x, y]));
  const down = (x: number, y: number) => top(y) + cell * loweredBy(lowered, [x, y]);
  // A thing as itself, or a small square where it has no picture.
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
      ctx.drawImage(shown.image, gutter + ox, gutter + oy, wide, tall);
      continue;
    }
    ctx.fillStyle = css(INK);
    ctx.fillRect(left(thing.x) + cell * 0.37, top(thing.y) + cell * 0.37, cell * 0.26, cell * 0.26);
  }
  // The figures as themselves, each on its cell, its feet as the scene puts them, among
  // the scene's own cut-outs in ink, each by its depth (D151).
  const layers: { depth: number; draw: () => void }[] = shapes.marks.map(({ x, y }) => ({
    depth: markDepth(y),
    draw: () => drawGoal(ctx, across(x, y), down(x, y) + cell / 2, cell),
  }));
  for (const figure of shapes.figures) {
    const feet = figure.y + FOOT_ON_THE_PLAN + loweredBy(lowered, [figure.x, figure.y]);
    layers.push({
      depth: figureDepth(feet),
      draw: () => {
        const sheet = loaded?.figures.get(figure.id);
        const about = pictures?.figures.find((one) => one.id === figure.id);
        const middle = across(figure.x, figure.y);
        if (sheet && about) {
          const scale = cell / about.cell;
          const [frameWidth, frameHeight] = about.frame;
          const row = about.rows[figure.facing] ?? 0;
          const [wide, tall] = [frameWidth * scale, frameHeight * scale];
          const bottom = gutter + feet * cell + about.foot * scale;
          ctx.drawImage(
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
          ctx.fillStyle = css(INK);
          ctx.beginPath();
          ctx.arc(middle, down(figure.x, figure.y) + cell / 2, cell * 0.27, 0, Math.PI * 2);
          ctx.fill();
        }
      },
    });
  }
  if (scene && pictures && loaded) {
    const cutOut = (image: HTMLImageElement, x: number, y: number) => () => {
      const inkedHere = inkedCutOut(scene, image, x, y, pictures.cell, shapes.columns);
      ctx.drawImage(inkedHere, gutter, gutter, shapes.columns * cell, shapes.height * cell);
    };
    for (const { image, top: y, depth } of loaded.rows) layers.push({ depth, draw: cutOut(image, 0, y) });
    for (const { image, left: x, top: y, depth } of loaded.doors) layers.push({ depth, draw: cutOut(image, x, y) });
  }
  for (const layer of [...layers].sort((one, other) => one.depth - other.depth)) layer.draw();
  // The names and cells, each clear of the others'; the tunnel's name, once.
  const font = `${Math.max(11, cell * 0.3)}px Georgia, serif`;
  ctx.font = font;
  const tall = Math.max(14, cell * 0.38);
  const named = [
    ...shapes.figures.map((figure) => ({ id: figure.id, x: figure.x, y: figure.y })),
    ...shapes.things.map((thing) => ({ id: thing.id, x: thing.x, y: thing.y })),
    // A mark says its cell, as a figure's name does (D151).
    ...shapes.marks.map((mark) => ({ id: '', x: mark.x, y: mark.y })),
  ];
  const says = named.map((one) => planLabel(one.id && words.name(one.id), one.x, one.y));
  const places = labelBoxes(
    named.map((one, index) => ({
      x: across(one.x, one.y),
      y: down(one.x, one.y) + cell / 2,
      width: ctx.measureText(says[index] ?? '').width + 8,
      height: tall,
      reach: cell * 0.5,
    })),
    { width, height },
  );
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  named.forEach((_, index) => {
    const place = places[index];
    const said = says[index];
    if (!place || !said) return;
    ctx.fillStyle = css(PARCHMENT, 0.92);
    ctx.fillRect(place.x, place.y, ctx.measureText(said).width + 8, tall);
    ctx.fillStyle = css(INK);
    ctx.fillText(said, place.x + 4, place.y + tall / 2);
  });
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
        pictures.things.map(async ({ id, url, left, top }) => [id, { image: await loadImage(url), left, top }] as const),
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
