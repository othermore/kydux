// The words said on the scene: a bubble with a tail over whoever says them, and
// the wizard's thoughts in a grey cloud when an action could not be done (D28).
// Each stays as many ticks as its words take to read (D175), and once the run is
// over, until that time has passed; it follows who it is over as they walk, sits
// below them when there is no room above, and is never held past the scene's
// sides. Its words are never smaller on the screen than at zoom 1 (D106): zoomed
// out, they are drawn larger. The scene's parent says what is said: data-bubble and
// data-speaker, data-thought, and data-words-scale.

import Phaser from 'phaser';
import { TILE } from './placeholders';
import { wordsScale } from './zooming';
import { type Box, bubbleBelow, bubbleShift, bubbleWrap, settleMs } from './bubble';

/** How far a bubble's drawn box and tail reach beyond its words, at most: a
 * container's bounds are its words' alone. */
const BUBBLE_ROOM = 18;

export interface SpeechParts {
  /** The scene's width, in its pixels, which no bubble passes. */
  width: number;
  /** The scene's height, in its pixels, which a bubble below someone stays inside. */
  height: number;
  /** How far above a figure's feet a word said over it goes. */
  headroom: number;
  /** Who a thought is over, and a bubble when no one else says it. */
  wizard: () => Phaser.GameObjects.Sprite;
  /** How wide a bubble's words are, in tiles, at most a third of the scene (bubble.ts). */
  wrap: number;
  /** Every other figure on the scene, which a bubble keeps clear of where it can. */
  figures: () => Phaser.GameObjects.Sprite[];
  /** How long a tick lasts at speed 1: words said for some ticks are read for as long. */
  tickMs: number;
}

