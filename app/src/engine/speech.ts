// The words said on the scene: a bubble with a tail over whoever says them, and
// the wizard's thoughts in a grey cloud when an action could not be done (D28).
// Each stays as many ticks as its words take to read (D175), and once the run is
// over, until that time has passed; it follows who it is over as they walk, sits
// below them when there is no room above, and is never held past the scene's
// sides. Under a place a story step frames (D199) the camera does not follow the
// words: there a bubble keeps inside what the frame shows. Its words are never
// smaller on the screen than at zoom 1 (D106): zoomed out, they are drawn larger.
// A thought about a bump shows half a second after it (D237): kept until then, the card
// waiting for it as for words that are up, and dropped by a restart, the slider or any
// other words. Words over a figure in the air are over it as it is drawn, higher by its
// flight's lift and a ring's raise; words under it stay under the place of its feet.
// Where the goals box, which lies on the page over the scene, would cover words over
// someone, they go under them, as where there is no room above (D240).
// The scene's parent says what is said: data-bubble and data-speaker, data-thought,
// data-words-scale, and data-words-over (how far over the place of the feet of who they
// are over the words' foot is, in cells, or `below`).

import Phaser from 'phaser';
import { TILE } from './placeholders';
import { wordsScale } from './zooming';
import {
  type Box,
  bubbleBelow,
  bubbleMiddle,
  bubbleRoom,
  bubbleShift,
  bubbleTip,
  bubbleWrap,
  roomTop,
  settleMs,
  wordsOver,
} from './bubble';

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
  /** How far above the place of its feet on the ground a figure is drawn, in the scene's
   * pixels: a flying figure's lift and a ring's raise, without the hover; 0 on the
   * ground (D237). */
  lifted: (figure: Phaser.GameObjects.Sprite) => number;
  /** Who a thought is over, and a bubble when no one else says it. */
  wizard: () => Phaser.GameObjects.Sprite;
  /** How wide a bubble's words are, in tiles, at most a third of the scene (bubble.ts). */
  wrap: number;
  /** Every other figure on the scene, which a bubble keeps clear of where it can. */
  figures: () => Phaser.GameObjects.Sprite[];
  /** How long a tick lasts at speed 1: words said for some ticks are read for as long. */
  tickMs: number;
  /** In a story, the top and the bottom, in the scene's pixels, of what a step's framing
   * shows (D199), which a bubble stays between; null where the camera follows who speaks. */
  shown: () => [number, number] | null;
  /** The left and the right of what such a framing shows, which a bubble stays between
   * as well; null likewise. */
  shownSides: () => [number, number] | null;
  /** What of the page lies over the scene, the goals box, as a box in the scene's pixels,
   * under which no words over someone are put (D240); null where nothing does. */
  cover: () => Box | null;
}

