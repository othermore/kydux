// The level's scene in Phaser: the map, the things and actors on it, the
// wizard, and the playback of a run's events, tick by tick. It speaks to the
// rest of the page only through its handle and its parent's data-* attributes:
// data-tick, data-state, data-wizard ("x,y"), data-actors ("id:x,y,facing"
// joined by ";"), data-doors (the open doors' ids, joined by ","),
// data-carried (the ids of what the wizard carries, joined by ","), data-shoved
// (who an opening door's leaf moved aside, joined by ",", D125), data-drawn
// (each painted thing seen and the middle of its picture, "id:x,y" in cells,
// joined by ";", D109),
// data-thought (why an action could not be done, while the wizard thinks it),
// data-shaking (present while something shakes at a failed try, or a story's figure
// stamps, D324), data-bubble
// and data-speaker (the words said in a bubble and who says them), data-look
// (the id of the look the wizard is drawn with, D36), data-wizard-figure and
// data-friend-figure (the sheets they are drawn from, D77), data-casting (present
// while the wizard's casting frames play), data-acting (`pickup` or `win` while
// the wizard's act plays, 14.3), data-opening (the door shown half open
// as it opens), data-dark (whether the
// room is still dark, D52), data-holes ("id:closed" or "id:open" joined by ";",
// each hole as a step taken now would find it, D53, D167), data-held (the holes
// osto holds closed now), data-enchanted (the figures an enchanted region hides, joined
// by ",", D135), data-zoom (the
// camera's zoom, D69), data-following (whether the camera follows the wizard),
// data-marks-covered (the marks a cut-out is drawn over now, whose ring shows over
// it, "x,y" joined by ";", D160, D168; a mark in an open doorway lies over its door's
// open picture, D172),
// data-revealed (the things whose outline shows where they lie, D85),
// data-sleeping (the bed the wizard sleeps in, D84), data-ground (`morning` while
// a scene painted at night shows its morning ground, `painting` otherwise, D126), data-asleep (each figure
// asleep with its bed, "id:bed" joined by ",", and "lying" when it is drawn lying
// under the bed's quilt, "id:bed:lying", D91),
// data-silhouette (present on a painted scene, where the wizard's outline shows
// when something hides more than a quarter of it, silhouette.ts), data-outlined
// (present while it shows), data-shade (each figure in a dark passage and how dark
// its feet are drawn, "id:shade" joined by ",", shade.ts) and data-debug with
// data-debug-layers and data-debug-leaves (the tester's view, its layers and the
// cells under an open door's leaf, debug.ts), data-sprite-things (each thing drawn
// from its kind's sprite, "id:kind:x,y" joined by ";", D182), data-found (the
// hidden things found and seen, joined by ",", D184), data-trials-fading (the trials seen that
// do not hold, which fade, joined by ",", D276), data-seated (the figures drawn
// seated, joined by ",", D279), data-hour (`sunset` while a story shows the scene
// painted at that hour, D273, D280), data-untied (the brooms
// untied, D183), data-thought-box (the thought's cloud on the page,
// "left,top,right,bottom", D245), data-wizard-facing (the way the wizard faces, as the
// scene keeps it, D241), data-wizard-frame (the name of the frame the wizard is drawn
// in), data-flying
// (the figures in the air, joined by ",", from their fly to their land, D185), data-rise
// (the wizard's rise, 0 on its cell to 1 at its flight's height, while it flies, D244),
// data-hover (the hover's clock, in whole milliseconds, which always runs but under
// reduced motion, D235, D242), data-wind (`on` while a gust of the wizard's sounds,
// from its start to its fall's end, muted or not, D243), data-wind-gusts (the gusts this
// run, one for each flown command, counted with the ticks shown), data-landing (`near`
// while the wind rises to the wizard's landing, `down` while it is switched off, muted or
// not, D255), data-through (the
// rings flown through, in order, joined by ","), data-race-band (what Ilda's band says while she
// reads the programs, D189), data-race-verdict (her verdict of the race, D234),
// data-flyers-at (where each flying figure is as each frame is drawn: its feet in the
// scene's pixels and on the canvas, the camera counted, "id:x,y,x,y" joined by ";",
// D259), data-world (what the camera shows, in cells: "left,top,width,height") and, in a
// story, data-figures (each figure drawn, its box in cells and its alpha,
// "id:left,top,right,bottom:alpha" joined by ";", D319, D322).
//
// The camera is a window on the scene (D69, camera.ts): it follows the wizard,
// the player zooms it and drags it to look around, and a run or a restart brings
// it back to the wizard, or to the place a level frames (D201). The words said are
// in bubbles and the wizard's thoughts in clouds (speech.ts).
//
// A painted scene (D76) is drawn by painted.ts: its ground and rows, its things'
// states, the figures' sheets, the grid, the goal's mark and the sealed doors'
// glow (D79); a scene without art, by placeholders.ts.
//
// A story is played on the scene the same way (D74): its steps come as events,
// an actor comes in by a way in (D322), walks, turns, says its words in a bubble and
// leaves by a way out (D319), a ghost or a familiar fading in and out; the camera keeps
// whoever each step is about, with their words, in view, or travels between two
// framings of a part, a bubble waiting for it to arrive (D321); a bubble stays until
// the next step.

import Phaser from 'phaser';
import type { LevelJson, WorldEvent, WorldResult } from '../runtime/protocol';
import { type CreatureLook, type Layout, layout, type PlanView, towards } from './layout';
import { familiarTable, firstSheet, sheetOf } from '../content/familiar';
import { HallShow } from './hallshow';
import { type Pixels, TREMBLE_MS, TREMBLE_PX, trialLeft, trialSheet, trialShown, trialTime } from './trial';
import { DEFAULT_LOOK, type Look } from './looks';
import {
  actorKey,
  FLOOR,
  friendKey,
  type Facing,
  FACINGS,
  makePlaceholders,
  markerKey,
  propKey,
  TERRAIN_KINDS,
  SHELF,
  thingKey,
  TILE,
  TILES_KEY,
  WALL,
  WIZARD_KEY,
} from './placeholders';
import {
  type Art,
  artScale,
  breakSeal,
  crossfade,
  drawnMiddle,
  fadeBetween,
  middleOffset,
  drawFigure,
  drawGlow,
  drawGrid,
  drawMark,
  MARK_RADIUS,
  drawSleepMark,
  figureName,
  floorKey,
  flyRowOf,
  hourKey,
  loadArt,
  paintGrounds,
  paintScene,
  paintThing,
  planPictures,
  placeThing,
  type Played,
  playFrames,
  marginOf,
  viewMarginOf,
  preloadArt,
  SHEET_ROW,
  sleepFrame,
  thingDepthOn,
} from './painted';
import { contentUrl } from '../content/address';
import { characterName, forWizard, t } from '../i18n';
import { AFTER_BUMP_MS, readingMs, readingTicks } from './bubble';
import { SceneCamera, VIEW_TILES } from './camera';
import type { StoryFraming } from './zooming';
import { DebugView, type PaintedImage } from './debug';
import { debugging } from './debugging';
import {
  FLOOR_DEPTH,
  FOOT_IN_CELL,
  figureDepth,
  lightDepth,
  loweredBy,
  MARK_DEPTH,
  markDepthIn,
  nudgedBy,
  overDepth,
  shiftedBy,
  sleeperDepth,
  thingDepth,
} from './depth';
import { type LightName, type LightState, NIGHT_MS, SceneLight, WHOLE_MORNING } from './light';
import { Speech } from './speech';
import { Sway } from './sway';
import { shadeAt, tintOf } from './shade';
import { heldOutline, MarkSilhouette, Silhouette } from './silhouette';
import { FAMILIAR_PACE, HELD, LONG, Playback, TOLD_MOST, toldHold } from './playback';
import { HOP_RISE, HOP_TICKS, hopAt, hopTop } from './hop';
import { lightTimes, LIGHT_RING, pullTimes } from './spell';
import { clearOf, sightTiles, type Tile } from './sight';
import { type Hold, holeClosed, holeHeld } from './hole';
import { type EffectName, play, STEP_LOWER, type StepName } from './sfx';
import {
  blockedText,
  bookText,
  bumpText,
  friendText,
  raceVerdict,
  ringWayText,
  sleepingText,
  toldPieces,
  toldText,
  toldWhole,
} from './words';
import {
  FLOWN,
  FLY_LIFT,
  flyFrame,
  type Glide,
  glideAt,
  glideBegins,
  glideMost,
  glideOver,
  glideTo,
  hoverOf,
  hoverPhase,
  LIFT_MS,
  RING_PAST,
  RING_RAISE,
  riseOf,
  throughRing,
} from './flight';
import { drawnFromSprite, spriteFoot, spriteKey, spriteName, spriteOrigin, spriteScale, type ThingSprite } from './things';
import { LAND_NEAR, Wind } from './sound';

/** How long one tick lasts at speed 1. */
export const TICK_MS = 400;

/** A figure in the air: its shadow, the way it last flew up or down and how far its feet
 * are past a ring's plane and raised in a ring's cell (D232); how far it has risen, 0 on
 * its cell to 1 at its height, and the rise under way: from where, to where (1 lifting,
 * 0 setting down), since when on the scene's clock and for how long (D244). */
interface Flyer {
  shadow: Phaser.GameObjects.Ellipse;
  way: 'up' | 'down';
  past: number;
  raise: number;
  rise: number;
  from: number;
  to: 0 | 1;
  since: number;
  length: number;
}

/** How fast a gust fades, in seconds (D243): when the program stops playing, at a bump
 * in the air, and at a restart. */
const WIND_STOP = 0.15;
const WIND_BUMP = 0.05;
const WIND_CUT = 0.02;
/** How far, in milliseconds, a tick may begin off the time its glide has for its step
 * and the glide keep its time (D259): past it, the ticks' clock started again, and the
 * glide's goes with it. */
const GLIDE_SLACK = 4;
/** Who judges a race and speaks in its band (D189, D234). */
const RACE_JUDGE = 'ilda';
/** How long the scene takes to fade out and in when the level starts again, and how
 * long it stays out (D75). */
const RESTART_FADE_MS = 120;
const RESTART_HOLD_MS = 160;

/** How a scene is played: a level's run, or a story's steps (D74). */
export interface SceneOptions {
  /** A story: the camera starts on this tile (camera.ts), and the words stay said;
   * `flying`, who is in the air on a broom from the start (D185); `light`, the light it
   * is told under, a morning (D124) or the sunset a scene is painted at too (D273). */
  story?: { camera: Tile; light?: LightName | 'sunset'; flying?: string[] };
  /** A level's own words said while a program runs, by their key (D264). */
  told?: Record<string, string>;
}

/** The world's events of a familiar, its trial and its book (D262 to D270), which the
 * scene shows apart from a figure's walk. */
const FAMILIAR_EVENTS = new Set([
  'trial',
  'spark',
  'held',
  'footprint',
  'born',
  'puzzled',
  'hand_over',
  'lit',
  'copied',
  'told',
  'book',
  'order',
  'learned',
]);
/** The placeholder a familiar is drawn with on a scene with no sheet for it. */
const CREATURE_KEY = 'creature-placeholder';
const SPARK_KEY = 'spark';
/** How far aside each of two familiars sharing a cell stands, in cells (D302). */
const SIDE_BY_SIDE = 0.25;
/** A story's figure in a rage (D324), stamping or throwing: how far it trembles to each
 * side, in the scene's pixels, and how many times in a tick; and the ways a figure
 * faces, in the round's order, by which it makes its small turns. */
const RAGE_SHAKE = 5;
const RAGE_TREMBLES = 5;
const ROUND: readonly Facing[] = ['right', 'down', 'left', 'up'];
/** A throw (D324), whose tick lasts THROWN: how long the things fly and how long the
 * thrower rages, in ticks; how high over its feet its hands are and how high over the
 * straight line the things rise, in cells. */
const THROW_FLIGHT = 1.5;
const THROW_RAGE = 1;
const THROW_HANDS = 0.4;
const THROW_RISE = 1;
/** The least time between two of a familiar's taps, in milliseconds (D277): its quick
 * steps at speed 1 are each heard, at twice the speed one in two, at four times one in
 * three. */
const PAW_GAP = 120;

export { type Art, type FigureArt, loadArt, type SceneArt } from './painted';

export interface SceneHandle {
  playback: Playback;
  /** Gives the playback a run's events, with everything back where it started. */
  /** A run's events to play; `way` names the way of the level they are of (D51),
   * whose places the restart uses. */
  load(result: WorldResult, way?: string | null): void;
  /** The level's first way on the scene again, as it opens (D204). */
  firstWay(): void;
  /** The level's start card closed: the seconds of a staged trial that does not hold
   * start (D276). */
  cardClosed(): void;
  reset(): void;
  /** Shows the level starting again: the scene fades, everything is put back,
   * `ready` is called and awaited while nothing is seen, and it comes back;
   * resolves once it is shown (D75, D121). */
  restartShow(ready?: () => Promise<void>): Promise<void>;
  /** The camera back on the wizard, following it (12.6). */
  follow(): void;
  /** In a story, the place a step frames, or none (D199, camera.ts); with `travel`, the
   * camera travels there from where it is (D321). */
  place(framing: StoryFraming | null, travel?: boolean): void;
  /** Zooms the camera one step in (1) or out (-1); false when it can go no further. */
  zoom(step: 1 | -1): boolean;
  /** Whether the camera can zoom one step in (1) or out (-1). */
  canZoom(step: 1 | -1): boolean;
  /** Whether the scene is drawn still, its camera there to ask: false once destroyed. */
  live(): boolean;
  /** A run played out: the wizard celebrates it when it is `won` (14.3); how long the
   * page waits before its card, the celebration and the words on the scene read to
   * their end, the longer of them (D175). */
  settle(won: boolean): number;
  /** Where the wizard stands on the page, a box in the page's pixels. */
  wizardBox(): { left: number; top: number; right: number; bottom: number };
  /** What of the level is drawn on the page now, each a box in the page's pixels: the
   * wizard, every figure, every thing of the level in sight and the end's mark, which
   * the goals box may not cover (D227). */
  levelBoxes(): { left: number; top: number; right: number; bottom: number }[];
  /** Who says what of the page lies over the scene, the goals box, as a box in the
   * page's pixels, asked whenever words are put over someone, which never go under it
   * (D240). */
  onCover(covered: () => { left: number; top: number; right: number; bottom: number } | null): void;
  /** Who is told when the map is opened, with the scene's plan at that tick, the run
   * paused until `playback.play()`, and when a run started again closes it (D134). */
  onMap(opened: (view: PlanView) => void, closed: () => void): void;
  destroy(): void;
}

function centre([x, y]: Tile): [number, number] {
  return [x * TILE + TILE / 2, y * TILE + TILE / 2];
}

function isFacing(value: unknown): value is Facing {
  return typeof value === 'string' && (FACINGS as readonly string[]).includes(value);
}

/** How many ticks a move takes: a walked step of the wizard's says it where it is more
 * than one (D225, D277), and so does a person's step in a story where a familiar walks. */
function stepTicks(event: WorldEvent): number {
  return typeof event.data.ticks === 'number' && event.data.ticks > 1 ? event.data.ticks : 1;
}

function tileOf(value: unknown): Tile | null {
  return Array.isArray(value) && value.length === 2 ? [Number(value[0]), Number(value[1])] : null;
}

/** How far a figure's head lies from its feet, a part of its height: where the
 * middle of the head is, on the pillow, for a figure asleep (D91). */
const HEAD_REACH = 0.65;
/** How many of the last sounds played data-sounds names. */
const SOUNDS_KEPT = 16;
/** How long the wizard is seen turned to who takes a thing before it goes, against a
 * tick (D48). */
const GIVE_TURN = 0.2;
/** How dark a dark room is drawn over a painting, whose shapes show faintly under it,
 * and over a scene without art (D52); and how long its light takes to lift, against
 * a tick. */
const DARK_PAINTED = 0.82;
/** A cell's width on the small canvas the dark over a painting is drawn on. */
const DARK_CELL = 24;
const DARK_KEY = 'dark-soft';
const DARK_PLAIN = 0.97;
const LIGHT_LIFT = 0.6;
/** The kinds of thing that lie on the floor and go unseen in the dark (D52). */
const LYING_KINDS: readonly string[] = ['key', 'book', 'wand', 'potion'];

const DELTA: Record<Facing, Tile> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

interface ActorState {
  sprite: Phaser.GameObjects.Sprite;
  tile: Tile;
  facing: Facing;
  sight: number;
}

class LevelScene extends Phaser.Scene {
  private wizard!: Phaser.GameObjects.Sprite;
  private wizardTile: Tile = [0, 0];
  /** Counts the showings of the level starting again, so that only the last fades in. */
  private showing = 0;
  /** The floating figures' swaying while they stand, by their sprite (D120). */
  private sways = new Map<Phaser.GameObjects.Sprite, Sway>();
  /** How many times each figure has raged since the scene started again (D324): its
   * small turns go to one side and to the other by turns. */
  private rages = new Map<Phaser.GameObjects.Sprite, number>();
  private things = new Map<string, Phaser.GameObjects.Image>();
  private doors = new Map<string, Tile>();
  /** Each painted door's piece lying on the floor while it is open, its doorway, under
   * every figure (D289). */
  private doorFloors = new Map<string, Phaser.GameObjects.Image>();
  private openDoors = new Set<string>();
  /** The rune's glow over each sealed door while its seal holds (D79). */
  private glows = new Map<string, Phaser.GameObjects.Container>();
  /** The painted rows' images, and what a tester sees with `?debug`. */
  private rows: Phaser.GameObjects.Image[] = [];
  private debug: DebugView | null = null;
  /** On a painted scene, the wizard's outline where something hides it. */
  private silhouette: Silhouette | null = null;
  /** What is painted, which may cover a figure or a thing, for their outlines. */
  private coverings: Phaser.GameObjects.Image[] = [];
  /** The things revealed (D85), each with its outline, until it is picked up. */
  private readonly revealed = new Map<string, Silhouette>();
  /** The goals' marks on a painted scene, by their cell, each lying on the ground with
   * its silhouette where something covers it (D160). */
  private marks: { tile: Tile; mark: Phaser.GameObjects.Container; silhouette: MarkSilhouette | null }[] = [];
  private carried = new Set<string>();
  /** The things a spell has brought to the wizard's hands in the run shown, held
   * there until picked up (D127), each with where it lies on its tile's floor. */
  private inHands = new Map<string, { x: number; y: number; depth: number }>();
  /** The images seen in the wizard's hands, which hide nothing of it (silhouette.ts). */
  private held = new Set<Phaser.GameObjects.Image>();
  /** The thing a spell takes in the tick shown, which its light flies to, and when
   * the light reaches it, in milliseconds from the cast (D127). */
  private pulling: string | null = null;
  private lightReaches = 0;
  /** Who an opening door's leaf moved aside in the run shown (D125). */
  private shoved = new Set<string>();
  private actors = new Map<string, ActorState>();
  /** Who lies asleep (D91), by their figure: their id and bed, and whether they are
   * drawn lying under its quilt, whose depth they keep. */
  private readonly asleep = new Map<Phaser.GameObjects.Sprite, { id: string; bed: string; lying: boolean }>();
  /** The figures hopping into a bed (D130), drawn at the depth they hop from, then
   * as sleepers, and not by where they are on the way. */
  private readonly hopping = new Set<Phaser.GameObjects.Sprite>();
  private cone!: Phaser.GameObjects.Graphics;
  /** The cells that hide every figure in them (D135). */
  private enchanted = new Set<string>();
  /** The crack of light round a hole while osto holds it closed, by its id (D167). */
  private heldOutlines = new Map<string, Phaser.GameObjects.Container>();
  /** Who is told when the map opens, and when a run started again closes it (D134). */
  private mapOpened: ((view: PlanView) => void) | null = null;
  private mapClosed: (() => void) | null = null;
  /** Who says what of the page lies over the scene, in the page's pixels (D240). */
  covered: (() => { left: number; top: number; right: number; bottom: number } | null) | null = null;
  /** The words said, in bubbles and thoughts (speech.ts), and the camera (camera.ts). */
  private speech!: Speech;
  private view!: SceneCamera;
  private shaking = 0;
  /** Who saw the wizard, whose cone is drawn red. */
  private seenBy: string | null = null;
  /** Whether the room is lit (D52), and the dark drawn over its floor while not. */
  private lit = true;
  private darkness!: Phaser.GameObjects.Graphics;
  /** The dark over a painting (D52), soft at its edges and round the wizard. */
  private softDark: Phaser.GameObjects.Image | null = null;
  private darkLifting = false;
  /** The tick shown, and each hole's holds seen so far (D53, D167). */
  private shownTick = 0;
  private holds = new Map<string, Hold[]>();
  /** Counts the restarts, so that a door's delayed opening from a run before is dropped. */
  private restarts = 0;
  /** The timers of a cast being played (D81), dropped when the level starts again. */
  private casting: Phaser.Time.TimerEvent[] = [];
  /** The light over the scene (D124): the painting's own, the night that falls once
   * the wizard sleeps and the morning after it, or a morning story's. */
  private light = new SceneLight();
  private lightCover!: Phaser.GameObjects.Rectangle;
  private shownLight: LightState | null = null;
  /** The scene's grounds at other hours over the painting's own (D126): the
   * morning's, shown as much as the light shows the day. */
  private grounds = new Map<string, Phaser.GameObjects.Image[]>();
  /** Each thing's morning image over its night one while the day comes, on a scene
   * painted whole by morning (D126), by the thing's id. */
  private dayTwins = new Map<string, Phaser.GameObjects.Image>();
  private shownDay: number | null = null;
  /** When the wizard has lain down in its bed, on the scene's clock, and the timer
   * that lets the night fall then. */
  private lyingUntil = 0;
  private nightFall: Phaser.Time.TimerEvent | null = null;
  /** The things drawn from their kind's sprite (D182), by id, and the hidden ones
   * found so far (D184). */
  private readonly sprites = new Map<string, ThingSprite>();
  private readonly found = new Set<string>();
  /** The brooms untied, and the rings flown through, in the run shown (D183, D187). */
  private readonly untied = new Set<string>();
  private readonly through: string[] = [];
  /** The rings' cells, which a flying figure flies through (D232). */
  private rings: Tile[] | null = null;
  /** The figures in the air (D185), and those setting down from it (D244). */
  private readonly flyers = new Map<Phaser.GameObjects.Sprite, Flyer>();
  /** The figures gliding over their runs of flown steps (D259): each glide, the cells of
   * its steps, when it started by the page's clock, the tick's length it was made for, and
   * how far into it its figure was last drawn, in milliseconds. */
  private readonly glides = new Map<
    Phaser.GameObjects.Sprite,
    { glide: Glide; cells: string[]; since: number; tickMs: number; at: number }
  >();
  private readonly wind = new Wind();
  /** The way each figure faces (D241), kept by its sprite. */
  private readonly ways = new Map<Phaser.GameObjects.Sprite, Facing>();
  /** The gusts of this run, one for each flown command, counted with the ticks shown, so
   * the same when the slider plays them again, and muted or not (D243). */
  private windGusts = 0;
  /** Whether the wind's rest is asked for: the wizard in the air, the program playing. */
  private resting = false;
  /** The hover's clock, in milliseconds (D235, D242): it always runs, but under reduced
   * motion; nothing else moves it. */
  private hoverMs = 0;
  /** How each familiar is drawn, by its id (D263, D273): the child's, its trials, and the
   * others' creatures; the trials a run calls, made as it plays; the footprints of light
   * a held run leaves (D268); the figures seated (D273); the plates lit (D270); and where
   * a voice painted into the scene speaks from (D264). */
  private readonly creatures = new Map<string, CreatureLook>();
  /** The familiars standing side by side on one cell, by the one that came second (D302). */
  private readonly sideBySide = new Map<string, string>();
  private readonly called = new Set<string>();
  /** When each familiar's last step was heard, on the scene's clock (D277). */
  private readonly lastPaw = new Map<string, number>();
  /** The trials seen that do not hold (D276), by id: how long each has still to be seen
   * and to fade, in milliseconds at speed 1, the alpha it fades from, the tick it came in
   * (0 for one staged), and whether it is staged, whose seconds start once the start
   * card is closed; the staged ones faded in this visit, which no run brings back. */
  private readonly fading = new Map<string, { left: number; alpha: number; tick: number; staged: boolean }>();
  private readonly fadedStaged = new Set<string>();
  private startClosed = false;
  private footprints: Phaser.GameObjects.GameObject[] = [];
  /** The keys of the words said in the run shown, in order (D264), for the tests; and how
   * long, in milliseconds at speed 1, the words told so far in the tick shown take to read,
   * after which the next told in it are said. */
  private toldKeys: string[] = [];
  private toldMs = 0;
  /** Whether the tick shown is one of Orla's orders, whose command holds nothing (D303). */
  private ordering = false;
  private readonly sitting = new Set<Phaser.GameObjects.Sprite>();
  private readonly litPlates = new Set<string>();
  private readonly voiceSprites = new Map<string, Phaser.GameObjects.Sprite>();
  /** What the book's band says in the run shown (D267). */
  private bookSaid: { words: string; code: string; look: string } | null = null;

