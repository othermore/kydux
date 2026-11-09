// The naughty child's map, open (D134): a window over the level with the scene's
// plan, drawn by the page from the level's map, its things and its figures at the
// tick shown, like an old map in ink on parchment: walls hatched, floor pale,
// furniture cross-hatched, a door a bar when shut and a quarter arc when open, every
// column and row numbered at the edges and each floor cell's numbers small inside
// it, and the wizard, every figure and every thing with its name and its cell.
// What lies unlit in a dark room (D52) and anyone in an enchanted region (D135) are
// left out. Its button or Escape closes it, and the playback goes on.

import type { PlanView, Tile } from '../engine/layout';
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
  return { columns: view.rows[0]?.length ?? 0, height: view.rows.length, cells, doors, things, figures };
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

const PARCHMENT = '#ecdcb4';
const FLOOR = '#f6ecd2';
const WALL = '#8a7350';
const INK = '#3f2c1a';
const DOOR = '#6e3f1b';
const UNLIT = '#a9a59a';
const WIZARD = '#a3271d';
const FRIEND = '#c98a1c';
const TEACHER = '#27405f';
/** The gutter round the plan, for its numbers, in cells. */
const GUTTER = 0.8;

/** Lines at a slant across a cell, cut to it; `both` crosses them. */
function hatch(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, step: number, both: boolean): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, size, size);
  ctx.clip();
  ctx.beginPath();
  for (let offset = -size; offset < size; offset += step) {
    ctx.moveTo(x + offset, y);
    ctx.lineTo(x + offset + size, y + size);
    if (both) {
      ctx.moveTo(x + offset + size, y);
      ctx.lineTo(x + offset, y + size);
    }
  }
  ctx.stroke();
  ctx.restore();
}

/** The parchment's stains, the same every time, darker at the edges. */
function parchment(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = PARCHMENT;
  ctx.fillRect(0, 0, width, height);
  let seed = 7;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 90; i += 1) {
    ctx.fillStyle = `rgb(120 90 40 / ${0.015 + next() * 0.03})`;
    ctx.beginPath();
    ctx.arc(next() * width, next() * height, 8 + next() * 46, 0, Math.PI * 2);
    ctx.fill();
  }
  const edge = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.45, width / 2, height / 2, Math.max(width, height) * 0.72);
  edge.addColorStop(0, 'rgb(90 60 20 / 0)');
  edge.addColorStop(1, 'rgb(90 60 20 / 0.28)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, width, height);
}

