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
// data-shaking (present while something shakes at a failed try), data-bubble
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
// hidden things found and seen, joined by ",", D184), data-untied (the brooms
// untied, D183), data-flying (the figures in the air, joined by ",", D185),
// data-wind (`on` while a flight's wind blows), data-through (the rings flown
// through, in order, joined by ","), data-circling (who circles before the
// finish now), data-race-band (what the start band says, D189) and data-world (what
// the camera shows, in cells: "left,top,width,height").
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
// an actor appears, walks, turns, says its words in a bubble and vanishes; the
// camera keeps whoever each step is about, with their words, in view; a bubble
// stays until the next step.

import Phaser from 'phaser';
import type { LevelJson, WorldEvent, WorldResult } from '../runtime/protocol';
import { type Layout, layout, type PlanView, towards } from './layout';
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
  facingOf,
  figureName,
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
  preloadArt,
  SHEET_ROW,
  sleepFrame,
  thingDepthOn,
} from './painted';
import { characterName, t } from '../i18n';
import { readingTicks } from './bubble';
import { SceneCamera, VIEW_TILES } from './camera';
import type { StoryFraming } from './zooming';
import { DebugView, type PaintedImage } from './debug';
import { debugging } from './debugging';
import {
  FOOT_IN_CELL,
  figureDepth,
  lightDepth,
  loweredBy,
  MARK_DEPTH,
  markDepthIn,
  nudgedBy,
  overDepth,
  sleeperDepth,
  thingDepth,
} from './depth';
import { type LightName, type LightState, NIGHT_MS, SceneLight, WHOLE_MORNING } from './light';
import { Speech } from './speech';
import { Sway } from './sway';
import { shadeAt, tintOf } from './shade';
import { heldOutline, MarkSilhouette, Silhouette } from './silhouette';
import { LONG, Playback } from './playback';
import { HOP_RISE, HOP_TICKS, hopAt, hopTop } from './hop';
import { lightTimes, LIGHT_RING, pullTimes } from './spell';
import { clearOf, sightTiles, type Tile } from './sight';
import { type Hold, holeClosed, holeHeld } from './hole';
import { type EffectName, play, STEP_LOWER, type StepName } from './sfx';
import { blockedText, bumpText, friendText, sleepingText } from './words';
import { bobOf, FLOWN, FLY_LIFT, flyFrame } from './flight';
import { drawnFromSprite, spriteFoot, spriteKey, spriteName, spriteOrigin, spriteScale, type ThingSprite } from './things';
import { Wind } from './sound';

/** How long one tick lasts at speed 1. */
export const TICK_MS = 400;

/** How long the scene takes to fade out and in when the level starts again, and how
 * long it stays out (D75). */
const RESTART_FADE_MS = 120;
const RESTART_HOLD_MS = 160;

/** How a scene is played: a level's run, or a story's steps (D74). */
export interface SceneOptions {
  /** A story: the camera starts on this tile (camera.ts), and the words stay said;
   * `flying`, who is in the air on a broom from the start (D185). */
  story?: { camera: Tile; light?: LightName; flying?: string[] };
}

export { type Art, type FigureArt, loadArt, type SceneArt } from './painted';

export interface SceneHandle {
  playback: Playback;
  /** Gives the playback a run's events, with everything back where it started. */
  /** A run's events to play; `way` names the way of the level they are of (D51),
   * whose places the restart uses. */
  load(result: WorldResult, way?: string | null): void;
  /** The level's first way on the scene again, as it opens (D204). */
  firstWay(): void;
  reset(): void;
  /** Shows the level starting again: the scene fades, everything is put back,
   * `ready` is called and awaited while nothing is seen, and it comes back;
   * resolves once it is shown (D75, D121). */
  restartShow(ready?: () => Promise<void>): Promise<void>;
  /** The camera back on the wizard, following it (12.6). */
  follow(): void;
  /** In a story, the place a step frames, or none (D199, camera.ts). */
  place(framing: StoryFraming | null): void;
  /** Zooms the camera one step in (1) or out (-1); false when it can go no further. */
  zoom(step: 1 | -1): boolean;
  /** Whether the camera can zoom one step in (1) or out (-1). */
  canZoom(step: 1 | -1): boolean;
  /** A run played out: the wizard celebrates it when it is `won` (14.3); how long the
   * page waits before its card, the celebration and the words on the scene read to
   * their end, the longer of them (D175). */
  settle(won: boolean): number;
  /** Where the wizard stands on the page, a box in the page's pixels. */
  wizardBox(): { left: number; top: number; right: number; bottom: number };
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
  private things = new Map<string, Phaser.GameObjects.Image>();
  private doors = new Map<string, Tile>();
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
  /** The figures in the air (D185): when their flight began, on the scene's clock,
   * and their shadow on the ground. */
  private readonly flyers = new Map<Phaser.GameObjects.Sprite, { since: number; shadow: Phaser.GameObjects.Ellipse }>();
  private readonly wind = new Wind();
  /** Who circles before the finish now (D189), for the tests. */
  private circling: string | null = null;

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