  constructor(
    private readonly map: Layout,
    private readonly parentNode: HTMLElement,
    private readonly playback: Playback,
    private readonly ready: () => void,
    private readonly look: Look,
    private readonly options: SceneOptions = {},
    private readonly art: Art | null = null,
  ) {
    super({ key: 'level' });
  }

  /** A painted scene's images, and the figures' sheets (D76). */
  preload(): void {
    if (this.art) preloadArt(this, this.art);
  }

  /** How far above a figure's feet a word said over it goes. */
  private get headroom(): number {
    return this.art ? TILE * (this.art.figures?.height_cells ?? 1.3) + 4 : 34;
  }

  /** The painted thing a level's thing is drawn from: its `art`, or its id (D85). */
  private artOf(id: string): string {
    return this.map.things.find((thing) => thing.id === id)?.art ?? id;
  }

  /** Whether a tile is one no one walks on, the inside of a bookcase or a bed: a
   * thing laid there is drawn under what stands on it. */
  private inside([x, y]: Tile): boolean {
    const letter = this.map.rows[y]?.[x];
    return letter === '#' || letter === '=';
  }

  /** Where a figure stands on a tile: its centre, or on a painted scene its feet,
   * lower on a tile the scene lowers (D95) and sideways on one it nudges (D105). */
  private figureAt([x, y]: Tile): [number, number] {
    if (!this.art) return centre([x, y]);
    const { lowered, nudged } = this.art.scene;
    return [
      (x + 0.5 + nudgedBy(nudged, [x, y])) * TILE,
      (y + FOOT_IN_CELL + loweredBy(lowered, [x, y])) * TILE,
    ];
  }

  /** A figure turned to face a way: its sheet's frame, or the placeholder's. A flying
   * figure keeps the way it last faced upward or downward, which says on which side of a
   * ring's plane it is in the ring's cell (D232). */
  private face(sprite: Phaser.GameObjects.Sprite, facing: Facing, step = this.art?.figures?.standing ?? 1): void {
    this.ways.set(sprite, facing);
    const flying = this.flyers.get(sprite);
    if (flying && (facing === 'up' || facing === 'down')) flying.way = facing;
    if (sprite.texture.key.startsWith('fig-')) {
      // A figure seated is drawn in its sitting rows, the same way faced (D273).
      const sit = this.sitting.has(sprite) ? this.art?.figures?.sheets?.[sprite.texture.key.slice(4)]?.sit : undefined;
      sprite.setFrame(((sit ?? 0) + SHEET_ROW[facing]) * 3 + (sit === undefined ? step : (this.art?.figures?.standing ?? 1)));
    } else if (sprite.texture.key !== CREATURE_KEY && sprite.texture.key !== SPARK_KEY) sprite.setFrame(facing);
  }

  /** A figure walking to a point, its frames stepping as it goes on a painted scene. */
  private walk(sprite: Phaser.GameObjects.Sprite, facing: Facing, x: number, y: number, duration: number): void {
    const stepping = sprite.texture.key.startsWith('fig-');
    // A floating figure steps as every figure does, and sways again once there (D120).
    const sway = this.sways.get(sprite);
    sway?.stop();
    this.tweens.add({
      targets: sprite,
      x,
      y,
      duration,
      ease: 'Linear',
      onUpdate: (tween) => {
        if (stepping) this.face(sprite, facing, [0, 1, 2, 1][Math.floor(tween.progress * 4) % 4] ?? 1);
      },
      onComplete: () => {
        this.face(sprite, facing);
        sway?.start();
      },
    });
  }

  /** A character's figure: its drawn sheet when there is one, else the placeholder. */
  private figure(id: string, placeholder: string, tile: Tile, facing: Facing): Phaser.GameObjects.Sprite {
    const figures = this.art?.figures;
    const name = figureName(id, this.look);
    const drawn = figures && this.textures.exists(`fig-${name}`);
    // Which sheet the wizard and the friend are drawn from, for the tests (D77, 13.2).
    if (id === 'wizard' || id === 'friend') {
      this.parentNode.dataset[id === 'wizard' ? 'wizardFigure' : 'friendFigure'] = drawn ? name : 'placeholder';
    }
    const sprite =
      figures && drawn
        ? drawFigure(this, figures, name, this.figureAt(tile), facing)
        : this.add.sprite(...centre(tile), placeholder, facing).setOrigin(0.5, 0.6);
    this.ways.set(sprite, facing);
    return sprite;
  }

  /** The way a figure faces, as the scene keeps it (D241): set where it is placed and
   * where it is turned, never read back from the frame it shows; down where none is. */
  private wayOf(sprite: Phaser.GameObjects.Sprite): Facing {
    return this.ways.get(sprite) ?? 'down';
  }

  /** A door's look, shut or open: its painted state, or, on a scene with no painting of
   * it, the placeholder's frame. A painted door is never drawn with the placeholder's
   * frame (D156): where its state's picture is not there, it keeps the painted state it
   * shows, and takes the state's picture once it is loaded. */
  private doorLook(id: string, open: boolean, lock: string, moving = false): void {
    const image = this.things.get(id);
    if (!image) return;
    const key = this.atHour(`art-${this.artOf(id)}-${open ? 'open' : 'closed'}`);
    if (!this.textures.exists(key)) {
      if (!this.art?.scene.things[this.artOf(id)]) {
        image.setFrame(open ? 'open' : lock);
        return;
      }
      this.textures.once(`addtexture-${key}`, () => {
        if (this.openDoors.has(id) === open) this.doorLook(id, open, lock);
      });
      return;
    }
    // Open, what is seen through the doorway is under whoever stands in it (D95).
    const painted = this.art?.scene.things[this.artOf(id)];
    const tile = this.doors.get(id);
    const depth =
      this.art && painted && tile
        ? thingDepthOn(this.art, this.artOf(id), tile, { open, inside: this.inside(tile) })
        : image.depth;
    if (!moving || this.still) {
      image.setTexture(key).setDepth(depth).setAlpha(1);
      this.floorLook(id, open, 0);
      return;
    }
    // Seen opening or closing: through its half-open state when it has one, each
    // picture fading out at its own depth as the next fades in at its own; the
    // picture of the hour the scene shows (D126), never a frame of another.
    const step = this.playback.tickDuration * 0.3;
    this.floorLook(id, open, step * 2);
    const ajar = this.atHour(`art-${this.artOf(id)}-ajar`);
    const fade = (to: string, length: number) => {
      const from = image.texture.key;
      const before = image.depth;
      fadeBetween(this, image, to, depth, length);
      this.parentNode.dataset.fading = `${id}:${from}@${before.toFixed(4)}>${to}@${depth.toFixed(4)}`;
      this.time.delayedCall(length, () => {
        if (this.parentNode.dataset.fading?.startsWith(`${id}:${from}@`)) delete this.parentNode.dataset.fading;
      });
    };
    if (!this.textures.exists(ajar)) {
      fade(key, step * 2);
      return;
    }
    fade(ajar, step);
    this.parentNode.dataset.opening = id;
    const run = this.restarts;
    this.time.delayedCall(step, () => {
      delete this.parentNode.dataset.opening;
      if (run === this.restarts && this.openDoors.has(id) === open) fade(key, step);
    });
  }

  /** A painted door's piece lying on the floor (D289), made beside the door's own
   * picture where its scene has one, shown while the door is open. */
  private floorOf(id: string, image: Phaser.GameObjects.Image, open: boolean): void {
    if (!this.art?.scene.things[this.artOf(id)]?.floors) return;
    const floor = this.add.image(image.x, image.y, image.texture.key).setOrigin(0, 0).setScale(image.scaleX, image.scaleY);
    this.doorFloors.set(id, floor.setDepth(FLOOR_DEPTH).setVisible(false));
    this.floorLook(id, open, 0);
  }

  /** A door's piece lying on the floor in the state it is in, where that state has one,
   * at the door's place: shown at once, or fading in or out over `fade` milliseconds as
   * the door's own picture does (D156, D289). */
  private floorLook(id: string, open: boolean, fade: number): void {
    const floor = this.doorFloors.get(id);
    const image = this.things.get(id);
    if (!floor || !image) return;
    const key = this.atHour(floorKey(this.artOf(id), open ? 'open' : 'closed'));
    const shown = this.textures.exists(key);
    this.tweens.killTweensOf(floor);
    floor.setPosition(image.x, image.y);
    if (shown) floor.setTexture(key);
    if (fade <= 0) {
      floor.setVisible(shown).setAlpha(1);
      return;
    }
    if (shown) {
      floor.setVisible(true).setAlpha(0);
      this.tweens.add({ targets: floor, alpha: 1, duration: fade });
    } else if (floor.visible) {
      this.tweens.add({ targets: floor, alpha: 0, duration: fade, onComplete: () => floor.setVisible(false) });
    }
  }

  /** A painted thing's texture at the hour the scene shows: its morning picture
   * once the day is all there, on a scene painted whole by morning (D126). */
  private atHour(key: string): string {
    if (!this.art?.scene.hours?.morning || (this.shownDay ?? 0) < 1) return key;
    const morning = hourKey(key, 'morning');
    return this.textures.exists(morning) ? morning : key;
  }

