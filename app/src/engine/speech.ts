// The words said on the scene: a bubble with a tail over whoever says them, and
// the wizard's thoughts in a grey cloud when an action could not be done (D28).
// Each stays as many ticks as its words take to read (D175), and once the run is
// over, until that time has passed; it follows who it is over as they walk, sits
// below them when there is no room above, and is never held past the scene's
// sides. Under a place a story step frames (D199) the camera does not follow the
// words: there a bubble keeps inside what the frame shows, whole, as who says it walks
// to the frame's edge, out of it or out of the scene (D319). Its words are never
// smaller on the screen than at zoom 1 (D106): zoomed out, they are drawn larger.
// A thought about a bump shows half a second after it (D237): kept until then, the card
// waiting for it as for words that are up, and dropped by a restart, the slider or any
// other words. Words over a figure in the air are over it as it is drawn, higher by its
// flight's lift and a ring's raise; words under it stay under the place of its feet.
// Where the goals box, which lies on the page over the scene, would cover words over
// someone, they go under them, as where there is no room above (D240).
// A thought with no room above goes beside the head, raised or lower, its dots going to
// the head, and under the feet only where neither side has room (D245, thoughtPlace); its
// place is chosen when it shows and kept while it is up. A bubble of words said keeps
// its own places. The scene's parent says what is said: data-bubble and data-speaker,
// data-thought, data-words-scale, data-words-place (`above`, `left`, `right`, `below`)
// and data-words-over (how far over the place of the feet of who they are over the
// words' foot is, in cells, or `below`).

