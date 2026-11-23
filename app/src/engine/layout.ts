// Where everything stands before a run, read from level.json for the scene to
// draw: the map's walls and markers, the wizard's start, the things and the
// actors. It follows kydux_world.level, which validates the same file: a thing
// or actor is placed by its marker or at [x, y], and an actor without a
// facing faces its first step, or, a friend, the wizard (D66), or down. A
// level on a scene (D65) comes with the scene's map built in by pack-world.
// The world's events say the rest.

import { familiarTable, filledIn, firstSheet, mateColour, sheetOf } from '../content/familiar';
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
  /** For a hole, the ticks it is closed and then open (D53, D167). */
  period?: number;
  /** For a hole, the cells it opens on, one or two side by side, its tile the first
   * (D167). */
  cells?: Tile[];
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
  /** Lying where it is not seen, a broom in the straw: drawn from a sprite only once
   * found (D184), or a painted key under a bookcase, seen once revealed (D85). */
  hidden?: boolean;
  /** A broom hanging on a peg of the rack (D195), drawn from its kind's hung sprite. */
  hung?: boolean;
  /** For a ring, the way it is flown through and its pair's colour, which it is drawn
   * in (D219). */
  way?: 'up' | 'down';
  colour?: string;
}

/** A race against a racer, by Ilda's count (D189): the racer's id, the lines Ilda
 * reads of its program, the cells it flies after its lift, and the finish. */
export interface RaceLayout {
  against: string;
  lines: number;
  path: Tile[];
  finish: Tile;
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
  /** For a familiar, the child's or someone else's (D273): how it is drawn. */
  creature?: CreatureLook;
  /** Seated on the floor, drawn in its sitting rows (D273). */
  sitting?: boolean;
  /** The room-mate's tries, shown coming and going on its cell (D300). */
  tries?: boolean;
  /** The loop of cells its owner orders a familiar round while no program runs (D300). */
  drill?: Tile[];
}

/** How a familiar is drawn (D263, D273): its kind and colour, the sheet it is drawn from,
 * and whether it lives, or is a trial with its colour (`good`) or with none (`pale`), or a
 * spark. */
export interface CreatureLook {
  kind: string;
  color: string | null;
  look: 'good' | 'pale' | 'living' | 'spark';
  sheet: string | null;
}

/** What the plan of the scene is drawn from at a tick (D134). */
export interface PlanView {
  /** The world's map: `#` a wall, `=` furniture, anything else floor. */
  rows: readonly string[];
  /** The enchanted cells (D135). */
  enchanted: readonly Tile[];
  /** The level's zones (D196), each hatched lightly and named. */
  zones?: readonly { name: string; cells: Tile[] }[];
  /** The wizard and every actor in sight, with where each stands and looks. */
  figures: { id: string; kind: string; tile: Tile; facing: string }[];
  /** The things on the map, not those carried; a thing drawn from a sprite with how far
   * sideways the scene draws it on its cell (D207). */
  things: { id: string; kind: string; tile: Tile; open?: boolean; shift?: number }[];
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
  /** The way the wizard faces at the start, the level's `facing` or down (D286). */
  facing: Facing;
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
  /** The level's zones, each its name and cells: a thing of a zone is found only from
   * within it (D196). */
  zones: { name: string; cells: Tile[] }[];
  /** The box of cells, x0, y0, x1, y1, a level's start shows whole (D201), or null. */
  camera: [number, number, number, number] | null;
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
  /** The things each way takes away, by the way's id: six brooms in one, nine in
   * another (D184); the first way's are gone before any run. */
  wayGone: Record<string, string[]>;
  /** Whether a way hides or shows a thing the level's own things do not, by the way's id
   * then the thing's: a broom moved onto the straw or off it (D202). */
  wayHidden: Record<string, Record<string, boolean>>;
  firstWay: string | null;
  /** What the scene shows and the world does not hold, like a flat stone. */
  props: { kind: string; tile: Tile }[];
  /** Every reach goal's cell, a hidden one's too (D143). */
  reaches: Tile[];
  /** The cell a sleep goal marks to sleep from (D130), or none. */
  sleepAt?: Tile;
  /** The cells a flight crosses and a walk does not (D186), `~` on the map. */
  low: Tile[];
  /** The race the level is (D189), or none. */
  race?: RaceLayout;
  /** The rings the level asks flown through, in their order (D187). */
  rings: string[];
  /** In a living level, the game's familiar, where it stands at the start (D269). */
  living?: { tile: Tile; facing: Facing; creature: CreatureLook };
  /** Where someone painted into the scene speaks from, by id (D264). */
  voices: Record<string, Tile>;
  /** The cells only a familiar enters (D270), `,` on the map. */
  small: Tile[];
  /** The familiar's circle, its first and last cells (D262), which words keep off (D284). */
  circle?: [Tile, Tile];
}

/** The familiar the child describes, or lives with: the game's, written into the level's
 * block (D265), or the level's own, or the default. */