  /** Whether the player asks for less motion: the pulses then stand still. */
  private get still(): boolean {
    return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  /** A glow over a sealed door, pulsing while the seal holds (D79): over its painted
   * state, or its placeholder's tile. */
  private addGlow(id: string, tile: Tile): void {
    const image = this.things.get(id);
    const at: [number, number] =
      this.art?.scene.things[this.artOf(id)] && image
        ? [image.x + (image.displayWidth || TILE) / 2, image.y + (image.displayHeight || TILE) / 2]
        : centre(tile);
    const sign = this.art?.scene.things[this.artOf(id)]?.rune !== 'painted';
    this.glows.set(id, drawGlow(this, at, image?.depth ?? 3, this.still, sign));
  }

  /** A seal broken: its glow goes, breaking into sparks when it is seen go. */
  private unseal(id: string, instant = true): void {
    const glow = this.glows.get(id);
    if (!glow?.visible) return;
    if (instant || this.still) glow.setVisible(false);
    else breakSeal(this, glow, this.playback.tickDuration * 0.8);
  }

  /** How long a tick of this scene lasts at speed 1: a third of TICK_MS where the wizard
   * can fly (D225), a half where a familiar walks (D277). */
  private get tickMs(): number {
    return TICK_MS * this.playback.pace;
  }

  /** How many ticks words said stay: in a level, as long as they take to read (D175),
   * in the ticks this scene plays; in a story, until the next step. */
  private sayTicks(text: string): number {
    return this.options.story ? Number.POSITIVE_INFINITY : readingTicks(text, this.tickMs);
  }

  /** A sprite's thing put on its tile, its foot there, among the figures by its row:
   * a broom lying under whoever stands on its cell, a ring standing (D182), a broom
   * hanging from its peg at the rack's row, behind whoever stands under it (D195). */
  private placeSprite(image: Phaser.GameObjects.Image, sprite: ThingSprite, tile: Tile): void {
    const [originX, originY] = spriteOrigin(sprite);
    // Moved sideways on a cell by painted furniture beside it (D207).
    const [footX, footY] = spriteFoot(sprite, tile);
    image
      .setPosition(footX + shiftedBy(this.art?.scene.shifted, tile) * TILE, footY)
      .setOrigin(originX, originY)
      .setScale(spriteScale(sprite, image.height))
      .setDepth(thingDepth(tile[1], { lying: sprite.lying === true }));
  }

  create(): void {
    makePlaceholders(
      this,
      this.map.markers.map(([letter]) => letter),
      this.look,
      this.map.actors.filter((actor) => actor.kind === 'friend').map((actor) => actor.id),
    );
    // The look the wizard is drawn with, for the tests (D36).
    this.parentNode.dataset.look = this.look.id;
    // Each tile drawn as its kind of terrain (D73), a placeholder until the art.
    const data = this.map.terrain.map((row) =>
      row.map((kind) => {
        const index = (TERRAIN_KINDS as readonly string[]).indexOf(kind);
        return index >= 0 ? index : kind === 'wall' ? WALL : kind === 'shelf' ? SHELF : FLOOR;
      }),
    );
    if (this.art) {
      // A painted scene (D76): the painting as the ground, its raised things by row.
      this.rows = paintScene(this, this.art);
      this.grounds = paintGrounds(this, this.art);
      // A scene painted whole by morning is the morning itself: no light over it (D126).
      if (this.art.scene.hours?.morning) this.light.morning = WHOLE_MORNING;
      drawGrid(this, [this.map.width, this.map.height]);
    } else {
      const tilemap = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
      const tileset = tilemap.addTilesetImage(TILES_KEY, TILES_KEY, TILE, TILE, 0, 0);
      if (tileset) tilemap.createLayer(0, tileset, 0, 0);
    }
    for (const prop of this.map.props) {
      // A painted scene has its props in the painting.
      if (!this.art && this.textures.exists(propKey(prop.kind))) {
        this.add.image(...centre(prop.tile), propKey(prop.kind)).setDepth(1.5);
      }
    }
    this.cone = this.add.graphics().setDepth(1);
    this.enchanted = new Set(this.map.enchanted.map(([x, y]) => `${x},${y}`));
    // Over a painting, the dark lies over its rows and its figures too (D52).
    this.darkness = this.add.graphics().setDepth(this.art ? lightDepth(this.map.height) - 0.5 : 2.5);
    this.softDark = null;
    for (const thing of this.map.things) {
      // A bed is the scene's: the painting draws it, and nothing is drawn for it (D84).
      if (thing.kind === 'bed') continue;
      const painted = this.art ? paintThing(this, this.art, thing, this.inside(thing.tile)) : null;
      if (painted) {
        this.things.set(thing.id, painted);
        if (thing.kind === 'door') {
          this.doors.set(thing.id, thing.tile);
          this.floorOf(thing.id, painted, thing.open === true);
        }
        continue;
      }
      // A thing of a kind with a sprite of its own, a broom or a ring, on a painted scene
      // with no cut-out of it (D182); one hidden in the straw unseen until found (D184).
      const named = spriteName(this.art?.sprites ?? null, thing);
      const sprite = this.art?.sprites?.[named];
      if (this.art && sprite && drawnFromSprite(this.art.sprites, named, false) && this.textures.exists(spriteKey(named))) {
        const image = this.add.image(0, 0, spriteKey(named));
        this.sprites.set(thing.id, sprite);
        this.placeSprite(image, sprite, thing.tile);
        this.things.set(thing.id, image.setVisible(!thing.hidden));
        continue;
      }
      const image =
        thing.kind === 'door'
          ? this.add.image(...centre(thing.tile), thingKey('door'), thing.open ? 'open' : thing.lock)
          : thing.kind === 'hole'
            ? this.add.image(...centre(thing.tile), thingKey('hole'), 'closed')
            : this.add.image(...centre(thing.tile), thingKey(thing.kind));
      // Doors and holes are the castle's shape, seen in the dark; what lies on the
      // floor is under it (D52).
      const shape = thing.kind === 'door' || thing.kind === 'hole';
      this.things.set(thing.id, image.setDepth(shape ? 2.8 : 2));
      if (thing.kind === 'door') this.doors.set(thing.id, thing.tile);
    }
    // A painted door no level or story places is drawn in the state it rests in
    // (D104): shut, or open, swung against the wall beside its doorway (D111).
    for (const [id, painted] of Object.entries(this.art?.scene.things ?? {})) {
      if (!this.art || !painted.rest || !this.textures.exists(`art-${id}-${painted.rest}`)) continue;
      if (this.map.things.some((thing) => (thing.art ?? thing.id) === id)) continue;
      const scale = artScale(this.art);
      this.add
        .image(painted.left * scale, painted.top * scale, `art-${id}-${painted.rest}`)
        .setOrigin(0, 0)
        .setScale(scale)
        .setDepth(thingDepthOn(this.art, id, painted.at ?? [0, painted.row], { open: painted.rest === 'open' }));
      // Its piece lying on the floor in that state, under every figure (D289).
      if (painted.floors?.[painted.rest] && this.textures.exists(floorKey(id, painted.rest))) {
        this.add
          .image(painted.left * scale, painted.top * scale, floorKey(id, painted.rest))
          .setOrigin(0, 0)
          .setScale(scale)
          .setDepth(FLOOR_DEPTH);
      }
    }
    for (const thing of this.map.things) {
      if (thing.kind === 'door' && thing.lock === 'spell') this.addGlow(thing.id, thing.tile);
    }
    for (const [letter, tile] of this.map.markers) {
      // A marker, like the way out, shows in the dark: it is the castle's shape. On a
      // painted scene the goal's mark is a ring that pulses, lying on the ground where a
      // figure on its cell stands, under whatever stands before it or walks over it,
      // even a shut door, with its silhouette where it is covered (D160).
      if (!this.art) {
        this.add.image(...centre(tile), markerKey(letter)).setDepth(2.8);
        continue;
      }
      const [markX, markY] = centre(tile);
      const { nudged, lowered } = this.art.scene;
      const placed: [number, number] = [
        markX + nudgedBy(nudged, tile) * TILE,
        markY + loweredBy(lowered, tile) * TILE,
      ];
      this.marks.push({ tile, mark: drawMark(this, placed, this.still, MARK_DEPTH), silhouette: null });
    }
    // The cell a sleep goal is met from, marked as a reach goal's is, with a sign of
    // sleep in its ring (D130), on the ground as it is (D160).
    const sleepAt = this.map.sleepAt;
    if (sleepAt) {
      const mark = drawSleepMark(this, centre(sleepAt), this.still, MARK_DEPTH);
      if (this.art) this.marks.push({ tile: sleepAt, mark, silhouette: null });
    }
    const marked = [...this.map.markers.map(([, tile]) => tile), ...(sleepAt ? [sleepAt] : [])];
    this.parentNode.dataset.marks = marked.map((tile) => tile.join(',')).join(';');
    this.makeCreatureTextures();
    for (const actor of this.map.actors) {
      const key = actor.kind === 'friend' ? friendKey(actor.id) : actorKey(actor.kind);
      // A familiar is drawn from its creature's sheet, alive or a trial (D263, D273).
      const sprite = actor.creature
        ? this.creatureSprite(actor.creature, actor.tile, actor.facing)
        : this.figure(actor.id, key, actor.tile, actor.facing).setDepth(3);
      if (actor.creature) this.creatures.set(actor.id, actor.creature);
      // A trial staged with no colour does not hold (D276).
      if (actor.creature?.look === 'pale') {
        this.fading.set(actor.id, { left: trialTime(true), alpha: sprite.alpha, tick: 0, staged: true });
      }
      if (actor.sitting) {
        this.sitting.add(sprite);
        this.face(sprite, actor.facing);
      }
      this.actors.set(actor.id, { sprite, tile: actor.tile, facing: actor.facing, sight: actor.sight });
      if (sprite.texture.key.startsWith('fig-') && this.art?.figures?.floating?.includes(figureName(actor.id, this.look))) {
        this.sways.set(
          sprite,
          new Sway(
            {
              every: (delay, callback) => {
                const event = this.time.addEvent({ delay, loop: true, callback });
                return () => event.remove(false);
              },
            },
            (step) => {
              const state = this.actors.get(actor.id);
              if (state) this.face(state.sprite, state.facing, step);
            },
          ),
        );
      }
    }
    // The game's familiar in a living level, where it stands at the start (D269).
    const living = this.map.living;
    if (living) {
      const sprite = this.creatureSprite(living.creature, living.tile, living.facing);
      this.creatures.set('familiar', living.creature);
      this.actors.set('familiar', { sprite, tile: living.tile, facing: living.facing, sight: 0 });
    }
    // The wizard faces the way its level says (D286).
    this.wizard = this.figure('wizard', WIZARD_KEY, this.map.start, this.map.facing).setDepth(4);
    // Fixed over the camera's view each frame (lit), so that no zoom or drag shows its edge.
    this.lightCover = this.add.rectangle(0, 0, 1, 1, 0x000000, 0).setOrigin(0, 0).setDepth(lightDepth(this.map.height));
    this.light.set(this.lightName());
    this.speech = new Speech(this, this.parentNode, {
      width: this.map.width * TILE,
      headroom: this.headroom,
      lifted: (figure) => {
        const flying = this.flyers.get(figure);
        return flying ? (FLY_LIFT + flying.raise) * TILE * flying.rise : 0;
      },
      wizard: () => this.wizard,
      height: this.map.height * TILE,
      wrap: this.options.story ? 6 : 4,
      figures: () => [this.wizard, ...[...this.actors.values()].map((actor) => actor.sprite)],
      tickMs: this.tickMs,
      shown: () => this.view.shown(),
      shownSides: () => this.view.shownSides(),
      // The window's view of the scene, which a thought stays inside (D245).
      view: () => {
        const view = this.cameras.main.worldView;
        return { left: view.x, top: view.y, right: view.right, bottom: view.bottom };
      },
      facing: (figure) => this.wayOf(figure),
      cover: () => this.coverOnScene(),
      // The familiar's circle, which words keep off (D284).
      keepOff: () => {
        const circle = this.map.circle;
        if (!circle) return null;
        const [[x0, y0], [x1, y1]] = circle;
        return { left: x0 * TILE, top: y0 * TILE, right: (x1 + 1) * TILE, bottom: (y1 + 1) * TILE };
      },
    });
    const story = this.options.story;
    this.view = new SceneCamera(this, this.parentNode, {
      columns: this.map.width,
      rows: this.map.height,
      margin: viewMarginOf(this.art),
      painted: this.art !== null,
      story: story ? { x: centre(story.camera)[0], y: centre(story.camera)[1] } : null,
      levelBox: this.map.camera,
      wizard: () => this.wizard,
      around: (figure) => this.speech.around(figure),
      zoomed: (cameraZoom) => this.speech.setZoom(cameraZoom),
    });
    this.view.setUp();
    // The painted rows and things, each with the row its foot stands on; a placeholder
    // scene has none.
    const scene = this.art?.scene;
    const painted: PaintedImage[] = scene
      ? [
          ...scene.rows.flatMap((row, index) => {
            const image = this.rows[index];
            return image ? [{ image, row: row.row }] : [];
          }),
          ...[...this.things].flatMap(([id, image]) => {
            const thing = scene.things[this.artOf(id)];
            // A hole lies in the floor, and hides no one.
            const flat = this.map.things.some((one) => one.id === id && one.kind === 'hole');
            return thing && !flat && image.texture.key.startsWith('art-') ? [{ image, row: thing.row }] : [];
          }),
        ]
      : [];
    this.coverings = painted.map(({ image }) => image);
    // Each mark's silhouette, where a cut-out covers it and no figure does, over what is
    // painted, under the dark and the light (D160, D168).
    const figures = [this.wizard, ...[...this.actors.values()].map((actor) => actor.sprite)];
    for (const one of this.marks) {
      one.silhouette = new MarkSilhouette(
        this,
        one.mark,
        MARK_RADIUS,
        this.coverings,
        figures,
        overDepth(this.map.height) + 0.25,
        this.still,
        this.wizard.scaleX,
      );
    }
    if (this.art && this.wizard.texture.key.startsWith('fig-')) {
      this.silhouette = new Silhouette(this, this.wizard, this.coverings, this.still);
      this.parentNode.dataset.silhouette = 'true';
    }
    if (debugging()) {
      this.debug = new DebugView(this, this.map, this.parentNode, painted, marginOf(this.art));
    }

    this.playback.onTick((tick, events, instant) => this.show(tick, events, instant));
    this.playback.onState((state) => {
      this.parentNode.dataset.state = state;
      // A run brings the camera back to the wizard, but where the level frames a place
      // the wizard stands in (D201).
      if (state === 'playing') this.view.runs(this.wizardTile);
      // Words said near the end of the run, with no tick to end them, go once they are
      // read (D175).
      if (state === 'done' && !this.options.story) this.time.delayedCall(this.speech.settle(), () => this.speech.expireRead());
      // Stop, a pause and the run's end silence a gust (D242, D243), and end each glide
      // on the cell of the tick shown (D259).
      if (state !== 'playing') {
        this.wind.stop(WIND_STOP);
        this.cutGlides();
      }
      // The friend's orders play while no program runs, the card closed (D300).
      if (state === 'idle' && this.startClosed) this.hallShow?.startDrill();
      else if (state !== 'idle') this.hallShow?.stopDrill();
    });
    // Where the flying figures are drawn, once each frame is drawn (D259).
    this.events.on(Phaser.Scenes.Events.RENDER, () => this.publishFlyers());
    this.restart();
    this.parentNode.dataset.state = this.playback.state;
    this.hallAtWork();
    this.ready();
  }

  /** The camera back on the wizard, following it; in a story, with whoever the
   * last step was about (camera.ts). */
  follow(): void {
    this.view.follow();
  }

  /** In a story, the place a step frames, or none (D199, camera.ts), travelled to with
   * `travel` (D321). */
  place(framing: StoryFraming | null, travel = false): void {
    this.view.place(framing, travel);
  }

  /** The camera's travel ended at once and nothing left waiting for it, as the scene
   * goes (D321). */
  endCamera(): void {
    this.view.drop();
    this.view.arrive();
  }

  /** A story's bubble said once the camera has arrived where it travels (D321): words
   * enter over a picture that does not move. */
  private sayOnArrival(said: () => void): void {
    if (this.options.story) this.view.arrived(said);
    else said();
  }

  /** In a story, the camera is with whoever the tick is about (D74): who speaks,
   * walks, appears or turns, unless the step is about someone else (D103). */
  private frameStory(events: WorldEvent[]): void {
    const about = [...events]
      .reverse()
      .find((event) => ['say', 'move', 'appear', 'face'].includes(event.kind) && event.data.aside !== true);
    if (!about) return;
    const sprite = about.actor === 'wizard' ? this.wizard : this.actors.get(about.actor)?.sprite;
    if (sprite) this.view.focus = sprite;
  }

  /** Whether the camera can zoom a step (camera.ts). */
  canZoomBy(step: 1 | -1): boolean {
    return this.view.canZoomBy(step);
  }

  /** One step in or out of the zooms (camera.ts). */
  zoomBy(step: 1 | -1): boolean {
    return this.view.zoomBy(step);
  }

  /** The level starting again, seen: a fade to the frame's colour, everything put
   * back while it is out, and a fade back in (D75). */
  restartShow(ready: () => Promise<void> = () => Promise.resolve()): Promise<void> {
    const camera = this.cameras.main;
    const showing = ++this.showing;
    this.parentNode.dataset.restarting = 'true';
    return new Promise((resolve) => {
      camera.once('camerafadeoutcomplete', () => {
        this.playback.reset();
        const held = new Promise<void>((done) => {
          this.time.delayedCall(RESTART_HOLD_MS, () => done());
        });
        // Out of sight until what is to be shown is in place (D121); a showing asked
        // for since fades in for both.
        void Promise.all([held, ready().catch(() => undefined)]).then(() => {
          if (showing !== this.showing || !this.sys.isActive()) {
            resolve();
            return;
          }
          camera.once('camerafadeincomplete', () => {
            delete this.parentNode.dataset.restarting;
            resolve();
          });
          camera.fadeFrom(RESTART_FADE_MS, 31, 35, 48, true);
        });
      });
      // Forced, so that a restart asked for during a fade still fades and resolves.
      camera.fade(RESTART_FADE_MS, 31, 35, 48, true);
    });
  }

  /** A word said follows who says it while they walk. */
  override update(_time: number, delta: number): void {
    // The hover's clock always runs, but under reduced motion (D235, D242).
    if (!this.still) this.hoverMs += delta;
    const hover = String(Math.round(this.hoverMs));
    if (this.parentNode.dataset.hover !== hover) this.parentNode.dataset.hover = hover;
    this.drawLight();
    // What the camera shows, in cells: its left, its top, its width and its height.
    const view = this.cameras.main.worldView;
    const world = [view.x, view.y, view.width, view.height].map((v) => (v / TILE).toFixed(2)).join(',');
    if (this.parentNode.dataset.world !== world) this.parentNode.dataset.world = world;
    if (this.options.story) this.publishFigures();
    if (this.glides.size > 0) this.moveGlides();
    // The camera moves with the wizard at once while it glides (D259).
    this.view.glide(this.glides.has(this.wizard));
    if (this.flyers.size > 0 || this.parentNode.dataset.flying) this.flyFrames();
    // The wind (D243): whether a gust sounds, and the rest asked for while the wizard is in
    // the air with the program playing.
    const wind = this.wind.blowing ? 'on' : 'off';
    if (this.parentNode.dataset.wind !== wind) this.parentNode.dataset.wind = wind;
    // The landing's wind (D255): near while its approach is planned, down while it falls.
    const landing = this.wind.landing;
    if (landing === null) delete this.parentNode.dataset.landing;
    else if (this.parentNode.dataset.landing !== landing) this.parentNode.dataset.landing = landing;
    // The thought's cloud on the page, for the tests to hold it clear of the goals box.
    const cloud = this.speech.thoughtBox();
    const onPage = cloud && this.onPage(new Phaser.Geom.Rectangle(cloud.left, cloud.top, cloud.right - cloud.left, cloud.bottom - cloud.top));
    const said = onPage ? [onPage.left, onPage.top, onPage.right, onPage.bottom].map(Math.round).join(',') : undefined;
    if (said === undefined) delete this.parentNode.dataset.thoughtBox;
    else if (this.parentNode.dataset.thoughtBox !== said) this.parentNode.dataset.thoughtBox = said;
    const resting = this.inAir(this.wizard) && this.playback.state === 'playing';
    if (resting !== this.resting) {
      this.resting = resting;
      this.wind.rest(resting);
    }
    // The wizard's way as the scene keeps it, and the frame it is drawn in (D241).
    const dataset = this.parentNode.dataset;
    const facing = this.wizardFacing();
    if (dataset.wizardFacing !== facing) dataset.wizardFacing = facing;
    const frame = String(this.wizard.frame.name);
    if (dataset.wizardFrame !== frame) dataset.wizardFrame = frame;
    // On a painted scene the figures go behind what stands in front of them (D76).
    if (this.art) {
      if (!this.asleep.get(this.wizard)?.lying && !this.hopping.has(this.wizard)) {
        this.wizard.setDepth(figureDepth(this.wizard.y / TILE + this.pastOf(this.wizard)) + 0.0005);
      }
      for (const actor of this.actors.values()) {
        if (!this.asleep.get(actor.sprite)?.lying && !this.hopping.has(actor.sprite)) {
          actor.sprite.setDepth(figureDepth(actor.sprite.y / TILE + this.pastOf(actor.sprite)));
        }
      }
      // A figure walking into a dark passage is drawn darker, head first.
      const dark = this.art.scene.dark;
      if (dark) {
        const figures: [string, Phaser.GameObjects.Sprite][] = [
          ['wizard', this.wizard],
          ...[...this.actors].map(([id, { sprite }]): [string, Phaser.GameObjects.Sprite] => [id, sprite]),
        ];
        const shaded: string[] = [];
        for (const [id, sprite] of figures) {
          const [head, feet] = shadeAt(dark, [sprite.x / TILE, sprite.y / TILE]);
          if (feet > 0) {
            sprite.setTint(tintOf(head), tintOf(head), tintOf(feet), tintOf(feet));
            if (sprite.visible) shaded.push(`${id}:${feet.toFixed(2)}`);
          } else sprite.clearTint();
        }
        if (shaded.length) this.parentNode.dataset.shade = shaded.join(',');
        else delete this.parentNode.dataset.shade;
      }
    }
    // A trial with no colour trembles, a pixel of its sheet to each side, about eight
    // times a second, but under reduced motion (D263).
    this.trembleTrials();
    this.fadeTrials(delta);
    this.speech.update();
    if (this.silhouette) {
      this.silhouette.off = this.asleep.get(this.wizard)?.lying === true || this.inEnchanted(this.wizardTile);
      this.silhouette.held = this.held;
      this.silhouette.update();
      if (this.silhouette.shown) this.parentNode.dataset.outlined = 'true';
      else delete this.parentNode.dataset.outlined;
    }
    for (const outline of this.revealed.values()) outline.update();
    if (this.marks.length > 0) {
      for (const { tile, mark, silhouette } of this.marks) {
        mark.setDepth(this.markDepth(tile));
        silhouette?.update();
      }
      const covered = this.marks
        .filter(({ silhouette }) => silhouette?.covered)
        .map(({ tile }) => tile.join(','))
        .join(';');
      if (this.parentNode.dataset.marksCovered !== covered) this.parentNode.dataset.marksCovered = covered;
    }
    this.debug?.update(this.cameras.main);
    if (this.art) this.publishDrawn();
  }

  /** In a story, each figure drawn, its box in cells and its alpha, for the tests that
   * hold who comes in and who leaves to be whole and solid (D319, D322). */
  private publishFigures(): void {
    const drawn = [['wizard', this.wizard] as const, ...[...this.actors].map(([id, { sprite }]) => [id, sprite] as const)]
      .filter(([, sprite]) => sprite.visible)
      .map(([id, sprite]) => {
        const box = sprite.getBounds();
        const cells = [box.left, box.top, box.right, box.bottom].map((v) => (v / TILE).toFixed(2)).join(',');
        return `${id}:${cells}:${sprite.alpha.toFixed(2)}`;
      })
      .join(';');
    if (this.parentNode.dataset.figures !== drawn) this.parentNode.dataset.figures = drawn;
  }

  /** The depth of the goal's mark on `tile`: on the ground (D160), or, where a door open
   * on the cell shows its open picture, which paints the doorway's floor, just over that
   * picture, so that the shut leaf's picture, gone, cuts nothing of it (D172). */
  private markDepth(tile: Tile): number {
    for (const thing of this.map.things) {
      if (thing.kind !== 'door' || !this.openDoors.has(thing.id)) continue;
      if (!(thing.cells ?? [thing.tile]).some(([x, y]) => x === tile[0] && y === tile[1])) continue;
      const image = this.things.get(thing.id);
      if (image?.texture.key === this.atHour(`art-${this.artOf(thing.id)}-open`)) return markDepthIn(image.depth);
    }
    return MARK_DEPTH;
  }

  /** Where each painted thing seen is drawn, its middle in cells (D109), in
   * data-drawn: said each frame, for a thing on its way to be seen where it is. */
  private publishDrawn(): void {
    const drawn = [...this.things]
      .filter(([, image]) => image.visible && image.texture.key.startsWith('art-'))
      .map(([id, image]) => `${id}:${drawnMiddle(image).map((v) => v.toFixed(2)).join(',')}`)
      .sort()
      .join(';');
    if (this.parentNode.dataset.drawn !== drawn) this.parentNode.dataset.drawn = drawn;
    // The picture each door is drawn with, for the tests (D156).
    const looks = [...this.doors.keys()]
      .map((id) => `${id}:${this.things.get(id)?.texture.key ?? ''}`)
      .sort()
      .join(';');
    if (this.parentNode.dataset.doorLooks !== looks) this.parentNode.dataset.doorLooks = looks;
  }

  /** The way of the level being shown (D51), whose places a restart uses; null for
   * the level's own. */
  shownWay: string | null = null;

  /** Where a thing or an actor starts in the way shown: the way's tile, or its own. */
  private startTile(id: string, own: Tile): Tile {
    return (this.shownWay ? this.map.ways[this.shownWay]?.[id] : undefined) ?? own;
  }

  /** Everything where it stood before the run; `seeking`, on the way to a tick. */
  private restart(seeking = false): void {
    this.restarts += 1;
    this.rages.clear();
    // A step shown anew takes the camera to its travel's end at once, and what waited
    // for it is the step shown before (D321).
    this.view.drop();
    this.view.arrive();
    // A run started again closes the map it opened (D134).
    this.mapClosed?.();
    this.found.clear();
    this.untied.clear();
    this.through.length = 0;
    for (const sprite of [...this.flyers.keys()]) this.land(sprite, true);
    // A restart cuts all of the wind, a landing that falls too (D255).
    this.wind.stop(WIND_CUT, true);
    this.countGusts(0);
    this.raceBand(0, [], true);
    for (const id of [...this.revealed.keys()]) this.unreveal(id);
    this.asleep.clear();
    this.hopping.clear();
    this.markAsleep();
    this.wizard.setAngle(0);
    delete this.parentNode.dataset.sleeping;
    this.speech.clearBubble();
    this.speech.clearThought();
    this.stopCast();
    this.resetLight();
    this.view.focus = null;
    this.seenBy = null;
    this.lit = !this.map.dark;
    this.shownTick = 0;
    this.holds.clear();
    this.openDoors.clear();
    // What the wizard holds from the start is carried at tick 0 (D49).
    this.carried = new Set(this.map.carrying);
    this.shoved.clear();
    this.inHands.clear();
    this.held.clear();
    for (const thing of this.map.things) {
      const image = this.things.get(thing.id);
      if (!image) continue;
      this.tweens.killTweensOf(image);
      const tile = this.startTile(thing.id, thing.tile);
      const painted = this.art?.scene.things[this.artOf(thing.id)];
      if (this.art && painted) {
        placeThing(image, this.art, this.artOf(thing.id), tile, {
          open: thing.open,
          inside: this.inside(tile),
          lying: thing.kind === 'key',
        });
        // Back in the state it lies in, a book the spell took at the run before.
        if (thing.kind !== 'door') image.setTexture(`art-${this.artOf(thing.id)}-${Object.keys(painted.states)[0]}`);
      } else if (this.sprites.has(thing.id)) {
        this.placeSprite(image, this.sprites.get(thing.id) as ThingSprite, tile);
      } else image.setPosition(...centre(tile));
      // A thing the way shown takes away, or the first way before any run (D184).
      const way = this.shownWay ?? this.map.firstWay;
      const gone = way !== null && (this.map.wayGone[way] ?? []).includes(thing.id);
      // A thing in the wizard's hands from the start is seen only once given (D123); one
      // drawn from a sprite and hidden, in the way shown, once found (D184, D202).
      const hidden = (way !== null ? this.map.wayHidden[way]?.[thing.id] : undefined) ?? thing.hidden === true;
      const unseen = hidden && this.sprites.has(thing.id);
      image.setVisible(!thing.carried && !unseen && !gone).setAlpha(1);
      if (thing.kind === 'door') this.doorLook(thing.id, thing.open, thing.lock);
      this.glows.get(thing.id)?.setVisible(!thing.open);
      if (thing.open) this.openDoors.add(thing.id);
    }
    for (const actor of this.map.actors) {
      const state = this.actors.get(actor.id);
      if (!state) continue;
      this.tweens.killTweensOf(state.sprite);
      state.tile = this.startTile(actor.id, actor.tile);
      state.facing = (this.shownWay ? this.map.wayFacings[this.shownWay]?.[actor.id] : undefined) ?? actor.facing;
      const hidden = actor.hidden || this.inEnchanted(state.tile) || this.fadedStaged.has(actor.id);
      state.sprite.setPosition(...this.figureAt(state.tile)).setAlpha(1).setVisible(!hidden).setAngle(0);
      // Seated as the staging has it, whatever a story's step did since (D279).
      if (actor.sitting) this.sitting.add(state.sprite);
      else this.sitting.delete(state.sprite);
      this.face(state.sprite, state.facing);
      if (actor.asleep) this.layDown(state.sprite, actor.id, actor.asleep, true);
      const sway = this.sways.get(state.sprite);
      if (actor.hidden || actor.asleep) sway?.stop();
      else sway?.start();
    }
    this.restartFamiliars();
    this.paintHour();
    this.placeWizard(this.map.start, this.map.facing);
    this.wizard.setAlpha(1).setVisible(!this.inEnchanted(this.map.start));
    // In a story, who is in the air from the start (D185).
    for (const id of this.options.story?.flying ?? []) {
      const sprite = this.spriteOf(id);
      if (sprite) this.lift(sprite, true);
    }
    this.parentNode.dataset.tick = '0';
    this.publish();
    // A level's start shows the place it frames (D201), or the wizard and every actor;
    // a seek stays with the wizard, or in the place framed while the wizard is in it.
    if (!this.options.story && !seeking) this.frameStart();
    else if (this.restarts > 1) this.view.runs(this.map.start);
  }

  /** The camera at a level's start: the place the level frames, or the wizard and every
   * actor seen (camera.ts). */
  private frameStart(): void {
    const others = this.map.actors.flatMap((actor) => {
      const state = this.actors.get(actor.id);
      return state?.sprite.visible ? [state.tile] : [];
    });
    this.view.frame([this.map.start, ...others]);
  }

  /** Where the wizard stands on the page (SceneHandle). */
  wizardBox(): { left: number; top: number; right: number; bottom: number } {
    return this.onPage(this.wizard.getBounds());
  }

  /** What of the level is drawn on the page now (SceneHandle, D227): the wizard, every
   * figure seen, every thing of the level seen, and the end's mark. */
  levelBoxes(): { left: number; top: number; right: number; bottom: number }[] {
    const drawn: ({ getBounds(): Phaser.Geom.Rectangle } | Phaser.Geom.Rectangle)[] = [this.wizard];
    for (const actor of this.actors.values()) if (actor.sprite.visible) drawn.push(actor.sprite);
    for (const image of this.things.values()) if (image.visible && image.alpha > 0) drawn.push(image);
    for (const { mark } of this.marks) if (mark.visible) drawn.push(mark);
    // A plate unlit is the painting's own, but a thing of the level that a goal sends the
    // familiar to (D270): its cell counts.
    for (const thing of this.map.things) {
      if (thing.kind !== 'plate') continue;
      const [x, y] = thing.tile;
      drawn.push(new Phaser.Geom.Rectangle(x * TILE, y * TILE, TILE, TILE));
    }
    return drawn.map((object) => this.onPage(object instanceof Phaser.Geom.Rectangle ? object : object.getBounds()));
  }

  /** A rectangle of the scene's world as a box in the page's pixels. */
  private onPage(box: Phaser.Geom.Rectangle): { left: number; top: number; right: number; bottom: number } {
    const camera = this.cameras.main;
    const canvas = this.game.canvas.getBoundingClientRect();
    const scale = (camera.zoom * canvas.width) / this.game.canvas.width;
    const left = canvas.left + (box.left - camera.worldView.x) * scale;
    const top = canvas.top + (box.top - camera.worldView.y) * scale;
    return { left, top, right: left + box.width * scale, bottom: top + box.height * scale };
  }

  /** What of the page lies over the scene, as a box in the scene's world (D240); null
   * where nothing does. */
  private coverOnScene(): { left: number; top: number; right: number; bottom: number } | null {
    const box = this.covered?.();
    if (!box) return null;
    const camera = this.cameras.main;
    const canvas = this.game.canvas.getBoundingClientRect();
    const scale = (camera.zoom * canvas.width) / this.game.canvas.width;
    const across = (x: number) => camera.worldView.x + (x - canvas.left) / scale;
    const down = (y: number) => camera.worldView.y + (y - canvas.top) / scale;
    return { left: across(box.left), top: down(box.top), right: across(box.right), bottom: down(box.bottom) };
  }

  private placeWizard(tile: Tile, facing: Facing): void {
    this.tweens.killTweensOf(this.wizard);
    this.glides.delete(this.wizard);
    this.wizard.setPosition(...this.figureAt(tile));
    this.face(this.wizard, facing);
    this.wizardTile = tile;
  }

  /** Whether a tile hides who stands on it (D135). */
  private inEnchanted([x, y]: Tile): boolean {
    return this.enchanted.has(`${x},${y}`);
  }

  /** A figure stepping into an enchanted region fades out over the step, one stepping
   * out of it fades in, and one walking in it stays unseen (D135). */
  private enchantedStep(sprite: Phaser.GameObjects.Sprite, from: Tile, to: Tile, duration: number, instant: boolean): void {
    if (this.enchanted.size === 0) return;
    const [before, after] = [this.inEnchanted(from), this.inEnchanted(to)];
    if (instant || before === after) {
      sprite.setAlpha(1).setVisible(!after);
      return;
    }
    sprite.setVisible(true).setAlpha(after ? 1 : 0);
    this.tweens.add({
      targets: sprite,
      alpha: after ? 0 : 1,
      duration,
      onComplete: () => sprite.setVisible(!after).setAlpha(1),
    });
  }

  /** The map opened by its spell (D134): the run pauses at this tick, and once the
   * wand is seen pointed the page opens the plan as the scene is now. */
  private openMap(): void {
    if (!this.mapOpened) return;
    this.playback.pause();
    const run = this.restarts;
    this.time.delayedCall(this.playback.tickDuration * LONG * 0.95, () => {
      if (run === this.restarts) this.mapOpened?.(this.planView());
    });
  }

  /** Tells who opens the map, and who closes it when a run starts again (D134). */
  listenForMap(opened: (view: PlanView) => void, closed: () => void): void {
    this.mapOpened = opened;
    this.mapClosed = closed;
  }

  /** What the plan is drawn from, at the tick shown (D134, D143). */
  private planView(): PlanView {
    const facing = this.wizardFacing();
    const things = this.map.things
      .filter((thing) => !this.carried.has(thing.id) && !thing.carried)
      .map((thing) => {
        const tile = this.startTile(thing.id, thing.tile);
        // A thing drawn from a sprite, moved sideways as the scene draws it (D207).
        const shift = this.sprites.has(thing.id) ? shiftedBy(this.art?.scene.shifted, tile) : 0;
        return {
          id: thing.id,
          kind: thing.kind,
          tile,
          open: this.openDoors.has(thing.id),
          ...(thing.art ? { art: thing.art } : {}),
          ...(shift ? { shift } : {}),
        };
      });
    const figures = [
      { id: 'wizard', kind: 'wizard', tile: this.wizardTile, facing },
      ...this.map.actors.flatMap((actor) => {
        const state = this.actors.get(actor.id);
        return state && (state.sprite.visible || this.inEnchanted(state.tile))
          ? [{ id: actor.id, kind: actor.kind, tile: state.tile, facing: state.facing as string }]
          : [];
      }),
    ];
    return {
      rows: this.map.rows,
      enchanted: this.map.enchanted,
      zones: this.map.zones,
      figures,
      things,
      marks: this.map.reaches,
      ...(this.art
        ? {
            pictures: planPictures(this.art, things, figures, this.look),
          }
        : {}),
    };
  }

  /** The cells of the dark area (D52, D73). */
  private darkCells(): Tile[] {
    if (this.map.darkArea.length > 0) return this.map.darkArea;
    return this.map.rows.flatMap((row, y) => [...row].map((_, x): Tile => [x, y]));
  }

  /** A tick's events drawn; `instant` for a tick replayed by a seek, drawn at once
   * with no tweens, no bubbles and no shaking: only where everything ends up. */
  private show(tick: number, events: WorldEvent[], instant: boolean): void {
    // A tick shown at once, or the start drawn again, puts every figure on its cell.
    if (instant || tick === 0) this.glides.clear();
    if (tick === 0) {
      this.restart(instant);
      return;
    }
    this.parentNode.dataset.tick = String(tick);
    this.shownTick = tick;
    this.toldMs = 0;
    this.ordering = false;
    this.endGlides(tick);
    // Drawn at once on a later tick than it came or last stepped in, a trial that does
    // not hold is not there (D276).
    if (instant) {
      for (const [id, trial] of this.fading) if (!trial.staged && trial.tick < tick) this.trialGone(id);
    }
    this.speech.expire(tick, instant);
    // A spell's light flies to the thing it takes, which waits for it (D127).
    const pulled = events.find((event) => event.kind === 'pull');
    this.pulling = pulled ? String(pulled.data.id) : null;
    this.lightReaches = 0;
    for (const event of events) {
      if (event.actor === 'wizard') this.showWizard(tick, event, instant);
      // A door opened by a spell or a word is the door's own event (D43); so is a
      // thing a spell pulls (D47).
      else if (event.kind === 'open') this.openDoor(String(event.data.id), instant, event.data.by === 'word');
      // A story's figure closes a door behind it (D103).
      else if (event.kind === 'close') this.closeDoor(String(event.data.id), instant);
      else if (event.kind === 'unsealed') this.unseal(String(event.data.id), instant);
      // A word said to a door while its seal holds: the wizard thinks why nothing happened.
      else if (event.kind === 'unheard') {
        if (!instant) {
          const unheard = blockedText('unheard', 'door');
          this.speech.think(unheard, tick, this.sayTicks(unheard));
        }
      }
      else if (event.kind === 'pull') this.pull(event, instant);
      // A door's leaf, opening, moves whoever stands where it comes to lie (D125).
      else if (event.kind === 'shoved') this.shove(event, instant);
      else if (event.kind === 'light') this.liftDark(instant);
      else if (event.kind === 'hold') this.hold(event);
      else if (event.kind === 'map') {
        if (!instant) this.openMap();
      }
      // A hidden thing found, seen from now on (D184).
      else if (event.kind === 'found') this.showFound(event, instant);
      // A familiar's trial, its book, its birth, its words (D262 to D270).
      else if (FAMILIAR_EVENTS.has(event.kind) || (event.kind === 'pick_up' && this.actors.has(event.actor)))
        this.showFamiliar(tick, event, instant);
      else if (event.kind === 'blocked' && this.actors.has(event.actor)) this.showFamiliar(tick, event, instant);
      // A ring flown through (D187), or flown against its way (D219).
      else if (event.kind === 'through')
        this.flownThrough(String(event.data.id), instant, typeof event.data.by !== 'string');
      else if (event.kind === 'wrong_way') this.flownAgainst(event, tick, instant);
      // A broom lifted or set down, the wizard's or a racer's (D185, D189).
      else if (event.kind === 'fly' || event.kind === 'land') {
        const sprite = this.spriteOf(String(event.data.id ?? event.actor));
        if (sprite && event.kind === 'fly') this.lift(sprite, instant);
        if (sprite && event.kind === 'land') this.land(sprite, instant);
      } else this.showActor(tick, event, instant);
    }
    this.raceBand(tick, events, instant);
    this.bookBand();
    this.nearLanding(instant);
    if (this.options.story) {
      this.frameStory(events);
      this.view.keep();
    } else this.view.hold(this.wizardTile);
    this.publish();
  }

  /** The landing near (D255): at a tick shown while the program plays, the wizard in the
   * air, the time to its next landing, whoever orders it; within LAND_NEAR, the wind's
   * rest rises to the landing, drawn again at every such tick from the level it has. */
  private nearLanding(instant: boolean): void {
    if (instant || this.playback.state !== 'playing' || !this.inAir(this.wizard)) return;
    const ms = this.playback.timeTo((event) => event.kind === 'land' && String(event.data.id ?? event.actor) === 'wizard');
    if (ms !== null && ms / 1000 <= LAND_NEAR) this.wind.near(ms / 1000);
  }

  /** The wizard's figure, or an actor's, by its id. */
  private spriteOf(id: string): Phaser.GameObjects.Sprite | null {
    return id === 'wizard' ? this.wizard : (this.actors.get(id)?.sprite ?? null);
  }

  /** Hidden things found (D184): each seen from now on, coming into sight. */
  private showFound(event: WorldEvent, instant: boolean): void {
    const ids = Array.isArray(event.data.ids) ? event.data.ids.map(String) : [];
    for (const id of ids) {
      this.found.add(id);
      const image = this.things.get(id);
      if (!image || this.carried.has(id)) continue;
      this.tweens.killTweensOf(image);
      if (instant) {
        image.setVisible(true).setAlpha(1);
        continue;
      }
      image.setVisible(true).setAlpha(0);
      this.tweens.add({ targets: image, alpha: 1, duration: this.playback.tickDuration * 0.8 });
    }
  }

  /** A story's figure throws things staged hidden (D324): it rages where it stands, with
   * a whoosh, and they leave its hands at once, each flying in an arc to its own cell and
   * tumbling once on the way, where it lies in sight from then on as a thing found does
   * (D184). */
  private throwThings(actor: ActorState, event: WorldEvent, instant: boolean): void {
    const ids = Array.isArray(event.data.ids) ? event.data.ids.map(String) : [];
    const moving = !instant && !this.still;
    const length = this.playback.tickDuration * THROW_FLIGHT;
    if (moving) {
      this.playSound('lift');
      this.rage(actor, this.playback.tickDuration * THROW_RAGE);
    }
    const from: [number, number] = [actor.sprite.x, actor.sprite.y - THROW_HANDS * TILE];
    const cells = Array.isArray(event.data.at) ? (event.data.at as Tile[]) : [];
    ids.forEach((id, index) => {
      this.found.add(id);
      const image = this.things.get(id);
      if (!image || this.carried.has(id)) return;
      this.tweens.killTweensOf(image);
      // On the cell it falls on, whatever a flight cut short left of it.
      const sprite = this.sprites.get(id);
      const cell = cells[index];
      if (sprite && cell) this.placeSprite(image, sprite, cell);
      image.setVisible(true).setAlpha(1).setAngle(0);
      if (!moving) return;
      const to: [number, number] = [image.x, image.y];
      // Each tumbles once as it flies, one the other way from the next.
      const tumble = index % 2 === 0 ? 360 : -360;
      image.setPosition(...from);
      this.tweens.add({
        targets: image,
        x: to[0],
        y: to[1],
        duration: length,
        ease: 'Linear',
        onUpdate: (tween) => {
          image.setPosition(...hopAt(from, to, tween.progress, THROW_RISE * TILE)).setAngle(tumble * tween.progress);
        },
        onComplete: () => image.setPosition(...to).setAngle(0),
      });
    });
  }

  /** A figure rages where it stands for `ms` (D324): it trembles to each side of its
   * place, back on it at the end, and makes a small turn meanwhile, a quarter of a round
   * to a side and back to the way it faced: never the whole round. One rage after
   * another turns to one side and to the other by turns, the first towards the front
   * of the scene for a figure in profile, which shows its face. */
  private rage(actor: ActorState, ms: number): void {
    const sprite = actor.sprite;
    const x = sprite.x;
    const trembles = Math.max(1, Math.round((RAGE_TREMBLES * ms) / this.playback.tickDuration));
    const count = this.rages.get(sprite) ?? 0;
    this.rages.set(sprite, count + 1);
    const first = ROUND.indexOf(actor.facing);
    const front = ROUND[(first + 1) % ROUND.length] === 'down' ? 1 : -1;
    const side = count % 2 === 0 ? front : -front;
    this.face(sprite, ROUND[(first + side + ROUND.length) % ROUND.length] ?? actor.facing);
    // Back to the way it faced, halfway; a restart drops it.
    const run = this.restarts;
    this.time.delayedCall(ms / 2, () => {
      if (run === this.restarts) this.face(sprite, actor.facing);
    });
    this.shaking += 1;
    this.parentNode.dataset.shaking = 'true';
    this.tweens.add({
      targets: sprite,
      x: { from: x - RAGE_SHAKE, to: x + RAGE_SHAKE },
      duration: ms / (2 * trembles),
      yoyo: true,
      repeat: trembles - 1,
      onComplete: () => {
        sprite.setX(x);
        this.shaking -= 1;
        if (this.shaking === 0) delete this.parentNode.dataset.shaking;
      },
    });
  }

  /** A ring flown through (D187): kept in order, the wizard's, and seen to glow for a
   * moment, a racer's too (D220). */
  private flownThrough(id: string, instant: boolean, wizard: boolean): void {
    if (wizard) this.through.push(id);
    const image = this.things.get(id);
    if (!image || instant || this.still) return;
    const glow = this.add
      .image(image.x, image.y, image.texture.key)
      .setOrigin(image.originX, image.originY)
      .setScale(image.scaleX)
      .setDepth(image.depth + 0.00001)
      .setTint(0xfff3bf)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.8);
    this.tweens.add({ targets: glow, alpha: 0, duration: this.playback.tickDuration * 1.2, onComplete: () => glow.destroy() });
  }

