// The level's scene in Phaser: the map, the things and actors on it, the
// wizard, and the playback of a run's events, tick by tick. It speaks to the
// rest of the page only through its handle and its parent's data-* attributes:
// data-tick, data-state, data-wizard ("x,y"), data-actors ("id:x,y,facing"
// joined by ";"), data-doors (the open doors' ids, joined by ","),
// data-carried (the ids of what the wizard carries, joined by ","),
// data-thought (why an action could not be done, while the wizard thinks it),
// data-shaking (present while something shakes at a failed try), data-bubble
// and data-speaker (the words said in a bubble and who says them), data-look
// (the id of the look the wizard is drawn with, D36), data-wizard-figure and
// data-friend-figure (the sheets they are drawn from, D77), data-casting (present
// while the wizard's casting frames play), data-opening (the door shown half open
// as it opens), data-dark (whether the
// room is still dark, D52), data-stairs ("id:in" or "id:away" joined by ";",
// each stair as a step taken now would find it, D53), data-zoom (the
// camera's zoom, D69) and data-following (whether the camera follows the wizard).
//
// The camera is a window on the scene (D69): at most VIEW_TILES of it at zoom
// 1, the tiles at their size; it follows the wizard, the player zooms it and
// drags it to look around, and a run or a restart brings it back to the wizard.
//
// A painted scene (D76) is drawn by painted.ts: its ground and rows, its things'
// states, the figures' sheets, the grid, the goal's mark and the sealed doors'
// glow (D79); a scene without art, by placeholders.ts.
//
// A story is played on the scene the same way (D74): its steps come as events,
// an actor appears, walks, turns, says its words in a bubble and vanishes; the
// camera stays on the story's tile, and a bubble stays until the next step.

import Phaser from 'phaser';
import type { LevelJson, WorldEvent, WorldResult } from '../runtime/protocol';
import { type Layout, layout, towards } from './layout';
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
  drawFigure,
  drawGlow,
  drawGrid,
  drawMark,
  figureName,
  FOOT_IN_CELL,
  loadArt,
  paintScene,
  paintThing,
  playCast,
  preloadArt,
  SHEET_ROW,
} from './painted';
import { Playback } from './playback';
import { clearOf, sightTiles, type Tile } from './sight';
import { type Hold, stairInPlace } from './stairs';
import { play } from './sfx';
import { blockedText, friendText } from './words';

/** How long one tick lasts at speed 1. */
export const TICK_MS = 400;
/** How many ticks a word said stays over the wizard. */
const SAY_TICKS = 3;
/** The most of a scene the camera shows at zoom 1, in tiles across and down (D69). */
export const VIEW_TILES: Tile = [15, 9];
/** How long the scene takes to fade out and in when the level starts again, and how
 * long it stays out (D75). */
const RESTART_FADE_MS = 120;
const RESTART_HOLD_MS = 160;
/** How far, in pixels, the pointer moves before a press is a drag of the camera. */
const DRAG_THRESHOLD = 6;
/** The zooms the player steps through, from the whole scene to a close look. */
export const ZOOMS = [0.5, 0.75, 1, 1.5, 2] as const;
const ZOOM_START = ZOOMS.indexOf(1);

/** How a scene is played: a level's run, or a story's steps (D74). */
export interface SceneOptions {
  /** A story: the camera stays on this tile, and the words stay said. */
  story?: { camera: Tile };
}

export { type Art, type FigureArt, loadArt, type SceneArt } from './painted';

