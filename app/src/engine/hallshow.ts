// The hall at work, drawn (D300): the room-mate's tries coming and going on its cell, and
// the friend's orders to her hare round its loop while no program runs. The page's own
// show on the scene's clock: it changes no cell of the world's, no goal and no run's
// data. What is shown is chosen by ambient.ts; this draws it.

import type Phaser from 'phaser';
import { drillStep, nextTry, ORDER_PAUSE_MS, TRY_FADE_MS, TRY_GAP_MS, TRY_SHOWN_MS, type Try } from './ambient';
import { readingMs } from './bubble';
import type { CreatureLook, Tile } from './layout';
import type { Facing } from './sight';

/** What the show asks of the scene. */
export interface HallShowParts {
  scene: Phaser.Scene;
  parent: HTMLElement;
  /** Whether the player asks for less motion: the spark stands, and no order is said. */
  still: boolean;
  /** The first year's kinds and their colours. */
  kinds: Record<string, readonly string[]>;
  /** A familiar's figure drawn on a cell, as a trial or a spark is. */
  creature: (look: CreatureLook, at: Tile) => Phaser.GameObjects.Sprite;
  /** A creature's look for a try: its sheet. */
  lookOf: (attempt: Try) => CreatureLook;
  /** An actor's figure and where it stands. */
  actor: (id: string) => { sprite: Phaser.GameObjects.Sprite; tile: Tile; facing: Facing } | null;
  figureAt: (tile: Tile) => [number, number];
  walk: (sprite: Phaser.GameObjects.Sprite, facing: Facing, x: number, y: number, ms: number) => void;
  face: (sprite: Phaser.GameObjects.Sprite, facing: Facing) => void;
  /** Words over a figure until `unsay`, and gone. */
  say: (text: string, over: Phaser.GameObjects.Sprite, who: string) => void;
  unsay: () => void;
  /** An order's words, by its key. */
  order: (key: string) => string;
  /** How long the hare's step takes, in milliseconds. */
  stepMs: number;
}

export class HallShow {
  private tryTimer: Phaser.Time.TimerEvent | null = null;
  private trySprite: Phaser.GameObjects.Sprite | null = null;
  private lastTry: Try | null = null;
  private drillTimer: Phaser.Time.TimerEvent | null = null;
  private drilling = false;
  private drillIndex = 0;
  private triesPlaying = false;

  constructor(
    private readonly parts: HallShowParts,
    /** The actor whose cell shows the tries, and the one ordered round its drill. */
    private readonly triesOf: string | null,
    private readonly driller: { id: string; owner: string; loop: Tile[] } | null,
  ) {
    if (triesOf && !parts.still) {
      this.triesPlaying = true;
      this.parts.actor(triesOf)?.sprite.setVisible(false);
      this.nextTry();
    }
    this.publish();
  }

  /** The mate's next try: comes up, stands, fades, and the next after a wait. */
  private nextTry(): void {
    const { scene } = this.parts;
    const at = this.triesOf ? this.parts.actor(this.triesOf)?.tile : null;
    if (!at) return;
    const attempt = nextTry(this.parts.kinds, this.lastTry, Math.random);
    this.lastTry = attempt;
    this.trySprite?.destroy();
    const sprite = this.parts.creature(this.parts.lookOf(attempt), at);
    this.trySprite = sprite;
    const alpha = sprite.alpha;
    sprite.setAlpha(0);
    scene.tweens.add({ targets: sprite, alpha, duration: TRY_FADE_MS / 2 });
    this.tryTimer = scene.time.delayedCall(TRY_SHOWN_MS, () => {
      scene.tweens.add({ targets: sprite, alpha: 0, duration: TRY_FADE_MS });
      this.tryTimer = scene.time.delayedCall(TRY_FADE_MS + TRY_GAP_MS, () => this.nextTry());
    });
  }

  /** The friend's orders begin, from the hare's own cell, unless they play already. */
  startDrill(): void {
    if (!this.driller || this.parts.still || this.drilling) return;
    this.drilling = true;
    this.drillIndex = 0;
    this.publish();
    this.nextOrder();
  }

  /** The orders stop, the hare on its own cell and the words gone. */
  stopDrill(): void {
    if (!this.drilling || !this.driller) return;
    this.drilling = false;
    this.drillTimer?.remove();
    this.drillTimer = null;
    this.parts.unsay();
    const hare = this.parts.actor(this.driller.id);
    if (hare) {
      this.parts.scene.tweens.killTweensOf(hare.sprite);
      hare.sprite.setPosition(...this.parts.figureAt(hare.tile));
      this.parts.face(hare.sprite, hare.facing);
    }
    this.publish();
  }

  private nextOrder(): void {
    const driller = this.driller;
    if (!driller || !this.drilling) return;
    const hare = this.parts.actor(driller.id);
    const friend = this.parts.actor(driller.owner);
    if (!hare || !friend) return;
    const step = drillStep(driller.loop, hare.tile, this.drillIndex);
    this.drillIndex += 1;
    const words = this.parts.order(step.key);
    this.parts.say(words, friend.sprite, driller.owner);
    const [x, y] = this.parts.figureAt(step.to);
    this.parts.walk(hare.sprite, step.way, x, y, this.parts.stepMs);
    this.drillTimer = this.parts.scene.time.delayedCall(readingMs(words), () => {
      this.parts.unsay();
      this.drillTimer = this.parts.scene.time.delayedCall(ORDER_PAUSE_MS, () => this.nextOrder());
    });
  }

  /** What plays, for the tests: data-ambient. */
  private publish(): void {
    const playing = [...(this.triesPlaying ? ['tries'] : []), ...(this.drilling ? ['drill'] : [])];
    if (playing.length > 0) this.parts.parent.dataset.ambient = playing.join(',');
    else delete this.parts.parent.dataset.ambient;
  }

  destroy(): void {
    this.tryTimer?.remove();
    this.drillTimer?.remove();
    this.trySprite?.destroy();
  }
}