  /** A ring flown against its way (D219): it shakes, the wizard thinks which way it
   * is flown, with the bump's sound, and the program goes on. */
  private flownAgainst(event: WorldEvent, tick: number, instant: boolean): void {
    const image = this.things.get(String(event.data.id));
    if (instant || this.still) return;
    if (image) this.shake(image, this.playback.tickDuration);
    this.playSound('bump');
    // Thought of after the bump is seen (D237).
    const why = ringWayText(String(event.data.way));
    this.speech.think(why, tick, this.sayTicks(why), AFTER_BUMP_MS);
  }

  /** A figure lifted on its broom (D185): drawn from its flying rows, its shadow on the
   * ground, rising to half a cell up over LIFT_MS at the playback's speed, or there at
   * once where it is shown at once (D244); one setting down rises again from where it
   * is. For the wizard, air that rises is heard, and the wind blows and swells (D236). */
  private lift(sprite: Phaser.GameObjects.Sprite, instant: boolean): void {
    const atOnce = instant || this.still;
    const flying = this.flyers.get(sprite);
    if (flying) {
      if (flying.to === 1) return;
      this.riseTo(flying, 1, atOnce);
    } else {
      const shadow = this.add
        .ellipse(sprite.x, sprite.y, TILE * 0.55, TILE * 0.18, 0x000000, 0.22)
        .setDepth(sprite.depth - 0.0004);
      const facing = this.wayOf(sprite);
      const made: Flyer = { shadow, way: facing === 'down' ? 'down' : 'up', past: 0, raise: 0, rise: 0, from: 0, to: 1, since: 0, length: 0 };
      this.flyers.set(sprite, made);
      this.riseTo(made, 1, atOnce);
    }
    if (sprite === this.wizard && !instant) this.playSound('lift');
  }

  /** The gusts of this run, as the scene says them (data-wind-gusts, D243). */
  private countGusts(gusts: number): void {
    this.windGusts = gusts;
    this.parentNode.dataset.windGusts = String(gusts);
  }

  /** A flown move of the wizard's (D243): its command's first step starts a gust for the
   * command's whole length, the steps it says at the tick's length; a later step starts
   * one for the steps still to fly where none sounds, a flight that goes on after a
   * pause. Counted at each command, shown at once or not. */
  private gust(event: WorldEvent, instant: boolean): void {
    const step = Number(event.data.step ?? 1);
    const steps = Number(event.data.steps ?? 1);
    if (step === 1) this.countGusts(this.windGusts + 1);
    if (instant || this.playback.state !== 'playing') return;
    if (step > 1 && this.wind.blowing) return;
    this.wind.gust(((steps - step + 1) * this.playback.tickDuration * FLOWN) / 1000);
    this.heard('wind');
  }

  /** A figure set down where it is (D185, D244): it comes down from where it is over
   * LIFT_MS, in its flying frame, and stands facing the way it flew once its feet are on
   * its cell (touchDown), or at once where it is shown at once. The wizard coming down
   * shows no frame of the cast that set it down: from its flying frame it stands. For
   * the wizard, whoever ordered the landing, the wind is switched off (D255), said as
   * `set_down` among data-sounds; a gust that sounds falls as planned. */
  private land(sprite: Phaser.GameObjects.Sprite, instant: boolean): void {
    const flying = this.flyers.get(sprite);
    if (!flying) return;
    if (instant || this.still) this.touchDown(sprite);
    else if (flying.to === 1) {
      this.riseTo(flying, 0, false);
      if (sprite === this.wizard) this.dropPartFrames();
    } else return;
    if (sprite === this.wizard && !instant) {
      this.wind.land();
      this.heard('set_down');
    }
  }

  /** A flyer's rise sent toward `to` from where it is, over LIFT_MS at the playback's
   * speed, or there at once (D244). */
  private riseTo(flying: Flyer, to: 0 | 1, atOnce: boolean): void {
    flying.from = atOnce ? to : flying.rise;
    flying.to = to;
    flying.since = this.time.now;
    flying.length = atOnce ? 0 : (LIFT_MS * this.playback.tickDuration) / TICK_MS;
    if (atOnce) flying.rise = to;
  }

  /** A figure whose feet are on its cell: its shadow gone, out of the flyers, standing
   * facing the way it flew (D241). */
  private touchDown(sprite: Phaser.GameObjects.Sprite): void {
    const flying = this.flyers.get(sprite);
    if (!flying) return;
    flying.shadow.destroy();
    this.flyers.delete(sprite);
    this.restOrigin(sprite);
    this.face(sprite, this.wayOf(sprite));
  }

  /** Whether a figure is in the air: a flyer not setting down, from its fly to its land,
   * as the world has it. */
  private inAir(sprite: Phaser.GameObjects.Sprite): boolean {
    return this.flyers.get(sprite)?.to === 1;
  }

  /** How long the wizard's set-down has still to go, in milliseconds; 0 where it is not
   * setting down. */
  private settingDown(): number {
    const flying = this.flyers.get(this.wizard);
    if (!flying || flying.to !== 0) return 0;
    return Math.max(0, flying.length - (this.time.now - flying.since));
  }

  /** The rings' cells, read once from the level's things. */
  private get ringTiles(): Tile[] {
    this.rings ??= this.map.things.filter((thing) => thing.kind === 'ring').map((thing) => thing.tile);
    return this.rings;
  }

  /** How far a flying figure's feet are past a ring's plane, in cells, for its depth
   * among the ring and the others (D232); none for a figure not flying. */
  private pastOf(sprite: Phaser.GameObjects.Sprite): number {
    return this.flyers.get(sprite)?.past ?? 0;
  }

  /** A figure's origin back at its feet, as it stands. */
  private restOrigin(sprite: Phaser.GameObjects.Sprite): void {
    const figures = this.art?.figures;
    if (figures && sprite.texture.key.startsWith('fig-')) sprite.setOrigin(0.5, 1 - figures.foot / figures.frame[1]);
    else sprite.setOrigin(0.5, 0.6);
  }

  /** Each flying figure, each frame: its flying frame by the way it faces, bobbing,
   * drawn half a cell above its feet, and its shadow on the ground under it (D185); in a
   * ring's cell drawn higher, in the ring's hole, and its feet and shadow past the ring's
   * plane the way it flew (D232). */
  private flyFrames(): void {
    const sides: string[] = [];
    const down: Phaser.GameObjects.Sprite[] = [];
    for (const [sprite, flying] of this.flyers) {
      const { shadow, way } = flying;
      // The rise under way (D244): a set-down ended puts the figure on its cell.
      flying.rise = flying.from + (flying.to - flying.from) * riseOf(this.time.now - flying.since, flying.length);
      if (flying.to === 0 && flying.rise <= 0) {
        down.push(sprite);
        continue;
      }
      const id = sprite === this.wizard ? 'wizard' : this.idOf(sprite);
      const figures = this.art?.figures;
      const name = sprite.texture.key.replace(/^fig-/, '');
      const facing = this.wayOf(sprite);
      const frame = figures && sprite.texture.key.startsWith('fig-') ? flyFrame(flyRowOf(figures, name), facing) : null;
      if (frame !== null && sprite.texture.frameTotal - 1 > frame) sprite.setFrame(frame);
      const ring = throughRing([sprite.x / TILE, sprite.y / TILE], this.ringTiles, way, this.art ? FOOT_IN_CELL : 0.5);
      flying.past = ring.past;
      flying.raise = ring.raise;
      if (Math.abs(ring.past) >= RING_PAST / 2) sides.push(`${id}:${ring.past < 0 ? 'behind' : 'front'}`);
      // The hover, whole outside a ring's cell and none at its middle, whose hole is
      // tight (D232, D235).
      const hover = hoverOf(this.hoverMs, hoverPhase(id)) * (1 - ring.raise / RING_RAISE);
      const lift = (FLY_LIFT + ring.raise + hover) * flying.rise * TILE;
      const height = sprite.frame.height || sprite.height;
      const base = figures && sprite.texture.key.startsWith('fig-') ? 1 - figures.foot / figures.frame[1] : 0.6;
      sprite.setOrigin(0.5, base + lift / (height * sprite.scaleY));
      // The shadow as faint as the figure is low.
      shadow
        .setPosition(sprite.x, sprite.y + (ring.past - 0.05) * TILE)
        .setDepth(sprite.depth - 0.0004)
        .setAlpha(flying.rise)
        .setVisible(sprite.visible);
    }
    for (const sprite of down) this.touchDown(sprite);
    const rise = this.flyers.get(this.wizard)?.rise;
    if (rise === undefined) delete this.parentNode.dataset.rise;
    else if (this.parentNode.dataset.rise !== rise.toFixed(2)) this.parentNode.dataset.rise = rise.toFixed(2);
    // Which flying figures are in a ring's cell, behind the ring or in front of it.
    const sided = sides.sort().join(',');
    if (sided) this.parentNode.dataset.ringSides = sided;
    else delete this.parentNode.dataset.ringSides;
    // In the air from its fly to its land, as the world has it (D244).
    const flying = [...this.flyers.keys()]
      .filter((sprite) => this.inAir(sprite))
      .map((sprite) => (sprite === this.wizard ? 'wizard' : this.idOf(sprite)))
      .filter(Boolean);
    const said = flying.sort().join(',');
    if (this.parentNode.dataset.flying !== said) this.parentNode.dataset.flying = said;
  }