export interface SceneHandle {
  playback: Playback;
  /** Gives the playback a run's events, with everything back where it started. */
  load(result: WorldResult): void;
  reset(): void;
  /** Shows the level starting again: the scene fades, everything is put back, and
   * it comes back; resolves once it is shown (D75). */
  restartShow(): Promise<void>;
  /** The camera back on the wizard, following it (12.6). */
  follow(): void;
  /** Zooms the camera one step in (1) or out (-1); false when it can go no further. */
  zoom(step: 1 | -1): boolean;
  /** Whether the camera can zoom one step in (1) or out (-1). */
  canZoom(step: 1 | -1): boolean;
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
  private things = new Map<string, Phaser.GameObjects.Image>();
  private doors = new Map<string, Tile>();
  private openDoors = new Set<string>();
  /** The glow over each sealed door while its seal holds (D79). */
  private glows = new Map<string, Phaser.GameObjects.Ellipse>();
  private carried = new Set<string>();
  private actors = new Map<string, ActorState>();
  private cone!: Phaser.GameObjects.Graphics;
  private bubble: Phaser.GameObjects.Text | null = null;
  private bubbleUntil = 0;
  private thought: Phaser.GameObjects.Container | null = null;
  private thoughtUntil = 0;
  /** Where a bubble or thought sits: its width, and whether it is below the wizard. */
  private bubblePlace = { width: 0, below: false };
  private shaking = 0;
  /** Who saw the wizard, whose cone is drawn red. */
  private seenBy: string | null = null;
  /** Whether the room is lit (D52), and the dark drawn over its floor while not. */
  private lit = true;
  private darkness!: Phaser.GameObjects.Graphics;
  /** The tick shown, and each stair's holds seen so far (D53). */
  private shownTick = 0;
  private holds = new Map<string, Hold[]>();
  /** Counts the restarts, so that a door's delayed opening from a run before is dropped. */
  private restarts = 0;
  /** The timers of a cast being played (D81), dropped when the level starts again. */
  private casting: Phaser.Time.TimerEvent[] = [];
  /** The zoom's step in ZOOMS (D69). */
  private zoomStep = ZOOM_START;
  /** Who a bubble or a thought is over: the wizard, or an actor who speaks. */
  private speaker: Phaser.GameObjects.Sprite | null = null;

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

  /** Where a figure stands on a tile: its centre, or on a painted scene its feet. */
  private figureAt([x, y]: Tile): [number, number] {
    return this.art ? [x * TILE + TILE / 2, y * TILE + TILE * FOOT_IN_CELL] : centre([x, y]);
  }

  /** A figure turned to face a way: its sheet's frame, or the placeholder's. */
  private face(sprite: Phaser.GameObjects.Sprite, facing: Facing, step = this.art?.figures?.standing ?? 1): void {
    if (sprite.texture.key.startsWith('fig-')) sprite.setFrame(SHEET_ROW[facing] * 3 + step);
    else sprite.setFrame(facing);
  }

