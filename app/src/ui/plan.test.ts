import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { PlanView } from '../engine/layout';
import { cellAt, floorEdges, inked, labelBoxes, paintedBox, planLabel, planShapes, tunnelLabelCell } from './plan';

/** A corridor, a closed door across it, a dark room and an enchanted end. */
const VIEW: PlanView = {
  rows: ['#########', '#S..=...#', '#########'],
  enchanted: [
    [6, 1],
    [7, 1],
  ],
  unlit: [
    [3, 1],
    [4, 1],
    [5, 1],
  ],
  figures: [
    { id: 'wizard', kind: 'wizard', tile: [1, 1], facing: 'down' },
    { id: 'friend', kind: 'friend', tile: [2, 1], facing: 'left' },
    { id: 'dask', kind: 'teacher', tile: [7, 1], facing: 'left' },
  ],
  things: [
    { id: 'door', kind: 'door', tile: [2, 1], open: false },
    { id: 'near_key', kind: 'key', tile: [2, 1] },
    { id: 'far_key', kind: 'key', tile: [5, 1] },
  ],
  marks: [[7, 1]],
};

describe('the plan of a scene (D134, D143)', () => {
  it('draws walls, floor, furniture, the enchanted region and the unlit room as they are', () => {
    const { cells, columns, height } = planShapes(VIEW);
    expect([columns, height]).toEqual([9, 3]);
    const at = (x: number, y: number) => cells.find((cell) => cell.x === x && cell.y === y)?.kind;
    expect(at(0, 0)).toBe('wall');
    expect(at(1, 1)).toBe('floor');
    expect(at(3, 1)).toBe('unlit');
    expect(at(4, 1)).toBe('furniture');
    expect(at(6, 1)).toBe('enchanted');
    expect(cells).toHaveLength(27);
  });

  it('leaves out who stands in the enchanted region and what lies unlit (D135, D52)', () => {
    const shapes = planShapes(VIEW);
    expect(shapes.figures.map((figure) => figure.id)).toEqual(['wizard', 'friend']);
    expect(shapes.things.map((thing) => thing.id)).toEqual(['near_key']);
  });

  it('draws a thing in the dark near the wizard, as the wizard sees it (D52)', () => {
    const near: PlanView = {
      ...VIEW,
      figures: [{ id: 'wizard', kind: 'wizard', tile: [4, 1], facing: 'down' }],
    };
    expect(planShapes(near).things.map((thing) => thing.id)).toEqual(['near_key', 'far_key']);
  });

  it('tells a door shut from one open, and which way its bar lies', () => {
    const [shut] = planShapes(VIEW).doors;
    expect(shut).toMatchObject({ id: 'door', open: false, across: false });
    const inWall: PlanView = {
      ...VIEW,
      rows: ['#.#', '#.#', '#.#'],
      enchanted: [],
      unlit: [],
      things: [{ id: 'door', kind: 'door', tile: [1, 1], open: true }],
    };
    expect(planShapes(inWall).doors[0]).toMatchObject({ open: true, across: true });
  });

  it('says every reach mark, the hidden ones too', () => {
    expect(planShapes(VIEW).marks).toEqual([{ x: 7, y: 1 }]);
  });

  it('leaves undrawn all that is still dark, walls and furniture too (D52)', () => {
    expect(planShapes(VIEW).unlit).toEqual([
      { x: 3, y: 1 },
      { x: 4, y: 1 },
      { x: 5, y: 1 },
    ]);
  });

  it('draws a picture in ink: its colour out, its lines darkened, its tones parchment', () => {
    // A plain grey ground, a dark line down it, and a band of colour.
    const [width, height] = [40, 20];
    const pixels = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const at = (y * width + x) * 4;
        const line = x === 20;
        pixels[at] = line ? 20 : 120;
        pixels[at + 1] = line ? 20 : 120;
        pixels[at + 2] = line ? 20 : 120;
        pixels[at + 3] = 255;
      }
    }
    inked(pixels, width, height, 16);
    const channels = (x: number) => [...pixels.slice((10 * width + x) * 4, (10 * width + x) * 4 + 4)];
    const [line, ground] = [channels(20), channels(4)];
    // The line goes toward the ink, the ground stays toward the parchment.
    expect(line[0]).toBeLessThan(120);
    expect(ground[0]).toBeGreaterThan(150);
    // Warm, whatever colour it was: red over green over blue, as the parchment is.
    expect(ground[0]).toBeGreaterThan(ground[1] ?? 0);
    expect(ground[1]).toBeGreaterThan(ground[2] ?? 0);
    expect(ground[3]).toBe(255);
  });

  it('finds the cell under the pointer, and none in the gutter', () => {
    expect(cellAt(28 + 45, 28 + 85, 40, 20, 15)).toEqual([1, 2]);
    expect(cellAt(10, 100, 40, 20, 15)).toBeNull();
    expect(cellAt(28 + 20 * 40 + 1, 100, 40, 20, 15)).toBeNull();
  });

  it('writes each name clear of the others while it can', () => {
    const size = { width: 400, height: 300 };
    const anchor = { x: 100, y: 100, width: 80, height: 14, reach: 10 };
    const [first, second, third] = labelBoxes([anchor, anchor, anchor], size);
    expect(first).toEqual({ x: 110, y: 93 });
    expect(second).toEqual({ x: 10, y: 93 });
    expect(third).toEqual({ x: 60, y: 76 });
  });

  it('keeps a name inside the plan at its edge', () => {
    const [place] = labelBoxes([{ x: 395, y: 100, width: 80, height: 14, reach: 10 }], { width: 400, height: 300 });
    expect(place?.x).toBe(305);
  });
});