  /** A figure turned to face a way: its sheet's frame, or the placeholder's. */
  private face(sprite: Phaser.GameObjects.Sprite, facing: Facing, step = this.art?.figures?.standing ?? 1): void {
    if (sprite.texture.key.startsWith('fig-')) sprite.setFrame(SHEET_ROW[facing] * 3 + step);
    else sprite.setFrame(facing);
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
    if (figures && drawn) return drawFigure(this, figures, name, this.figureAt(tile), facing);
    return this.add.sprite(...centre(tile), placeholder, facing).setOrigin(0.5, 0.6);
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
      return;
    }
    // Seen opening or closing: through its half-open state when it has one, each
    // picture fading out at its own depth as the next fades in at its own; the
    // picture of the hour the scene shows (D126), never a frame of another.
    const step = this.playback.tickDuration * 0.3;
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

  /** How many ticks words said stay: in a level, as long as they take to read (D175);
   * in a story, until the next step. */
  private sayTicks(text: string): number {
    return this.options.story ? Number.POSITIVE_INFINITY : readingTicks(text, TICK_MS);
  }

  /** A sprite's thing put on its tile, its foot there, among the figures by its row:
   * a broom lying under whoever stands on its cell, a ring standing (D182), a broom
   * hanging from its peg at the rack's row, behind whoever stands under it (D195). */
  private placeSprite(image: Phaser.GameObjects.Image, sprite: ThingSprite, tile: Tile): void {
    const [originX, originY] = spriteOrigin(sprite);
    image
      .setPosition(...spriteFoot(sprite, tile))
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
        if (thing.kind === 'door') this.doors.set(thing.id, thing.tile);
        continue;
      }
      // A thing of a kind with a sprite of its own, a broom or a ring, on a painted scene
      // with no cut-out of it (D182); one hidden in the straw unseen until found (D184).
      const named = spriteName(this.art?.sprites ?? null, thing.kind, thing.hung === true);
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
    for (const actor of this.map.actors) {
      const key = actor.kind === 'friend' ? friendKey(actor.id) : actorKey(actor.kind);
      const sprite = this.figure(actor.id, key, actor.tile, actor.facing).setDepth(3);
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
    this.wizard = this.figure('wizard', WIZARD_KEY, this.map.start, 'down').setDepth(4);
    // Fixed over the camera's view each frame (lit), so that no zoom or drag shows its edge.
    this.lightCover = this.add.rectangle(0, 0, 1, 1, 0x000000, 0).setOrigin(0, 0).setDepth(lightDepth(this.map.height));
    this.light.set(this.options.story?.light ?? 'none');
    this.speech = new Speech(this, this.parentNode, {
      width: this.map.width * TILE,
      headroom: this.headroom,
      wizard: () => this.wizard,
      height: this.map.height * TILE,
      wrap: this.options.story ? 6 : 4,
      figures: () => [this.wizard, ...[...this.actors.values()].map((actor) => actor.sprite)],
      tickMs: TICK_MS,
      shown: () => this.view.shown(),
    });
    const story = this.options.story;
    this.view = new SceneCamera(this, this.parentNode, {
      columns: this.map.width,
      rows: this.map.height,
      margin: marginOf(this.art),
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
    });
    this.restart();
    this.parentNode.dataset.state = this.playback.state;
    this.ready();
  }

  /** The camera back on the wizard, following it; in a story, with whoever the
   * last step was about (camera.ts). */
  follow(): void {
    this.view.follow();
  }