  /** A flown step of a figure's as it plays (D259): taken up by the glide under way
   * that planned it, or the start of a glide over the figure's run of flown steps, read
   * ahead from the ticks, each step at its tick's length: from where the figure is, if a
   * glide is under way, else from the step's first cell. */
  private glideStep(sprite: Phaser.GameObjects.Sprite, who: string, tick: number, from: Tile, to: Tile): void {
    const under = this.glides.get(sprite);
    const tickMs = this.playback.tickDuration;
    // Planned by the glide under way: the step is the glide's. Where its tick begins later
    // than the glide has it, the ticks' clock started again after the page was held up
    // (playback's HELD), and the glide's clock is put back as far: the figure goes on from
    // where it is drawn, never back.
    if (under && under.tickMs === tickMs && under.cells[tick - under.glide.tick] === String(to)) {
      const late = this.playback.startedAt - under.since - glideBegins(under.glide, tick);
      if (late > GLIDE_SLACK) under.since += late;
      return;
    }
    this.tweens.killTweensOf(sprite);
    // The run read ahead begins with this step; were it not to, the step alone.
    const read = this.playback.flownRun(who).map(({ event, length }) => ({
      cell: tileOf(event.data.to),
      facing: isFacing(event.data.facing) ? event.data.facing : this.wayOf(sprite),
      length,
    }));
    const steps = String(read[0]?.cell) === String(to) ? read : [{ cell: to, facing: this.wayOf(sprite), length: FLOWN }];
    const [x0, y0] = under ? [sprite.x, sprite.y] : this.figureAt(from);
    const points: { x: number; y: number; facing: Facing }[] = [{ x: x0, y: y0, facing: this.wayOf(sprite) }];
    const cells: string[] = [];
    const ends: number[] = [];
    let elapsed = 0;
    for (const { cell, facing, length } of steps) {
      if (!cell) break;
      const [x, y] = this.figureAt(cell);
      points.push({ x, y, facing });
      cells.push(String(cell));
      elapsed += length * tickMs;
      ends.push(elapsed);
    }
    if (!under) sprite.setPosition(x0, y0);
    // It starts when its tick began by the playback's clock, so that it meets the ticks.
    const since = Math.min(this.playback.startedAt, performance.now());
    this.glides.set(sprite, { glide: { points, ends, tick }, cells, since, tickMs, at: 0 });
  }

  /** Each gliding figure, each frame: where its glide has it by the page's clock, facing
   * the way it flies to its next point; on its last point once its glide ends (D259). It
   * is drawn no farther ahead of the tick shown than HELD, the ticks being that late at
   * most, and never back from where it was drawn; its glide lasts until the tick of its
   * last step is shown, so that a late tick finds the glide that planned it. */
  private moveGlides(): void {
    const now = this.game.loop.now;
    for (const [sprite, gliding] of this.glides) {
      const most = glideMost(gliding.glide, this.shownTick, HELD);
      gliding.at = Math.max(gliding.at, Math.min(now - gliding.since, most));
      const at = glideAt(gliding.glide, gliding.at);
      sprite.setPosition(at.x, at.y);
      const facing = gliding.glide.points[at.to]?.facing;
      if (facing && this.wayOf(sprite) !== facing) this.face(sprite, facing);
      if (at.done && glideOver(gliding.glide, this.shownTick)) this.glides.delete(sprite);
    }
  }

  /** A tick past a figure's run of flown steps finds it on the run's last cell (D259). */
  private endGlides(tick: number): void {
    for (const [sprite, gliding] of this.glides) {
      if (tick < gliding.glide.tick + gliding.glide.ends.length) continue;
      const last = gliding.glide.points[gliding.glide.points.length - 1];
      if (last) sprite.setPosition(last.x, last.y);
      this.glides.delete(sprite);
    }
  }

  /** Paused or stopped, each gliding figure goes on to the cell of the tick shown and
   * stands there, as the tick has it (D259). */
  private cutGlides(): void {
    for (const gliding of this.glides.values()) {
      gliding.glide = glideTo(gliding.glide, this.playback.tick);
      gliding.cells = gliding.cells.slice(0, gliding.glide.ends.length);
    }
  }

  /** Where each flying figure is as the frame is drawn (data-flyers-at, D259): its feet
   * in the scene's pixels, and on the canvas, the camera counted, for the test that holds
   * a flight even on the screen. */
  private publishFlyers(): void {
    const dataset = this.parentNode.dataset;
    if (this.flyers.size === 0) {
      if (dataset.flyersAt !== undefined) delete dataset.flyersAt;
      return;
    }
    const camera = this.cameras.main;
    const view = camera.worldView;
    dataset.flyersAt = [...this.flyers.keys()]
      .map((sprite) => {
        const id = sprite === this.wizard ? 'wizard' : this.idOf(sprite);
        const screen = [(sprite.x - view.x) * camera.zoom, (sprite.y - view.y) * camera.zoom];
        return `${id}:${[sprite.x, sprite.y, ...screen].map((value) => value.toFixed(2)).join(',')}`;
      })
      .join(';');
  }

  /** What the tests read of chapter 4's things (D182 to D187): the sprites drawn, the
   * hidden things found, the brooms untied, the rings flown through. */
  private publishThings(): void {
    const node = this.parentNode.dataset;
    const drawn = [...this.sprites.keys()]
      .flatMap((id) => {
        const image = this.things.get(id);
        const thing = this.map.things.find((one) => one.id === id);
        if (!image?.visible || !thing) return [];
        const [x, y] = [image.x / TILE, image.y / TILE];
        // A hung broom by its hung sprite's name, on its peg's cell (D195).
        const name = spriteName(this.art?.sprites ?? null, thing);
        return [`${id}:${name}:${Math.floor(x)},${thing.hung ? thing.tile[1] : Math.ceil(y) - 1}`];
      })
      .sort()
      .join(';');
    if (node.spriteThings !== drawn) node.spriteThings = drawn;
    const found = [...this.found].sort().join(',');
    if (node.found !== found) node.found = found;
    const untied = [...this.untied].sort().join(',');
    if (node.untied !== untied) node.untied = untied;
    const through = this.through.join(',');
    if (node.through !== through) node.through = through;
  }

  /** The id of an actor's figure. */
  private idOf(sprite: Phaser.GameObjects.Sprite): string {
    for (const [id, actor] of this.actors) if (actor.sprite === sprite) return id;
    return '';
  }

  /** Ilda's band at the scene's foot in a race (D189, D234): her portrait and her
   * words. While she reads the programs, the lines read of each, ticking down, until
   * both have taken off; from the race's `judged` event, her verdict, which stays
   * until the run starts again. */
  private raceBand(tick: number, events: WorldEvent[], instant: boolean): void {
    const race = this.map.race;
    if (!race) return;
    let band = this.parentNode.querySelector<HTMLElement>('.race-band');
    if (!band) {
      band = document.createElement('div');
      band.className = 'race-band';
      band.hidden = true;
      const picture = document.createElement('img');
      picture.className = 'portrait small';
      picture.src = contentUrl(`art/portraits/${RACE_JUDGE}.webp`);
      picture.alt = '';
      picture.dataset.portrait = RACE_JUDGE;
      band.append(picture, document.createElement('p'));
      this.parentNode.append(band);
    }
    if (tick === 0) {
      this.readLines = 0;
      this.verdict = null;
      this.verdictRead = 0;
    }
    const read = events.find((event) => event.kind === 'read');
    if (read) this.readLines = Number(read.data.lines);
    const judged = events.find((event) => event.kind === 'judged');
    if (judged) {
      this.verdict = raceVerdict(judged.data);
      this.verdictRead = instant ? 0 : this.time.now + readingMs(this.verdict);
    }
    const mine = this.readLines;
    const name = characterName(race.against);
    const reading = !this.verdict && tick > 0 && (read !== undefined || tick <= race.lines);
    const said = reading
      ? `${t('race.reading', { mine, name, theirs: race.lines })} ${t('race.left', {
          mine: Math.max(mine - tick, 0),
          name,
          theirs: Math.max(race.lines - tick, 0),
        })}`
      : '';
    const verdict = this.verdict ?? '';
    band.hidden = !said && !verdict;
    const words = band.querySelector('p');
    if (words) words.textContent = verdict || said;
    if (said) this.parentNode.dataset.raceBand = said;
    else delete this.parentNode.dataset.raceBand;
    if (verdict) this.parentNode.dataset.raceVerdict = verdict;
    else delete this.parentNode.dataset.raceVerdict;
  }

  /** Ilda's verdict in the run shown, and when it is read to its end, by the scene's
   * clock (D234). */
  private verdict: string | null = null;
  private verdictRead = 0;

  /** The lines Ilda reads of the wizard's program in the run shown (D189). */
  private readLines = 0;

  /** A figure on an opening door's leaf walks aside to its tile along the row, in
   * the door's tick, the wizard as any other (D125). */
  private shove(event: WorldEvent, instant: boolean): void {
    const from = tileOf(event.data.from);
    const to = tileOf(event.data.to);
    if (!from || !to) return;
    const facing = towards(from, to);
    const id = String(event.data.id);
    this.shoved.add(id);
    if (id === 'wizard') {
      if (instant) {
        this.placeWizard(to, facing);
        return;
      }
      this.stopCast();
      this.placeWizard(from, facing);
      this.wizardTile = to;
      this.walk(this.wizard, facing, ...this.figureAt(to), this.playback.tickDuration * 0.9);
      this.step('wizard');
      return;
    }
    const actor = this.actors.get(id);
    if (!actor) return;
    this.tweens.killTweensOf(actor.sprite);
    actor.tile = to;
    actor.facing = facing;
    if (instant) {
      actor.sprite.setPosition(...this.figureAt(to));
      this.face(actor.sprite, facing);
      return;
    }
    actor.sprite.setPosition(...this.figureAt(from));
    this.walk(actor.sprite, facing, ...this.figureAt(to), this.playback.tickDuration * 0.9);
    this.step(id);
  }

  /** The names of the last sounds played, newest last, for the tests (data-sounds). */
  private readonly playedSounds: string[] = [];

  /** Each figure's last step, whether it was the lower one (D132). */
  private readonly lowerSteps = new Map<string, boolean>();

  /** A figure's step (D132): the wizard's, a grown-up's (figures.json's `adults`) or
   * a child's, every other one a little lower. */
  private step(id: string): void {
    // A familiar's steps are lighter than anyone's (D273), and quick (D277): a tap at most
    // every PAW_GAP of the page's clock, so that a run of them is heard as steps and not
    // as a noise.
    if (this.creatures.has(id)) {
      const now = this.time.now;
      if (now - (this.lastPaw.get(id) ?? Number.NEGATIVE_INFINITY) < PAW_GAP) return;
      this.lastPaw.set(id, now);
      this.playSound('step_child', 1.6);
      return;
    }
    const sheet = figureName(id, this.look);
    const name: StepName =
      id === 'wizard' ? 'step' : (this.art?.figures?.adults ?? []).includes(sheet) ? 'step_adult' : 'step_child';
    const lower = !this.lowerSteps.get(id);
    this.lowerSteps.set(id, lower);
    this.playSound(name, lower ? STEP_LOWER : 1);
  }

  /** A sound of the scene played (sfx.ts), and said on data-sounds. */
  private playSound(name: EffectName, pitch = 1): void {
    play(name, pitch);
    this.heard(name);
  }

  /** A sound named among data-sounds, muted or not: an effect, a gust (`wind`) or the
   * wind switched off at a landing (`set_down`). */
  private heard(name: string): void {
    this.playedSounds.push(name);
    if (this.playedSounds.length > SOUNDS_KEPT) this.playedSounds.shift();
    this.parentNode.dataset.sounds = this.playedSounds.join(',');
  }

  /** A hole held closed by osto: its hold kept, for its state at later ticks (D53, D167). */
  private hold(event: WorldEvent): void {
    const id = String(event.data.id);
    const held = { from: Number(event.data.from), until: Number(event.data.until) };
    this.holds.set(id, [...(this.holds.get(id) ?? []), held]);
  }

  /** A thing shown where it lies (D85): its whole outline drawn over whatever covers
   * it, beating, until it is picked up; data-revealed names the things shown. */
  private reveal(id: string, instant: boolean): void {
    const image = this.things.get(id);
    if (!image || this.revealed.has(id)) return;
    this.revealed.set(id, new Silhouette(this, image, [], this.still || instant, true));
    this.parentNode.dataset.revealed = [...this.revealed.keys()].join(',');
    if (!instant) play('cast');
  }

  private unreveal(id: string): void {
    const outline = this.revealed.get(id);
    if (!outline) return;
    outline.destroy();
    this.revealed.delete(id);
    if (this.revealed.size > 0) this.parentNode.dataset.revealed = [...this.revealed.keys()].join(',');
    else delete this.parentNode.dataset.revealed;
  }

  /** The wizard lies down in the bed beside it and sleeps (D84, D91); data-sleeping
   * names the bed. */
  private sleep(event: WorldEvent, instant: boolean): void {
    this.parentNode.dataset.sleeping = String(event.data.id);
    // The hop into the bed takes the sleep's tick (layDown, D130); the night waits
    // for it (D124).
    this.lyingUntil = this.time.now + (instant ? 0 : this.playback.tickDuration);
    if (!tileOf(event.data.bed)) return;
    this.stopCast();
    this.layDown(this.wizard, 'wizard', String(event.data.id), instant);
  }

  /** The beds' tiles, by their ids. */
  private bedTile(bed: string): Tile | null {
    return this.map.things.find((thing) => thing.kind === 'bed' && thing.id === bed)?.tile ?? null;
  }

  /** A figure laid in a bed (D91). On a painted scene that knows where the bed's
   * pillow is, with a lying frame on the figure's sheet: the figure goes there, then
   * takes that frame, turned along the bed with its head on the pillow, just under
   * the bed's quilt, which the scene's static things draw over it. Else the
   * standing figure, turned along the bed over it (D84). */
  private layDown(sprite: Phaser.GameObjects.Sprite, id: string, bed: string, instant: boolean): void {
    const tile = this.bedTile(bed);
    if (!tile) return;
    this.tweens.killTweensOf(sprite);
    const place = this.art?.scene.beds?.[bed];
    const figures = this.art?.figures;
    const frame = figures && sprite.texture.key.startsWith('fig-') ? sleepFrame(figures, figureName(id, this.look)) : null;
    if (place && figures && frame !== null) {
      const toward = place.toward === 'right' ? 1 : -1;
      // The figure's feet are its origin: they lie the head's reach from the pillow.
      const x = (place.head[0] - toward * figures.height_cells * HEAD_REACH) * TILE;
      const y = place.head[1] * TILE;
      const lie = () => {
        sprite.setFrame(frame).setAngle(90 * toward).setPosition(x, y).setDepth(sleeperDepth(place.row));
        this.asleep.set(sprite, { id, bed, lying: true });
        this.markAsleep();
      };
      if (instant || this.still) {
        lie();
        return;
      }
      // Seen going to bed (D130): the figure has walked to the floor under the
      // pillow, a cell a tick, the world's moves; from there, facing the bed, it hops
      // in an arc into the bed's place, takes its lying frame at the arc's top, and
      // settles lying there, under the quilt once it lands. Until then it stays in
      // front of the bed, at the depth it stood at.
      this.asleep.set(sprite, { id, bed, lying: false });
      this.markAsleep();
      this.face(sprite, place.head[1] * TILE < sprite.y ? 'up' : 'down');
      const from: [number, number] = [sprite.x, sprite.y];
      let turned = false;
      this.hopping.add(sprite);
      this.tweens.add({
        targets: sprite,
        x,
        y,
        duration: this.playback.tickDuration * HOP_TICKS,
        ease: 'Linear',
        onUpdate: (tween) => {
          sprite.setPosition(...hopAt(from, [x, y], tween.progress, HOP_RISE * TILE));
          if (!turned && hopTop(tween.progress)) {
            turned = true;
            sprite.setFrame(frame).setAngle(90 * toward);
          }
        },
        onComplete: () => {
          this.hopping.delete(sprite);
          lie();
        },
      });
      return;
    }
    this.asleep.set(sprite, { id, bed, lying: false });
    this.markAsleep();
    this.face(sprite, 'down');
    const [x, y] = this.figureAt(tile);
    const lying = { x: x - TILE * 0.55, y: y - TILE * 0.35, angle: 90 };
    if (instant || this.still) {
      sprite.setPosition(lying.x, lying.y).setAngle(lying.angle);
      return;
    }
    this.tweens.add({ targets: sprite, ...lying, duration: this.playback.tickDuration * 0.9, ease: 'Sine.easeInOut' });
  }

  /** A figure asleep gets up, and stands on its tile, the floor under the pillow,
   * facing a way. */
  private getUp(sprite: Phaser.GameObjects.Sprite, tile: Tile, facing: Facing, instant: boolean): void {
    this.hopping.delete(sprite);
    if (!this.asleep.delete(sprite)) return;
    this.markAsleep();
    this.tweens.killTweensOf(sprite);
    sprite.setAngle(0).setPosition(...this.figureAt(tile));
    this.face(sprite, facing);
    if (!instant && !this.still) {
      sprite.setAlpha(0);
      this.tweens.add({ targets: sprite, alpha: 1, duration: this.playback.tickDuration * 0.6 });
    } else sprite.setAlpha(1);
  }

  /** data-asleep, for the tests: who lies asleep in which bed, and how drawn. */
  private markAsleep(): void {
    const asleep = [...this.asleep.values()].map(({ id, bed, lying }) => `${id}:${bed}${lying ? ':lying' : ''}`);
    if (asleep.length > 0) this.parentNode.dataset.asleep = asleep.sort().join(',');
    else delete this.parentNode.dataset.asleep;
  }

  /** A thing drawn by a spell from where it lay to the wizard's tile (D47): it
   * leaves its place when the spell's light reaches it, and flies to the wizard's
   * hands, glowing when it is painted so, where it lands before the tick ends and
   * stays, held, in front of the wizard (D127). The world has it on the wizard's
   * tile: where it lies there is kept, for a thing set down. */
  private pull(event: WorldEvent, instant: boolean): void {
    const id = String(event.data.id);
    const image = this.things.get(id);
    const from = tileOf(event.data.from);
    const to = tileOf(event.data.to);
    if (!image || !to || !from) return;
    this.tweens.killTweensOf(image);
    const painted = this.art?.scene.things[this.artOf(id)];
    const floor =
      this.art && painted
        ? {
            x: image.x + (to[0] - from[0]) * TILE,
            y: image.y + (to[1] - from[1]) * TILE,
            depth: thingDepthOn(this.art, this.artOf(id), to, {
              inside: this.inside(to),
              lying: this.map.things.some((thing) => thing.id === id && thing.kind === 'key'),
            }),
          }
        : { x: centre(to)[0], y: centre(to)[1], depth: image.depth };
    this.inHands.set(id, floor);
    this.held.add(image);
    // A thing the spell takes glows as it comes, when it is painted so (D47).
    const glowing = `art-${this.artOf(id)}-pulled`;
    const key = this.textures.exists(glowing) ? glowing : image.texture.key;
    const [x, y] = this.handsFor(image, key);
    const depth = figureDepth(this.wizard.y / TILE) + 0.001;
    if (instant) {
      image.setTexture(key).setPosition(x, y).setDepth(depth).setVisible(true).setAlpha(1);
      return;
    }
    const { delay, flight } = pullTimes(this.lightReaches, this.playback.tickDuration);
    this.tweens.add({
      targets: image,
      x,
      y,
      delay,
      duration: flight,
      ease: 'Quad.easeIn',
      onStart: () => {
        if (key !== image.texture.key) crossfade(this, image, key, flight * 0.5);
        image.setDepth(depth);
      },
    });
  }

  /** Where an image is drawn for its middle to be at the wizard's hands. */
  private handsFor(image: Phaser.GameObjects.Image, key: string = image.texture.key): [number, number] {
    const [x, y] = [this.wizard.x, this.wizard.y - 16];
    if (image.originX !== 0 || !key.startsWith('art-')) return [x, y];
    const [mx, my] = middleOffset(image, key);
    return [x - mx, y - my];
  }

  /** Where an image's corner goes for its middle to lie on the middle of the figure
   * standing on a tile, half its height above its feet, as it is drawn there. */
  private middleOnFigure(image: Phaser.GameObjects.Image, tile: Tile): [number, number] {
    const [fx, fy] = this.figureAt(tile);
    const height = (this.art?.figures?.height_cells ?? 0.8) * TILE;
    const [x, y] = [fx, fy - height * 0.5];
    if (image.originX !== 0 || !image.texture.key.startsWith('art-')) return [x, y];
    const [mx, my] = middleOffset(image, image.texture.key);
    return [x - mx, y - my];
  }

