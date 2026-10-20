// The level's scene in Phaser: the map, the wizard, and the playback of a
// run's events. It speaks to the rest of the page only through its parent's
// data-* attributes (data-tick, data-wizard, data-state) and its handle.

import Phaser from 'phaser';
import type { LevelJson, WorldResult } from '../runtime/protocol';
import {
  FLOOR,
  type Facing,
  FACINGS,
  makePlaceholders,
  markerKey,
  TILE,
  TILES_KEY,
  WALL,
  WIZARD_KEY,
} from './placeholders';
import { Playback, type PlaybackEvent } from './playback';

/** How long one tick lasts at speed 1. */
export const TICK_MS = 400;
/** How many ticks a word said stays over the wizard. */
const SAY_TICKS = 3;

export interface SceneHandle {
  playback: Playback;
  /** Gives the playback a run's events, with the wizard back at the start. */
  load(result: WorldResult): void;
  reset(): void;
  destroy(): void;
}

interface MapInfo {
  rows: string[];
  start: [number, number];
  markers: [string, number, number][];
}

function readMap(level: LevelJson): MapInfo {
  const rows = (level.map as string[] | undefined) ?? [];
  let start: [number, number] = [0, 0];
  const markers: [string, number, number][] = [];
  rows.forEach((row, y) => {
    [...row].forEach((char, x) => {
      if (char === 'S') start = [x, y];
      else if (/^\p{L}$/u.test(char)) markers.push([char, x, y]);
    });
  });
  return { rows, start, markers };
}

function centre(x: number, y: number): [number, number] {
  return [x * TILE + TILE / 2, y * TILE + TILE / 2];
}

function isFacing(value: unknown): value is Facing {
  return typeof value === 'string' && (FACINGS as readonly string[]).includes(value);
}

function tileOf(value: unknown): [number, number] | null {
  return Array.isArray(value) && value.length === 2 ? [Number(value[0]), Number(value[1])] : null;
}

class LevelScene extends Phaser.Scene {
  private wizard!: Phaser.GameObjects.Sprite;
  private bubble: Phaser.GameObjects.Text | null = null;
  private bubbleUntil = 0;

  constructor(
    private readonly map: MapInfo,
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
    for (const [letter, x, y] of this.map.markers) {
      this.add.image(...centre(x, y), markerKey(letter));
    }
    this.wizard = this.add.sprite(...centre(...this.map.start), WIZARD_KEY, 'down');
    this.wizard.setOrigin(0.5, 0.6);

    this.playback.onTick((tick, event) => this.show(tick, event));
    this.playback.onState((state) => {
      this.parentNode.dataset.state = state;
    });
    this.place(this.map.start, 'down');
    this.parentNode.dataset.tick = '0';
    this.parentNode.dataset.state = this.playback.state;
    this.ready();
  }

  /** A word said follows the wizard while it walks. */
  override update(): void {
    this.bubble?.setPosition(this.wizard.x, this.wizard.y - 34);
  }

  /** The wizard standing on a tile, facing a way, with no tween running. */
  place(tile: [number, number], facing: Facing): void {
    this.tweens.killTweensOf(this.wizard);
    this.wizard.setPosition(...centre(...tile));
    this.wizard.setFrame(facing);
    this.parentNode.dataset.wizard = tile.join(',');
  }

  private show(tick: number, event: PlaybackEvent | null): void {
    this.parentNode.dataset.tick = String(tick);
    if (this.bubble && tick >= this.bubbleUntil) this.clearBubble();
    if (!event) {
      this.clearBubble();
      this.place(this.map.start, 'down');
      return;
    }
    if (event.actor !== 'wizard') return;
    const facing = isFacing(event.data.facing) ? event.data.facing : null;
    const duration = this.playback.tickDuration * 0.9;
    if (event.kind === 'move') {
      const from = tileOf(event.data.from);
      const to = tileOf(event.data.to);
      if (!from || !to) return;
      this.place(from, facing ?? 'down');
      this.parentNode.dataset.wizard = to.join(',');
      const [x, y] = centre(...to);
      this.tweens.add({ targets: this.wizard, x, y, duration, ease: 'Linear' });
    } else if (event.kind === 'bump') {
      const at = tileOf(event.data.at);
      if (!at) return;
      this.place(at, facing ?? 'down');
      const [dx, dy] =
        facing === 'up' ? [0, -1] : facing === 'down' ? [0, 1] : facing === 'left' ? [-1, 0] : [1, 0];
      this.tweens.add({
        targets: this.wizard,
        x: this.wizard.x + dx * 6,
        y: this.wizard.y + dy * 6,
        duration: duration / 2,
        yoyo: true,
        ease: 'Sine.easeOut',
      });
    } else if (event.kind === 'say') {
      this.say(String(event.data.text ?? ''), tick);
    }
  }

  private say(text: string, tick: number): void {
    this.clearBubble();
    this.bubble = this.add
      .text(this.wizard.x, this.wizard.y - 34, text, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: '#1f2330',
        backgroundColor: '#ffffff',
        padding: { x: 6, y: 3 },
        wordWrap: { width: TILE * 4 },
      })
      .setOrigin(0.5, 1)
      .setDepth(10);
    this.bubbleUntil = tick + SAY_TICKS;
  }

  private clearBubble(): void {
    this.bubble?.destroy();
    this.bubble = null;
  }
}

/** Starts the level's scene in `parent`; resolves once it is drawn. */
export function startScene(parent: HTMLElement, level: LevelJson): Promise<SceneHandle> {
  const map = readMap(level);
  const playback = new Playback({ tickMs: TICK_MS });
  const width = Math.max(1, map.rows[0]?.length ?? 1) * TILE;
  const height = Math.max(1, map.rows.length) * TILE;

  return new Promise((resolve) => {
    let game: Phaser.Game | null = null;
    // The scene fits its parent, and follows it when the parent changes size.
    const resized = new ResizeObserver(() => game?.scale.refresh());
    resized.observe(parent);
    const scene = new LevelScene(map, parent, playback, () => {
      resolve({
        playback,
        load(result: WorldResult) {
          playback.load((result.events as PlaybackEvent[] | undefined) ?? []);
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
      width,
      height,
      pixelArt: true,
      backgroundColor: '#1f2330',
      banner: false,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene,
    });
  });
}