function childsFamiliar(level: LevelJson): { kind: string; color: string } | null {
  const block = isRecord(level.familiar) ? level.familiar : null;
  const table = familiarTable();
  const living = isRecord(block?.living) ? block.living : null;
  const draft = isRecord(block?.draft) ? block.draft : null;
  const described = (living ?? draft) as { kind?: unknown; name?: unknown; color?: unknown } | null;
  if (!table) {
    return typeof described?.kind === 'string' && typeof described.color === 'string'
      ? { kind: described.kind, color: described.color }
      : null;
  }
  const filled = filledIn(
    typeof described?.kind === 'string'
      ? {
          kind: described.kind,
          ...(typeof described.color === 'string' ? { color: described.color } : {}),
        }
      : undefined,
    table,
  );
  return { kind: filled.kind, color: filled.color };
}

/** How an actor of the kind `familiar` is drawn (D273): its kind, or the first of a list
 * that is not the child's; its colour, or the one for that kind; the room-mate's copy of
 * the child's, of its kind in the room-mate's colour; the child's own where it names
 * neither. */
function creatureOf(spec: Record<string, unknown>, level: LevelJson): CreatureLook {
  const child = childsFamiliar(level);
  const table = familiarTable();
  if (spec.spark === true || spec.tries === true) return { kind: '', color: null, look: 'spark', sheet: null };
  let kind: string;
  let color: string | null;
  if (spec.of === 'mate') {
    kind = child?.kind ?? 'Fox';
    color = table ? mateColour(kind, child?.color, table) : null;
  } else if (spec.creature === undefined) {
    kind = child?.kind ?? 'Fox';
    color = child?.color ?? null;
  } else {
    const kinds = Array.isArray(spec.creature) ? spec.creature.map(String) : [String(spec.creature)];
    const index = Math.max(0, kinds.findIndex((one) => one !== child?.kind));
    kind = kinds[index] ?? kinds[0] ?? 'Fox';
    const colours = Array.isArray(spec.color) ? spec.color : [spec.color];
    const found = colours[Array.isArray(spec.color) ? index : 0];
    color = typeof found === 'string' ? found : null;
  }
  const trial = spec.trial === true;
  const look = trial ? (color === null ? 'pale' : 'good') : 'living';
  const sheet = color === null ? firstSheet(kind, table) : sheetOf(kind, color);
  return { kind, color, look, sheet };
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
      return char === '#' ? 'wall' : char === '=' ? 'shelf' : char === '~' ? 'low' : 'floor';
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
      const celled = spec.kind === 'hole' && Array.isArray(spec.cells) ? spec.cells.map(asTile) : [];
      const cells = celled.length > 0 ? { cells: celled.filter((cell): cell is Tile => cell !== null) } : {};
      const open = spec.kind === 'door' && spec.open === true;
      const art = typeof spec.art === 'string' ? { art: spec.art } : {};
      const covered = coversOf(spec);
      const covers = covered.length > 0 ? { covers: covered } : {};
      const hidden = spec.hidden === true ? { hidden: true } : {};
      const hung = spec.hung === true ? { hung: true } : {};
      const way: { way?: 'up' | 'down' } = spec.way === 'up' || spec.way === 'down' ? { way: spec.way } : {};
      const colour = typeof spec.colour === 'string' ? { colour: spec.colour } : {};
      things.push({
        id: String(spec.id),
        kind: String(spec.kind),
        tile,
        lock: lockOf(spec),
        open,
        ...period,
        ...cells,
        ...art,
        ...covers,
        ...hidden,
        ...hung,
        ...way,
        ...colour,
      });
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
    const creature = spec.kind === 'familiar' ? { creature: creatureOf(spec, level) } : {};
    const sitting = spec.sitting === true ? { sitting: true } : {};
    // The hall at work (D300): the mate's tries, the friend's loop of orders.
    const tries = spec.kind === 'familiar' && spec.tries === true ? { tries: true } : {};
    const loop = asList(spec.drill)
      .map((cell) => asTile(cell))
      .filter((cell): cell is Tile => cell !== null);
    const drill = spec.kind === 'familiar' && loop.length > 0 ? { drill: loop } : {};
    actors.push({
      id: String(spec.id),
      kind: String(spec.kind),
      tile,
      facing,
      sight,
      hidden: spec.hidden === true,
      ...asleep,
      ...creature,
      ...sitting,
      ...tries,
      ...drill,
    });
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
  const low: Tile[] = [];
  const small: Tile[] = [];
  rows.forEach((row, y) => {
    [...row].forEach((char, x) => {
      if (char === '=') shelves.push([x, y]);
      if (char === '~') low.push([x, y]);
      if (char === ',') small.push([x, y]);
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
  const wayGone: Record<string, string[]> = {};
  const wayHidden: Record<string, Record<string, boolean>> = {};
  for (const way of asList(level.ways)) {
    const moved: Record<string, Tile> = {};
    const turned: Record<string, Facing> = {};
    wayGone[String(way.id)] = asList(way.things)
      .filter((spec) => spec.gone === true)
      .map((spec) => String(spec.id));
    wayHidden[String(way.id)] = Object.fromEntries(
      asList(way.things)
        .filter((spec) => typeof spec.hidden === 'boolean')
        .map((spec) => [String(spec.id), spec.hidden === true]),
    );
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
    facing: facingOf(level.facing),
    markers,
    reaches,
    things,
    actors,
    shelves,
    carrying,
    ways,
    wayFacings,
    wayGone,
    wayHidden,
    firstWay: asList(level.ways)[0] ? String(asList(level.ways)[0]?.id) : null,
    dark: level.dark === true,
    darkArea: boxedCells(level.dark_area),
    enchanted: boxedCells(level.enchanted),
    zones: Object.entries((level.zones ?? {}) as Record<string, unknown>).map(([name, boxes]) => ({
      name,
      cells: boxedCells(boxes),
    })),
    camera: levelCamera(level.camera),
    terrain: terrainOf(level, rows),
    letters: Array.isArray(level.terrain) ? (level.terrain as string[]) : rows,
    props: asList(level.props).flatMap((prop) => {
      const tile = asTile(prop.at);
      return tile ? [{ kind: String(prop.kind), tile }] : [];
    }),
    ...sleepAtOf(level),
    low,
    ...raceOf(level),
    rings: asList(level.goals)
      .filter((goal) => goal.kind === 'through_in_order')
      .flatMap((goal) => (Array.isArray(goal.ids) ? goal.ids.map(String) : [])),
    ...livingOf(level),
    ...circleOf(level),
    voices: Object.fromEntries(
      Object.entries(isRecord(level.voices) ? level.voices : {}).flatMap(([who, cell]) => {
        const tile = asTile(cell);
        return tile ? [[who, tile]] : [];
      }),
    ),
    small,
  };
}

/** A level's familiar circle, from its block (D262, D284). */
function circleOf(level: LevelJson): Pick<Layout, 'circle'> {
  const block = isRecord(level.familiar) ? level.familiar : null;
  const box = block?.circle;
  if (!Array.isArray(box) || box.length !== 4) return {};
  const [x0, y0, x1, y1] = box.map(Number) as [number, number, number, number];
  return { circle: [[x0, y0], [x1, y1]] };
}

/** A level's way for its wizard at the start (D286): one of the four, down where it says
 * none; the world refuses any other. */
function facingOf(value: unknown): Facing {
  return value === 'up' || value === 'left' || value === 'right' ? value : 'down';
}

/** In a living level, the game's familiar where it stands at the start (D269). */
function livingOf(level: LevelJson): Pick<Layout, 'living'> {
  const block = isRecord(level.familiar) ? level.familiar : null;
  const living = isRecord(block?.living) ? block.living : null;
  const tile = asTile(living?.at);
  if (block?.stage !== 'living' || !living || !tile) return {};
  const facing = (typeof living.facing === 'string' ? living.facing : 'down') as Facing;
  return { living: { tile, facing, creature: creatureOf({ kind: 'familiar' }, level) } };
}

/** A level's race (D189, D220), its path's turning points walked out into the cells
 * flown, as kydux_world reads it. */
function raceOf(level: LevelJson): { race?: RaceLayout } {
  const race = isRecord(level.race) ? level.race : null;
  const finish = race ? asTile(race.finish) : null;
  if (!race || !finish) return {};
  const racer = asList(level.actors).find((actor) => actor.id === race.against);
  let here = racer ? asTile(racer.at) : null;
  if (!here) return {};
  const path: Tile[] = [];
  for (const point of asList(race.path)) {
    const there = asTile(point);
    if (!there) continue;
    while (there[0] !== here[0] || there[1] !== here[1]) {
      here = [here[0] + Math.sign(there[0] - here[0]), here[1] + Math.sign(there[1] - here[1])];
      path.push(here);
    }
  }
  return { race: { against: String(race.against), lines: Number(race.lines), path, finish } };
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

/** A level's camera (D201), `{"fit": [[x0, y0], [x1, y1]]}`, as its box; anything else,
 * a story's point among them, is none. */
function levelCamera(value: unknown): [number, number, number, number] | null {
  if (typeof value !== 'object' || value === null || !('fit' in value)) return null;
  const [from, to] = Array.isArray(value.fit) ? value.fit.map(asTile) : [];
  return from && to ? [from[0], from[1], to[0], to[1]] : null;
}

/** The cell a level's sleep goal marks to sleep from (D130), when it names one. */
function sleepAtOf(level: LevelJson): { sleepAt?: Tile } {
  for (const goal of asList(level.goals)) {
    const tile = goal.kind === 'sleep' ? asTile(goal.at) : null;
    if (tile) return { sleepAt: tile };
  }
  return {};
}
