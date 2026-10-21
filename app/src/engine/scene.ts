// The level's scene in Phaser: the map, the things and actors on it, the
// wizard, and the playback of a run's events, tick by tick. It speaks to the
// rest of the page only through its handle and its parent's data-* attributes:
// data-tick, data-state, data-wizard ("x,y"), data-actors ("id:x,y,facing"
// joined by ";"), data-doors (the open doors' ids, joined by ","),
// data-carried (the ids of what the wizard carries, joined by ","),
// data-thought (why an action could not be done, while the wizard thinks it)
// and data-shaking (present while something shakes at a failed try).

import Phaser from 'phaser';
import type { LevelJson, WorldEvent, WorldResult } from '../runtime/protocol';
import { type Layout, layout } from './layout';
import {
  actorKey,
  FLOOR,
  type Facing,
  FACINGS,
  makePlaceholders,
  markerKey,
  thingKey,
  TILE,
  TILES_KEY,
  WALL,
  WIZARD_KEY,
} from './placeholders';
import { Playback } from './playback';
import { sightTiles, type Tile } from './sight';
import { blockedText } from './words';

/** How long one tick lasts at speed 1. */
export const TICK_MS = 400;
/** How many ticks a word said stays over the wizard. */
const SAY_TICKS = 3;

export interface SceneHandle {
  playback: Playback;
  /** Gives the playback a run's events, with everything back where it started. */
  load(result: WorldResult): void;
  reset(): void;
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

  constructor(
    private readonly map: Layout,
    private readonly parentNode: HTMLElement,
    private readonly playback: Playback,
    private readonly ready: () => void,
  ) {
    super({ key: 'level' });
  }

  create(): void {
    makePlaceholders(
      this,
      this.map.markers.map(([letter]) => letter),
    );
    const data = this.map.rows.map((row) => [...row].map((c) => (c === '#' ? WALL : FLOOR)));
    const tilemap = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    const tileset = tilemap.addTilesetImage(TILES_KEY, TILES_KEY, TILE, TILE, 0, 0);
    if (tileset) tilemap.createLayer(0, tileset, 0, 0);
    for (const [letter, tile] of this.map.markers) {
      this.add.image(...centre(tile), markerKey(letter));
    }
    this.cone = this.add.graphics().setDepth(1);
    for (const thing of this.map.things) {
      const image =
        thing.kind === 'door'
          ? this.add.image(...centre(thing.tile), thingKey('door'), 'closed')
          : this.add.image(...centre(thing.tile), thingKey(thing.kind));
      this.things.set(thing.id, image.setDepth(2));
      if (thing.kind === 'door') this.doors.set(thing.id, thing.tile);
    }
    for (const actor of this.map.actors) {
      const sprite = this.add
        .sprite(...centre(actor.tile), actorKey(actor.kind), actor.facing)
        .setOrigin(0.5, 0.6)
        .setDepth(3);
      this.actors.set(actor.id, { sprite, tile: actor.tile, facing: actor.facing, sight: actor.sight });
    }
    this.wizard = this.add.sprite(...centre(this.map.start), WIZARD_KEY, 'down');
    this.wizard.setOrigin(0.5, 0.6).setDepth(4);

    this.playback.onTick((tick, events, instant) => this.show(tick, events, instant));
    this.playback.onState((state) => {
      this.parentNode.dataset.state = state;
    });
    this.restart();
    this.parentNode.dataset.state = this.playback.state;
    this.ready();
  }

  /** A word said follows the wizard while it walks. */
  override update(): void {
    const [x, y] = this.bubbleAnchor();
    this.bubble?.setPosition(x, y);
    this.thought?.setPosition(x, y);
  }

  /** Over the wizard, or under it when there is no room above; never past the sides. */
  private bubbleAnchor(): [number, number] {
    const half = this.bubblePlace.width / 2 + 4;
    const width = this.map.width * TILE;
    const x = Math.min(Math.max(this.wizard.x, half), Math.max(half, width - half));
    return [x, this.wizard.y + (this.bubblePlace.below ? 22 : -34)];
  }

  /** Whether a bubble this tall fits over the wizard, inside the scene. */
  private roomAbove(height: number): boolean {
    return this.wizard.y - 34 - height - 14 >= 2;
  }

  /** Everything where it stood before the run. */
  private restart(): void {
    this.clearBubble();
    this.clearThought();
    this.seenBy = null;
    this.openDoors.clear();
    this.carried.clear();
    for (const thing of this.map.things) {
      const image = this.things.get(thing.id);
      if (!image) continue;
      this.tweens.killTweensOf(image);
      image.setPosition(...centre(thing.tile)).setVisible(true).setAlpha(1);
      if (thing.kind === 'door') image.setFrame('closed');
    }
    for (const actor of this.map.actors) {
      const state = this.actors.get(actor.id);
      if (!state) continue;
      this.tweens.killTweensOf(state.sprite);
      state.tile = actor.tile;
      state.facing = actor.facing;
      state.sprite.setPosition(...centre(actor.tile)).setFrame(actor.facing);
    }
    this.placeWizard(this.map.start, 'down');
    this.parentNode.dataset.tick = '0';
    this.publish();
  }

