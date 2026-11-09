// Where everything stands before a run, read from level.json for the scene to
// draw: the map's walls and markers, the wizard's start, the things and the
// actors. It follows kydux_world.level, which validates the same file: a thing
// or actor is placed by its marker or at [x, y], and an actor without a
// facing faces its first step, or, a friend, the wizard (D66), or down. A
// level on a scene (D65) comes with the scene's map built in by pack-world.
// The world's events say the rest.

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
  /** For a slab, the ticks it is in place and then away (D53, D138). */
  period?: number;
  /** For a door, open from the start: an earlier level of the scene opened it (D65). */
  open: boolean;
  /** The painted thing it is drawn from, when the level names one other than its id
   * (D85): every level's key is `key`, each drawn from the key painted for it. */
  art?: string;
  /** In the wizard's hands from the start, and drawn only once it leaves them,
   * given (D123); its tile is the wizard's start. */
  carried?: boolean;
  /** For a door, the cells its open leaf lies on, which no one walks onto while it
   * is open (D125). */
  covers?: Tile[];
}

/** The kinds a level's wizard carries from the start (D49): each entry of
 * `carrying` is a kind, or the kind with the painted thing it is drawn from
 * (`{"kind": "book", "art": "old_book"}`, D123). */
export function carriedKinds(level: LevelJson): string[] {
  return Array.isArray(level.carrying) ? level.carrying.map((entry) => String(isRecord(entry) ? entry.kind : entry)) : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function lockOf(spec: Record<string, unknown>): DoorLock {
  if (spec.kind !== 'door') return 'none';
  if (spec.locked === true) return 'key';
  if (typeof spec.sealed === 'string') return 'spell';
  if (typeof spec.password === 'string') return 'word';
  return 'none';
}

/** A door's `covers`, the cells its open leaf lies on (D125). */
function coversOf(spec: Record<string, unknown>): Tile[] {
  const covers = isRecord(spec.covers) ? spec.covers.open : null;
  return Array.isArray(covers) ? covers.map(asTile).filter((tile): tile is Tile => tile !== null) : [];
}

export interface ActorLayout {
  id: string;
  kind: string;
  tile: Tile;
  facing: Facing;
  sight: number;
  /** Out of sight until a story makes it appear (D74). */
  hidden: boolean;
  /** The bed it lies asleep in from the start (D91); it gets up on its tile. */
  asleep?: string;
}

/** What the plan of the scene is drawn from at a tick (D134). */
export interface PlanView {
  /** The world's map: `#` a wall, `=` furniture, anything else floor. */
  rows: readonly string[];
  /** The enchanted cells (D135), and the cells still dark (D52). */
  enchanted: readonly Tile[];
  unlit: readonly Tile[];
  /** The wizard and every actor in sight, with where each stands and looks. */
  figures: { id: string; kind: string; tile: Tile; facing: string }[];
  /** The things on the map, not those carried. */
  things: { id: string; kind: string; tile: Tile; open?: boolean }[];
  /** Every reach goal's cell, a hidden one's too (D143). */
  marks: readonly Tile[];
  /** The pictures it is drawn from, on a painted scene (D143). */
  pictures?: PlanPictures;
}

/** The scene's pictures as the plan draws them (D143): its ground, each door in the
 * state it is in, its corner in the ground's pixels, and each figure's sheet. */
export interface PlanPictures {
  ground: string;
  /** The ground's pixels a cell, and where the scene's first cell lies in it. */
  cell: number;
  origin: Tile;
  doors: { url: string; left: number; top: number; depth: number }[];
  /** What the scene draws among the figures, each with its depth (D151). */
  rows: { url: string; top: number; depth: number }[];
  /** The cells a figure and a mark are drawn lower or sideways on (D149). */
  lowered?: { cells: [Tile, Tile]; by: number }[];
  nudged?: { cells: [Tile, Tile]; by: number }[];
  /** Each other thing with a picture, its corner in the ground's pixels on its tile; a
   * key drawn smaller (`scale`), the point in cells its middle lies on (D164). */
  things: { id: string; url: string; left: number; top: number; scale?: number; centre?: [number, number] }[];
  figures: {
    id: string;
    url: string;
    /** The frame's size, the pixels a cell the sheet is drawn at, how far above the
     * frame's bottom the feet are, the standing frame's column, and each way's row. */
    frame: Tile;
    cell: number;
    foot: number;
    column: number;
    rows: Record<string, number>;
  }[];
}

export type { Tile };

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
  /** Whether the room is dark until lit (D52), and the tiles it covers: the dark
   * rooms of the scene, or none for the whole map (D73). */
  dark: boolean;
  darkArea: Tile[];
  /** The cells that hide every figure in them (D135). */
  enchanted: Tile[];
  /** Each tile's kind of terrain (D73): the scene's, or wall, floor and shelf. */
  terrain: string[][];
  /** Each tile's letter in the scene's map.txt (D73), or in the level's own map. */
  letters: string[];
  /** For a level played in several ways (D51), where each way puts the things and
   * actors it moves, by the way's id then the thing's: what a restart for that way
   * places (D85). */
  ways: Record<string, Record<string, Tile>>;
  /** And which way each way turns the actors it names (D51). */
  wayFacings: Record<string, Record<string, Facing>>;
  /** What the scene shows and the world does not hold, like a flat stone. */
  props: { kind: string; tile: Tile }[];
  /** Every reach goal's cell, a hidden one's too (D143). */
  reaches: Tile[];
  /** The cell a sleep goal marks to sleep from (D130), or none. */
  sleepAt?: Tile;
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

/** Each tile's kind of terrain: from the scene's letters and their kinds when the
 * level is on a scene (D73), else from the map's wall, floor and shelf. */
function terrainOf(level: LevelJson, rows: string[]): string[][] {
  const letters = Array.isArray(level.terrain) ? (level.terrain as string[]) : null;
  const kinds = (level.terrains as Record<string, string> | undefined) ?? {};
  return rows.map((row, y) =>
    [...row].map((char, x) => {
      const letter = letters?.[y]?.[x];
      if (letter && kinds[letter]) return kinds[letter];
      return char === '#' ? 'wall' : char === '=' ? 'shelf' : 'floor';
    }),
  );
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
      const open = spec.kind === 'door' && spec.open === true;
      const art = typeof spec.art === 'string' ? { art: spec.art } : {};
      const covered = coversOf(spec);
      const covers = covered.length > 0 ? { covers: covered } : {};
      things.push({ id: String(spec.id), kind: String(spec.kind), tile, lock: lockOf(spec), open, ...period, ...art, ...covers });
    }
  }
  const actors: ActorLayout[] = [];
  for (const spec of asList(level.actors)) {
    const tile = place(spec);
    if (typeof spec.marker === 'string') used.add(spec.marker);
    if (!tile) continue;
    const first = asTile(asList(spec.patrol)[0] ?? null);
    const looking = spec.kind === 'friend' && (tile[0] !== start[0] || tile[1] !== start[1]);
    const facing =
      (spec.facing as Facing | undefined) ??
      (first ? towards(tile, first) : looking ? towards(tile, start) : 'down');
    // Only a teacher looks out for the wizard; a ghost or a cat sees nothing to catch.
    const sight = spec.kind !== 'teacher' ? 0 : typeof spec.sight === 'number' ? spec.sight : DEFAULT_SIGHT;
    const asleep = typeof spec.asleep === 'string' ? { asleep: spec.asleep } : {};
    actors.push({ id: String(spec.id), kind: String(spec.kind), tile, facing, sight, hidden: spec.hidden === true, ...asleep });
  }
  // A reach goal may be hidden: the cell is said in words, and no mark drawn (D134).
  for (const goal of asList(level.goals)) {
    if (goal.kind === 'reach' && goal.hidden === true && typeof goal.marker === 'string') used.add(goal.marker);
  }
  const markers = [...letters].filter(([letter]) => !used.has(letter));
  const reaches = asList(level.goals)
    .filter((goal) => goal.kind === 'reach')
    .flatMap((goal) => {
      const tile = place(goal);
      return tile ? [tile] : [];
    })
    // Two goals on one mark, a level's and its bonus, are one mark.
    .filter(([x, y], index, all) => all.findIndex(([ox, oy]) => ox === x && oy === y) === index);
  const shelves: Tile[] = [];
  rows.forEach((row, y) => {
    [...row].forEach((char, x) => {
      if (char === '=') shelves.push([x, y]);
    });
  });
  const carrying = carriedKinds(level);
  // A thing carried with a picture is drawn from it when it is given (D123).
  for (const entry of Array.isArray(level.carrying) ? level.carrying : []) {
    if (isRecord(entry) && typeof entry.art === 'string') {
      const kind = String(entry.kind);
      things.push({ id: kind, kind, tile: start, lock: 'none', open: false, art: entry.art, carried: true });
    }
  }
  const ways: Record<string, Record<string, Tile>> = {};
  const wayFacings: Record<string, Record<string, Facing>> = {};
  for (const way of asList(level.ways)) {
    const moved: Record<string, Tile> = {};
    const turned: Record<string, Facing> = {};
    for (const spec of [...asList(way.things), ...asList(way.actors)]) {
      const tile = place(spec);
      if (tile) moved[String(spec.id)] = tile;
      if (typeof spec.facing === 'string') turned[String(spec.id)] = spec.facing as Facing;
    }
    ways[String(way.id)] = moved;
    wayFacings[String(way.id)] = turned;
  }
  return {
    rows,
    width: Math.max(1, rows[0]?.length ?? 1),
    height: Math.max(1, rows.length),
    start,
    markers,
    reaches,
    things,
    actors,
    shelves,
    carrying,
    ways,
    wayFacings,
    dark: level.dark === true,
    darkArea: boxedCells(level.dark_area),
    enchanted: boxedCells(level.enchanted),
    terrain: terrainOf(level, rows),
    letters: Array.isArray(level.terrain) ? (level.terrain as string[]) : rows,
    props: asList(level.props).flatMap((prop) => {
      const tile = asTile(prop.at);
      return tile ? [{ kind: String(prop.kind), tile }] : [];
    }),
    ...sleepAtOf(level),
  };
}

/** The cells of a list of boxes, each x0, y0, x1, y1. */
function boxedCells(boxes: unknown): Tile[] {
  return asList(boxes).flatMap((box) => {
    const [x0, y0, x1, y1] = (box as unknown as number[]).map(Number);
    const tiles: Tile[] = [];
    for (let y = y0 ?? 0; y <= (y1 ?? -1); y += 1) for (let x = x0 ?? 0; x <= (x1 ?? -1); x += 1) tiles.push([x, y]);
    return tiles;
  });
}

/** The cell a level's sleep goal marks to sleep from (D130), when it names one. */
function sleepAtOf(level: LevelJson): { sleepAt?: Tile } {
  for (const goal of asList(level.goals)) {
    const tile = goal.kind === 'sleep' ? asTile(goal.at) : null;
    if (tile) return { sleepAt: tile };
  }
  return {};
}