  /** The things held in the wizard's hands set down where the world has them, on
   * the tile the spell brought them to, when the wizard does something else (D127). */
  private setDown(instant: boolean): void {
    for (const [id, floor] of this.inHands) {
      const image = this.things.get(id);
      if (!image) continue;
      this.tweens.killTweensOf(image);
      this.held.delete(image);
      image.setDepth(floor.depth);
      if (instant) image.setPosition(floor.x, floor.y);
      else this.tweens.add({ targets: image, x: floor.x, y: floor.y, duration: this.playback.tickDuration * 0.4 });
    }
    this.inHands.clear();
  }

  /** A thing handed to the actor beside the wizard: it floats over and fades (D48). */
  private give(event: WorldEvent, instant: boolean): void {
    const id = String(event.data.id);
    this.carried.delete(id);
    const actor = this.actors.get(String(event.data.to));
    const image = this.things.get(id);
    if (actor) {
      actor.facing = towards(actor.tile, this.wizardTile);
      this.face(actor.sprite, actor.facing);
      // The wizard turns to who takes the thing before it leaves the hands (D48).
      const turned = towards(this.wizardTile, actor.tile);
      this.face(this.wizard, turned);
      this.parentNode.dataset.givenFacing = turned;
    }
    if (!image || !actor) return;
    this.tweens.killTweensOf(image);
    if (instant) {
      image.setVisible(false);
      return;
    }
    image.setPosition(...this.handsFor(image)).setVisible(true).setAlpha(1);
    // Leaving the hands, it hides nothing of the wizard (silhouette.ts).
    this.held.add(image);
    // To the middle of the figure that takes it, where that figure is drawn, its
    // nudge and its lowering included (D48, D105): the image's middle, not its corner.
    const [x, y] = this.middleOnFigure(image, actor.tile);
    const middle = (px: number, py: number) => {
      const [mx, my] = image.originX === 0 ? middleOffset(image, image.texture.key) : [0, 0];
      return `${((px + mx) / TILE).toFixed(2)},${((py + my) / TILE).toFixed(2)}`;
    };
    this.parentNode.dataset.given = `${id}:${middle(image.x, image.y)}>${middle(x, y)}`;
    // Seen turned first, then the thing goes.
    this.tweens.add({
      targets: image,
      x,
      y,
      alpha: 0,
      delay: this.playback.tickDuration * GIVE_TURN,
      duration: this.playback.tickDuration * (0.9 - GIVE_TURN),
      onComplete: () => {
        image.setVisible(false).setAlpha(1);
        this.held.delete(image);
      },
    });
  }

  /** A door closed, in a story (D103): its closed picture, and the doorway's mark
   * hidden behind it again. */
  private closeDoor(id: string, instant = true): void {
    this.openDoors.delete(id);
    if (!instant) play('door');
    const lock = this.map.things.find((thing) => thing.id === id)?.lock ?? 'none';
    this.doorLook(id, false, lock, !instant);
  }

  /** A door opened. One opened by a word opens in the second half of the tick, once
   * the word is said, so that the child sees the word, then the door. */
  private openDoor(id: string, instant = true, byWord = false): void {
    this.openDoors.add(id);
    this.unseal(id, instant);
    if (!instant) play('door');
    const lock = this.map.things.find((thing) => thing.id === id)?.lock ?? 'none';
    if (instant || !byWord) {
      this.doorLook(id, true, lock, !instant);
      return;
    }
    const run = this.restarts;
    this.time.delayedCall(this.playback.tickDuration * 0.5, () => {
      if (run === this.restarts && this.openDoors.has(id)) this.doorLook(id, true, lock, true);
    });
  }

  /** The wizard playing a part of its sheet over `duration` (playFrames), its frames'
   * timers kept so that a restart or the next move drops them; data-casting is there
   * while it casts, data-acting names an act while it plays. Null for a sheet
   * without that part, and on a scene without art. */
  private playPart(part: Played, duration: number): Phaser.Time.TimerEvent[] | null {
    this.stopCast();
    const figures = this.art?.figures;
    if (!figures || this.still && part !== 'cast') return null;
    const timers = playFrames(this, this.wizard, figures, part, duration, this.wizardFacing());
    if (!timers) return null;
    if (part === 'cast') this.parentNode.dataset.casting = 'true';
    else this.parentNode.dataset.acting = part;
    this.casting = [...timers, this.time.delayedCall(duration, () => this.stopCast())];
    return timers;
  }

  /** A run played out (D175): the wizard celebrates it when it is won, and how long the
   * page waits before the card is the longest of that, the words on the scene read to
   * their end, and Ilda's verdict of a race read to its end (D234). */
  settle(won: boolean): number {
    const verdict = Math.max(0, this.verdictRead - this.time.now);
    // A set-down under way is waited for, and a run won is celebrated once the wizard's
    // feet are on its cell (D244).
    const down = this.settingDown();
    let party = 0;
    if (won && down > 0) {
      const run = this.restarts;
      this.time.delayedCall(down, () => {
        if (run !== this.restarts) return;
        this.touchDown(this.wizard);
        this.celebrate();
      });
      party = down + this.playback.tickDuration * 2;
    } else if (won) party = this.celebrate();
    return Math.max(party, down, this.speech.settle(), verdict);
  }

  /** After a run won, the wizard celebrates (14.3): how long it takes; 0 when it does
   * not, in a story, on a scene without art, or for a reader who asks for less motion. */
  private celebrate(): number {
    if (this.options.story) return 0;
    // A wizard asleep is not woken to celebrate: the night falls once it lies in its
    // bed, it sleeps, and the morning comes (D124); the card waits for all of it.
    if (this.parentNode.dataset.sleeping) {
      const wait = Math.max(0, this.lyingUntil - this.time.now);
      this.nightFall?.remove(false);
      this.nightFall = this.time.delayedCall(wait, () => this.light.fall(this.time.now));
      return wait + NIGHT_MS;
    }
    const duration = this.playback.tickDuration * 2;
    return this.playPart('win', duration) ? duration : 0;
  }

  /** The light drawn over the camera's view as it is now, and said on the scene's
   * node; the sleeper's thought while the night holds (D124). */
  private drawLight(): void {
    const look = this.light.at(this.time.now);
    const view = this.cameras.main.worldView;
    const cover = this.lightCover;
    if (cover.x !== view.x - 2 || cover.y !== view.y - 2) cover.setPosition(view.x - 2, view.y - 2);
    if (cover.width !== view.width + 4 || cover.height !== view.height + 4) cover.setSize(view.width + 4, view.height + 4);
    cover.setFillStyle(Phaser.Display.Color.GetColor(...look.colour), look.alpha);
    // The morning ground over the night one as the day comes (D126), said in
    // data-ground: `morning` once it is all there, `painting` otherwise.
    const morning = this.grounds.get('morning');
    if (morning && look.day !== this.shownDay) {
      this.shownDay = look.day;
      for (const image of morning) image.setAlpha(look.day);
      this.parentNode.dataset.ground = look.day >= 1 ? 'morning' : 'painting';
    }
    this.showHour(look.day);
    if (look.state === this.shownLight) return;
    this.shownLight = look.state;
    this.parentNode.dataset.light = look.state;
    if (look.state === 'night') this.speech.think(sleepingText(), this.shownTick, Number.POSITIVE_INFINITY);
    else if (look.state === 'dawning') this.speech.clearThought();
  }

  /** The things of a scene painted whole by morning, as much as the day is seen
   * (D126): each in its state's morning image once the day is all there; while it
   * comes, that image over its night one, `day` seen, in the same place. */
  private showHour(day: number): void {
    if (!this.art?.scene.hours?.morning) return;
    const suffix = hourKey('', 'morning');
    for (const [id, image] of this.things) {
      const key = image.texture.key;
      const night = key.endsWith(suffix) ? key.slice(0, -suffix.length) : key;
      const morning = hourKey(night, 'morning');
      const has = this.textures.exists(morning);
      const wanted = has && day >= 1 ? morning : night;
      if (key !== wanted) image.setTexture(wanted);
      const twin = this.dayTwins.get(id);
      if (!has || day <= 0 || day >= 1 || !image.visible) {
        twin?.setVisible(false);
        continue;
      }
      const shown = twin ?? this.add.image(image.x, image.y, morning);
      this.dayTwins.set(id, shown);
      shown
        .setTexture(morning)
        .setPosition(image.x, image.y)
        .setOrigin(image.originX, image.originY)
        .setScale(image.scaleX, image.scaleY)
        .setAngle(image.angle)
        .setDepth(image.depth + 0.00005)
        .setAlpha(image.alpha * day)
        .setVisible(true);
    }
  }

  /** The light laid over the scene: a story's morning; a sunset is a painting of its own,
   * and lays none (D273). */
  private lightName(): LightName {
    const light = this.options.story?.light;
    return light === 'sunset' || light === undefined ? 'none' : light;
  }

  /** A story told at an hour the scene is painted at, the sunset (D273): its ground and
   * rows at that hour shown over the painting's own, and each thing's picture at that
   * hour where it has one. */
  private paintHour(): void {
    const hour = this.options.story?.light === 'sunset' ? 'sunset' : null;
    if (!hour || !this.art?.scene.hours?.[hour]) {
      delete this.parentNode.dataset.hour;
      return;
    }
    // The hour the scene is shown at, for the tests (D280).
    this.parentNode.dataset.hour = hour;
    for (const image of this.grounds.get(hour) ?? []) image.setAlpha(1);
    for (const image of this.things.values()) {
      const key = hourKey(image.texture.key, hour);
      if (this.textures.exists(key)) image.setTexture(key);
    }
    this.parentNode.dataset.ground = hour;
  }

  /** The light back to what it is before a run: the painting's own, or the story's. */
  private resetLight(): void {
    this.nightFall?.remove(false);
    this.nightFall = null;
    this.light.set(this.lightName());
  }

  /** The frames still to come of the part the wizard plays, dropped; the part's end is
   * kept, and with it data-casting and data-acting for the part's length. */
  private dropPartFrames(): void {
    for (const timer of this.casting.slice(0, -1)) timer.remove(false);
    this.casting = this.casting.slice(-1);
  }

  /** A cast's frames stopped where they are, their timers dropped. */
  private stopCast(): void {
    for (const timer of this.casting) timer.remove(false);
    this.casting = [];
    delete this.parentNode.dataset.casting;
    delete this.parentNode.dataset.acting;
  }

  /** The way the wizard faces, as the scene keeps it (D241). */
  private wizardFacing(): Facing {
    return this.wayOf(this.wizard);
  }

  /** A spell cast (D42, D81): a point of light leaves the wand's tip once the wand
   * is pointed, flies to the thing the spell takes (D127), or a tile ahead, and
   * bursts there in a ring that fades; when it gets there is kept for the thing. */
  private castLight(duration: number): void {
    const [dx, dy] = DELTA[this.wizardFacing()];
    const lift = this.art ? TILE * 0.55 : 6;
    const [x0, y0] = [this.wizard.x + dx * TILE * 0.3, this.wizard.y - lift + dy * TILE * 0.15];
    const target = this.pulling ? this.things.get(this.pulling) : undefined;
    const [x1, y1] = target
      ? target.originX === 0
        ? drawnMiddle(target).map((cells) => cells * TILE)
        : [target.x, target.y]
      : [this.wizard.x + dx * TILE, this.wizard.y - lift + dy * TILE * 0.8];
    const { delay, flight, reaches } = lightTimes(duration);
    this.lightReaches = reaches;
    const dot = this.add.circle(x0, y0, 5, 0xffffff, 1).setBlendMode(Phaser.BlendModes.ADD).setDepth(5);
    const halo = this.add.circle(x0, y0, 11, 0xfff3bf, 0.6).setBlendMode(Phaser.BlendModes.ADD).setDepth(5);
    this.tweens.add({
      targets: [dot, halo],
      x: x1,
      y: y1,
      delay,
      duration: flight,
      ease: 'Quad.easeOut',
      onComplete: () => {
        dot.destroy();
        halo.destroy();
        const ring = this.add.circle(x1, y1, 8, 0xfff3bf, 0.9).setBlendMode(Phaser.BlendModes.ADD).setDepth(5);
        this.tweens.add({ targets: ring, scale: 3, alpha: 0, duration: duration * LIGHT_RING, onComplete: () => ring.destroy() });
      },
    });
  }

  private showWizard(tick: number, event: WorldEvent, instant: boolean): void {
    const facing = isFacing(event.data.facing) ? event.data.facing : null;
    const duration = this.playback.tickDuration * 0.9;
    // What the hands hold is picked up, or set down when the wizard does anything else.
    if (event.kind !== 'pick_up' && event.kind !== 'cast') this.setDown(instant);
    switch (event.kind) {
      case 'move': {
        const from = tileOf(event.data.from);
        const to = tileOf(event.data.to);
        if (!from || !to) return;
        // A flown command is a gust (D243).
        const flown = event.data.flying === true;
        if (flown) this.gust(event, instant);
        if (instant) {
          this.placeWizard(to, facing ?? 'down');
          this.enchantedStep(this.wizard, from, to, 0, true);
          break;
        }
        this.stopCast();
        // A flown step takes a third of a walked one, with no step's tap (D185), and
        // glides on from the step before with no rest (D259).
        if (flown) {
          this.glideStep(this.wizard, 'wizard', tick, from, to);
          this.wizardTile = to;
          this.enchantedStep(this.wizard, from, to, duration * FLOWN, false);
          break;
        }
        this.placeWizard(from, facing ?? 'down');
        this.wizardTile = to;
        const [x, y] = this.figureAt(to);
        // A walked step lasts the ticks it takes, as they are played (D225, D277).
        const walked = duration * this.playback.span(stepTicks(event));
        this.walk(this.wizard, facing ?? 'down', x, y, walked);
        this.enchantedStep(this.wizard, from, to, walked, false);
        this.step('wizard');
        break;
      }
      case 'untie': {
        // The wizard bends over the broom and unties its knot (D183).
        const id = String(event.data.id);
        this.untied.add(id);
        if (!instant) {
          this.playPart('pickup', this.playback.tickDuration * LONG * 0.95);
          play('pick_up');
        }
        break;
      }
      case 'bump': {
        const at = tileOf(event.data.at);
        if (!at) return;
        this.placeWizard(at, facing ?? 'down');
        if (!instant) this.nudge(this.wizard, facing ?? 'down', duration);
        if (!instant) play('bump');
        // A bump in the air ends the gust at once (D243).
        if (!instant && this.inAir(this.wizard)) this.wind.drop(WIND_BUMP);
        // A friend in the way: the wizard thinks who (D66); a ring's side, a tree's
        // crown or a wall in a flight's way, what it is (D186, D187).
        if (!instant && event.data.by === 'friend') {
          const who = friendText(String(event.data.id));
          this.speech.think(who, tick, this.sayTicks(who), AFTER_BUMP_MS);
        } else if (!instant && (event.data.by === 'high' || event.data.by === 'ring')) {
          const why = bumpText(String(event.data.by), typeof event.data.kind === 'string' ? event.data.kind : null);
          this.speech.think(why, tick, this.sayTicks(why), AFTER_BUMP_MS);
        } else if (!instant && (event.data.by === 'familiar' || event.data.kind === 'passage')) {
          // A familiar in the way, or a familiars' passage, where the wizard does not fit
          // (D270).
          const why = event.data.by === 'familiar' ? t('blocked.familiar') : t('blocked.passage');
          this.speech.think(why, tick, this.sayTicks(why), AFTER_BUMP_MS);
        }
        break;
      }
      case 'say':
        if (!instant) {
          const said = String(event.data.text ?? '');
          this.sayOnArrival(() => {
            this.speech.say(said, tick, this.sayTicks(said), this.wizard, 'wizard');
            play('say');
          });
        }
        break;
      case 'turn':
        if (facing) this.face(this.wizard, facing);
        break;
      case 'reveal':
        this.reveal(String(event.data.id), instant);
        break;
      case 'sleep':
        this.sleep(event, instant);
        break;
      case 'wake':
        delete this.parentNode.dataset.sleeping;
        this.getUp(this.wizard, this.wizardTile, 'down', instant);
        break;
      case 'pick_up': {
        const id = String(event.data.id);
        this.unreveal(id);
        const image = this.things.get(id);
        const held = this.inHands.delete(id);
        this.setDown(instant);
        const taking = this.playback.tickDuration * LONG * 0.95;
        if (image && instant) {
          this.tweens.killTweensOf(image);
          this.held.delete(image);
          image.setVisible(false);
        } else if (image && held) {
          // In the hands already (D127): the hands close on it, no second rise; it
          // fades where it is over the pick-up frames' last third.
          this.tweens.killTweensOf(image);
          this.tweens.add({
            targets: image,
            alpha: 0,
            delay: (taking * 2) / 3,
            duration: taking / 3,
            onComplete: () => {
              image.setVisible(false).setAlpha(1);
              this.held.delete(image);
              this.publishDrawn();
            },
          });
        } else if (image) {
          this.tweens.add({
            targets: image,
            y: image.y - 16,
            alpha: 0,
            duration,
            onComplete: () => image.setVisible(false).setAlpha(1),
          });
        }
        this.carried.add(id);
        if (!instant) {
          // The wizard bends and takes it, as the thing goes (14.3).
          this.playPart('pickup', taking);
          play('pick_up');
        }
        break;
      }
      case 'open':
        this.openDoor(String(event.data.id), instant);
        break;
      case 'close':
        this.closeDoor(String(event.data.id), instant);
        break;
      case 'cast':
        if (!instant) {
          // The wand raised, pointed and lowered, on a sheet that has it, taking
          // longer than the tick so that the wand is seen out; its light flies.
          const casting = this.playback.tickDuration * LONG * 0.95;
          const timers = this.playPart('cast', casting);
          this.castLight(timers ? casting : duration);
          play('cast');
        }
        break;
      // At the end of a part, the wizard walks out of the scene with the others (D310,
      // D319).
      case 'leave':
        this.leave(this.wizard);
        break;
      case 'give':
        this.unreveal(String(event.data.id));
        this.give(event, instant);
        break;
      case 'blocked': {
        // The wizard thinks why; and when it did try, what would not do shakes:
        // a locked door, or the wizard with nothing to pick up (D28). From too
        // far away there was nothing to try, so nothing shakes. A step refused
        // turns the wizard the way it would have gone (D84).
        if (facing) this.face(this.wizard, facing);
        if (instant) break;
        const by = String(event.data.by);
        // What the first year does not allow is told by Orla or the book (D261, D264).
        if (by === 'orla' || by === 'book') break;
        // A familiar moved before it is called (D270), or told to pick up where nothing
        // lies, which it tries (D278).
        if (this.creatures.has(by) || this.called.has(by) || by.startsWith('familiar')) {
          const reason = { not_here: 'not_called', nothing: 'familiar_nothing' }[String(event.data.reason)];
          const why = blockedText(reason ?? String(event.data.reason), null);
          this.speech.think(why, tick, this.sayTicks(why));
          const tried = this.actors.get(by)?.sprite;
          if (event.data.tried === true && tried) this.shake(tried, duration);
          break;
        }
        const thing = this.map.things.find((t) => t.id === by);
        const detail = {
          ...(typeof event.data.spell === 'string' ? { spell: event.data.spell } : {}),
          ...(Array.isArray(event.data.things) ? { things: event.data.things.map(String) } : {}),
          ...(typeof event.data.kind === 'string' ? { kind: event.data.kind } : {}),
        };
        const why = blockedText(String(event.data.reason), thing?.kind ?? null, detail);
        // drevo cast over a cell no one walks on, and a turn inside a ring that rubs its
        // rim: each sounds as a bump does, and the wizard stays in the air (D215, D226);
        // the rim nudges the wizard the way it turned, as a bump does; the thought comes
        // after the bump is seen (D237). Any other refusal is thought at once.
        const bumped = event.data.reason === 'no_landing' || event.data.reason === 'ring_rim';
        this.speech.think(why, tick, this.sayTicks(why), bumped ? AFTER_BUMP_MS : 0);
        if (event.data.tried === true) this.shake(this.things.get(by) ?? this.wizard, duration);
        if (bumped) this.playSound('bump');
        // Stopped in the air, the gust ends at once (D243).
        if (bumped) this.wind.drop(WIND_BUMP);
        if (event.data.reason === 'ring_rim') this.nudge(this.wizard, facing ?? 'right', duration);
        break;
      }
      // 'wait': the wizard stands still while the world moves on.
    }
  }

