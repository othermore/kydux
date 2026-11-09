import { describe, expect, it } from 'vitest';
import type { PlanView } from '../engine/layout';
import { labelBoxes, planShapes } from './plan';

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
};

describe('the plan of a scene (D134)', () => {
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