export class Speech {
  private bubble: Phaser.GameObjects.Container | null = null;
  private bubbleUntil = 0;
  /** When, on the scene's clock, the bubble's words are read to their end. */
  private bubbleRead = 0;
  private thought: Phaser.GameObjects.Container | null = null;
  private thoughtUntil = 0;
  private thoughtRead = 0;
  /** A thought said to show later (D237): its words, its ticks, when it shows on the
   * scene's clock, and the timer that shows it. */
  private pending: { text: string; ticks: number; due: number; timer: Phaser.Time.TimerEvent } | null = null;
  /** The last tick `expire` was told of, from which a thought shown later lasts. */
  private lastTick = 0;
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
    this.lastTick = tick;
    // A thought still to come is not shown under the slider or after a restart.
    if (instant) this.dropPending();
    if (this.bubble && (instant || tick >= this.bubbleUntil)) this.clearBubble();
    if (this.thought && (instant || tick >= this.thoughtUntil)) this.clearThought();
  }

  /** The milliseconds until the last of the words on the scene is read to its end and
   * gone, 0 when none is on (D175): what the card waits for. */
  settle(): number {
    const read = [
      ...(this.bubble ? [this.bubbleRead] : []),
      ...(this.thought ? [this.thoughtRead] : []),
      ...(this.pending ? [this.pending.due + this.pending.ticks * this.parts.tickMs] : []),
    ];
    return settleMs(read, this.scene.time.now);
  }

  /** A bubble and a thought gone once they are read to their end, when no tick comes
   * any more to end them: after a run, called when `settle()`'s time is up. Words said
   * for ever, a sleeper's thought, stay. The clock is not asked again: a timer of the
   * scene's fires on its smoothed deltas, and can come a fraction before `time.now`
   * reaches the end read, when nothing would call this again. */
  expireRead(): void {
    if (this.bubble && Number.isFinite(this.bubbleRead)) this.clearBubble();
    if (this.thought && Number.isFinite(this.thoughtRead)) this.clearThought();
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
    this.publishOver();
  }

  /** How far over the place of the feet of who they are over the words' foot is, for
   * the tests (data-words-over): in cells, `below`, or nothing with no words on. */
  private publishOver(): void {
    const dataset = this.parent.dataset;
    let over: string | undefined;
    if (this.bubble || this.thought) {
      const who = this.speaker ?? this.parts.wizard();
      over = this.place.below ? 'below' : wordsOver(this.parts.headroom, this.parts.lifted(who), TILE).toFixed(2);
    }
    if (over === undefined) delete dataset.wordsOver;
    else if (dataset.wordsOver !== over) dataset.wordsOver = over;
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

  /** Over who speaks, or under them when there is no room above; never past the scene's
   * sides, nor past those of what a framing shows of it. */
  private anchor(): [number, number] {
    const over = this.speaker ?? this.parts.wizard();
    const half = (this.place.width / 2 + 4) * this.scale;
    const sides = bubbleRoom(this.parts.width, this.parts.shownSides());
    const x = bubbleMiddle(over.x + this.place.shift, half, sides);
    return [x, over.y + (this.place.below ? 22 : -this.parts.headroom - this.parts.lifted(over))];
  }

  /** The top and the bottom a bubble stays between, in the scene's pixels: the scene's
   * own, or what a story step's framing shows of it. */
  private get room(): [number, number] {
    return bubbleRoom(this.parts.height, this.parts.shown());
  }

  /** Whether words this tall and this wide fit over who they are over: inside the scene,
   * and under nothing of the page that lies over it (D240). */
  private roomAbove(height: number, width: number): boolean {
    const over = this.speaker ?? this.parts.wizard();
    const foot = over.y - this.parts.headroom - this.parts.lifted(over);
    const top = foot - (height + 14) * this.scale;
    const half = (width / 2) * this.scale;
    return top >= roomTop(this.room[0], over.x - half, over.x + half, foot, this.parts.cover()) + 2;
  }

  /** A thought over the wizard: grey and rounded, with two small circles under it,
   * for `ticks` ticks from `tick`; with `afterMs`, shown that many milliseconds later,
   * for `ticks` ticks from the last tick shown then (D237). */
  think(text: string, tick: number, ticks: number, afterMs = 0): void {
    this.dropPending();
    if (afterMs > 0) {
      const timer = this.scene.time.delayedCall(afterMs, () => {
        this.pending = null;
        this.showThought(text, this.lastTick, ticks);
      });
      this.pending = { text, ticks, due: this.scene.time.now + afterMs, timer };
      return;
    }
    this.showThought(text, tick, ticks);
  }

  /** A thought not yet shown dropped, its timer with it. */
  private dropPending(): void {
    this.pending?.timer.remove(false);
    this.pending = null;
  }

  /** The thought drawn now, for `ticks` ticks from `tick`. */
  private showThought(text: string, tick: number, ticks: number): void {
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
    const below = !this.roomAbove(height, width);
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
    this.publishOver();
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
    // Each other figure as it is drawn, higher when it flies (D237).
    const figures = this.parts
      .figures()
      .filter((figure) => figure !== over && figure.visible)
      .map((figure) => {
        const drawnAt = figure.y - this.parts.lifted(figure);
        return {
          left: figure.x - figure.displayWidth / 4,
          right: figure.x + figure.displayWidth / 4,
          top: drawnAt - figure.displayHeight * 0.8,
          bottom: drawnAt,
        };
      });
    const belowFits = () => over.y + 22 + (height + tail) * scale <= this.room[1];
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
      const bottom = over.y - this.parts.headroom - this.parts.lifted(over) - tail * scale;
      return sides(bottom - height * scale, bottom);
    };
    const belowBox = () => {
      const top = over.y + 22 + tail * scale;
      return sides(top, top + height * scale);
    };
    const wanted = () => bubbleBelow(aboveBox(), belowBox(), figures, this.roomAbove(height + tail, width));
    let below = wanted();
    if (below && !belowFits() && this.roomAbove(height + tail, width)) {
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
    // in from a side or moved off someone.
    const tip = bubbleTip(over.x - x, scale, width);
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
    this.publishOver();
  }

  /** The thought gone, if there is one, and one still to come with it. */
  clearThought(): void {
    this.dropPending();
    this.thought?.destroy();
    this.thought = null;
    delete this.parent.dataset.thought;
    this.publishOver();
  }

  /** The bubble gone, if there is one. */
  clearBubble(): void {
    this.bubble?.destroy();
    this.bubble = null;
    delete this.parent.dataset.bubble;
    delete this.parent.dataset.speaker;
    this.publishOver();
  }
}