  /** The placeholder a familiar is drawn with on a scene with no sheet for it, a small
   * round creature, and the light a spark is drawn with (D263). */
  private makeCreatureTextures(): void {
    if (!this.textures.exists(CREATURE_KEY)) {
      const texture = this.textures.createCanvas(CREATURE_KEY, 28, 24);
      const ctx = texture?.getContext();
      if (texture && ctx) {
        ctx.fillStyle = '#d9822b';
        ctx.strokeStyle = '#2a1a10';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(12, 16, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(20, 9, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        texture.refresh();
      }
    }
    if (!this.textures.exists(SPARK_KEY)) {
      const texture = this.textures.createCanvas(SPARK_KEY, 32, 32);
      const ctx = texture?.getContext();
      if (texture && ctx) {
        const glow = ctx.createRadialGradient(16, 16, 1, 16, 16, 15);
        glow.addColorStop(0, 'rgba(255, 251, 230, 0.95)');
        glow.addColorStop(1, 'rgba(255, 236, 160, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 32, 32);
        ctx.fillStyle = 'rgba(255, 252, 235, 0.95)';
        ctx.beginPath();
        for (const [x, y] of [[16, 1], [19, 13], [31, 16], [19, 19], [16, 31], [13, 19], [1, 16], [13, 13]] as const) {
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        texture.refresh();
      }
    }
  }

  /** A familiar's texture for its look (D263): its sheet, alive; a trial's made from that
   * sheet, frame by frame, with its colour or, from the kind's first sheet, with none;
   * null where the sheet is not there. */
  private creatureTexture(look: CreatureLook): string | null {
    if (look.look === 'spark' || !look.sheet) return null;
    const source = `fig-${look.sheet}`;
    const figures = this.art?.figures;
    if (!figures || !this.textures.exists(source)) return null;
    if (look.look === 'living') return source;
    const pale = look.look === 'pale';
    const key = `fig-trial-${pale ? 'pale' : 'good'}-${look.sheet}`;
    if (this.textures.exists(key)) return key;
    const image = this.textures.get(source).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const [width, height] = [image.width, image.height];
    const drawn = document.createElement('canvas');
    [drawn.width, drawn.height] = [width, height];
    const context = drawn.getContext('2d', { willReadFrequently: true });
    const texture = this.textures.createCanvas(key, width, height);
    const ctx = texture?.getContext();
    if (!context || !texture || !ctx || width === 0) return null;
    context.drawImage(image, 0, 0);
    const sheet: Pixels = { width, height, data: context.getImageData(0, 0, width, height).data };
    const made = trialSheet(sheet, figures.frame, figures.cell, pale);
    ctx.putImageData(new ImageData(made.data as Uint8ClampedArray<ArrayBuffer>, width, height), 0, 0);
    // The trial's frames where the creature's sheet has its own.
    const [frameWidth, frameHeight] = figures.frame;
    let index = 0;
    for (let top = 0; top + frameHeight <= height; top += frameHeight) {
      for (let left = 0; left + frameWidth <= width; left += frameWidth) {
        texture.add(index, 0, left, top, frameWidth, frameHeight);
        index += 1;
      }
    }
    texture.refresh();
    return key;
  }

  /** A familiar's figure, drawn as its look says, standing on a tile (D263, D273). */
  private creatureSprite(look: CreatureLook, tile: Tile, facing: Facing): Phaser.GameObjects.Sprite {
    const figures = this.art?.figures;
    const key = this.creatureTexture(look);
    let sprite: Phaser.GameObjects.Sprite;
    if (figures && key) {
      sprite = this.add.sprite(...this.figureAt(tile), key, SHEET_ROW[facing] * 3 + figures.standing);
      sprite.setOrigin(0.5, 1 - figures.foot / figures.frame[1]).setScale(TILE / figures.cell);
    } else {
      const placeholder = look.look === 'spark' ? SPARK_KEY : CREATURE_KEY;
      sprite = this.add.sprite(...this.figureAt(tile), placeholder).setOrigin(0.5, 0.9);
      if (look.look === 'pale') sprite.setAlpha(0.45);
      else if (look.look === 'good') sprite.setAlpha(0.8);
    }
    sprite.setDepth(3);
    this.ways.set(sprite, facing);
    if (look.look === 'spark') this.flicker(sprite);
    return sprite;
  }

  /** A familiar drawn again in another look (D268): a trial born, alive at last; the
   * room-mate's copy drawn again from the trial called. */
  private relook(id: string, look: CreatureLook): void {
    const actor = this.actors.get(id);
    if (!actor) return;
    this.creatures.set(id, look);
    this.tweens.killTweensOf(actor.sprite);
    const key = this.creatureTexture(look);
    const figures = this.art?.figures;
    if (key && figures) {
      actor.sprite.setTexture(key).setAlpha(1).setScale(TILE / figures.cell);
      actor.sprite.setOrigin(0.5, 1 - figures.foot / figures.frame[1]);
      this.face(actor.sprite, actor.facing);
    } else {
      actor.sprite.setTexture(look.look === 'spark' ? SPARK_KEY : CREATURE_KEY).setOrigin(0.5, 0.9);
      actor.sprite.setAlpha(look.look === 'pale' ? 0.45 : look.look === 'good' ? 0.8 : 1);
    }
    if (look.look === 'spark') this.flicker(actor.sprite);
  }

  /** A spark's light, flickering where a trial would stand, with no figure (D263). */
  private flicker(sprite: Phaser.GameObjects.Sprite): void {
    if (this.still) return;
    this.tweens.add({
      targets: sprite,
      alpha: { from: 0.35, to: 1 },
      duration: 130,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /** Each trial with no colour trembles: its picture moved a pixel of its sheet to each
   * side, about eight times a second, by its origin, so that no walk is touched (D263). */
  private trembleTrials(): void {
    const figures = this.art?.figures;
    if (!figures) return;
    const side = this.still ? 0 : Math.floor(this.time.now / TREMBLE_MS) % 2 === 0 ? 1 : -1;
    for (const [id, look] of this.creatures) {
      if (look.look !== 'pale') continue;
      const sprite = this.actors.get(id)?.sprite;
      if (!sprite?.texture.key.startsWith('fig-')) continue;
      sprite.setOrigin(0.5 - (side * TREMBLE_PX) / figures.frame[0], sprite.originY);
    }
  }

  /** The level's start card closed (SceneHandle, D276). */
  cardClosed(): void {
    this.startClosed = true;
    if (this.playback.state === 'idle') this.hallShow?.startDrill();
  }

  /** The hall at work (D300): the room-mate's tries on the cell of the actor that has
   * them, and the friend's orders to her familiar round its drill. */
  private hallShow: HallShow | null = null;

  private hallAtWork(): void {
    const tries = this.map.actors.find((actor) => actor.tries)?.id ?? null;
    const drilled = this.map.actors.find((actor) => actor.drill && actor.drill.length > 0);
    if (!tries && !drilled) return;
    const name = forWizard('{friend_familiar}');
    this.hallShow = new HallShow(
      {
        scene: this,
        parent: this.parentNode,
        still: this.still,
        kinds: familiarTable()?.kinds ?? {},
        creature: (look, at) => this.creatureSprite(look, at, 'down'),
        lookOf: (attempt) => {
          const kind = attempt.kind ?? '';
          const sheet = attempt.look === 'spark' ? null : attempt.color ? sheetOf(kind, attempt.color) : firstSheet(kind, familiarTable());
          return { kind, color: attempt.color, look: attempt.look, sheet };
        },
        actor: (id) => {
          const state = this.actors.get(id);
          return state ? { sprite: state.sprite, tile: state.tile, facing: state.facing } : null;
        },
        figureAt: (tile) => this.figureAt(tile),
        walk: (sprite, facing, x, y, ms) => this.walk(sprite, facing, x, y, ms),
        face: (sprite, facing) => this.face(sprite, facing),
        say: (text, over, who) => this.speech.say(text, this.shownTick, Number.POSITIVE_INFINITY, over, who),
        unsay: () => this.speech.clearBubble(),
        order: (key) => t(key, { name }),
        stepMs: this.playback.tickDuration * FAMILIAR_PACE * 0.9,
      },
      tries,
      // A familiar is ordered by the one whose it is: the friend's, `friend_familiar`.
      drilled ? { id: drilled.id, owner: drilled.id.replace(/_familiar$/, ''), loop: drilled.drill ?? [] } : null,
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.hallShow?.destroy());
  }

  /** Each trial that does not hold, seen and then fading (`trialLeft`, D276, D285): a
   * called one's seconds shorter as the speed is higher, a staged one's the page's plain
   * clock from the start card's close; both waiting while the run is paused. */
  private fadeTrials(delta: number): void {
    if (this.fading.size === 0 || this.playback.state === 'paused') return;
    for (const [id, trial] of this.fading) {
      if (trial.staged && !this.startClosed) continue;
      const sprite = this.actors.get(id)?.sprite;
      if (!sprite) {
        this.fading.delete(id);
        continue;
      }
      trial.left = trialLeft(trial.left, delta, this.playback.speed, trial.staged);
      if (trial.left <= 0) this.trialGone(id);
      // Whole until its fade, which the tween of its coming leaves alone.
      else if (trialShown(trial.left) < 1) sprite.setAlpha(trial.alpha * trialShown(trial.left));
    }
  }

  /** A trial that does not hold, gone (D276); a staged one stays gone in this visit. */
  private trialGone(id: string): void {
    const trial = this.fading.get(id);
    this.fading.delete(id);
    const sprite = this.actors.get(id)?.sprite;
    if (!sprite) return;
    this.tweens.killTweensOf(sprite);
    sprite.setVisible(false);
    if (trial?.staged) this.fadedStaged.add(id);
    this.publish();
  }

  /** A trial that steps (the birth level, D268) has its seconds counted from its last
   * step (D276). */
  private trialStepped(id: string, tick: number): void {
    const trial = this.fading.get(id);
    if (!trial) return;
    trial.left = trialTime(trial.staged);
    trial.tick = tick;
    this.actors.get(id)?.sprite.setAlpha(trial.alpha);
  }

  /** The familiars as they were before the run (D262, D268): the trials the run called
   * gone, the child's familiar on its cell, the others' as the level has them, no
   * footprint, no plate lit, the book's band empty. */
  private restartFamiliars(): void {
    for (const id of this.called) {
      this.actors.get(id)?.sprite.destroy();
      this.actors.delete(id);
      this.creatures.delete(id);
      this.fading.delete(id);
    }
    this.called.clear();
    this.sideBySide.clear();
    for (const object of this.footprints) object.destroy();
    this.footprints = [];
    for (const actor of this.map.actors) if (actor.creature) this.relook(actor.id, actor.creature);
    const living = this.map.living;
    const state = this.actors.get('familiar');
    if (living && state) {
      this.tweens.killTweensOf(state.sprite);
      state.tile = living.tile;
      state.facing = living.facing;
      state.sprite.setPosition(...this.figureAt(living.tile)).setVisible(true).setAngle(0);
      this.relook('familiar', living.creature);
    }
    for (const thing of this.map.things) if (thing.kind === 'plate') this.plateLook(thing.id, false);
    this.litPlates.clear();
    this.toldKeys = [];
    delete this.parentNode.dataset.told;
    delete this.parentNode.dataset.footprints;
    this.bookSaid = null;
    this.bookBand();
  }

  /** A familiar's trial and book, its steps held, its birth and its words (D262 to D270). */
  /** Another familiar standing on a cell a familiar steps onto (D302), or null: who is
   * a familiar is said by its creature's look. The pairs side by side are told in
   * data-shared. */
  private sharedWith(id: string, tile: Tile): ActorState | null {
    if (!this.creatures.has(id)) return null;
    for (const [other, look] of this.creatures) {
      const state = this.actors.get(other);
      if (other === id || look.look === 'spark' || !state?.sprite.visible) continue;
      if (state.tile[0] === tile[0] && state.tile[1] === tile[1]) {
        this.sideBySide.set(id, `${other}+${id}:${tile[0]},${tile[1]}`);
        return state;
      }
    }
    return null;
  }

  private showFamiliar(tick: number, event: WorldEvent, instant: boolean): void {
    const data = event.data;
    const duration = this.playback.tickDuration * 0.9;
    switch (event.kind) {
      case 'trial': {
        const id = String(data.id);
        const at = tileOf(data.at);
        if (!at) return;
        if (typeof data.dissolved === 'string') this.dissolve(data.dissolved, instant);
        const kind = String(data.kind);
        const color = typeof data.color === 'string' ? data.color : null;
        const look: CreatureLook = {
          kind,
          color,
          look: data.pale === true ? 'pale' : 'good',
          sheet: color ? sheetOf(kind, color) : firstSheet(kind, familiarTable()),
        };
        this.actors.get(id)?.sprite.destroy();
        const sprite = this.creatureSprite(look, at, 'down');
        this.actors.set(id, { sprite, tile: at, facing: 'down', sight: 0 });
        this.creatures.set(id, look);
        this.called.add(id);
        // A trial with no name the book took, or no colour of its kind, fades (D276).
        if (data.holds !== true) {
          this.fading.set(id, { left: trialTime(false), alpha: sprite.alpha, tick, staged: false });
        }
        if (!instant) {
          const alpha = sprite.alpha;
          sprite.setAlpha(0);
          this.tweens.add({ targets: sprite, alpha, duration });
          this.burst(at);
          play('trial');
        }
        break;
      }
      case 'spark': {
        const at = tileOf(data.at);
        if (!at || instant) return;
        const spark = this.creatureSprite({ kind: '', color: null, look: 'spark', sheet: null }, at, 'down');
        this.footprints.push(spark);
        this.time.delayedCall(this.playback.tickDuration * 3, () => {
          if (!spark.active) return;
          this.tweens.killTweensOf(spark);
          this.tweens.add({ targets: spark, alpha: 0, duration: 300, onComplete: () => spark.destroy() });
        });
        play('trial', 0.6);
        break;
      }
      case 'held': {
        // The step that would leave the circle, held at its edge (D268).
        this.trialStepped(event.actor, tick);
        const actor = this.actors.get(event.actor);
        const facing = isFacing(data.facing) ? data.facing : 'down';
        if (actor && !instant) {
          this.face(actor.sprite, facing);
          this.nudge(actor.sprite, facing, duration);
          play('bump');
        }
        const to = tileOf(data.to);
        if (to) this.footprint(to, instant);
        break;
      }
      case 'footprint': {
        const at = tileOf(data.at);
        if (at) this.footprint(at, instant);
        break;
      }
      case 'born': {
        const id = String(data.id);
        this.fading.delete(id);
        const look = this.creatures.get(id);
        if (look && look.look !== 'living') {
          const sheet = look.color ? sheetOf(look.kind, look.color) : look.sheet;
          this.relook(id, { ...look, look: 'living', sheet });
          const at = tileOf(data.at);
          if (at && !instant) {
            this.burst(at);
            play('cast', 0.8);
          }
        }
        break;
      }
      case 'puzzled': {
        // A familiar told what it does not know tilts its head (D269).
        const actor = this.actors.get(String(data.id));
        if (actor && !instant) {
          this.tweens.add({ targets: actor.sprite, angle: 16, duration: duration / 3, yoyo: true, hold: duration / 3 });
        }
        break;
      }
      case 'pick_up': {
        // A familiar picks up a piece of thread where its move ends (D270).
        const image = this.things.get(String(data.id));
        if (!image) break;
        this.tweens.killTweensOf(image);
        if (instant) image.setVisible(false);
        else {
          this.tweens.add({
            targets: image,
            y: image.y - 8,
            alpha: 0,
            duration,
            onComplete: () => image.setVisible(false).setAlpha(1),
          });
          play('pick_up', 1.4);
        }
        break;
      }
      case 'hand_over':
        // What the familiar carries, in the wizard's hands now (D262).
        for (const id of Array.isArray(data.things) ? data.things : []) this.carried.add(String(id));
        if (!instant) play('pick_up');
        break;
      case 'lit': {
        const id = String(data.id);
        this.litPlates.add(id);
        this.plateLook(id, true);
        if (!instant) play('trial', 1.3);
        break;
      }
      case 'copied': {
        // The room-mate copies the trial called (D268).
        const kind = String(data.kind);
        const color = typeof data.color === 'string' ? data.color : null;
        const before = this.creatures.get(String(data.id));
        this.relook(String(data.id), {
          kind,
          color,
          look: before?.look === 'living' ? 'living' : color ? 'good' : 'pale',
          sheet: color ? sheetOf(kind, color) : firstSheet(kind, familiarTable()),
        });
        break;
      }
      case 'told':
        this.tell(tick, data, instant);
        break;
      case 'book':
        this.bookSaid = bookText(data);
        if (!instant) play('pick_up', 0.7);
        break;
      case 'order':
        this.bookSaid = bookText(data, true);
        // The command said in this tick holds nothing of it (D303).
        this.ordering = true;
        break;
      case 'blocked': {
        // A familiar called back that finds no way (D262).
        if (instant) break;
        const why = blockedText(String(data.reason), null);
        this.speech.think(why, tick, this.sayTicks(why));
        break;
      }
      // 'learned': the familiar's class took a method; nothing is seen of it.
    }
  }

  /** A trial dissolved by the next one called onto its cell (D262). */
  private dissolve(id: string, instant: boolean): void {
    const actor = this.actors.get(id);
    if (!actor) return;
    this.actors.delete(id);
    this.creatures.delete(id);
    this.called.delete(id);
    this.fading.delete(id);
    // A trial already faded is not there to dissolve (D276).
    if (instant || !actor.sprite.visible) {
      actor.sprite.destroy();
      return;
    }
    this.tweens.killTweensOf(actor.sprite);
    this.tweens.add({ targets: actor.sprite, alpha: 0, duration: this.playback.tickDuration * 0.5, onComplete: () => actor.sprite.destroy() });
  }

  /** A footprint of light on a cell, where a held trial would have gone (D268): two
   * small marks on the floor, under whoever stands there. */
  private footprint(tile: Tile, instant: boolean): void {
    const [x, y] = this.figureAt(tile);
    const marks = this.add.container(x, y - TILE * 0.08).setDepth(MARK_DEPTH + 0.01);
    for (const [dx, dy] of [[-5, 2], [5, -3]] as const) {
      marks.add(this.add.ellipse(dx, dy, 9, 5, 0xfff3c4, 0.85).setStrokeStyle(1.5, 0xffd75e, 0.9));
    }
    if (!instant) {
      marks.setAlpha(0);
      this.tweens.add({ targets: marks, alpha: 1, duration: this.playback.tickDuration * 0.6 });
    }
    this.footprints.push(marks);
    this.parentNode.dataset.footprints = String(this.footprints.filter((object) => object instanceof Phaser.GameObjects.Container).length);
  }

  /** A footprint's bump: a flash where the held trial's way would have bumped (D268). */
  private footprintBump(tile: Tile, facing: Facing): void {
    const [x, y] = this.figureAt(tile);
    const [dx, dy] = DELTA[facing];
    const flash = this.add.circle(x + dx * TILE * 0.4, y - TILE * 0.2 + dy * TILE * 0.4, TILE * 0.18, 0xfff3c4, 0.9);
    flash.setDepth(MARK_DEPTH + 0.02);
    this.footprints.push(flash);
    this.tweens.add({ targets: flash, alpha: 0, scale: 1.8, duration: this.playback.tickDuration, onComplete: () => flash.setVisible(false) });
    play('bump', 1.4);
  }

  /** A burst of light over a cell: a trial coming, or a familiar born (D263, D268). */
  private burst(tile: Tile): void {
    if (this.still) return;
    const [x, y] = this.figureAt(tile);
    const ring = this.add.circle(x, y - TILE * 0.3, TILE * 0.25, 0xfffbe6, 0.7).setDepth(overDepth(this.map.height));
    this.tweens.add({ targets: ring, alpha: 0, scale: 2.4, duration: this.playback.tickDuration * 1.2, onComplete: () => ring.destroy() });
  }

  /** A brass plate lit, or back as it lies (D270): its picture lit, where the scene has
   * one; unlit, its other picture, or none, the painting's own plate. */
  private plateLook(id: string, lit: boolean): void {
    const image = this.things.get(id);
    const painted = this.art?.scene.things[this.artOf(id)];
    if (!image || !painted) return;
    const shown = lit ? 'lit' : Object.keys(painted.states).find((state) => state !== 'lit');
    const key = shown ? `art-${this.artOf(id)}-${shown}` : null;
    if (key && this.textures.exists(key)) image.setTexture(key).setVisible(true);
    else image.setVisible(false);
  }

  /** Someone says something while the program runs (D264): a bubble over who says it, or
   * from the spot the scene names for a voice painted into it, or the book's band; the
   * playback holds until the words are read. Words in several pieces are said in a
   * bubble each, one after another (D274). */
  private tell(tick: number, data: Record<string, unknown>, instant: boolean): void {
    const who = String(data.who);
    const text = toldText(data, this.options.told);
    this.toldKeys.push(`${who}:${String(data.key)}`);
    this.parentNode.dataset.told = this.toldKeys.join(',');
    // Each piece is read for as long as it takes, the longest hold at most (D274).
    const pieces = toldPieces(text);
    const reading = pieces.map((piece) => Math.min(readingMs(piece), TOLD_MOST));
    // Words told in the tick by another before are read first (D264).
    const later = this.toldMs > 0;
    const before = this.toldMs;
    if (who === 'book') {
      this.bookSaid = { words: toldWhole(text), code: '', look: 'told' };
    } else {
      const sprite = who === 'wizard' ? this.wizard : (this.actors.get(who)?.sprite ?? this.voiceSprite(who));
      if (!sprite) return;
      if (instant) {
        // Under the slider, the words as they end.
        const last = pieces[pieces.length - 1] ?? text;
        this.speech.say(last, tick, this.sayTicks(last), sprite, who);
      } else {
        let after = this.toldMs;
        const said = pieces.map((piece, index) => {
          const one = { text: piece, ticks: this.sayTicks(piece), after: after / this.playback.speed };
          after += reading[index] ?? 0;
          return one;
        });
        if (later) this.speech.sayAfter(said, sprite, who, () => play('say'));
        else this.speech.sayPieces(said, tick, sprite, who, () => play('say'));
        this.toldMs = after;
      }
    }
    if (!instant) {
      if (who === 'book' || !later) play('say');
      // In an order's tick, the command is read while the familiar walks (D303).
      const whole =
        who === 'book'
          ? Math.min(readingMs(toldWhole(text)), TOLD_MOST)
          : toldHold(reading, before, this.ordering && who === 'orla');
      this.playback.holdTick(whole, whole);
    }
  }

  /** Where a voice painted into the scene speaks from (D264): a figure no one sees, on the
   * spot the scene names, for its bubble to point at. */
  private voiceSprite(who: string): Phaser.GameObjects.Sprite | null {
    const known = this.voiceSprites.get(who);
    if (known) return known;
    const spot = this.map.voices[who];
    if (!spot) return null;
    const sprite = this.add.sprite(...this.figureAt(spot), CREATURE_KEY).setOrigin(0.5, 0.9).setAlpha(0);
    this.voiceSprites.set(who, sprite);
    return sprite;
  }

  /** The book's band under the scene (D267): the line that conjures the trial, tried by
   * the book or written in it by Orla, its words when the class cannot, a kind's colours,
   * the line Orla's order runs; hidden while it has nothing to say. */
  private bookBand(): void {
    let band = this.parentNode.querySelector<HTMLElement>('.book-band');
    const said = this.bookSaid;
    if (!said) {
      if (band) band.hidden = true;
      delete this.parentNode.dataset.bookBand;
      return;
    }
    if (!band) {
      band = document.createElement('div');
      band.className = 'book-band';
      band.append(document.createElement('p'), document.createElement('code'));
      this.parentNode.append(band);
    }
    band.hidden = false;
    band.dataset.look = said.look;
    const words = band.querySelector('p');
    const code = band.querySelector('code');
    if (words) {
      words.textContent = said.words;
      words.hidden = said.words === '';
    }
    if (code) {
      code.textContent = said.code;
      code.hidden = said.code === '';
    }
    this.parentNode.dataset.bookBand = `${said.look}:${said.code || said.words}`;
  }

  private showActor(tick: number, event: WorldEvent, instant: boolean): void {
    const actor = this.actors.get(event.actor);
    // A voice painted into the scene, or with no figure, speaks from its spot (D264).
    if (!actor && event.kind === 'say' && !instant) {
      const spot = this.voiceSprite(event.actor);
      const said = String(event.data.text ?? '');
      const at = this.shownTick;
      if (spot) this.sayOnArrival(() => this.speech.say(said, at, this.sayTicks(said), spot, event.actor));
      return;
    }
    if (!actor) return;
    const facing = isFacing(event.data.facing) ? event.data.facing : actor.facing;
    switch (event.kind) {
      case 'move': {
        const from = tileOf(event.data.from);
        const to = tileOf(event.data.to);
        if (!from || !to) return;
        actor.tile = to;
        actor.facing = facing;
        this.trialStepped(event.actor, tick);
        // A racer's flown step, a third of a walked one, and no tap (D185, D189), gliding
        // on from the step before with no rest (D259).
        const flown = event.data.flying === true;
        if (flown && !instant) {
          this.glideStep(actor.sprite, event.actor, tick, from, to);
          this.enchantedStep(actor.sprite, from, to, this.playback.tickDuration * FLOWN, false);
          break;
        }
        this.tweens.killTweensOf(actor.sprite);
        this.glides.delete(actor.sprite);
        // A familiar that ends its step on another familiar's cell shares it: the two stand
        // side by side, the one there sliding aside as the other comes (D302).
        const shared = this.sharedWith(event.actor, to);
        if (instant) {
          actor.sprite.setPosition(...this.figureAt(to));
          if (shared) {
            actor.sprite.x += SIDE_BY_SIDE * TILE;
            shared.sprite.x = this.figureAt(to)[0] - SIDE_BY_SIDE * TILE;
          }
          this.face(actor.sprite, facing);
          this.enchantedStep(actor.sprite, from, to, 0, true);
          break;
        }
        actor.sprite.setPosition(...this.figureAt(from));
        const [x, y] = this.figureAt(to);
        // A step lasts the ticks it takes, as they are played: a familiar's half a person's
        // where it walks (D277).
        const length = this.playback.tickDuration * 0.9 * this.playback.span(stepTicks(event));
        if (shared) {
          this.tweens.add({ targets: shared.sprite, x: x - SIDE_BY_SIDE * TILE, duration: length });
        }
        this.walk(actor.sprite, facing, x + (shared ? SIDE_BY_SIDE * TILE : 0), y, length);
        this.enchantedStep(actor.sprite, from, to, length, false);
        this.step(event.actor);
        break;
      }
      case 'turn':
        actor.facing = facing;
        this.face(actor.sprite, facing);
        break;
      // A story's seated figure stands up, and one with the sitting rows sits, the way it
      // faces (D279).
      case 'stand':
        this.sitting.delete(actor.sprite);
        this.face(actor.sprite, actor.facing);
        break;
      case 'sit':
        this.sitting.add(actor.sprite);
        this.face(actor.sprite, actor.facing);
        break;
      // A story's figure stamps where it stands: it trembles for the tick, with the
      // bump's sound (D324).
      case 'stamp':
        if (!instant && !this.still) {
          this.rage(actor, this.playback.tickDuration);
          this.playSound('bump');
        }
        break;
      case 'throw':
        this.throwThings(actor, event, instant);
        break;
      // A familiar bumps where it cannot go (D270); after a step held at the circle's
      // edge, the bump is a footprint's, the trial staying where it is (D268).
      case 'bump': {
        if (event.data.footprint === true) {
          const at = tileOf(event.data.at);
          if (at && !instant) this.footprintBump(at, facing);
          break;
        }
        this.tweens.killTweensOf(actor.sprite);
        actor.facing = facing;
        actor.sprite.setPosition(...this.figureAt(actor.tile));
        this.face(actor.sprite, facing);
        if (!instant) {
          this.nudge(actor.sprite, facing, this.playback.tickDuration * 0.9);
          play('bump');
        }
        break;
      }
      // A story's actor lies down in a bed and gets up (D91).
      case 'sleep':
        this.sways.get(actor.sprite)?.stop();
        this.layDown(actor.sprite, event.actor, String(event.data.id), instant);
        break;
      case 'wake':
        this.getUp(actor.sprite, actor.tile, actor.facing, instant);
        this.sways.get(actor.sprite)?.start();
        break;
      // A story's actor speaks, comes into sight and goes (D74).
      case 'say':
        if (!instant) {
          const said = String(event.data.text ?? '');
          const at = this.shownTick;
          this.sayOnArrival(() => {
            this.speech.say(said, at, this.sayTicks(said), actor.sprite, event.actor);
            play('say');
          });
        }
        break;
      case 'appear': {
        const at = tileOf(event.data.at);
        if (!at) return;
        this.tweens.killTweensOf(actor.sprite);
        actor.tile = at;
        // Who comes into sight comes on its feet (D279).
        this.sitting.delete(actor.sprite);
        actor.sprite.setPosition(...this.figureAt(at)).setVisible(true);
        this.face(actor.sprite, actor.facing);
        this.sways.get(actor.sprite)?.start();
        // Out from behind a thing on the cell beside (D128): drawn there, behind it,
        // and walking onto the cell over the tick, facing the way it goes.
        const from = tileOf(event.data.from);
        if (from && !instant) {
          actor.facing = towards(from, at);
          actor.sprite.setPosition(...this.figureAt(from)).setAlpha(1);
          this.walk(actor.sprite, actor.facing, ...this.figureAt(at), this.playback.tickDuration * 0.9);
          this.step(event.actor);
        } else if (instant) actor.sprite.setAlpha(1);
        else {
          actor.sprite.setAlpha(0);
          this.tweens.add({ targets: actor.sprite, alpha: 1, duration: this.playback.tickDuration * 0.9 });
        }
        break;
      }
      // Come into the scene by a way in (D322): past its edge, where the frame hides it, or
      // behind a cover, whole and solid, on its feet or in the air, from where it walks in.
      case 'enter': {
        const at = tileOf(event.data.at);
        if (!at) return;
        this.tweens.killTweensOf(actor.sprite);
        this.glides.delete(actor.sprite);
        actor.tile = at;
        actor.facing = facing;
        this.sitting.delete(actor.sprite);
        actor.sprite.setPosition(...this.figureAt(at)).setVisible(true).setAlpha(1);
        this.face(actor.sprite, actor.facing);
        this.sways.get(actor.sprite)?.start();
        break;
      }
      // Gone out of the scene by a way out, past its edge or behind a cover: hidden at
      // once, with nothing of it in sight to fade (D319).
      case 'leave':
        this.leave(actor.sprite);
        break;
      // A ghost or a familiar fades out (D322).
      case 'vanish':
        this.tweens.killTweensOf(actor.sprite);
        this.sways.get(actor.sprite)?.stop();
        if (instant) actor.sprite.setVisible(false);
        else {
          this.tweens.add({
            targets: actor.sprite,
            alpha: 0,
            duration: this.playback.tickDuration * 0.9,
            onComplete: () => {
              actor.sprite.setVisible(false).setAlpha(1);
              // Gone at a step's last tick, no tick after says so (D103).
              this.publish();
            },
          });
        }
        break;
      case 'seen':
        this.seenBy = event.actor;
        if (!instant) this.cameras.main.shake(this.playback.tickDuration * 0.6, 0.006);
        break;
    }
  }

  /** A figure gone out of the scene by a way out (D319): hidden at once, its sway and
   * its shadow with it. */
  private leave(sprite: Phaser.GameObjects.Sprite): void {
    this.tweens.killTweensOf(sprite);
    this.glides.delete(sprite);
    this.sways.get(sprite)?.stop();
    sprite.setVisible(false).setAlpha(1);
    this.flyers.get(sprite)?.shadow.setVisible(false);
  }

  /** Whether sight passes a tile: the shared rule (sight.ts), with the doors shut now. */
  private isClear = (tile: Tile): boolean =>
    clearOf(this.map.rows, ([x, y]) =>
      [...this.doors].some(([id, at]) => at[0] === x && at[1] === y && !this.openDoors.has(id)),
    )(tile);

  /** The attributes the tests read, and the sight cones drawn again. */
  private publish(): void {
    this.publishThings();
    this.cone.clear();
    for (const [id, actor] of this.actors) {
      this.cone.fillStyle(id === this.seenBy ? 0xe03131 : 0xffd43b, id === this.seenBy ? 0.45 : 0.28);
      for (const [x, y] of sightTiles(this.isClear, actor.tile, actor.facing, actor.sight)) {
        this.cone.fillRect(x * TILE, y * TILE, TILE, TILE);
      }
    }
    // Each hole as a step taken now would find it, and closed under the wizard, on any of
    // its cells: on a painted scene, its picture seen while it is open, and a crack of
    // light round it over the closed floor while osto holds it closed (D167).
    const holes: string[] = [];
    const held: string[] = [];
    for (const thing of this.map.things) {
      if (thing.kind !== 'hole') continue;
      const cells = thing.cells ?? [thing.tile];
      const under = cells.some(([x, y]) => x === this.wizardTile[0] && y === this.wizardTile[1]);
      const holds = this.holds.get(thing.id) ?? [];
      const closed = under || holeClosed(thing.period ?? 1, holds, this.shownTick + 1);
      const image = this.things.get(thing.id);
      if (image?.texture.key.startsWith('art-')) {
        // Its picture by the state's name: open, or closed where it has a closed picture;
        // with none, the floor of the ground shows (D167).
        const shown = `art-${this.artOf(thing.id)}-${closed ? 'closed' : 'open'}`;
        const drawn = this.textures.exists(shown);
        if (drawn && image.texture.key !== shown) image.setTexture(shown);
        image.setVisible(drawn);
      } else image?.setFrame(closed ? 'closed' : 'open');
      holes.push(`${thing.id}:${closed ? 'closed' : 'open'}`);
      const holding = holeHeld(holds, this.shownTick + 1);
      if (holding) held.push(thing.id);
      this.heldOutlineOf(thing.id)?.setVisible(holding);
    }
    // The dark over the dark area (the dark rooms, or the whole map), but the wizard's
    // tile and its eight neighbours (D52, D73).
    this.darkness.clear();
    if (this.art) this.paintDark();
    else if (!this.lit) this.drawDark();
    // What lies on the floor of a painted dark room is not seen until it is lit or the
    // wizard is beside it (D52).
    if (this.art && this.map.dark) {
      const area = this.map.darkArea.length > 0 ? new Set(this.map.darkArea.map(([x, y]) => `${x},${y}`)) : null;
      for (const thing of this.map.things) {
        const image = this.things.get(thing.id);
        if (!image || !LYING_KINDS.includes(thing.kind) || this.carried.has(thing.id)) continue;
        const [x, y] = this.startTile(thing.id, thing.tile);
        const near = Math.abs(x - this.wizardTile[0]) <= 1 && Math.abs(y - this.wizardTile[1]) <= 1;
        image.setVisible(this.lit || near || (area !== null && !area.has(`${x},${y}`)));
      }
    }
    const dataset = this.parentNode.dataset;
    dataset.dark = String(!this.lit);
    dataset.holes = holes.join(';');
    if (held.length > 0) dataset.held = held.join(',');
    else delete dataset.held;
    dataset.wizard = this.wizardTile.join(',');
    // Who an enchanted region hides now (D135).
    if (this.enchanted.size > 0) {
      const hidden = [
        ...(this.inEnchanted(this.wizardTile) ? ['wizard'] : []),
        ...[...this.actors].filter(([, a]) => this.inEnchanted(a.tile)).map(([id]) => id),
      ];
      if (hidden.length > 0) dataset.enchanted = hidden.join(',');
      else delete dataset.enchanted;
    }
    // An actor out of sight is left out (D74).
    dataset.actors = [...this.actors]
      .filter(([, a]) => a.sprite.visible)
      .map(([id, a]) => `${id}:${a.tile.join(',')},${a.facing}`)
      .join(';');
    // The figures drawn seated (D273, D279).
    const seated = [...this.actors].filter(([, a]) => a.sprite.visible && this.sitting.has(a.sprite)).map(([id]) => id);
    if (seated.length > 0) dataset.seated = seated.sort().join(',');
    else delete dataset.seated;
    dataset.doors = [...this.openDoors].sort().join(',');
    this.debug?.doorsOpen(this.openDoors);
    dataset.glowing = [...this.glows].filter(([, glow]) => glow.visible).map(([id]) => id).sort().join(',');
    dataset.carried = [...this.carried].sort().join(',');
    // Each familiar on the scene, how it is drawn and from which sheet (D263, D273), and
    // the plates lit (D270).
    const creatures = [...this.creatures]
      .filter(([id]) => this.actors.get(id)?.sprite.visible)
      .map(([id, look]) => `${id}:${look.look}:${look.kind}:${look.color ?? ''}:${look.sheet ?? ''}`);
    if (creatures.length > 0) dataset.creatures = creatures.join(';');
    else delete dataset.creatures;
    if (this.sideBySide.size > 0) dataset.shared = [...this.sideBySide.values()].join(';');
    else delete dataset.shared;
    const trials = creatures.filter((one) => /^[^:]+:(good|pale|spark):/.test(one));
    if (trials.length > 0) dataset.trials = trials.join(';');
    else delete dataset.trials;
    // The trials seen that do not hold, which fade (D276).
    const fading = [...this.fading.keys()].filter((id) => this.actors.get(id)?.sprite.visible);
    if (fading.length > 0) dataset.trialsFading = fading.join(',');
    else delete dataset.trialsFading;
    if (this.litPlates.size > 0) dataset.lit = [...this.litPlates].sort().join(',');
    else delete dataset.lit;
    if (this.shoved.size > 0) dataset.shoved = [...this.shoved].sort().join(',');
    else delete dataset.shoved;
    this.publishDrawn();
  }

  /** The dark over a painting (D52): the cells of the dark area as one shape, faint
   * enough for the painting's shapes to show, soft at its edges, with a soft light round
   * the wizard. Drawn on a small canvas and shown large. */
  private paintDark(): void {
    if (!this.map.dark) return;
    if (this.lit) {
      if (!this.darkLifting) this.softDark?.setVisible(false);
      return;
    }
    const [width, height] = [this.map.width * DARK_CELL, this.map.height * DARK_CELL];
    if (!this.softDark) {
      if (this.textures.exists(DARK_KEY)) this.textures.remove(DARK_KEY);
      this.textures.createCanvas(DARK_KEY, width, height);
      this.softDark = this.add
        .image(0, 0, DARK_KEY)
        .setOrigin(0, 0)
        .setScale(TILE / DARK_CELL)
        .setDepth(this.darkness.depth);
    }
    const texture = this.textures.get(DARK_KEY) as Phaser.Textures.CanvasTexture;
    const ctx = texture.getContext();
    ctx.clearRect(0, 0, width, height);
    // Only the shape's shadow is drawn, so that it has no hard edge: the shape itself
    // lies off the canvas.
    const away = width + height;
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowColor = '#07080c';
    ctx.shadowBlur = DARK_CELL * 0.6;
    ctx.shadowOffsetX = away;
    ctx.fillStyle = '#07080c';
    ctx.beginPath();
    for (const [x, y] of this.darkCells()) ctx.rect(x * DARK_CELL - away, y * DARK_CELL, DARK_CELL, DARK_CELL);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    const [cx, cy] = [(this.wizardTile[0] + 0.5) * DARK_CELL, (this.wizardTile[1] + 0.5) * DARK_CELL];
    const light = ctx.createRadialGradient(cx, cy, DARK_CELL * 1.1, cx, cy, DARK_CELL * 2.1);
    light.addColorStop(0, 'rgba(0, 0, 0, 1)');
    light.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = light;
    ctx.fillRect(cx - DARK_CELL * 2.2, cy - DARK_CELL * 2.2, DARK_CELL * 4.4, DARK_CELL * 4.4);
    ctx.globalCompositeOperation = 'source-over';
    texture.refresh();
    this.tweens.killTweensOf(this.softDark);
    this.darkLifting = false;
    this.softDark.setVisible(true).setAlpha(DARK_PAINTED);
  }

  /** The dark over the floor of a scene with no painting (D52). */
  private drawDark(): void {
    const graphics = this.darkness;
    graphics.fillStyle(0x07080c, DARK_PLAIN);
    const area = this.map.darkArea.length > 0 ? new Set(this.map.darkArea.map(([x, y]) => `${x},${y}`)) : null;
    this.map.rows.forEach((row, y) => {
      [...row].forEach((char, x) => {
        const near = Math.abs(x - this.wizardTile[0]) <= 1 && Math.abs(y - this.wizardTile[1]) <= 1;
        const inside = !area || area.has(`${x},${y}`);
        if (char !== '#' && inside && !near) graphics.fillRect(x * TILE, y * TILE, TILE, TILE);
      });
    });
  }

  /** The light lifting the dark (D52): at once on a seek or a scene without art; else
   * the dark as it was fades out over a part of the tick. */
  private liftDark(instant: boolean): void {
    if (!instant && this.softDark && !this.still) {
      this.darkLifting = true;
      const fading = this.softDark;
      this.tweens.add({
        targets: fading,
        alpha: 0,
        duration: this.playback.tickDuration * LIGHT_LIFT,
        onComplete: () => {
          this.darkLifting = false;
          fading.setVisible(false);
        },
      });
    }
    this.lit = true;
  }

  /** The crack of light round a hole, seen while osto holds it closed (D167): the floor
   * shows whole, and the crack follows the hole's open picture, on one cell or two; on a
   * placeholder scene, the placeholder's round hole. */
  private heldOutlineOf(id: string): Phaser.GameObjects.Container | null {
    const known = this.heldOutlines.get(id);
    if (known) return known;
    const image = this.things.get(id);
    if (!image) return null;
    const key = image.texture.key.startsWith('art-') ? `art-${this.artOf(id)}-open` : thingKey('hole-shape');
    if (!this.textures.exists(key)) return null;
    const outline = heldOutline(this, image, key, this.still);
    this.heldOutlines.set(id, outline);
    return outline;
  }

  private nudge(target: Phaser.GameObjects.Sprite, facing: Facing, ms: number): void {
    const [dx, dy] = DELTA[facing];
    this.tweens.add({
      targets: target,
      x: target.x + dx * 6,
      y: target.y + dy * 6,
      duration: ms / 2,
      yoyo: true,
      ease: 'Sine.easeOut',
    });
  }

  private shake(target: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite, ms: number): void {
    this.shaking += 1;
    this.parentNode.dataset.shaking = 'true';
    this.tweens.add({
      targets: target,
      x: target.x + 4,
      duration: ms / 6,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.shaking -= 1;
        if (this.shaking === 0) delete this.parentNode.dataset.shaking;
      },
    });
  }
}

/** Starts the level's scene in `parent`, its wizard drawn with `look`, or a
 * story's (D74); resolves once it is drawn. */
export async function startScene(
  parent: HTMLElement,
  level: LevelJson,
  look: Look = DEFAULT_LOOK,
  options: SceneOptions = {},
): Promise<SceneHandle> {
  const map = layout(level);
  // Where the wizard can fly, every tick plays in a third of the time (D225); where a
  // familiar walks, in half of it, and a level with a familiar keeps its own pace though
  // it knows drevo (D80, D277).
  const flies = Array.isArray(level.spells) && level.spells.includes('drevo');
  const familiar = level.familiar as { stage?: unknown } | undefined;
  const walks = familiar?.stage === 'birth' || familiar?.stage === 'living';
  const pace = familiar ? (walks ? FAMILIAR_PACE : 1) : flies ? FLOWN : 1;
  const playback = new Playback({ tickMs: TICK_MS, pace });
  // A painted scene's art, when it has some (D76); a scene without is drawn with placeholders.
  const art = await loadArt(level).catch(() => null);

  return new Promise((resolve) => {
    let game: Phaser.Game | null = null;
    // The scene fits its parent, and follows it when the parent changes size.
    const resized = new ResizeObserver(() => game?.scale.refresh());
    resized.observe(parent);
    const onReady = () => {
      resolve({
        playback,
        load(result: WorldResult, way = null) {
          scene.shownWay = way;
          playback.load(result.events);
        },
        firstWay() {
          scene.shownWay = null;
        },
        cardClosed() {
          scene.cardClosed();
        },
        reset() {
          playback.reset();
        },
        restartShow(ready) {
          return scene.restartShow(ready);
        },
        follow() {
          scene.follow();
        },
        place(framing, travel) {
          scene.place(framing, travel);
        },
        zoom(step) {
          return scene.zoomBy(step);
        },
        canZoom(step) {
          return scene.canZoomBy(step);
        },
        live() {
          return game !== null && scene.cameras?.main !== undefined;
        },
        wizardBox() {
          return scene.wizardBox();
        },
        levelBoxes() {
          return scene.levelBoxes();
        },
        settle(won) {
          return scene.settle(won);
        },
        onCover(covered) {
          scene.covered = covered;
        },
        onMap(opened, closed) {
          scene.listenForMap(opened, closed);
        },
        destroy() {
          resized.disconnect();
          playback.stop();
          if (scene.cameras?.main) scene.endCamera();
          game?.destroy(true);
          game = null;
        },
      });
    };
    const scene = new LevelScene(map, parent, playback, onReady, look, options, art);
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      // The canvas is the frame's size; the camera's zoom fits the window to it (fit).
      width: parent.clientWidth || Math.min(map.width, VIEW_TILES[0]) * TILE,
      height: parent.clientHeight || Math.min(map.height, VIEW_TILES[1]) * TILE,
      pixelArt: true,
      backgroundColor: '#1f2330',
      banner: false,
      scale: { mode: Phaser.Scale.RESIZE },
      // Every sound is the page's own, on sfx.ts's one context, which sleeps while
      // nothing sounds (D231): Phaser makes no context of its own, which would run
      // from the first click to the level's end.
      audio: { noAudio: true },
      scene,
    });
  });
}