/** The plan drawn on a canvas's context, `cell` pixels a cell. */
export function drawPlan(
  ctx: CanvasRenderingContext2D,
  shapes: PlanShapes,
  cell: number,
  words: { enchanted: string; name: (id: string) => string },
): void {
  const gutter = cell * GUTTER;
  const width = shapes.columns * cell + gutter * 2;
  const height = shapes.height * cell + gutter * 2;
  parchment(ctx, width, height);
  ctx.lineCap = 'round';
  const left = (x: number) => gutter + x * cell;
  const top = (y: number) => gutter + y * cell;
  const small = Math.max(7, cell * 0.2);
  const kindAt = new Map(shapes.cells.map(({ x, y, kind }) => [`${x},${y}`, kind]));
  for (const { x, y, kind } of shapes.cells) {
    ctx.fillStyle = kind === 'wall' ? WALL : kind === 'unlit' ? UNLIT : FLOOR;
    ctx.fillRect(left(x), top(y), cell, cell);
    ctx.strokeStyle = INK;
    if (kind === 'wall') {
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.45;
      hatch(ctx, left(x), top(y), cell, cell / 3.5, false);
    } else if (kind === 'furniture') {
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.6;
      hatch(ctx, left(x), top(y), cell, cell / 4, true);
    } else if (kind === 'enchanted') {
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.28;
      hatch(ctx, left(x), top(y), cell, cell / 5, false);
    }
    ctx.globalAlpha = 1;
  }
  // The grid over what is walked on, and the line where a wall begins.
  for (const { x, y, kind } of shapes.cells) {
    if (kind === 'wall') continue;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.6;
    ctx.globalAlpha = 0.45;
    ctx.strokeRect(left(x) + 0.5, top(y) + 0.5, cell, cell);
    ctx.globalAlpha = 1;
    ctx.fillStyle = INK;
    ctx.font = `${small}px Georgia, serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${x},${y}`, left(x) + 2, top(y) + 2);
    ctx.lineWidth = Math.max(1.5, cell * 0.05);
    for (const [dx, dy, x0, y0, x1, y1] of [
      [-1, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 1],
      [0, -1, 0, 0, 1, 0],
      [0, 1, 0, 1, 1, 1],
    ] as const) {
      if (kindAt.get(`${x + dx},${y + dy}`) !== 'wall' && kindAt.has(`${x + dx},${y + dy}`)) continue;
      ctx.beginPath();
      ctx.moveTo(left(x + x0), top(y + y0));
      ctx.lineTo(left(x + x1), top(y + y1));
      ctx.stroke();
    }
  }
  // Every column along the top and the bottom, every row along the left and the right.
  ctx.fillStyle = INK;
  ctx.font = `bold ${Math.max(9, cell * 0.32)}px Georgia, serif`;
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
  // The doors, a bar on the cell while shut, a quarter arc once open.
  for (const door of shapes.doors) {
    const cx = left(door.x) + cell / 2;
    const cy = top(door.y) + cell / 2;
    ctx.strokeStyle = DOOR;
    ctx.fillStyle = DOOR;
    if (door.open) {
      ctx.lineWidth = Math.max(1.5, cell * 0.07);
      ctx.beginPath();
      if (door.across) {
        ctx.moveTo(left(door.x), cy);
        ctx.lineTo(left(door.x), cy - cell * 0.8);
        ctx.arc(left(door.x), cy, cell * 0.8, -Math.PI / 2, -0.06);
      } else {
        ctx.moveTo(cx, top(door.y));
        ctx.lineTo(cx + cell * 0.8, top(door.y));
        ctx.arc(cx, top(door.y), cell * 0.8, 0, Math.PI / 2 - 0.06);
      }
      ctx.stroke();
    } else if (door.across) ctx.fillRect(left(door.x), cy - cell * 0.1, cell, cell * 0.2);
    else ctx.fillRect(cx - cell * 0.1, top(door.y), cell * 0.2, cell);
  }
  // The enchanted region, named once, in its largest box.
  const charmed = shapes.cells.filter((one) => one.kind === 'enchanted');
  const middle = charmed[Math.floor(charmed.length / 2)];
  // The marks and their words, each clear of the others'.
  const font = `${Math.max(9, cell * 0.27)}px Georgia, serif`;
  ctx.font = font;
  const tall = Math.max(11, cell * 0.34);
  const named = [
    ...shapes.figures.map((figure) => ({ ...figure, thing: false })),
    ...shapes.things.map((thing) => ({ ...thing, kind: 'thing', facing: '', thing: true })),
    ...shapes.doors.map((door) => ({ id: door.id, kind: 'door', facing: '', x: door.x, y: door.y, thing: true })),
  ];
  const says = named.map((one) => `${words.name(one.id)} (${one.x}, ${one.y})`);
  const places = labelBoxes(
    named.map((one, index) => ({
      x: left(one.x) + cell / 2,
      y: top(one.y) + cell / 2,
      width: ctx.measureText(says[index] ?? '').width + 8,
      height: tall,
      reach: cell * 0.42,
    })),
    { width, height },
  );
  for (const one of named) {
    const cx = left(one.x) + cell / 2;
    const cy = top(one.y) + cell / 2;
    if (one.kind === 'door') continue;
    if (one.thing) {
      ctx.fillStyle = INK;
      ctx.fillRect(cx - cell * 0.13, cy - cell * 0.13, cell * 0.26, cell * 0.26);
      continue;
    }
    ctx.fillStyle = one.id === 'wizard' ? WIZARD : one.kind === 'teacher' ? TEACHER : FRIEND;
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1, cell * 0.03);
    ctx.beginPath();
    ctx.arc(cx, cy, cell * 0.27, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (one.kind === 'teacher') {
      const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[one.facing] ?? [0, 1];
      const [dx0, dy0] = [dx ?? 0, dy ?? 0];
      const [tipX, tipY] = [cx + dx0 * cell * 0.62, cy + dy0 * cell * 0.62];
      ctx.strokeStyle = TEACHER;
      ctx.lineWidth = Math.max(1.5, cell * 0.07);
      ctx.beginPath();
      ctx.moveTo(cx + dx0 * cell * 0.27, cy + dy0 * cell * 0.27);
      ctx.lineTo(tipX, tipY);
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX - dx0 * cell * 0.14 - dy0 * cell * 0.12, tipY - dy0 * cell * 0.14 - dx0 * cell * 0.12);
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX - dx0 * cell * 0.14 + dy0 * cell * 0.12, tipY - dy0 * cell * 0.14 + dx0 * cell * 0.12);
      ctx.stroke();
    }
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = font;
  named.forEach((_, index) => {
    const place = places[index];
    const said = says[index];
    if (!place || !said) return;
    ctx.fillStyle = 'rgb(246 236 210 / 0.92)';
    ctx.fillRect(place.x, place.y, ctx.measureText(said).width + 8, tall);
    ctx.fillStyle = INK;
    ctx.fillText(said, place.x + 4, place.y + tall / 2);
  });
  if (middle) {
    ctx.font = `italic ${Math.max(10, cell * 0.34)}px Georgia, serif`;
    const said = words.enchanted;
    const wide = ctx.measureText(said).width + 8;
    const x = Math.min(width - wide, Math.max(0, left(middle.x) + cell / 2 - wide / 2));
    const y = top(middle.y) + cell / 2 - tall / 2;
    ctx.fillStyle = 'rgb(246 236 210 / 0.9)';
    ctx.fillRect(x, y, wide, tall);
    ctx.fillStyle = INK;
    ctx.fillText(said, x + 4, y + tall / 2);
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
  const panel = element('div', { className: 'plan-panel' }, [
    element('h3', { className: 'plan-title' }, [t('plan.title')]),
    canvas,
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
  node.dataset.floor = String(shapes.cells.filter((one) => one.kind !== 'wall').length);
  node.dataset.enchanted = String(shapes.cells.filter((one) => one.kind === 'enchanted').length);
  const draw = () => {
    const free = {
      width: Math.max(160, innerWidth - 24),
      // Its title, its legend and its button take this much.
      height: Math.max(160, innerHeight - 130),
    };
    const cell = Math.max(
      12,
      Math.min(free.width / (shapes.columns + GUTTER * 2), free.height / (shapes.height + GUTTER * 2)),
    );
    const width = cell * (shapes.columns + GUTTER * 2);
    const height = cell * (shapes.height + GUTTER * 2);
    const ratio = globalThis.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${Math.round(width)}px`;
    canvas.style.height = `${Math.round(height)}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    drawPlan(ctx, shapes, cell, {
      enchanted: t('plan.enchanted'),
      name: (id) => {
        if (id === 'wizard') return forWizard('{wizard}');
        return view.figures.some((figure) => figure.id === id) ? characterName(id) : id;
      },
    });
  };
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
  return plan;
}