  private placeWizard(tile: Tile, facing: Facing): void {
    this.tweens.killTweensOf(this.wizard);
    this.wizard.setPosition(...centre(tile));
    this.wizard.setFrame(facing);
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
    if (this.bubble && (instant || tick >= this.bubbleUntil)) this.clearBubble();
    if (this.thought && (instant || tick >= this.thoughtUntil)) this.clearThought();
    for (const event of events) {
      if (event.actor === 'wizard') this.showWizard(tick, event, instant);
      else this.showActor(event, instant);
    }
    this.publish();
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
        const [x, y] = centre(to);
        this.tweens.add({ targets: this.wizard, x, y, duration, ease: 'Linear' });
        break;
      }
      case 'bump': {
        const at = tileOf(event.data.at);
        if (!at) return;
        this.placeWizard(at, facing ?? 'down');
        if (!instant) this.nudge(this.wizard, facing ?? 'down', duration);
        break;
      }
      case 'say':
        if (!instant) this.say(String(event.data.text ?? ''), tick);
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
        break;
      }
      case 'open': {
        const id = String(event.data.id);
        this.things.get(id)?.setFrame('open');
        this.openDoors.add(id);
        break;
      }
      case 'blocked': {
        // The wizard thinks why; and when it did try, what would not do shakes:
        // a locked door, or the wizard with nothing to pick up (D28). From too
        // far away there was nothing to try, so nothing shakes.
        if (instant) break;
        const by = String(event.data.by);
        const thing = this.map.things.find((t) => t.id === by);
        this.think(blockedText(String(event.data.reason), thing?.kind ?? null), tick);
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
          actor.sprite.setPosition(...centre(to)).setFrame(facing);
          break;
        }
        actor.sprite.setPosition(...centre(from)).setFrame(facing);
        const [x, y] = centre(to);
        this.tweens.add({
          targets: actor.sprite,
          x,
          y,
          duration: this.playback.tickDuration * 0.9,
          ease: 'Linear',
        });
        break;
      }
      case 'turn':
        actor.facing = facing;
        actor.sprite.setFrame(facing);
        break;
      case 'seen':
        this.seenBy = event.actor;
        if (!instant) this.cameras.main.shake(this.playback.tickDuration * 0.6, 0.006);
        break;
    }
  }

  private isClear = ([x, y]: Tile): boolean => {
    const row = this.map.rows[y];
    if (!row || x < 0 || x >= row.length || row[x] === '#') return false;
    for (const [id, tile] of this.doors) {
      if (tile[0] === x && tile[1] === y && !this.openDoors.has(id)) return false;
    }
    return true;
  };

  /** The attributes the tests read, and the sight cones drawn again. */
  private publish(): void {
    this.cone.clear();
    for (const [id, actor] of this.actors) {
      this.cone.fillStyle(id === this.seenBy ? 0xe03131 : 0xffd43b, id === this.seenBy ? 0.45 : 0.28);
      for (const [x, y] of sightTiles(this.isClear, actor.tile, actor.facing, actor.sight)) {
        this.cone.fillRect(x * TILE, y * TILE, TILE, TILE);
      }
    }
    const dataset = this.parentNode.dataset;
    dataset.wizard = this.wizardTile.join(',');
    dataset.actors = [...this.actors]
      .map(([id, a]) => `${id}:${a.tile.join(',')},${a.facing}`)
      .join(';');
    dataset.doors = [...this.openDoors].sort().join(',');
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
    this.thoughtUntil = tick + SAY_TICKS;
    this.parentNode.dataset.thought = text.replaceAll('`', '');
  }

  private clearThought(): void {
    this.thought?.destroy();
    this.thought = null;
    delete this.parentNode.dataset.thought;
  }

  private say(text: string, tick: number): void {
    this.clearBubble();
    this.clearThought();
    const bubble = this.add
      .text(0, 0, text, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: '#1f2330',
        backgroundColor: '#ffffff',
        padding: { x: 6, y: 3 },
        wordWrap: { width: TILE * 4 },
      })
      .setDepth(10);
    const below = !this.roomAbove(bubble.height);
    bubble.setOrigin(0.5, below ? 0 : 1);
    this.bubblePlace = { width: bubble.width, below };
    bubble.setPosition(...this.bubbleAnchor());
    this.bubble = bubble;
    this.bubbleUntil = tick + SAY_TICKS;
  }

  private clearBubble(): void {
    this.bubble?.destroy();
    this.bubble = null;
  }
}

/** Starts the level's scene in `parent`; resolves once it is drawn. */
export function startScene(parent: HTMLElement, level: LevelJson): Promise<SceneHandle> {
  const map = layout(level);
  const playback = new Playback({ tickMs: TICK_MS });

  return new Promise((resolve) => {
    let game: Phaser.Game | null = null;
    // The scene fits its parent, and follows it when the parent changes size.
    const resized = new ResizeObserver(() => game?.scale.refresh());
    resized.observe(parent);
    const scene = new LevelScene(map, parent, playback, () => {
      resolve({
        playback,
        load(result: WorldResult) {
          playback.load(result.events);
        },
        reset() {
          playback.reset();
        },
        destroy() {
          resized.disconnect();
          playback.stop();
          game?.destroy(true);
          game = null;
        },
      });
    });
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: map.width * TILE,
      height: map.height * TILE,
      pixelArt: true,
      backgroundColor: '#1f2330',
      banner: false,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene,
    });
  });
}