import Phaser from 'phaser';
import { TILE } from './placeholders';
import { wordsScale } from './zooming';
import {
  type Box,
  bubbleBelow,
  bubbleBeside,
  bubbleHeld,
  bubbleMiddle,
  bubbleReach,
  bubbleRoom,
  bubbleShift,
  bubbleTip,
  bubbleWrap,
  roomTop,
  settleMs,
  type ThoughtSide,
  thoughtPlace,
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
  /** What of the scene the window shows, in the scene's pixels, which a thought stays
   * inside (D245). */
  view: () => Box;
  /** The way a figure faces, as the scene keeps it (D241): a thought goes behind it. */
  facing: (figure: Phaser.GameObjects.Sprite) => 'up' | 'down' | 'left' | 'right';
  /** What words keep off, in the scene's pixels: the familiar's circle (D284), or null. */
  keepOff?: () => Box | null;
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
  /** The bubbles still to come of words said in pieces (D274): the timers that show
   * them, and when, on the scene's clock, the last of them is read to its end. */
  private queue: { timers: Phaser.Time.TimerEvent[]; read: number } | null = null;
  /** The last tick `expire` was told of, from which a thought shown later lasts. */
  private lastTick = 0;
  /** Where a bubble or a thought sits: its width, and whether it is below who it is over;
   * `tall`, how far a bubble's box and tail reach from its anchor, over or under who
   * speaks, in its own pixels, 0 for a thought and for a bubble beside the head. */
  private place: {
    width: number;
    below: boolean;
    shift: number;
    side: ThoughtSide;
    bottom: number;
    tall: number;
  } = {
    width: 0,
    below: false,
    shift: 0,
    side: 'above',
    bottom: 0,
    tall: 0,
  };
  /** The thought's cloud as drawn, its box against the point it hangs from (the head's
   * top beside it, the anchor over or under it), in the scene's pixels. */
  private cloud: Box | null = null;
  /** Who a bubble or a thought is over: the wizard, or an actor who speaks. */
  private speaker: Phaser.GameObjects.Sprite | null = null;
  /** How much larger the words are drawn than the scene's pixels (wordsScale). */
  private scale = 1;
  /** Where the bubble's tail's tip is against the box's middle, in its own pixels. */
  private tipAt = 0;

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
    if (instant) this.dropQueue();
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
      ...(this.queue ? [this.queue.read] : []),
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
    let place: string | undefined;
    if (this.bubble || this.thought) {
      const who = this.speaker ?? this.parts.wizard();
      place = this.place.side;
      if (this.place.below) over = 'below';
      else if (place === 'left' || place === 'right') over = ((who.y - this.headOf(who).top - this.place.bottom) / TILE).toFixed(2);
      else over = wordsOver(this.parts.headroom, this.parts.lifted(who), TILE).toFixed(2);
    }
    if (over === undefined) delete dataset.wordsOver;
    else if (dataset.wordsOver !== over) dataset.wordsOver = over;
    if (place === undefined) delete dataset.wordsPlace;
    else if (dataset.wordsPlace !== place) dataset.wordsPlace = place;
    // How far the bubble's tail's tip is from who speaks, in cells across (D306).
    const who = this.speaker ?? this.parts.wizard();
    const tail = this.bubble ? ((this.bubble.x + this.tipAt * this.scale - who.x) / TILE).toFixed(2) : undefined;
    if (tail === undefined) delete dataset.tail;
    else if (dataset.tail !== tail) dataset.tail = tail;
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
    // Beside the head, the thought follows the head's top as it is drawn (D245).
    if (this.place.side === 'left' || this.place.side === 'right') return [over.x, this.headOf(over).top];
    const half = (this.place.width / 2 + 4) * this.scale;
    const sides = bubbleRoom(this.parts.width, this.parts.shownSides());
    const x = bubbleMiddle(over.x + this.place.shift, half, sides);
    return [x, this.held(over.y + (this.place.below ? 22 : -this.parts.headroom - this.parts.lifted(over)))];
  }

  /** A bubble's anchor, from `y` over or under who speaks, held where the bubble is whole
   * inside what a framing shows: who says it may walk to the frame's edge and out of it,
   * or leave the scene (D319). */
  private held(y: number): number {
    if (this.place.tall === 0 || !this.parts.shown()) return y;
    const reach = (this.place.tall + 2) * this.scale;
    return this.place.below ? bubbleHeld(y, 0, reach, this.room) : bubbleHeld(y, reach, 0, this.room);
  }

  /** The top and the bottom a bubble stays between, in the scene's pixels: the scene's
   * own, or what a story step's framing shows of it. */
  private get room(): [number, number] {
    return bubbleRoom(this.parts.height, this.parts.shown());
  }

  /** A figure's head as it is drawn (D245): its middle across, its top, a figure's
   * height over the place of its feet and lifted as it flies, and its two sides. */
  private headOf(figure: Phaser.GameObjects.Sprite): { middle: number; top: number; left: number; right: number } {
    const top = figure.y - this.parts.lifted(figure) - (this.parts.headroom - 4);
    const half = figure.displayWidth / 4;
    return { middle: figure.x, top, left: figure.x - half, right: figure.x + half };
  }

  /** The heads of every other figure in sight, as drawn, which a thought does not cover. */
  private headsBut(figure: Phaser.GameObjects.Sprite): Box[] {
    return this.parts
      .figures()
      .filter((other) => other !== figure && other.visible)
      .map((other) => {
        const { top, left, right } = this.headOf(other);
        return { left, right, top, bottom: top + TILE / 2 };
      });
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
    const over = this.parts.wizard();
    const head = this.headOf(over);
    // Where it goes (D245): over the head, beside it, raised or lower, or under the feet.
    const placing = thoughtPlace({
      width: width * this.scale,
      height: height * this.scale,
      head,
      feet: over.y,
      facing: this.parts.facing(over),
      view: this.parts.view(),
      cover: this.parts.cover(),
      heads: this.headsBut(over),
    });
    const cloud = this.scene.add.graphics();
    cloud.fillStyle(0xe9ecef, 0.97).lineStyle(2, 0x868e96, 1);
    if (placing.place === 'above' || placing.place === 'below') {
      // Above the wizard, the two small circles lead down to it; below, up to it.
      const below = placing.place === 'below';
      const sign = below ? 1 : -1;
      const top = below ? 14 : -height - 14;
      cloud.fillRoundedRect(-width / 2, top, width, height, 12);
      cloud.strokeRoundedRect(-width / 2, top, width, height, 12);
      cloud.fillCircle(-6, sign * 8, 4).strokeCircle(-6, sign * 8, 4);
      cloud.fillCircle(-12, sign * 1, 2.5).strokeCircle(-12, sign * 1, 2.5);
      words.setOrigin(0.5, below ? 0 : 1).setY(below ? 14 + pad : -14 - pad);
      this.place = { width, below, shift: 0, side: placing.place, bottom: 0, tall: 0 };
      const scaled = (n: number) => n * this.scale;
      this.cloud = { left: scaled(-width / 2), right: scaled(width / 2), top: scaled(top), bottom: scaled(top + height) };
    } else {
      // Beside the head: the cloud and its dots where the place says, drawn from the
      // head's top in the container's own pixels; the dots going to the head.
      const at = (x: number, y: number): [number, number] => [(x - head.middle) / this.scale, (y - head.top) / this.scale];
      const [left, top] = at(placing.cloud.left, placing.cloud.top);
      cloud.fillRoundedRect(left, top, width, height, 12);
      cloud.strokeRoundedRect(left, top, width, height, 12);
      for (const dot of placing.dots) {
        const [x, y] = at(dot.x, dot.y);
        cloud.fillCircle(x, y, dot.radius / this.scale).strokeCircle(x, y, dot.radius / this.scale);
      }
      words.setOrigin(0.5, 0).setPosition(left + width / 2, top + pad);
      this.place = { width, below: false, shift: 0, side: placing.place, bottom: placing.cloud.bottom - head.top, tall: 0 };
      this.cloud = {
        left: placing.cloud.left - head.middle,
        right: placing.cloud.right - head.middle,
        top: placing.cloud.top - head.top,
        bottom: placing.cloud.bottom - head.top,
      };
    }
    this.thought = this.scene.add.container(...this.anchor(), [cloud, words]).setDepth(11).setScale(this.scale);
    this.thoughtUntil = tick + ticks;
    this.thoughtRead = this.readAt(ticks);
    this.parent.dataset.thought = text.replaceAll('`', '');
    this.publishOver();
  }

  /** Words said in a bubble over the wizard, or over the actor who says them, for
   * `ticks` ticks from `tick`. */
  say(text: string, tick: number, ticks: number, over: Phaser.GameObjects.Sprite, who: string): void {
    this.dropQueue();
    this.bubbleUp(text, tick, ticks, over, who);
  }

  /** Words said in several bubbles, one after another (D274): the first now, for its
   * ticks from `tick`, and each of the others `after` milliseconds from now, when the
   * one before is read, for its ticks from the last tick shown then; `shown` is called
   * as each of the others comes. */
  sayPieces(
    pieces: { text: string; ticks: number; after: number }[],
    tick: number,
    over: Phaser.GameObjects.Sprite,
    who: string,
    shown: () => void = () => {},
  ): void {
    const [first, ...rest] = pieces;
    if (!first) return;
    this.say(first.text, tick, first.ticks, over, who);
    this.queuePieces(rest, over, who, shown);
  }

  /** Words said after those still to come in this tick (D264): each piece `after`
   * milliseconds from now, the first too, the bubbles still to come kept. */
  sayAfter(
    pieces: { text: string; ticks: number; after: number }[],
    over: Phaser.GameObjects.Sprite,
    who: string,
    shown: () => void = () => {},
  ): void {
    this.queuePieces(pieces, over, who, shown);
  }

  /** Bubbles to come, each `after` milliseconds from now, joined to those still to come. */
  private queuePieces(
    pieces: { text: string; ticks: number; after: number }[],
    over: Phaser.GameObjects.Sprite,
    who: string,
    shown: () => void,
  ): void {
    const last = pieces[pieces.length - 1];
    if (!last) return;
    const queue = this.queue ?? { timers: [], read: 0 };
    this.queue = queue;
    for (const piece of pieces) {
      const timer = this.scene.time.delayedCall(piece.after, () => {
        queue.timers = queue.timers.filter((one) => one !== timer);
        if (queue.timers.length === 0 && this.queue === queue) this.queue = null;
        this.bubbleUp(piece.text, this.lastTick, piece.ticks, over, who);
        shown();
      });
      queue.timers.push(timer);
    }
    queue.read = Math.max(queue.read, this.scene.time.now + last.after + last.ticks * this.parts.tickMs);
  }

  /** The bubbles still to come of words said in pieces, not shown after all. */
  private dropQueue(): void {
    for (const timer of this.queue?.timers ?? []) timer.remove();
    this.queue = null;
  }

  private bubbleUp(text: string, tick: number, ticks: number, over: Phaser.GameObjects.Sprite, who: string): void {
    this.removeBubble();
    this.clearThought();
    this.speaker = over;
    // A story's words may mark a word to type or a name in code; a bubble shows them plain.
    const plain = text.replace(/[`*]/g, '');
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
      this.place = { width, below: false, shift: 0, side: 'above', bottom: 0, tall: 0 };
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
    // What words keep off, the familiar's circle, is cleared as a figure is (D284).
    const keep = this.parts.keepOff?.() ?? null;
    const avoid = keep ? [...figures, keep] : figures;
    const wanted = () => bubbleBelow(aboveBox(), belowBox(), avoid, this.roomAbove(height + tail, width));
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
    // With no room above, and the circle below: beside who speaks, away from it (D284).
    const beside = below ? bubbleBeside(belowBox(), keep, over.x) : null;
    if (beside) {
      this.besideBubble(beside, over, words, width, height, pad, who, plain, tick, ticks);
      return;
    }
    // The box moves off others no farther than its tail reaches who speaks (D306).
    const half = (width / 2 + 4) * scale;
    const edge = bubbleMiddle(over.x, half, bubbleRoom(this.parts.width, this.parts.shownSides())) - over.x;
    const reach = bubbleReach(width, scale, edge);
    const shift = below ? 0 : bubbleShift(aboveBox(), avoid, this.parts.width, reach);
    const top = below ? tail : -height - tail;
    this.place = { width, below, shift, side: below ? 'below' : 'above', bottom: 0, tall: height + tail };
    const [x, y] = this.anchor();
    // The tail's tip is at the anchor, over who speaks, even where the box is held
    // in from a side or moved off someone.
    const tip = bubbleTip(over.x - x, scale, width);
    this.tipAt = tip;
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

  /** A bubble beside who speaks, on `side`, level with the head, its tail to the head's
   * side (D284). */
  private besideBubble(
    side: 'left' | 'right',
    over: Phaser.GameObjects.Sprite,
    words: Phaser.GameObjects.Text,
    width: number,
    height: number,
    pad: number,
    who: string,
    plain: string,
    tick: number,
    ticks: number,
  ): void {
    const scale = this.scale;
    const head = this.headOf(over);
    const edge = (side === 'right' ? head.right - over.x : head.left - over.x) / scale;
    const gap = 12;
    const left = side === 'right' ? edge + gap : edge - gap - width;
    const top = -height / 3;
    const near = side === 'right' ? left : left + width;
    const middle = top + height / 2;
    const box = this.scene.add.graphics();
    box.fillStyle(0xffffff, 1).lineStyle(2, 0x1f2330, 1);
    box.fillRoundedRect(left, top, width, height, 8);
    box.strokeRoundedRect(left, top, width, height, 8);
    box.fillTriangle(near, middle - 7, near, middle + 7, edge, middle);
    box.beginPath();
    box.moveTo(near, middle - 7);
    box.lineTo(edge, middle);
    box.lineTo(near, middle + 7);
    box.strokePath();
    box.lineStyle(3, 0xffffff, 1);
    box.beginPath();
    box.moveTo(near, middle - 6);
    box.lineTo(near, middle + 6);
    box.strokePath();
    words.setPosition(left + width / 2, top + pad);
    this.place = { width, below: false, shift: 0, side, bottom: (top + height) * scale, tall: 0 };
    this.bubble = this.scene.add.container(...this.anchor(), [box, words]).setDepth(10).setScale(scale);
    this.bubbleUntil = tick + ticks;
    this.bubbleRead = this.readAt(ticks);
    this.parent.dataset.bubble = plain;
    this.parent.dataset.speaker = who;
    this.publishOver();
  }

  /** The thought's cloud where it is drawn now, in the scene's pixels; null with no
   * thought up (data-thought-box, D245). */
  thoughtBox(): Box | null {
    if (!this.thought || !this.cloud) return null;
    const [x, y] = [this.thought.x, this.thought.y];
    return { left: x + this.cloud.left, right: x + this.cloud.right, top: y + this.cloud.top, bottom: y + this.cloud.bottom };
  }

  /** The thought gone, if there is one, and one still to come with it. */
  clearThought(): void {
    this.dropPending();
    this.thought?.destroy();
    this.thought = null;
    delete this.parent.dataset.thought;
    this.publishOver();
  }

  /** The bubble gone, if there is one, and those still to come of words said in pieces. */
  clearBubble(): void {
    this.dropQueue();
    this.removeBubble();
  }

  private removeBubble(): void {
    this.bubble?.destroy();
    this.bubble = null;
    delete this.parent.dataset.bubble;
    delete this.parent.dataset.speaker;
    this.publishOver();
  }
}