describe('what the plan writes and rules (D151)', () => {
  it('a mark says its cell, and a figure its name and its cell', () => {
    expect(planLabel('', 15, 3)).toBe('(15, 3)');
    expect(planLabel('Nuri', 2, 5)).toBe('Nuri (2, 5)');
  });

  it('rules every edge of the floor cells once, and none of the walls alone', () => {
    const shapes = planShapes({
      rows: ['###', '#.#', '#.#', '###'],
      enchanted: [],
      unlit: [],
      figures: [],
      things: [],
      marks: [],
    });
    // Two cells, one above the other, share their edge: seven edges, not eight.
    expect(floorEdges(shapes)).toHaveLength(7);
    expect(floorEdges(shapes)).toContainEqual([1, 2, 2, 2]);
  });

  it("writes the dark tunnel's name away from the mark", () => {
    const shapes = planShapes({
      rows: ['#######', '#.....#', '#######'],
      enchanted: [
        [1, 1],
        [2, 1],
        [3, 1],
        [4, 1],
        [5, 1],
      ],
      unlit: [],
      figures: [],
      things: [],
      marks: [[5, 1]],
    });
    expect(tunnelLabelCell(shapes)).toEqual({ x: 1, y: 1 });
  });
});

describe('the plan draws a cut-out where it is painted (D159)', () => {
  const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
  const cell = 40;

  it("draws the crossing's statues at their painted box, on the row of the wall they stand against", () => {
    const art = read('../../../content/art/scenes/the-crossing/art.json');
    const cut = read('../../../art/scenes/the-crossing/cut.json');
    const statues = Object.entries(cut.things as Record<string, { box: number[]; row: number }>).filter(([id]) =>
      id.startsWith('statue_'),
    );
    expect(statues.map(([, thing]) => thing.row)).toEqual([5, 5, 5]);
    const row = art.rows.find((one: { row: number; static?: boolean }) => one.row === 5 && one.static);
    const [left, top] = paintedBox(0, row.top, 1, 1, art.cell, cell);
    // The row's image begins where the highest statue is painted, and the plan draws it
    // there, in cells as on the scene, not from the cell the statues stand on.
    const highest = Math.min(...statues.map(([, thing]) => thing.box[1] ?? 0));
    expect(left).toBe(0);
    expect(Math.abs(top / cell - highest)).toBeLessThan(1 / art.cell);
  });

  it("draws each door's state at the box art.json gives it", () => {
    const art = read('../../../content/art/scenes/the-two-doors/art.json');
    for (const [id, door] of Object.entries(art.things as Record<string, { left: number; top: number }>)) {
      const [left, top, wide, tall] = paintedBox(door.left, door.top, 96, 192, art.cell, cell);
      expect(left, id).toBeCloseTo((door.left / art.cell) * cell, 6);
      expect(top, id).toBeCloseTo((door.top / art.cell) * cell, 6);
      expect([wide, tall], id).toEqual([cell, 2 * cell]);
    }
  });
});
