// Where everything stands before a run, read from level.json for the scene to
// draw: the map's walls and markers, the wizard's start, the things and the
// actors. It follows kydux_world.level, which validates the same file: a thing
// or actor is placed by its marker or at [x, y], and an actor without a
// facing faces its first step, or down. The world's events say the rest.

import type { LevelJson } from '../runtime/protocol';
import type { Facing, Tile } from './sight';

/** How a closed door opens (D43): by hand, by its key, by a spell, by a word. */
export type DoorLock = 'none' | 'key' | 'spell' | 'word';

export interface ThingLayout {
  id: string;
  kind: string;
  tile: Tile;
  /** For a door, how it opens; `none` for anything else. */
  lock: DoorLock;
  /** For a stair, the ticks it is in place and then away (D53). */
  period?: number;
}

function lockOf(spec: Record<string, unknown>): DoorLock {
  if (spec.kind !== 'door') return 'none';
  if (spec.locked === true) return 'key';
  if (typeof spec.sealed === 'string') return 'spell';
  if (typeof spec.password === 'string') return 'word';
  return 'none';
}

export interface ActorLayout {
  id: string;
  kind: string;
  tile: Tile;
  facing: Facing;
  sight: number;
}

export interface Layout {
  rows: string[];
  width: number;
  height: number;
  start: Tile;
  /** Marker letters on the map that no thing or actor stands on, like a goal's. */
  markers: [string, Tile][];
  things: ThingLayout[];
  actors: ActorLayout[];
  /** The shelves' tiles, `=`: no one walks on them, sight passes (D46). */
  shelves: Tile[];
  /** The ids of the things the wizard carries from the start, each its kind (D49). */
  carrying: string[];
  /** Whether the room is dark until lit (D52). */
  dark: boolean;
}

const DEFAULT_SIGHT = 4;

/** The way to face to look from one tile towards another. */
export function towards([x, y]: Tile, [tx, ty]: Tile): Facing {
  if (tx > x) return 'right';
  if (tx < x) return 'left';
  return ty > y ? 'down' : 'up';
}

function asTile(value: unknown): Tile | null {
  return Array.isArray(value) && value.length === 2 ? [Number(value[0]), Number(value[1])] : null;
}

function asList(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

export function layout(level: LevelJson): Layout {
  const rows = (level.map as string[] | undefined) ?? [];
  let start: Tile = [0, 0];
  const letters = new Map<string, Tile>();
  rows.forEach((row, y) => {
    [...row].forEach((char, x) => {
      if (char === 'S') start = [x, y];
      else if (/^\p{L}$/u.test(char)) letters.set(char, [x, y]);
    });
  });
  const place = (spec: Record<string, unknown>): Tile | null =>
    typeof spec.marker === 'string' ? (letters.get(spec.marker) ?? null) : asTile(spec.at);

  const used = new Set<string>();
  const things: ThingLayout[] = [];
  for (const spec of asList(level.things)) {
    const tile = place(spec);
    if (typeof spec.marker === 'string') used.add(spec.marker);
    if (tile) {
      const period = typeof spec.period === 'number' ? { period: spec.period } : {};
      things.push({ id: String(spec.id), kind: String(spec.kind), tile, lock: lockOf(spec), ...period });
    }
  }
  const actors: ActorLayout[] = [];
  for (const spec of asList(level.actors)) {
    const tile = place(spec);
    if (typeof spec.marker === 'string') used.add(spec.marker);
    if (!tile) continue;
    const first = asTile(asList(spec.patrol)[0] ?? null);
    const facing = (spec.facing as Facing | undefined) ?? (first ? towards(tile, first) : 'down');
    // Only a teacher looks out for the wizard; a ghost or a cat sees nothing to catch.
    const sight = spec.kind !== 'teacher' ? 0 : typeof spec.sight === 'number' ? spec.sight : DEFAULT_SIGHT;
    actors.push({ id: String(spec.id), kind: String(spec.kind), tile, facing, sight });
  }
  const markers = [...letters].filter(([letter]) => !used.has(letter));
  const shelves: Tile[] = [];
  rows.forEach((row, y) => {
    [...row].forEach((char, x) => {
      if (char === '=') shelves.push([x, y]);
    });
  });
  const carrying = Array.isArray(level.carrying) ? level.carrying.map(String) : [];
  return {
    rows,
    width: Math.max(1, rows[0]?.length ?? 1),
    height: Math.max(1, rows.length),
    start,
    markers,
    things,
    actors,
    shelves,
    carrying,
    dark: level.dark === true,
  };
}