  /** A figure walking to a point, its frames stepping as it goes on a painted scene. */
  private walk(sprite: Phaser.GameObjects.Sprite, facing: Facing, x: number, y: number, duration: number): void {
    const stepping = sprite.texture.key.startsWith('fig-');
    this.tweens.add({
      targets: sprite,
      x,
      y,
      duration,
      ease: 'Linear',
      onUpdate: (tween) => {
        if (stepping) this.face(sprite, facing, [0, 1, 2, 1][Math.floor(tween.progress * 4) % 4] ?? 1);
      },
      onComplete: () => this.face(sprite, facing),
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

  /** A door's look, shut or open: its painted state, or the placeholder's frame. */
  private doorLook(id: string, open: boolean, lock: string, moving = false): void {
    const image = this.things.get(id);
    if (!image) return;
    const key = `art-${id}-${open ? 'open' : 'closed'}`;
    if (!this.textures.exists(key)) {
      image.setFrame(open ? 'open' : lock);
      return;
    }
    if (!moving || this.still) {
      image.setTexture(key);
      return;
    }
    // Seen opening: through its half-open state when it has one, each state fading
    // into the next.
    const step = this.playback.tickDuration * 0.3;
    const ajar = `art-${id}-ajar`;
    if (!this.textures.exists(ajar)) {
      crossfade(this, image, key, step * 2);
      return;
    }
    crossfade(this, image, ajar, step);
    this.parentNode.dataset.opening = id;
    const run = this.restarts;
    this.time.delayedCall(step, () => {
      delete this.parentNode.dataset.opening;
      if (run === this.restarts && this.openDoors.has(id)) crossfade(this, image, key, step);
    });
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
      this.art?.scene.things[id] && image
        ? [image.x + (image.displayWidth || TILE) / 2, image.y + (image.displayHeight || TILE) / 2]
        : centre(tile);
    this.glows.set(id, drawGlow(this, at, image?.depth ?? 3, this.still));
  }

  /** A seal broken: its glow goes, breaking into sparks when it is seen go. */
  private unseal(id: string, instant = true): void {
    const glow = this.glows.get(id);
    if (!glow?.visible) return;
    if (instant || this.still) glow.setVisible(false);
    else breakSeal(this, glow, this.playback.tickDuration * 0.8);
  }

  /** How many ticks a word said stays: in a story, until the next step. */
  private get sayTicks(): number {
    return this.options.story ? Number.POSITIVE_INFINITY : SAY_TICKS;
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
      paintScene(this, this.art);
      drawGrid(this, [this.map.width, this.map.height]);
    } else {
      const tilemap = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
      const tileset = tilemap.addTilesetImage(TILES_KEY, TILES_KEY, TILE, TILE, 0, 0);
      if (tileset) tilemap.createLayer(0, tileset, 0, 0);
    }
    for (const [letter, tile] of this.map.markers) {
      // A marker, like the way out, shows in the dark: it is the castle's shape. On a
      // painted scene the goal's mark is a ring that pulses, over the ground (D79).
      if (this.art) drawMark(this, centre(tile), this.still);
      else this.add.image(...centre(tile), markerKey(letter)).setDepth(2.8);
    }
    this.parentNode.dataset.marks = this.map.markers.map(([, tile]) => tile.join(',')).join(';');
    for (const prop of this.map.props) {
      // A painted scene has its props in the painting.
      if (!this.art && this.textures.exists(propKey(prop.kind))) {
        this.add.image(...centre(prop.tile), propKey(prop.kind)).setDepth(1.5);
      }
    }
    this.cone = this.add.graphics().setDepth(1);
    this.darkness = this.add.graphics().setDepth(2.5);
    for (const thing of this.map.things) {
      const painted = this.art ? paintThing(this, this.art, thing) : null;
      if (painted) {
        this.things.set(thing.id, painted);
        if (thing.kind === 'door') this.doors.set(thing.id, thing.tile);
        continue;
      }
      const image =
        thing.kind === 'door'
          ? this.add.image(...centre(thing.tile), thingKey('door'), thing.open ? 'open' : thing.lock)
          : thing.kind === 'stair'
            ? this.add.image(...centre(thing.tile), thingKey('stair'), 'in')
            : this.add.image(...centre(thing.tile), thingKey(thing.kind));
      // Doors and stairs are the castle's shape, seen in the dark; what lies on the
      // floor is under it (D52).
      const shape = thing.kind === 'door' || thing.kind === 'stair';
      this.things.set(thing.id, image.setDepth(shape ? 2.8 : 2));
      if (thing.kind === 'door') this.doors.set(thing.id, thing.tile);
    }
    for (const thing of this.map.things) {
      if (thing.kind === 'door' && thing.lock === 'spell') this.addGlow(thing.id, thing.tile);
    }
    for (const actor of this.map.actors) {
      const key = actor.kind === 'friend' ? friendKey(actor.id) : actorKey(actor.kind);
      const sprite = this.figure(actor.id, key, actor.tile, actor.facing).setDepth(3);
      this.actors.set(actor.id, { sprite, tile: actor.tile, facing: actor.facing, sight: actor.sight });
    }
    this.wizard = this.figure('wizard', WIZARD_KEY, this.map.start, 'down').setDepth(4);
    this.setUpCamera();

    this.playback.onTick((tick, events, instant) => this.show(tick, events, instant));
    this.playback.onState((state) => {
      this.parentNode.dataset.state = state;
      // A run brings the camera back to the wizard.
      if (state === 'playing') this.follow();
      // A word said near the end of the run would stay for ever: it fades.
      if (state === 'done' && !this.options.story) this.time.delayedCall(this.playback.tickDuration * SAY_TICKS, () => this.clearBubble());
    });
    this.restart();
    this.parentNode.dataset.state = this.playback.state;
    this.ready();
  }

  /** The camera over the whole scene, on the wizard; the wheel zooms it and a drag
   * moves it, which lets go of the wizard until the next run (D69). */
  private setUpCamera(): void {
    const camera = this.cameras.main;
    camera.setBounds(0, 0, this.map.width * TILE, this.map.height * TILE);
    camera.setRoundPixels(true);
    this.follow();
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      if (dy !== 0) this.zoomBy(dy < 0 ? 1 : -1);
    });
    // The wheel over the scene zooms it, and does not scroll the page under it.
    this.parentNode.addEventListener('wheel', (event) => event.preventDefault(), { passive: false });
    // A drag lets go of the wizard only once it is a real drag, a few pixels long, so
    // that a click or a shaky tap does not (12.6).
    let dragging = false;
    this.input.on('pointerdown', () => {
      dragging = false;
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return;
      if (!dragging) {
        const far = Math.hypot(pointer.x - pointer.downX, pointer.y - pointer.downY);
        if (far < DRAG_THRESHOLD) return;
        dragging = true;
      }
      const dx = pointer.x - pointer.prevPosition.x;
      const dy = pointer.y - pointer.prevPosition.y;
      if (dx === 0 && dy === 0) return;
      camera.stopFollow();
      this.parentNode.dataset.following = 'false';
      camera.scrollX -= dx / camera.zoom;
      camera.scrollY -= dy / camera.zoom;
    });
    this.parentNode.dataset.zoom = String(camera.zoom);
  }