export class Speech {
  private bubble: Phaser.GameObjects.Container | null = null;
  private bubbleUntil = 0;
  /** When, on the scene's clock, the bubble's words are read to their end. */
  private bubbleRead = 0;
  private thought: Phaser.GameObjects.Container | null = null;
  private thoughtUntil = 0;
  private thoughtRead = 0;
  /** Where a bubble or a thought sits: its width, and whether it is below who it is over. */
  private place = { width: 0, below: false, shift: 0 };
  /** Who a bubble or a thought is over: the wizard, or an actor who speaks. */
  private speaker: Phaser.GameObjects.Sprite | null = null;
  /** How much larger the words are drawn than the scene's pixels (wordsScale). */
  private scale = 1;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly parent: HTMLElement,
    private readonly parts: SpeechParts,
  ) {}

  /** Whether words are said in a bubble now. */
  get saying(): boolean {
    return this.bubble !== null;
  }

  /** A bubble and a thought gone once their ticks are over, or at once. */
  expire(tick: number, instant: boolean): void {
    if (this.bubble && (instant || tick >= this.bubbleUntil)) this.clearBubble();
    if (this.thought && (instant || tick >= this.thoughtUntil)) this.clearThought();
  }

  /** The milliseconds until the last of the words on the scene is read to its end and
   * gone, 0 when none is on (D175): what the card waits for. */
  settle(): number {
    const read = [...(this.bubble ? [this.bubbleRead] : []), ...(this.thought ? [this.thoughtRead] : [])];
    return settleMs(read, this.scene.time.now);
  }

  /** A bubble and a thought gone once they are read to their end, when no tick comes
   * any more to end them: after a run. */
  expireRead(): void {
    const now = this.scene.time.now;
    if (this.bubble && now >= this.bubbleRead) this.clearBubble();
    if (this.thought && now >= this.thoughtRead) this.clearThought();
  }

  /** When words said now for `ticks` ticks are read to their end. */
  private readAt(ticks: number): number {
    return this.scene.time.now + ticks * this.parts.tickMs;
  }

  /** The camera's zoom, the scene's pixels to the screen's: the words drawn larger
   * when it is less than 1, a bubble already said with them. */
  setZoom(cameraZoom: number): void {
    this.scale = wordsScale(cameraZoom);
    this.bubble?.setScale(this.scale);
    this.thought?.setScale(this.scale);
    this.parent.dataset.wordsScale = String(Math.round(this.scale * 100) / 100);
  }

  /** Every frame: the words over who says them, as they walk. */
  update(): void {
    const [x, y] = this.anchor();
    this.bubble?.setPosition(x, y);
    this.thought?.setPosition(x, y);
  }

  /** The bubble's box and tail with the figure, for the camera to keep in view: the
   * figure's bounds, and the bubble's when the figure says it. */
  around(figure: Phaser.GameObjects.Sprite): Phaser.Geom.Rectangle {
    const box = figure.getBounds();
    if (this.bubble && this.speaker === figure) {
      const words = this.bubble.getBounds();
      words.setTo(
        words.x - BUBBLE_ROOM,
        words.y - BUBBLE_ROOM,
        words.width + BUBBLE_ROOM * 2,
        words.height + BUBBLE_ROOM * 2,
      );
      Phaser.Geom.Rectangle.Union(box, words, box);
    }
    return box;
  }

  /** Over who speaks, or under them when there is no room above; never past the sides. */
  private anchor(): [number, number] {
    const over = this.speaker ?? this.parts.wizard();
    const half = (this.place.width / 2 + 4) * this.scale;
    const wanted = over.x + this.place.shift;
    const x = Math.min(Math.max(wanted, half), Math.max(half, this.parts.width - half));
    return [x, over.y + (this.place.below ? 22 : -this.parts.headroom)];
  }

  /** Whether a bubble this tall fits over who speaks, inside the scene. */
  private roomAbove(height: number): boolean {
    return (this.speaker ?? this.parts.wizard()).y - this.parts.headroom - (height + 14) * this.scale >= 2;
  }

  /** A thought over the wizard: grey and rounded, with two small circles under it,
   * for `ticks` ticks from `tick`. */
  think(text: string, tick: number, ticks: number): void {
    this.clearThought();
    this.clearBubble();
    this.speaker = null;
    const words = this.scene.add
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
    const cloud = this.scene.add.graphics();
    cloud.fillStyle(0xe9ecef, 0.97).lineStyle(2, 0x868e96, 1);
    cloud.fillRoundedRect(-width / 2, top, width, height, 12);
    cloud.strokeRoundedRect(-width / 2, top, width, height, 12);
    cloud.fillCircle(-6, sign * 8, 4).strokeCircle(-6, sign * 8, 4);
    cloud.fillCircle(-12, sign * 1, 2.5).strokeCircle(-12, sign * 1, 2.5);
    words.setOrigin(0.5, below ? 0 : 1).setY(below ? 14 + pad : -14 - pad);
    this.place = { width, below, shift: 0 };
    this.thought = this.scene.add.container(...this.anchor(), [cloud, words]).setDepth(11).setScale(this.scale);
    this.thoughtUntil = tick + ticks;
    this.thoughtRead = this.readAt(ticks);
    this.parent.dataset.thought = text.replaceAll('`', '');
  }

  /** Words said in a bubble over the wizard, or over the actor who says them, for
   * `ticks` ticks from `tick`. */
  say(text: string, tick: number, ticks: number, over: Phaser.GameObjects.Sprite, who: string): void {
    this.clearBubble();
    this.clearThought();
    this.speaker = over;
    // A story's words may mark a word to type or a name in code; a bubble shows them plain.
    const plain = text.replace(/[`*_]/g, '');
    const words = this.scene.add
      .text(0, 0, plain, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: '#1f2330',
        wordWrap: { width: TILE * bubbleWrap(this.parts.wrap, this.parts.width / TILE) },
      })
      .setOrigin(0.5, 0);
    const pad = 7;
    const tail = 10;
    let width = words.width + pad * 2;
    let height = words.height + pad * 2;
    // The box above who speaks, its tail pointing down at them. Where that would cover
    // someone: below them, as wide as a third of the scene if that lets it fit there;
    // else still above, moved to the side of whoever it would cover.
    this.speaker = over;
    const scale = this.scale;
    const figures = this.parts
      .figures()
      .filter((figure) => figure !== over && figure.visible)
      .map(({ x: fx, y: fy, displayWidth, displayHeight }) => ({
        left: fx - displayWidth / 4,
        right: fx + displayWidth / 4,
        top: fy - displayHeight * 0.8,
        bottom: fy,
      }));
    const belowFits = () => over.y + 22 + (height + tail) * scale <= this.parts.height;
    const sides = (from: number, to: number): Box => {
      this.place = { width, below: false, shift: 0 };
      const [middle] = this.anchor();
      return {
        left: middle - (width / 2) * scale,
        right: middle + (width / 2) * scale,
        top: from,
        bottom: to,
      };
    };
    const aboveBox = () => {
      const bottom = over.y - this.parts.headroom - tail * scale;
      return sides(bottom - height * scale, bottom);
    };
    const belowBox = () => {
      const top = over.y + 22 + tail * scale;
      return sides(top, top + height * scale);
    };
    const wanted = () => bubbleBelow(aboveBox(), belowBox(), figures, this.roomAbove(height + tail));
    let below = wanted();
    if (below && !belowFits() && this.roomAbove(height + tail)) {
      const [narrow, tall] = [width, height];
      words.setWordWrapWidth(this.parts.width / 3);
      width = words.width + pad * 2;
      height = words.height + pad * 2;
      below = wanted() && belowFits();
      if (!below) {
        words.setWordWrapWidth(TILE * bubbleWrap(this.parts.wrap, this.parts.width / TILE));
        [width, height] = [narrow, tall];
      }
    }
    const shift = below ? 0 : bubbleShift(aboveBox(), figures, this.parts.width);
    const top = below ? tail : -height - tail;
    this.place = { width, below, shift };
    const [x, y] = this.anchor();
    // The tail's tip is at the anchor, over who speaks, even where the box is held
    // in from the scene's side.
    const tip = Math.min(Math.max(over.x - x, -width / 2 + 12), width / 2 - 12);
    const base = below ? top : top + height;
    const box = this.scene.add.graphics();
    box.fillStyle(0xffffff, 1).lineStyle(2, 0x1f2330, 1);
    box.fillRoundedRect(-width / 2, top, width, height, 8);
    box.strokeRoundedRect(-width / 2, top, width, height, 8);
    box.fillTriangle(tip - 7, base, tip + 7, base, tip, 0);
    box.beginPath();
    box.moveTo(tip - 7, base);
    box.lineTo(tip, 0);
    box.lineTo(tip + 7, base);
    box.strokePath();
    box.lineStyle(3, 0xffffff, 1);
    box.beginPath();
    box.moveTo(tip - 6, base);
    box.lineTo(tip + 6, base);
    box.strokePath();
    words.setY(top + pad);
    this.bubble = this.scene.add.container(x, y, [box, words]).setDepth(10).setScale(this.scale);
    this.bubbleUntil = tick + ticks;
    this.bubbleRead = this.readAt(ticks);
    this.parent.dataset.bubble = plain;
    this.parent.dataset.speaker = who;
  }

  /** The thought gone, if there is one. */
  clearThought(): void {
    this.thought?.destroy();
    this.thought = null;
    delete this.parent.dataset.thought;
  }

  /** The bubble gone, if there is one. */
  clearBubble(): void {
    this.bubble?.destroy();
    this.bubble = null;
    delete this.parent.dataset.bubble;
    delete this.parent.dataset.speaker;
  }
}