  /** In a story, the place a step frames, or none (D199, camera.ts). */
  place(framing: StoryFraming | null): void {
    this.view.place(framing);
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
  override update(): void {
    this.drawLight();
    // What the camera shows, in cells: its left, its top, its width and its height.
    const view = this.cameras.main.worldView;
    const world = [view.x, view.y, view.width, view.height].map((v) => (v / TILE).toFixed(2)).join(',');
    if (this.parentNode.dataset.world !== world) this.parentNode.dataset.world = world;
    if (this.flyers.size > 0 || this.parentNode.dataset.flying) this.flyFrames();
    // On a painted scene the figures go behind what stands in front of them (D76).
    if (this.art) {
      if (!this.asleep.get(this.wizard)?.lying && !this.hopping.has(this.wizard)) {
        this.wizard.setDepth(figureDepth(this.wizard.y / TILE) + 0.0005);
      }
      for (const actor of this.actors.values()) {
        if (!this.asleep.get(actor.sprite)?.lying && !this.hopping.has(actor.sprite)) {
          actor.sprite.setDepth(figureDepth(actor.sprite.y / TILE));
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
    // A run started again closes the map it opened (D134).
    this.mapClosed?.();
    this.found.clear();
    this.untied.clear();
    this.through.length = 0;
    this.circling = null;
    for (const sprite of [...this.flyers.keys()]) this.land(sprite, true);
    this.wind.stop(true);
    this.raceBand(0, []);
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
      // A thing in the wizard's hands from the start is seen only once given (D123); one
      // drawn from a sprite and hidden, once found (D184).
      const unseen = thing.hidden === true && this.sprites.has(thing.id);
      // A thing the way shown takes away, or the first way before any run (D184).
      const way = this.shownWay ?? this.map.firstWay;
      const gone = way !== null && (this.map.wayGone[way] ?? []).includes(thing.id);
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
      const hidden = actor.hidden || this.inEnchanted(state.tile);
      state.sprite.setPosition(...this.figureAt(state.tile)).setAlpha(1).setVisible(!hidden).setAngle(0);
      this.face(state.sprite, state.facing);
      if (actor.asleep) this.layDown(state.sprite, actor.id, actor.asleep, true);
      const sway = this.sways.get(state.sprite);
      if (actor.hidden || actor.asleep) sway?.stop();
      else sway?.start();
    }
    this.placeWizard(this.map.start, 'down');
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
    const box = this.wizard.getBounds();
    const camera = this.cameras.main;
    const canvas = this.game.canvas.getBoundingClientRect();
    const scale = (camera.zoom * canvas.width) / this.game.canvas.width;
    const left = canvas.left + (box.left - camera.worldView.x) * scale;
    const top = canvas.top + (box.top - camera.worldView.y) * scale;
    return { left, top, right: left + box.width * scale, bottom: top + box.height * scale };
  }

  private placeWizard(tile: Tile, facing: Facing): void {
    this.tweens.killTweensOf(this.wizard);
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
      .map((thing) => ({
        id: thing.id,
        kind: thing.kind,
        tile: this.startTile(thing.id, thing.tile),
        open: this.openDoors.has(thing.id),
        ...(thing.art ? { art: thing.art } : {}),
      }));
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
    if (tick === 0) {
      this.restart(instant);
      return;
    }
    this.parentNode.dataset.tick = String(tick);
    this.shownTick = tick;
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
      // A ring flown through (D187).
      else if (event.kind === 'through') this.flownThrough(String(event.data.id), instant);
      // A broom lifted or set down, the wizard's or a racer's (D185, D189).
      else if (event.kind === 'fly' || event.kind === 'land') {
        const sprite = this.spriteOf(String(event.data.id ?? event.actor));
        if (sprite && event.kind === 'fly') this.lift(sprite, instant);
        if (sprite && event.kind === 'land') this.land(sprite, instant);
      } else this.showActor(event, instant);
    }
    this.raceBand(tick, events);
    if (this.options.story) {
      this.frameStory(events);
      this.view.keep();
    } else this.view.hold(this.wizardTile);
    this.publish();
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

  /** A ring flown through (D187): kept in order, and seen to glow for a moment. */
  private flownThrough(id: string, instant: boolean): void {
    this.through.push(id);
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

  /** A figure lifted on its broom (D185): drawn from its flying rows, half a cell up,
   * its shadow on the ground; the wind blows for the wizard. */
  private lift(sprite: Phaser.GameObjects.Sprite, instant: boolean): void {
    if (this.flyers.has(sprite)) return;
    const shadow = this.add
      .ellipse(sprite.x, sprite.y, TILE * 0.55, TILE * 0.18, 0x000000, 0.22)
      .setDepth(sprite.depth - 0.0004);
    this.flyers.set(sprite, { since: this.time.now, shadow });
    if (sprite === this.wizard && !instant) {
      this.wind.start();
      this.playedSounds.push('wind');
      this.parentNode.dataset.sounds = this.playedSounds.join(',');
    }
  }

  /** A figure set down where it is (D185): its feet on its cell, standing, the wind gone. */
  private land(sprite: Phaser.GameObjects.Sprite, instant: boolean): void {
    const flying = this.flyers.get(sprite);
    if (!flying) return;
    flying.shadow.destroy();
    this.flyers.delete(sprite);
    this.restOrigin(sprite);
    const facing = sprite === this.wizard ? this.wizardFacing() : facingOf(sprite);
    this.face(sprite, facing);
    if (sprite === this.wizard) this.wind.stop(instant);
  }

  /** A figure's origin back at its feet, as it stands. */
  private restOrigin(sprite: Phaser.GameObjects.Sprite): void {
    const figures = this.art?.figures;
    if (figures && sprite.texture.key.startsWith('fig-')) sprite.setOrigin(0.5, 1 - figures.foot / figures.frame[1]);
    else sprite.setOrigin(0.5, 0.6);
  }

  /** Each flying figure, each frame: its flying frame by the way it faces, bobbing,
   * drawn half a cell above its feet, and its shadow on the ground under it (D185). */
  private flyFrames(): void {
    for (const [sprite, { since, shadow }] of this.flyers) {
      const figures = this.art?.figures;
      const name = sprite.texture.key.replace(/^fig-/, '');
      const facing = sprite === this.wizard ? this.wizardFacing() : facingOf(sprite);
      const frame = figures && sprite.texture.key.startsWith('fig-') ? flyFrame(flyRowOf(figures, name), facing, this.time.now - since) : null;
      if (frame !== null && sprite.texture.frameTotal - 1 > frame) sprite.setFrame(frame);
      const bob = frame === null ? bobOf(this.time.now - since) : 0;
      const lift = (FLY_LIFT + bob) * TILE;
      const height = sprite.frame.height || sprite.height;
      const base = figures && sprite.texture.key.startsWith('fig-') ? 1 - figures.foot / figures.frame[1] : 0.6;
      sprite.setOrigin(0.5, base + lift / (height * sprite.scaleY));
      shadow.setPosition(sprite.x, sprite.y - TILE * 0.05).setDepth(sprite.depth - 0.0004).setVisible(sprite.visible);
    }
    const flying = [...this.flyers.keys()].map((sprite) => (sprite === this.wizard ? 'wizard' : this.idOf(sprite))).filter(Boolean);
    const said = flying.sort().join(',');
    if (this.parentNode.dataset.flying !== said) this.parentNode.dataset.flying = said;
    const wind = this.wind.blowing ? 'on' : 'off';
    if (this.parentNode.dataset.wind !== wind) this.parentNode.dataset.wind = wind;
  }

  /** What the tests read of chapter 4's things (D182 to D187): the sprites drawn, the
   * hidden things found, the brooms untied, the rings flown through, who circles. */
  private publishThings(): void {
    const node = this.parentNode.dataset;
    const drawn = [...this.sprites.keys()]
      .flatMap((id) => {
        const image = this.things.get(id);
        const thing = this.map.things.find((one) => one.id === id);
        if (!image?.visible || !thing) return [];
        const [x, y] = [image.x / TILE, image.y / TILE];
        // A hung broom by its hung sprite's name, on its peg's cell (D195).
        const name = spriteName(this.art?.sprites ?? null, thing.kind, thing.hung === true);
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
    if (this.circling) node.circling = this.circling;
    else delete node.circling;
  }

  /** The id of an actor's figure. */
  private idOf(sprite: Phaser.GameObjects.Sprite): string {
    for (const [id, actor] of this.actors) if (actor.sprite === sprite) return id;
    return '';
  }

  /** A figure circling over its cell for a tick (D189): the wizard serving a ring
   * missed before the finish, a racer's flourish. */
  private circle(sprite: Phaser.GameObjects.Sprite, at: Tile, who: string, instant: boolean): void {
    if (instant) return;
    const [x, y] = this.figureAt(at);
    const radius = TILE * 0.35;
    const counter = { turn: 0 };
    this.tweens.killTweensOf(sprite);
    this.circling = who;
    this.tweens.add({
      targets: counter,
      turn: 1,
      duration: this.playback.tickDuration * FLOWN * 0.95,
      onUpdate: () => {
        const angle = counter.turn * Math.PI * 2;
        sprite.setPosition(x + Math.sin(angle) * radius, y - (1 - Math.cos(angle)) * radius * 0.6);
      },
      onComplete: () => {
        sprite.setPosition(x, y);
        if (this.circling === who) this.circling = null;
      },
    });
  }

  /** The band over the scene while Ilda reads the programs before a race (D189): the
   * lines read of each, ticking down, until both have taken off. */
  private raceBand(tick: number, events: WorldEvent[]): void {
    const race = this.map.race;
    let band = this.parentNode.querySelector<HTMLElement>('.race-band');
    if (!race) return;
    if (!band) {
      band = document.createElement('div');
      band.className = 'race-band';
      band.hidden = true;
      this.parentNode.append(band);
    }
    const read = events.find((event) => event.kind === 'read');
    if (tick === 0) this.readLines = 0;
    if (read) this.readLines = Number(read.data.lines);
    const mine = this.readLines;
    const name = characterName(race.against);
    const showing = tick > 0 && (read !== undefined || tick <= race.lines);
    band.hidden = !showing;
    const said = showing
      ? `${t('race.reading', { mine, name, theirs: race.lines })} ${t('race.left', {
          mine: Math.max(mine - tick, 0),
          name,
          theirs: Math.max(race.lines - tick, 0),
        })}`
      : '';
    band.textContent = said;
    if (said) this.parentNode.dataset.raceBand = said;
    else delete this.parentNode.dataset.raceBand;
  }

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
    const timers = playFrames(this, this.wizard, figures, part, duration);
    if (!timers) return null;
    if (part === 'cast') this.parentNode.dataset.casting = 'true';
    else this.parentNode.dataset.acting = part;
    this.casting = [...timers, this.time.delayedCall(duration, () => this.stopCast())];
    return timers;
  }

  /** A run played out (D175): the wizard celebrates it when it is won, and how long the
   * page waits before the card is the longer of that and the words on the scene read
   * to their end. */
  settle(won: boolean): number {
    return Math.max(won ? this.celebrate() : 0, this.speech.settle());
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

  /** The light back to what it is before a run: the painting's own, or the story's. */
  private resetLight(): void {
    this.nightFall?.remove(false);
    this.nightFall = null;
    this.light.set(this.options.story?.light ?? 'none');
  }

  /** A cast's frames stopped where they are, their timers dropped. */
  private stopCast(): void {
    for (const timer of this.casting) timer.remove(false);
    this.casting = [];
    delete this.parentNode.dataset.casting;
    delete this.parentNode.dataset.acting;
  }

  /** The way the wizard faces, read from its figure. */
  private wizardFacing(): Facing {
    if (this.wizard.texture.key.startsWith('fig-')) return facingOf(this.wizard);
    return isFacing(this.wizard.frame.name) ? this.wizard.frame.name : 'down';
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
        if (instant) {
          this.placeWizard(to, facing ?? 'down');
          this.enchantedStep(this.wizard, from, to, 0, true);
          break;
        }
        this.stopCast();
        this.placeWizard(from, facing ?? 'down');
        this.wizardTile = to;
        const [x, y] = this.figureAt(to);
        // A flown step takes a third of a walked one, with the wind's swell and no
        // step's tap (D185).
        const flown = event.data.flying === true;
        this.walk(this.wizard, facing ?? 'down', x, y, flown ? duration * FLOWN : duration);
        this.enchantedStep(this.wizard, from, to, duration, false);
        if (flown) this.wind.swell((duration * FLOWN) / 1000);
        else this.step('wizard');
        break;
      }
      case 'circle': {
        const at = tileOf(event.data.at);
        if (at) this.circle(this.wizard, at, 'wizard', instant);
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
        // A friend in the way: the wizard thinks who (D66); a ring's side, a tree's
        // crown or a wall in a flight's way, what it is (D186, D187).
        if (!instant && event.data.by === 'friend') {
          const who = friendText(String(event.data.id));
          this.speech.think(who, tick, this.sayTicks(who));
        } else if (!instant && (event.data.by === 'high' || event.data.by === 'ring')) {
          const why = bumpText(String(event.data.by), typeof event.data.kind === 'string' ? event.data.kind : null);
          this.speech.think(why, tick, this.sayTicks(why));
        }
        break;
      }
      case 'say':
        if (!instant) {
          const said = String(event.data.text ?? '');
          this.speech.say(said, tick, this.sayTicks(said), this.wizard, 'wizard');
          play('say');
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
      case 'vanish':
        // At the very end of a story, the wizard walks out of sight with the others.
        if (instant) this.wizard.setVisible(false);
        else this.tweens.add({ targets: this.wizard, alpha: 0, duration: this.playback.tickDuration * 0.9, onComplete: () => this.wizard.setVisible(false).setAlpha(1) });
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
        const thing = this.map.things.find((t) => t.id === by);
        const detail = {
          ...(typeof event.data.spell === 'string' ? { spell: event.data.spell } : {}),
          ...(Array.isArray(event.data.things) ? { things: event.data.things.map(String) } : {}),
          ...(typeof event.data.kind === 'string' ? { kind: event.data.kind } : {}),
        };
        const why = blockedText(String(event.data.reason), thing?.kind ?? null, detail);
        this.speech.think(why, tick, this.sayTicks(why));
        if (event.data.tried === true) this.shake(this.things.get(by) ?? this.wizard, duration);
        break;
      }
      // 'wait': the wizard stands still while the world moves on.
    }
  }

  private showActor(event: WorldEvent, instant: boolean): void {
    const actor = this.actors.get(event.actor);
    if (!actor) return;
    const facing = isFacing(event.data.facing) ? event.data.facing : actor.facing;
    switch (event.kind) {
      case 'move': {
        const from = tileOf(event.data.from);
        const to = tileOf(event.data.to);
        if (!from || !to) return;
        this.tweens.killTweensOf(actor.sprite);
        actor.tile = to;
        actor.facing = facing;
        if (instant) {
          actor.sprite.setPosition(...this.figureAt(to));
          this.face(actor.sprite, facing);
          this.enchantedStep(actor.sprite, from, to, 0, true);
          break;
        }
        actor.sprite.setPosition(...this.figureAt(from));
        const [x, y] = this.figureAt(to);
        // A racer's flown step, a third of a walked one, and no tap (D185, D189).
        const flown = event.data.flying === true;
        const length = this.playback.tickDuration * 0.9 * (flown ? FLOWN : 1);
        this.walk(actor.sprite, facing, x, y, length);
        this.enchantedStep(actor.sprite, from, to, length, false);
        if (!flown) this.step(event.actor);
        break;
      }
      case 'circle': {
        // A racer's flourish (D189).
        const at = tileOf(event.data.at);
        if (at) this.circle(actor.sprite, at, event.actor, instant);
        break;
      }
      case 'turn':
        actor.facing = facing;
        this.face(actor.sprite, facing);
        break;
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
          this.speech.say(said, this.shownTick, this.sayTicks(said), actor.sprite, event.actor);
          play('say');
        }
        break;
      case 'appear': {
        const at = tileOf(event.data.at);
        if (!at) return;
        this.tweens.killTweensOf(actor.sprite);
        actor.tile = at;
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
    dataset.doors = [...this.openDoors].sort().join(',');
    this.debug?.doorsOpen(this.openDoors);
    dataset.glowing = [...this.glows].filter(([, glow]) => glow.visible).map(([id]) => id).sort().join(',');
    dataset.carried = [...this.carried].sort().join(',');
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
  const playback = new Playback({ tickMs: TICK_MS });
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
        reset() {
          playback.reset();
        },
        restartShow(ready) {
          return scene.restartShow(ready);
        },
        follow() {
          scene.follow();
        },
        place(framing) {
          scene.place(framing);
        },
        zoom(step) {
          return scene.zoomBy(step);
        },
        canZoom(step) {
          return scene.canZoomBy(step);
        },
        wizardBox() {
          return scene.wizardBox();
        },
        settle(won) {
          return scene.settle(won);
        },
        onMap(opened, closed) {
          scene.listenForMap(opened, closed);
        },
        destroy() {
          resized.disconnect();
          playback.stop();
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
      scene,
    });
  });
}