  /** The camera back on the wizard, following it; in a story, on the story's tile. */
  follow(): void {
    const camera = this.cameras.main;
    if (this.options.story) {
      camera.stopFollow();
      camera.centerOn(...centre(this.options.story.camera));
      this.parentNode.dataset.following = 'false';
      return;
    }
    camera.startFollow(this.wizard, true, 0.2, 0.2);
    camera.centerOn(this.wizard.x, this.wizard.y);
    this.parentNode.dataset.following = 'true';
  }

  /** Whether the camera can zoom a step: never out so far that its window would
   * reach past the scene's edges and show the frame's colour beside it. */
  canZoomBy(step: 1 | -1): boolean {
    const next = this.zoomStep + step;
    const zoom = ZOOMS[next];
    if (zoom === undefined) return false;
    if (step > 0) return true;
    const camera = this.cameras.main;
    return camera.width / zoom <= this.map.width * TILE && camera.height / zoom <= this.map.height * TILE;
  }

  /** The level starting again, seen: a fade to the frame's colour, everything put
   * back while it is out, and a fade back in (D75). */
  restartShow(): Promise<void> {
    const camera = this.cameras.main;
    this.parentNode.dataset.restarting = 'true';
    return new Promise((resolve) => {
      camera.once('camerafadeoutcomplete', () => {
        this.playback.reset();
        this.time.delayedCall(RESTART_HOLD_MS, () => {
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

  /** One step in or out of ZOOMS, about the camera's middle. */
  zoomBy(step: 1 | -1): boolean {
    if (!this.canZoomBy(step)) return false;
    this.zoomStep += step;
    const zoom = ZOOMS[this.zoomStep] ?? 1;
    this.cameras.main.setZoom(zoom);
    this.parentNode.dataset.zoom = String(zoom);
    return true;
  }

  /** A word said follows who says it while they walk. */
  override update(): void {
    // On a painted scene the figures go behind what stands in front of them (D76).
    if (this.art) {
      this.wizard.setDepth(3 + (this.wizard.y / TILE) * 0.01 + 0.0005);
      for (const actor of this.actors.values()) actor.sprite.setDepth(3 + (actor.sprite.y / TILE) * 0.01);
    }
    const [x, y] = this.bubbleAnchor();
    this.bubble?.setPosition(x, y);
    this.thought?.setPosition(x, y);
  }

  /** Over who speaks, or under them when there is no room above; never past the sides. */
  private bubbleAnchor(): [number, number] {
    const over = this.speaker ?? this.wizard;
    const half = this.bubblePlace.width / 2 + 4;
    const width = this.map.width * TILE;
    const x = Math.min(Math.max(over.x, half), Math.max(half, width - half));
    return [x, over.y + (this.bubblePlace.below ? 22 : -this.headroom)];
  }

  /** Whether a bubble this tall fits over who speaks, inside the scene. */
  private roomAbove(height: number): boolean {
    return (this.speaker ?? this.wizard).y - this.headroom - height - 14 >= 2;
  }

  /** Everything where it stood before the run. */
  private restart(): void {
    this.restarts += 1;
    this.clearBubble();
    this.clearThought();
    this.stopCast();
    this.seenBy = null;
    this.lit = !this.map.dark;
    this.shownTick = 0;
    this.holds.clear();
    this.openDoors.clear();
    // What the wizard holds from the start is carried at tick 0 (D49).
    this.carried = new Set(this.map.carrying);
    for (const thing of this.map.things) {
      const image = this.things.get(thing.id);
      if (!image) continue;
      this.tweens.killTweensOf(image);
      const painted = this.art?.scene.things[thing.id];
      if (this.art && painted) image.setPosition(painted.left * artScale(this.art), painted.top * artScale(this.art));
      else image.setPosition(...centre(thing.tile));
      image.setVisible(true).setAlpha(1);
      if (thing.kind === 'door') this.doorLook(thing.id, thing.open, thing.lock);
      this.glows.get(thing.id)?.setVisible(!thing.open);
      if (thing.open) this.openDoors.add(thing.id);
    }
    for (const actor of this.map.actors) {
      const state = this.actors.get(actor.id);
      if (!state) continue;
      this.tweens.killTweensOf(state.sprite);
      state.tile = actor.tile;
      state.facing = actor.facing;
      state.sprite.setPosition(...this.figureAt(actor.tile)).setAlpha(1).setVisible(!actor.hidden);
      this.face(state.sprite, actor.facing);
    }
    this.placeWizard(this.map.start, 'down');
    this.parentNode.dataset.tick = '0';
    this.publish();
    if (this.restarts > 1) this.follow();
  }

  private placeWizard(tile: Tile, facing: Facing): void {
    this.tweens.killTweensOf(this.wizard);
    this.wizard.setPosition(...this.figureAt(tile));
    this.face(this.wizard, facing);
    this.wizardTile = tile;
  }

  /** A tick's events drawn; `instant` for a tick replayed by a seek, drawn at once
   * with no tweens, no bubbles and no shaking: only where everything ends up. */
  private show(tick: number, events: WorldEvent[], instant: boolean): void {
    if (tick === 0) {
      this.restart();
      return;
    }
    this.parentNode.dataset.tick = String(tick);
    this.shownTick = tick;
    if (this.bubble && (instant || tick >= this.bubbleUntil)) this.clearBubble();
    if (this.thought && (instant || tick >= this.thoughtUntil)) this.clearThought();
    for (const event of events) {
      if (event.actor === 'wizard') this.showWizard(tick, event, instant);
      // A door opened by a spell or a word is the door's own event (D43); so is a
      // thing a spell pulls (D47).
      else if (event.kind === 'open') this.openDoor(String(event.data.id), instant, event.data.by === 'word');
      else if (event.kind === 'unsealed') this.unseal(String(event.data.id), instant);
      else if (event.kind === 'pull') this.pull(event, instant);
      else if (event.kind === 'light') this.lit = true;
      else if (event.kind === 'hold') this.hold(event);
      else this.showActor(event, instant);
    }
    this.publish();
  }

  /** A stair held by osto: its hold kept, for the stair's state at later ticks (D53). */
  private hold(event: WorldEvent): void {
    const id = String(event.data.id);
    const held = { from: Number(event.data.from), until: Number(event.data.until) };
    this.holds.set(id, [...(this.holds.get(id) ?? []), held]);
  }

  /** A thing drawn by a spell from where it lay to the wizard's tile (D47). */
  private pull(event: WorldEvent, instant: boolean): void {
    const image = this.things.get(String(event.data.id));
    const to = tileOf(event.data.to);
    if (!image || !to) return;
    this.tweens.killTweensOf(image);
    const [x, y] = centre(to);
    if (instant) image.setPosition(x, y);
    else this.tweens.add({ targets: image, x, y, duration: this.playback.tickDuration * 0.9 });
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
    }
    if (!image || !actor) return;
    this.tweens.killTweensOf(image);
    if (instant) {
      image.setVisible(false);
      return;
    }
    image.setPosition(this.wizard.x, this.wizard.y - 16).setVisible(true).setAlpha(1);
    const [x, y] = centre(actor.tile);
    this.tweens.add({
      targets: image,
      x,
      y: y - 10,
      alpha: 0,
      duration: this.playback.tickDuration * 0.9,
      onComplete: () => image.setVisible(false).setAlpha(1),
    });
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

  /** A cast's frames stopped where they are, their timers dropped. */
  private stopCast(): void {
    for (const timer of this.casting) timer.remove(false);
    this.casting = [];
    delete this.parentNode.dataset.casting;
  }

  /** A spell cast: a ring of light that grows from the wizard and fades (D42). */
  private flash(duration: number): void {
    const lift = this.art ? TILE * 0.5 : 6;
    const ring = this.add.circle(this.wizard.x, this.wizard.y - lift, 10, 0xfff3bf, 0.8).setDepth(5);
    this.tweens.add({
      targets: ring,
      scale: 3,
      alpha: 0,
      duration,
      onComplete: () => ring.destroy(),
    });
  }

  private showWizard(tick: number, event: WorldEvent, instant: boolean): void {
    const facing = isFacing(event.data.facing) ? event.data.facing : null;
    const duration = this.playback.tickDuration * 0.9;
    switch (event.kind) {
      case 'move': {
        const from = tileOf(event.data.from);
        const to = tileOf(event.data.to);
        if (!from || !to) return;
        if (instant) {
          this.placeWizard(to, facing ?? 'down');
          break;
        }
        this.placeWizard(from, facing ?? 'down');
        this.wizardTile = to;
        const [x, y] = this.figureAt(to);
        this.walk(this.wizard, facing ?? 'down', x, y, duration);
        play('step');
        break;
      }
      case 'bump': {
        const at = tileOf(event.data.at);
        if (!at) return;
        this.placeWizard(at, facing ?? 'down');
        if (!instant) this.nudge(this.wizard, facing ?? 'down', duration);
        if (!instant) play('bump');
        // A friend in the way: the wizard thinks who (D66).
        if (!instant && event.data.by === 'friend') this.think(friendText(String(event.data.id)), tick);
        break;
      }
      case 'say':
        if (!instant) {
          this.say(String(event.data.text ?? ''), tick);
          play('say');
        }
        break;
      case 'turn':
        if (facing) this.face(this.wizard, facing);
        break;
      case 'pick_up': {
        const id = String(event.data.id);
        const image = this.things.get(id);
        if (image && instant) {
          this.tweens.killTweensOf(image);
          image.setVisible(false);
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
        if (!instant) play('pick_up');
        break;
      }
      case 'open':
        this.openDoor(String(event.data.id), instant);
        break;
      case 'cast':
        if (!instant) {
          // The wand raised, pointed and lowered, on a sheet that has it.
          this.stopCast();
          const timers = playCast(this, this.wizard, this.art?.figures?.standing ?? 1, duration);
          if (timers) {
            this.parentNode.dataset.casting = 'true';
            this.casting = [...timers, this.time.delayedCall(duration, () => this.stopCast())];
          }
          this.flash(duration);
          play('cast');
        }
        break;
      case 'give':
        this.give(event, instant);
        break;
      case 'blocked': {
        // The wizard thinks why; and when it did try, what would not do shakes:
        // a locked door, or the wizard with nothing to pick up (D28). From too
        // far away there was nothing to try, so nothing shakes.
        if (instant) break;
        const by = String(event.data.by);
        const thing = this.map.things.find((t) => t.id === by);
        const detail = {
          ...(typeof event.data.spell === 'string' ? { spell: event.data.spell } : {}),
          ...(Array.isArray(event.data.things) ? { things: event.data.things.map(String) } : {}),
        };
        this.think(blockedText(String(event.data.reason), thing?.kind ?? null, detail), tick);
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
          break;
        }
        actor.sprite.setPosition(...this.figureAt(from));
        const [x, y] = this.figureAt(to);
        this.walk(actor.sprite, facing, x, y, this.playback.tickDuration * 0.9);
        break;
      }
      case 'turn':
        actor.facing = facing;
        this.face(actor.sprite, facing);
        break;
      // A story's actor speaks, comes into sight and goes (D74).
      case 'say':
        if (!instant) {
          this.say(String(event.data.text ?? ''), this.shownTick, actor.sprite, event.actor);
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
        if (instant) actor.sprite.setAlpha(1);
        else {
          actor.sprite.setAlpha(0);
          this.tweens.add({ targets: actor.sprite, alpha: 1, duration: this.playback.tickDuration * 0.9 });
        }
        break;
      }
      case 'vanish':
        this.tweens.killTweensOf(actor.sprite);
        if (instant) actor.sprite.setVisible(false);
        else {
          this.tweens.add({
            targets: actor.sprite,
            alpha: 0,
            duration: this.playback.tickDuration * 0.9,
            onComplete: () => actor.sprite.setVisible(false).setAlpha(1),
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
    this.cone.clear();
    for (const [id, actor] of this.actors) {
      this.cone.fillStyle(id === this.seenBy ? 0xe03131 : 0xffd43b, id === this.seenBy ? 0.45 : 0.28);
      for (const [x, y] of sightTiles(this.isClear, actor.tile, actor.facing, actor.sight)) {
        this.cone.fillRect(x * TILE, y * TILE, TILE, TILE);
      }
    }
    // Each stair as a step taken now would find it, and in place under the wizard.
    const stairs: string[] = [];
    for (const thing of this.map.things) {
      if (thing.kind !== 'stair') continue;
      const under = thing.tile[0] === this.wizardTile[0] && thing.tile[1] === this.wizardTile[1];
      const inPlace =
        under || stairInPlace(thing.period ?? 1, this.holds.get(thing.id) ?? [], this.shownTick + 1);
      this.things.get(thing.id)?.setFrame(inPlace ? 'in' : 'away');
      stairs.push(`${thing.id}:${inPlace ? 'in' : 'away'}`);
    }
    // The dark over every floor tile of the dark area (the dark rooms, or the whole
    // map) but the wizard's and its eight neighbours (D52, D73).
    this.darkness.clear();
    if (!this.lit) {
      this.darkness.fillStyle(0x07080c, 0.97);
      const area = this.map.darkArea.length > 0 ? new Set(this.map.darkArea.map(([x, y]) => `${x},${y}`)) : null;
      this.map.rows.forEach((row, y) => {
        [...row].forEach((char, x) => {
          const near = Math.abs(x - this.wizardTile[0]) <= 1 && Math.abs(y - this.wizardTile[1]) <= 1;
          const inside = !area || area.has(`${x},${y}`);
          if (char !== '#' && inside && !near) this.darkness.fillRect(x * TILE, y * TILE, TILE, TILE);
        });
      });
    }
    const dataset = this.parentNode.dataset;
    dataset.dark = String(!this.lit);
    dataset.stairs = stairs.join(';');
    dataset.wizard = this.wizardTile.join(',');
    // An actor out of sight is left out (D74).
    dataset.actors = [...this.actors]
      .filter(([, a]) => a.sprite.visible)
      .map(([id, a]) => `${id}:${a.tile.join(',')},${a.facing}`)
      .join(';');
    dataset.doors = [...this.openDoors].sort().join(',');
    dataset.glowing = [...this.glows].filter(([, glow]) => glow.visible).map(([id]) => id).sort().join(',');
    dataset.carried = [...this.carried].sort().join(',');
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

  /** A thought over the wizard: grey and rounded, with two small circles under it. */
  private think(text: string, tick: number): void {
    this.clearThought();
    this.clearBubble();
    this.speaker = null;
    const words = this.add
      .text(0, 0, text.replaceAll('`', ''), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'italic',
        color: '#1f2330',
        wordWrap: { width: TILE * 4 },
        align: 'center',
      })
      .setOrigin(0.5, 1);
    const pad = 8;
    const width = words.width + pad * 2;
    const height = words.height + pad * 2;
    // Above the wizard, the two small circles lead down to it; below, up to it.
    const below = !this.roomAbove(height);
    const sign = below ? 1 : -1;
    const top = below ? 14 : -height - 14;
    const cloud = this.add.graphics();
    cloud.fillStyle(0xe9ecef, 0.97).lineStyle(2, 0x868e96, 1);
    cloud.fillRoundedRect(-width / 2, top, width, height, 12);
    cloud.strokeRoundedRect(-width / 2, top, width, height, 12);
    cloud.fillCircle(-6, sign * 8, 4).strokeCircle(-6, sign * 8, 4);
    cloud.fillCircle(-12, sign * 1, 2.5).strokeCircle(-12, sign * 1, 2.5);
    words.setOrigin(0.5, below ? 0 : 1).setY(below ? 14 + pad : -14 - pad);
    this.bubblePlace = { width, below };
    this.thought = this.add.container(...this.bubbleAnchor(), [cloud, words]).setDepth(11);
    this.thoughtUntil = tick + this.sayTicks;
    this.parentNode.dataset.thought = text.replaceAll('`', '');
  }

  private clearThought(): void {
    this.thought?.destroy();
    this.thought = null;
    delete this.parentNode.dataset.thought;
  }

  /** Words said in a bubble over the wizard, or over the actor who says them. */
  private say(text: string, tick: number, over: Phaser.GameObjects.Sprite = this.wizard, who = 'wizard'): void {
    this.clearBubble();
    this.clearThought();
    this.speaker = over;
    // A story's words may mark a word to type or a name in code; a bubble shows them plain.
    const plain = text.replace(/[`*_]/g, '');
    const bubble = this.add
      .text(0, 0, plain, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: '#1f2330',
        backgroundColor: '#ffffff',
        padding: { x: 6, y: 3 },
        wordWrap: { width: TILE * (this.options.story ? 6 : 4) },
      })
      .setDepth(10);
    const below = !this.roomAbove(bubble.height);
    bubble.setOrigin(0.5, below ? 0 : 1);
    this.bubblePlace = { width: bubble.width, below };
    bubble.setPosition(...this.bubbleAnchor());
    this.bubble = bubble;
    this.bubbleUntil = tick + this.sayTicks;
    this.parentNode.dataset.bubble = plain;
    this.parentNode.dataset.speaker = who;
  }

  private clearBubble(): void {
    this.bubble?.destroy();
    this.bubble = null;
    delete this.parentNode.dataset.bubble;
    delete this.parentNode.dataset.speaker;
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
        load(result: WorldResult) {
          playback.load(result.events);
        },
        reset() {
          playback.reset();
        },
        restartShow() {
          return scene.restartShow();
        },
        follow() {
          scene.follow();
        },
        zoom(step) {
          return scene.zoomBy(step);
        },
        canZoom(step) {
          return scene.canZoomBy(step);
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
      // The camera's window: the whole scene when it is small, VIEW_TILES of it when not.
      width: Math.min(map.width, VIEW_TILES[0]) * TILE,
      height: Math.min(map.height, VIEW_TILES[1]) * TILE,
      pixelArt: true,
      backgroundColor: '#1f2330',
      banner: false,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene,
    });
  });
}
